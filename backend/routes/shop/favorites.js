import express from "express";
import db from "../../utils/connect-mysql.js";

const router = express.Router();

// [READ] 取得使用者收藏列表（JOIN products 拿名稱/價格/圖片）
router.get("/", async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || 0;
    if (!userId) return res.json({ success: true, data: [] });

    const [data] = await db.query(
      `SELECT f.id, f.product_id, f.created_at,
              p.name AS product_name, p.price AS product_price,
              (SELECT url FROM product_imgs WHERE product_id = p.id AND is_main = 1 LIMIT 1) AS product_img
       FROM favorites f
       JOIN products p ON f.product_id = p.id
       WHERE f.user_id = ?
       ORDER BY f.id DESC`,
      [userId]
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error("❌ 收藏查詢錯誤:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// [CREATE] 新增收藏
router.post("/", async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    if (!user_id || !product_id) return res.status(400).json({ success: false, error: "缺少參數" });

    await db.query(
      "INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)",
      [user_id, product_id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("❌ 收藏新增錯誤:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// [DELETE] 取消收藏
router.delete("/:productId", async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || 0;
    const productId = parseInt(req.params.productId) || 0;
    if (!userId || !productId) return res.status(400).json({ success: false, error: "缺少參數" });

    await db.query(
      "DELETE FROM favorites WHERE user_id = ? AND product_id = ?",
      [userId, productId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("❌ 收藏刪除錯誤:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
