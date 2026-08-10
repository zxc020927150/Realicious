import express from "express";
import db from "../../utils/connect-mysql.js";
import crypto from "crypto";
import { authenticateToken } from "../../middlewares/hua/auth.js";

const router = express.Router();
const VOUCHER_PROMOTION_VALID_DAYS = 180;

// 綠界要求 MerchantTradeNo 每次建立金流交易都必須唯一。
// 前 8 碼保留商城訂單 ID，後 8 碼為本次付款嘗試的隨機識別碼。
function createEcpayTradeNo(orderId) {
  const orderPart = String(orderId).padStart(8, "0").slice(-8);
  const attemptPart = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `REAL${orderPart}${attemptPart}`;
}

function getOrderIdFromEcpayTradeNo(tradeNo) {
  const match = /^REAL(\d{8})/.exec(tradeNo || "");
  return match ? Number.parseInt(match[1], 10) : NaN;
}

function getVoucherPromotionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + VOUCHER_PROMOTION_VALID_DAYS);
  return expiresAt;
}

// ── 共用：訂單付款成功後建立票券 ──
async function createTicketsFromOrder(orderId, queryable = db) {
  // 避免重複建立：已存在此訂單的票券就跳過
  const [[existing]] = await queryable.query("SELECT COUNT(*) AS cnt FROM user_tickets WHERE order_id = ?", [orderId]);
  if (existing && existing.cnt > 0) return;

  // 取得訂單 user_id
  const [[order]] = await queryable.query("SELECT user_id FROM `orders` WHERE id = ?", [orderId]);
  if (!order) return;
  const userId = order.user_id;

  // 找出 category 名稱為「E-voucher」的 id
  const [[catRow]] = await queryable.query("SELECT id FROM `categories` WHERE name = '電子票券' LIMIT 1");
  if (!catRow) return;

  const [items] = await queryable.query(
    `SELECT oi.product_id, oi.quantity, p.name, p.price
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ? AND p.category_id = ?`,
    [orderId, catRow.id]
  );

  for (const item of items) {
    const values = [];
    const expiresAt = getVoucherPromotionExpiry();
    for (let i = 0; i < item.quantity; i++) {
      values.push([userId, item.product_id, orderId, crypto.randomUUID(), item.name, expiresAt]);
    }
    if (values.length > 0) {
      await queryable.query(
        "INSERT INTO user_tickets (user_id, product_id, order_id, redeem_code, name, expires_at) VALUES ?",
        [values]
      );
    }
  }
}

function createPaymentError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function assertOrderStock(orderId, queryable = db) {
  const [items] = await queryable.query(
    `SELECT oi.product_id, oi.quantity, p.name, p.stock_qty
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`,
    [orderId],
  );

  if (items.length === 0) {
    throw createPaymentError("訂單沒有商品", 400);
  }
  for (const item of items) {
    if (Number(item.stock_qty) < Number(item.quantity)) {
      throw createPaymentError(`${item.name} 庫存不足，目前只剩 ${item.stock_qty} 件`, 409);
    }
  }
}

