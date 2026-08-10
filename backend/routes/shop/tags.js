import express from 'express';
import db from "../../utils/connect-mysql.js";

const router = express.Router();

// 1. 讀取清單 (GET /tags)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // 這裡維持 SELECT * 沒問題
    const [data] = await db.query(
      "SELECT * FROM `tags` ORDER BY id LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const [countResult] = await db.query("SELECT COUNT(*) as total FROM `tags` ");
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data,
      pagination: { 
        total, 
        totalPages: Math.ceil(total / limit), 
        currentPage: page 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. 新增 (POST /tags/add) - 修正點：補上 category
router.post("/add", async (req, res) => {
  try {
    // 這裡解構賦值拿 name，並給 category 一個預設值 'location'
    const { area = 'location' } = req.body;
    
    // SQL 必須寫入兩個欄位，否則會因為 NOT NULL 而失敗
    const sql = "INSERT INTO `tags` (area) VALUES (?)";
    const [result] = await db.query(sql, [area]);
    
    res.json({ success: !!result.affectedRows, insertId: result.insertId });
  } catch (error) {
    // 如果失敗，這裡會回傳錯誤訊息，你可以從 F12 看到
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. 修改 (PUT /tags/edit/:id) - 修正點：對應新欄位名 name
router.put("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { area } = req.body;
    
    // 如果未來你想連分類一起改，可以寫成這樣：
    const sql = "UPDATE `tags` SET `area` = ? WHERE `id` = ?";
    // 但如果你目前只想改名字，category 可以拿掉，這裡我先幫你寫最保險的改名版：
    // const sql = "UPDATE `tags` SET `name` = ? WHERE `id` = ?";
    
    const [result] = await db.query(sql, [area || 'location', id]);
    res.json({ success: !!result.affectedRows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. 刪除 (DELETE /tags/delete/:id) - 維持不變
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM `tags` WHERE `id` = ?", [id]);

    if(result.affectedRows === 0 ) {
      return res.json({
        success: false,
        error: "找不到該標籤資料"
      });
    }

    res.json({
      success:true
    });
  } catch (error) {
    console.error(`SQL Error: ${error.message}`);
    
    // 檢查是不是外鍵約束錯誤 (MySQL 錯誤代碼 1451)
    let errorMsg = `刪除失敗, 系統發生錯誤`
    if(error.errno === 1451 || error.code ==="ER_ROW_IS_REFERENCE_2"){
      errorMsg = "此標籤目前正被商品使用中,無法刪除！";
    }
    
    
    res.status(200).json({ // 這裡改傳 200，前端 fetch 才比較好抓到 JSON 內容
      success: false,
      error: errorMsg });
  }
});

export default router;