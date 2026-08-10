import express from "express";
import db from "../../utils/connect-mysql.js";

const router = express.Router();

// [READ] 獲取所有紅利紀錄
router.get("/", async (req, res) => {
  try {
    const { page = 1, search = "" } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    // 建立篩選條件，支援搜尋帳號或 ID
    let whereSql = "";
    const params = [];
    if (search) {
      whereSql = "WHERE u.account LIKE ? OR u.id = ?";
      params.push(`%${search}%`, search);
    }

    const sql = `
      SELECT p.*, u.account 
      FROM \`point_logs\` p
      LEFT JOIN \`users\` u ON p.user_id = u.id
      ${whereSql}
      ORDER BY p.id DESC LIMIT ? OFFSET ?`;
    
    params.push(limit, offset);
    
    const [data] = await db.query(sql, params);
    
    // 總筆數也需要跟著搜尋條件變化
    const countSql = `SELECT COUNT(*) as total FROM \`point_logs\` p LEFT JOIN \`users\` u ON p.user_id = u.id ${whereSql}`;
    const [[{total}]] = await db.query(countSql, search ? [`%${search}%`, search] : []);

    res.json({ success: true, data, pagination: { total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;