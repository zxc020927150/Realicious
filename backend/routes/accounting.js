import express from "express";
import pool from "../utils/connect-mysql.js";
const router = express.Router();

// 吃土模式 (User Budget) 專屬路由
router.get("/", async (req, res) => {
  const { username, is_poor_mode } = req.query; 
  let page = parseInt(req.query.page) || 1; 
  const perPage = 10; 
  if (page < 1) page = 1;

  // 1. 準備共用的 WHERE 條件與參數
  let whereSql = " WHERE 1=1 ";
  let params = [];

  // 如果有輸入名稱，加入搜尋條件
  if (username) {
    whereSql += " AND CONCAT(b.last_name, b.first_name) LIKE ? "; 
    params.push("%" + username + "%");
  }
  // 如果有選擇吃土模式，加入搜尋條件
  if (is_poor_mode) {
    whereSql += " AND a.is_poor_mode_enabled = ? ";
    params.push(is_poor_mode);
  }

  try {
    // 2. 算「預算表」的總筆數 (這次對準目標啦！)
    const countSql = `SELECT COUNT(1) AS totalRows FROM user_budget a LEFT JOIN user_profile b ON a.user_id = b.id ${whereSql}`;
    const [[{ totalRows }]] = await pool.query(countSql, params);

    let totalPages = 0;
    let rows = [];

    if (totalRows > 0) {
      totalPages = Math.ceil(totalRows / perPage); 
      if (page > totalPages) page = totalPages; 

      const offset = (page - 1) * perPage;
      
      // 3. 撈「預算表」當頁的資料，並加上 LIMIT 跟 OFFSET 來做分頁
      const sql = `
        SELECT a.id, 
               CONCAT(b.last_name, b.first_name) AS full_name, 
               CONCAT(DATE_FORMAT(SYSDATE(), '%Y-%m'), '-', LPAD(a.reset_day, 2, '0')) AS reset_date, 
               a.monthly_budget, a.is_poor_mode_enabled, 
               DATE_FORMAT(a.create_time, '%Y-%m-%d %H:%i:%s') AS create_time, 
               DATE_FORMAT(a.update_time, '%Y-%m-%d %H:%i:%s') AS update_time 
        FROM user_budget a 
        LEFT JOIN user_profile b ON a.user_id = b.id 
        ${whereSql} 
        ORDER BY a.update_time DESC 
        LIMIT ? OFFSET ?
      `;
      
      const limitParams = [...params, perPage, offset];
      const [data] = await pool.query(sql, limitParams);
      rows = data;
    }

    // 4. 打包傳給 EJS 畫面
    res.render("accounting-Lia/index", { 
      records: rows, // 既然獨立一頁了，變數名稱我們改回單純的 records 就好
      totalRows: totalRows, 
      totalPages: totalPages,
      page: page,
      perPage: perPage,
      // 把搜尋關鍵字也傳下去，讓分頁按鈕的 href 可以保留搜尋狀態
      username: username || "",
      is_poor_mode: is_poor_mode || ""
    });

  } catch (error) {
    console.error("查詢發生錯誤 QQ：", error);
    res.status(500).send("資料庫不給看");
  }
});

export default router;