// 付款成功、扣庫存、建立票券必須在同一個 transaction 中完成。
// 訂單列使用 FOR UPDATE 鎖定，重複回調不會重複扣庫存。
async function completePaidOrder(orderId, userId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [[order]] = await connection.query(
      "SELECT id, user_id, status FROM `orders` WHERE id = ? FOR UPDATE",
      [orderId],
    );
    if (!order) throw createPaymentError("訂單不存在", 404);
    if (userId && Number(order.user_id) !== Number(userId)) {
      throw createPaymentError("無權操作此訂單", 403);
    }
    if (Number(order.status) === 2) {
      await connection.commit();
      return { alreadyPaid: true };
    }
    if (Number(order.status) !== 1) {
      throw createPaymentError("只有待付款訂單可以完成付款", 409);
    }

    const [items] = await connection.query(
      `SELECT oi.product_id, oi.quantity, p.name, p.stock_qty
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?
       FOR UPDATE`,
      [orderId],
    );
    if (items.length === 0) throw createPaymentError("訂單沒有商品", 400);

    for (const item of items) {
      if (Number(item.stock_qty) < Number(item.quantity)) {
        throw createPaymentError(`${item.name} 庫存不足，目前只剩 ${item.stock_qty} 件`, 409);
      }
    }

    for (const item of items) {
      const [result] = await connection.query(
        `UPDATE products
         SET stock_qty = stock_qty - ?
         WHERE id = ? AND stock_qty >= ?`,
        [item.quantity, item.product_id, item.quantity],
      );
      if (result.affectedRows !== 1) {
        throw createPaymentError(`${item.name} 庫存更新失敗`, 409);
      }
    }

    await connection.query(
      "UPDATE `orders` SET status = 2, paid_at = NOW() WHERE id = ?",
      [orderId],
    );
    await createTicketsFromOrder(orderId, connection);
    await connection.commit();
    return { alreadyPaid: false };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ── 策略模式：金流服務 Map ──
const paymentStrategies = {
  ecpay: {
    name: "ECPay 信用卡",
    async pay(orderId, total, desc) {
      const MerchantID = process.env.ECPAY_MERCHANT_ID || "3002607";
      const HashKey = process.env.ECPAY_HASH_KEY || "5294y06JbISpM5x9";
      const HashIV = process.env.ECPAY_HASH_IV || "v77hoKGq4kWxNNIS";

      const tradeNo = createEcpayTradeNo(orderId);
      const params = {
        MerchantID,
        MerchantTradeNo: tradeNo,
        MerchantTradeDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().replace(/T/, " ").slice(0, 19).replace(/-/g, "/"),
        PaymentType: "aio",
        TotalAmount: Math.round(total),
        TradeDesc: desc || "Realicious 美食商城訂單",
        ItemName: desc || "商品",
        ReturnURL: `${process.env.SITE_URL || "http://localhost:3001"}/payment/ecpay/return`,
        OrderResultURL: `${process.env.SITE_URL || "http://localhost:3001"}/payment/ecpay/callback`,
        ChoosePayment: "Credit",
        EncryptType: 1,
        NeedExtraPaidInfo: "N",
      };

      const raw = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&");

      const checkStr = `HashKey=${HashKey}&${raw}&HashIV=${HashIV}`;
      params.CheckMacValue = crypto.createHash("sha256").update(encodeURIComponent(checkStr).toLowerCase().replace(/%20/g, "+")).digest("hex").toUpperCase();

      return { action: "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5", method: "POST", params };
    },
  },

  mock: {
    name: "模擬付款",
    async pay(orderId, total, desc, userId) {
      await completePaidOrder(orderId, userId);
      return { action: "", method: "MOCK" };
    },
  },

  linepay: {
    name: "LINE Pay",
    async pay(orderId, total, desc) {
      const channelId = process.env.LINEPAY_CHANNEL_ID || "";
      const channelSecret = process.env.LINEPAY_CHANNEL_SECRET || "";
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      const nonce = crypto.randomUUID();
      const body = {
        amount: Math.round(total),
        currency: "TWD",
        orderId: `REAL${orderId.toString().padStart(8, "0")}`,
        packages: [{ id: String(orderId), amount: Math.round(total), products: [{ name: desc || "Realicious 訂單", quantity: 1, price: Math.round(total) }] }],
        redirectUrls: {
          confirmUrl: `${frontendUrl}/shop/checkoutFinished?from=linepay&orderId=${orderId}`,
          cancelUrl: `${frontendUrl}/shop/checkoutFinished?cancel=1&orderId=${orderId}`,
        },
      };

      const uri = "/v3/payments/request";
      const hmacSource = channelSecret + uri + JSON.stringify(body) + nonce;
      const signature = crypto.createHmac("sha256", channelSecret).update(hmacSource).digest("base64");

      const res = await fetch(`https://sandbox-api-pay.line.me${uri}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-LINE-ChannelId": channelId, "X-LINE-Authorization-Nonce": nonce, "X-LINE-Authorization": signature },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.returnCode === "0000") {
        return { action: data.info.paymentUrl.web, method: "REDIRECT" };
      }
      throw new Error(`LINE Pay error: ${data.returnMessage}`);
    },
  },
};

// ── POST /payment/pay — 依策略執行付款 ──
router.post("/pay", authenticateToken, async (req, res) => {
  const { method, orderId } = req.body;
  const strategy = paymentStrategies[method];
  if (!strategy) return res.status(400).json({ success: false, error: "不支援的付款方式" });

  try {
    const [rows] = await db.query(
      "SELECT id, user_id, total_price, status FROM `orders` WHERE id = ?",
      [orderId],
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: "訂單不存在" });

    const order = rows[0];
    if (Number(order.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, error: "無權操作此訂單" });
    }
    if (Number(order.status) !== 1) {
      return res.status(409).json({ success: false, error: "此訂單不是待付款狀態" });
    }
    await assertOrderStock(order.id);

    const result = await strategy.pay(
      order.id,
      order.total_price,
      `Realicious 訂單 #${order.id}`,
      Number(req.user.id),
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error("❌ 付款失敗:", error.message);
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

// ── POST /payment/ecpay/return — 綠界付款結果回調 ──
router.post("/ecpay/return", async (req, res) => {
  const { MerchantTradeNo, RtnCode } = req.body;
  const orderId = getOrderIdFromEcpayTradeNo(MerchantTradeNo);

  if (RtnCode === "1" && orderId) {
    try {
      await completePaidOrder(orderId);
    } catch (error) {
      console.error("❌ 綠界付款完成處理失敗:", error.message);
      return res.send("0|Error");
    }
  }

  res.send("1|OK");
});

// ── PUT /payment/confirm/:orderId — 前端回調確認付款（測試環境用）──
router.put("/confirm/:orderId", authenticateToken, async (req, res) => {
  try {
    await completePaidOrder(req.params.orderId, Number(req.user.id));
    res.json({ success: true });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

// ── GET+POST /payment/ecpay/callback — 綠界 OrderResultURL 轉導 ──
router.all("/ecpay/callback", async (req, res) => {
  const params = req.method === "POST" ? req.body : req.query;
  const orderId = getOrderIdFromEcpayTradeNo(params.MerchantTradeNo);
  if (orderId) params.orderId = String(orderId);
  const qs = new URLSearchParams(params).toString();
  res.redirect(302, `${process.env.FRONTEND_URL || "http://localhost:3000"}/shop/checkoutFinished?${qs}`);
});

export default router;
