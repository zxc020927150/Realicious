import express from "express";
import db from "../../utils/connect-mysql.js";

const router = express.Router();

// [READ] 獲取使用者票券（支援 user_id 篩選）
router.get("/", async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id) || 0;

    let whereSql = "";
    const params = [];
    if (userId) {
      whereSql = "WHERE t.user_id = ?";
      params.push(userId);
    }

    const sql = `
      SELECT 
        t.*,
        p.name AS product_name,
        p.price AS product_price,
        (SELECT url FROM product_imgs WHERE product_id = p.id AND is_main = 1 LIMIT 1) AS product_img
      FROM user_tickets t
      LEFT JOIN products p ON t.product_id = p.id
      ${whereSql}
      ORDER BY t.id DESC`;

    const [data] = await db.query(sql, params);

    res.json({ success: true, data });
  } catch (error) {
    console.error("❌ 票券查詢錯誤:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// [EXPIRE] 將票券設為已過期（Demo 用）
router.put("/expire/:code", async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE user_tickets SET status = 3, expires_at = DATE_SUB(NOW(), INTERVAL 1 SECOND) WHERE redeem_code = ? AND status = 1",
      [req.params.code]
    );
    if (result.affectedRows === 0) {
      return res.json({ success: false, error: "票券不存在或已使用" });
    }
    res.json({ success: true, message: "已設為已過期" });
  } catch (error) {
    console.error("❌ 過期操作錯誤:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// [REDEEM] 核銷票券
router.put("/redeem/:code", async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE user_tickets
       SET status = 2, used_at = NOW()
       WHERE redeem_code = ?
         AND status = 1
         AND (expires_at IS NULL OR expires_at >= NOW())`,
      [req.params.code]
    );
    if (result.affectedRows === 0) {
      return res.json({ success: false, error: "票券不存在、已使用或已過期" });
    }
    res.json({ success: true, message: "核銷成功" });
  } catch (error) {
    console.error("❌ 核銷錯誤:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
