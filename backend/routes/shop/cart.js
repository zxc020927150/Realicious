import express from "express";
import db from "../../utils/connect-mysql.js";

const router = express.Router();

function parseId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function getCartItems(userId) {
  const [items] = await db.query(
    `SELECT
      c.product_id AS id,
      c.quantity AS qty,
      p.name,
      p.price,
      p.stock_qty,
      (
        SELECT pi.url
        FROM product_imgs pi
        WHERE pi.product_id = p.id AND pi.is_main = 1
        ORDER BY pi.id ASC
        LIMIT 1
      ) AS main_img
    FROM cart c
    JOIN products p ON p.id = c.product_id
    WHERE c.user_id = ?
    ORDER BY c.created_at ASC, c.id ASC`,
    [userId],
  );
  return items;
}

// 取得會員購物車
router.get("/:userId", async (req, res) => {
  const userId = parseId(req.params.userId);
  if (!userId) return res.status(400).json({ success: false, error: "無效的會員 ID" });

  try {
    res.json({ success: true, items: await getCartItems(userId) });
  } catch (error) {
    console.error("讀取購物車失敗:", error.message);
    res.status(500).json({ success: false, error: "讀取購物車失敗" });
  }
});

// 合併訪客購物車；相同商品數量相加。
router.post("/:userId/merge", async (req, res) => {
  const userId = parseId(req.params.userId);
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!userId) return res.status(400).json({ success: false, error: "無效的會員 ID" });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const item of items) {
      const productId = parseId(item.product_id);
      const quantity = Number.parseInt(item.qty, 10);
      if (!productId || !Number.isInteger(quantity) || quantity < 1) continue;

      const [[product]] = await connection.query(
        "SELECT stock_qty FROM products WHERE id = ? AND is_active = 1 FOR UPDATE",
        [productId],
      );
      const stockQty = Number(product?.stock_qty) || 0;
      if (stockQty < 1) continue;

      const insertQty = Math.min(quantity, stockQty);
      await connection.query(
        `INSERT INTO cart (user_id, product_id, quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + ?, ?)`,
        [userId, productId, insertQty, quantity, stockQty],
      );
    }

    await connection.commit();
    res.json({ success: true, items: await getCartItems(userId) });
  } catch (error) {
    await connection.rollback();
    console.error("合併購物車失敗:", error.message);
    res.status(500).json({ success: false, error: "合併購物車失敗" });
  } finally {
    connection.release();
  }
});

// 加入商品（相同商品數量相加）
router.post("/:userId/items", async (req, res) => {
  const userId = parseId(req.params.userId);
  const productId = parseId(req.body.product_id);
  const quantity = Number.parseInt(req.body.qty, 10);
  if (!userId || !productId || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ success: false, error: "商品或數量不正確" });
  }

  try {
    const [[product]] = await db.query(
      "SELECT stock_qty FROM products WHERE id = ? AND is_active = 1",
      [productId],
    );
    const stockQty = Number(product?.stock_qty) || 0;
    if (stockQty < 1) {
      return res.status(409).json({ success: false, error: "商品已售完" });
    }

    const insertQty = Math.min(quantity, stockQty);
    await db.query(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + ?, ?)`,
      [userId, productId, insertQty, quantity, stockQty],
    );
    res.json({ success: true, items: await getCartItems(userId) });
  } catch (error) {
    console.error("加入購物車失敗:", error.message);
    res.status(500).json({ success: false, error: "加入購物車失敗" });
  }
});

// 修改單一商品數量
router.patch("/:userId/items/:productId", async (req, res) => {
  const userId = parseId(req.params.userId);
  const productId = parseId(req.params.productId);
  const quantity = Number.parseInt(req.body.qty, 10);
  if (!userId || !productId || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ success: false, error: "商品或數量不正確" });
  }

  try {
    const [[product]] = await db.query(
      "SELECT stock_qty FROM products WHERE id = ? AND is_active = 1",
      [productId],
    );
    const stockQty = Number(product?.stock_qty) || 0;
    if (stockQty < 1) {
      return res.status(409).json({ success: false, error: "商品已售完" });
    }
    const nextQuantity = Math.min(quantity, stockQty);

    await db.query(
      "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?",
      [nextQuantity, userId, productId],
    );
    res.json({ success: true, items: await getCartItems(userId) });
  } catch (error) {
    console.error("更新購物車失敗:", error.message);
    res.status(500).json({ success: false, error: "更新購物車失敗" });
  }
});

// 移除單一商品
router.delete("/:userId/items/:productId", async (req, res) => {
  const userId = parseId(req.params.userId);
  const productId = parseId(req.params.productId);
  if (!userId || !productId) return res.status(400).json({ success: false, error: "商品不正確" });

  try {
    await db.query("DELETE FROM cart WHERE user_id = ? AND product_id = ?", [userId, productId]);
    res.json({ success: true, items: await getCartItems(userId) });
  } catch (error) {
    console.error("移除購物車商品失敗:", error.message);
    res.status(500).json({ success: false, error: "移除購物車商品失敗" });
  }
});

// 清空會員購物車
router.delete("/:userId", async (req, res) => {
  const userId = parseId(req.params.userId);
  if (!userId) return res.status(400).json({ success: false, error: "無效的會員 ID" });

  try {
    await db.query("DELETE FROM cart WHERE user_id = ?", [userId]);
    res.json({ success: true, items: [] });
  } catch (error) {
    console.error("清空購物車失敗:", error.message);
    res.status(500).json({ success: false, error: "清空購物車失敗" });
  }
});

export default router;
