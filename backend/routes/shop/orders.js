import express from "express";
import db from "../../utils/connect-mysql.js";
import { authenticateToken } from "../../middlewares/hua/auth.js";

const router = express.Router();

// [READ] 獲取訂單列表（支援 user_id 篩選）
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const userId = parseInt(req.query.user_id) || 0;

    let whereSql = "";
    const params = [];
    if (userId) {
      whereSql = "WHERE o.user_id = ?";
      params.push(userId);
    }

    const sql = `
      SELECT 
        o.id, 
        o.user_id, 
        o.status, 
        o.created_at, 
        u.account as user_name,
        IFNULL((SELECT SUM(unit_price * quantity) FROM \`order_items\` WHERE order_id = o.id), 0) as total_price
      FROM \`orders\` o
      LEFT JOIN \`users\` u ON o.user_id = u.id
      ${whereSql}
      ORDER BY o.id DESC LIMIT ? OFFSET ?`;
    
    params.push(limit, offset);
    const [data] = await db.query(sql, params);

    const countSql = `SELECT COUNT(*) as total FROM \`orders\` o ${whereSql}`;
    const [[{total}]] = await db.query(countSql, userId ? [userId] : []);

    res.json({
      success: true,
      data,
      pagination: { total, totalPages: Math.ceil(total / limit) || 1, currentPage: page }
    });
  } catch (error) {
    console.error("❌ SQL 錯誤:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// [READ DETAIL] 獲取訂單明細
// [READ DETAIL] 獲取訂單明細
router.get("/detail/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // console.log("正在查詢訂單明細，訂單ID:", id); // 除錯用

    const sql = `
      SELECT 
        oi.id, 
        oi.product_id, 
        oi.quantity, 
        oi.unit_price, 
        p.name AS product_name,
        p.is_active -- 關鍵：增加抓取商品目前的上下架狀態
      FROM \`order_items\` oi
      LEFT JOIN \`products\` p ON oi.product_id = p.id
      WHERE oi.order_id = ?`;
    
    const [items] = await db.query(sql, [id]);
    res.json({ success: true, items });
  } catch (error) {

    // console.error("❌ SQL 錯誤 (訂單明細):", error.message);

    res.status(500).json({ success: false, error: error.message });
  }
});


// [CREATE] 新增訂單：會員身分、價格與庫存一律由後端確認。
router.post("/", authenticateToken, async (req, res) => {
  const {
    items,
    address = "",
    recipient_name = "",
    recipient_email = "",
    recipient_phone = "",
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: "訂單沒有商品" });
  }

  const requestedItems = new Map();
  for (const item of items) {
    const productId = Number.parseInt(item.id, 10);
    const quantity = Number.parseInt(item.qty, 10);
    if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, error: "商品或數量不正確" });
    }
    requestedItems.set(productId, (requestedItems.get(productId) || 0) + quantity);
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const productIds = [...requestedItems.keys()];
    const [products] = await connection.query(
      `SELECT id, name, price, stock_qty, is_active
       FROM products
       WHERE id IN (?)
       FOR UPDATE`,
      [productIds],
    );
    const productMap = new Map(products.map((product) => [product.id, product]));
    const verifiedItems = [];

    for (const [productId, quantity] of requestedItems) {
      const product = productMap.get(productId);
      if (!product || !product.is_active) {
        const error = new Error(`商品 #${productId} 已下架或不存在`);
        error.statusCode = 409;
        throw error;
      }
      if (Number(product.stock_qty) < quantity) {
        const error = new Error(`${product.name} 庫存只剩 ${product.stock_qty} 件`);
        error.statusCode = 409;
        throw error;
      }
      verifiedItems.push({
        id: product.id,
        quantity,
        unitPrice: Number(product.price),
      });
    }

    const totalPrice = verifiedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const [orderResult] = await connection.query(
      `INSERT INTO \`orders\`
        (user_id, status, total_price, address, recipient_name, recipient_email, recipient_phone, paid_at)
       VALUES (?, 1, ?, ?, ?, ?, ?, NULL)`,
      [
        Number(req.user.id),
        totalPrice,
        address,
        recipient_name,
        recipient_email,
        recipient_phone,
      ],
    );
    const orderId = orderResult.insertId;

    for (const item of verifiedItems) {
      await connection.query(
        "INSERT INTO `order_items` (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
        [orderId, item.id, item.quantity, item.unitPrice],
      );
    }

    await connection.commit();
    res.json({ success: true, orderId });
  } catch (error) {
    await connection.rollback();
    console.error("❌ 訂單建立失敗:", error.message);
    console.error("❌ SQL:", error.sql);
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});


export default router;
