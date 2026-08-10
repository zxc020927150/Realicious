import fs from 'fs';
import path from 'path';
import express from "express";
import pool from "../utils/connect-mysql.js";
const router = express.Router();

// 用戶記帳明細路由
router.get("/", async (req, res) => {
  const { username, category } = req.query; 
  let page = parseInt(req.query.page) || 1;
  const perPage = 10;
  if (page < 1) page = 1;

  let whereSql = " WHERE 1=1 ";
  let params = [];

  if (username) {
    whereSql += " AND CONCAT(u.last_name, u.first_name) LIKE ? ";
    params.push("%" + username + "%");
  }

  if (category) {
    whereSql += " AND d.category = ? ";
    params.push(category);
  }

  try {
    // 1. 計算總筆數
    const countSql = `
      SELECT COUNT(1) AS totalRows 
      FROM diet_detail d 
      LEFT JOIN user_profile u ON d.user_id = u.id 
      ${whereSql}
    `;
    const [[{ totalRows }]] = await pool.query(countSql, params);

    let totalPages = 0;
    let rows = [];

    // 🌟 確保只有在有資料時才計算 offset 與執行查詢
    if (totalRows > 0) {
      totalPages = Math.ceil(totalRows / perPage);
      if (page > totalPages) page = totalPages;
      
      // 定義 offset
      const offset = (page - 1) * perPage;

      // 2. 撈取當頁明細資料
      const sql = `
        SELECT 
            d.id,
            CONCAT(u.last_name, u.first_name) AS full_name,
            DATE_FORMAT(d.consume_date, '%Y-%m-%d %H:%i') AS consume_date,
            d.category,
            d.amount,
            d.user_remark,
            f.file_path AS receipt_image 
        FROM diet_detail d
        LEFT JOIN user_profile u ON d.user_id = u.id
        LEFT JOIN upload_file f ON d.upload_file_id = f.id
        ${whereSql}
        ORDER BY d.consume_date 
        LIMIT ? OFFSET ?
      `;

      const limitParams = [...params, perPage, offset];
      const [data] = await pool.query(sql, limitParams);
      rows = data;

      // --- 🌟 Base64 轉換處理 ---
      const imageBaseFolder = path.join(process.cwd(), 'public');

      for (let item of rows) {
        if (item.receipt_image) {
          try {
            const filePath = path.join(imageBaseFolder, item.receipt_image);
            if (fs.existsSync(filePath)) { // 先檢查檔案是否存在
              const fileData = fs.readFileSync(filePath);
              const ext = path.extname(item.receipt_image).toLowerCase().replace('.', '');
              const mimeType = ext === 'jpg' ? 'jpeg' : (ext || 'png');
              item.base64_src = `data:image/${mimeType};base64,${fileData.toString('base64')}`;
            }
          } catch (err) {
            console.error(`圖片讀取失敗：${item.receipt_image}`, err);
          }
        }
      }
    }

    // 3. 渲染畫面：使用 return 確保執行完這行就結束
    return res.render("accounting-detail-Lia/index", {
      records: rows,
      totalRows: totalRows,
      totalPages: totalPages,
      page: page,
      perPage: perPage,
      username: username || "",
      category: category || ""
    });

  } catch (error) {
    console.error("明細查詢發生錯誤：", error);
    // 🌟 防護機制
    if (!res.headersSent) {
      return res.status(500).send("伺服器內部錯誤");
    }
  }
});

export default router;