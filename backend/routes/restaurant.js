import express from "express";
import pool from "../utils/connect-mysql.js";
const router = express.Router();

// 店家管理路由
router.get("/", async (req, res) => {
  const { keyword, is_poor_mode } = req.query; // 用一個 keyword 欄位來搜尋店名或分店
  let page = parseInt(req.query.page) || 1; 
  const perPage = 10; 
  if (page < 1) page = 1;

  let whereSql = " WHERE 1=1 ";
  let params = [];

  // 如果有輸入關鍵字，就搜尋店名(name)或分店(branch)
  if (keyword) {
    whereSql += " AND (name LIKE ? OR branch LIKE ?) "; 
    params.push("%" + keyword + "%", "%" + keyword + "%");
  }
  if (is_poor_mode) {
  whereSql += " AND is_poor_mode = ? ";
  params.push(is_poor_mode);
  }

  try {
    // 1. 算總筆數
    const countSql = `SELECT COUNT(1) AS totalRows FROM restaurant ${whereSql}`;
    const [[{ totalRows }]] = await pool.query(countSql, params);

    let totalPages = 0;
    let rows = [];

    if (totalRows > 0) {
      totalPages = Math.ceil(totalRows / perPage); 
      if (page > totalPages) page = totalPages; 

      const offset = (page - 1) * perPage;
      
      // 2. 撈當頁的店家資料
  const sql = `
          SELECT id, name, branch, desc_brief, telephone, 
                CONCAT(IFNULL(county, ''), IFNULL(district, ''), IFNULL(address, '')) AS location, 
                average_range,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at
          FROM restaurant 
          ${whereSql} 
          ORDER BY id  
          LIMIT ? OFFSET ?
        `;
      
      const limitParams = [...params, perPage, offset];
      const [data] = await pool.query(sql, limitParams);
      rows = data;
    }

    // 3. 打包傳給前端 EJS
    // 注意：這裡我們指向即將建立的新資料夾 `restaurant-Lia`
    res.render("restaurant-Lia/index", { 
      records: rows,
      totalRows: totalRows, 
      totalPages: totalPages,
      page: page,
      perPage: perPage,
      keyword: keyword || "" ,// 傳回前端讓搜尋框保留字串
      is_poor_mode: is_poor_mode || "",
      pageName: 'list' // 加上這行！告訴外殼要裝 'list' 的身體
    });

  } catch (error) {
    console.error("店家查詢發生錯誤：", error);
    res.status(500).send("資料庫不給看");
  }
});

// 顯示「新增店家」的表單頁面
router.get("/add", (req, res) => {
  // 統一渲染 index，但告訴它要用 'add' 這個身體
  res.render("restaurant-Lia/index", { 
    pageName: 'add' // 這是我們自訂的變數
  }); 
});

// 處理新增資料的提交 (接收 POST 請求)
router.post("/add", async (req, res) => {
  // 1. 從表單拿到所有解碼後的資料 (記得前端對應的 name 屬性)
  const { 
    name, branch, desc_brief, county, district, address, telephone, average_range, station_id,
    mon, tue, wed, thu, fri, sat, sun, holiday 
  } = req.body;

  try {
    // 2. 先存入主表 restaurant (取得資料庫自動產生的流水號 ID)
    // 🌟 前輩的防呆魔法：如果沒填捷運站，確保它變成 null 而不是空字串，才不會被外鍵阻擋！
    const finalStationId = station_id ? station_id : null;
    
    const sqlRes = "INSERT INTO restaurant (name, branch, desc_brief, county, district, address, telephone, average_range, station_id) VALUES (?,?,?,?,?,?,?,?,?)";
    const [result] = await pool.query(sqlRes, [name, branch, desc_brief, county, district, address, telephone, average_range, finalStationId]);
    
    const newId = result.insertId; // 🌟 拿到熱騰騰的新餐廳 ID！

    // 3. 用同一個 ID 存入副表 work_hour (達成你說的兩者 ID 相同！)
    const sqlHour = "INSERT INTO work_hour (id, mon, tue, wed, thu, fri, sat, sun, holiday) VALUES (?,?,?,?,?,?,?,?,?)";
    await pool.query(sqlHour, [newId, mon, tue, wed, thu, fri, sat, sun, holiday]);

    // 4. 大功告成，把使用者踢回列表頁看他剛新增的資料
    res.redirect("/restaurant");
    
  } catch (error) {
    console.error("❌ 新增店家失敗：", error);
    res.status(500).send("新增過程出錯了，請檢查伺服器終端機的錯誤訊息。");
  }
});

// 顯示「編輯店家」的表單頁面，並帶入現有資料
router.get("/edit/:id", async (req, res) => {
  const restaurantId = req.params.id;

  try {
    // 1. 去主表 restaurant 撈取這家店的基本資料
    const sqlRes = "SELECT * FROM restaurant WHERE id = ?";
    const [resData] = await pool.query(sqlRes, [restaurantId]);

    // 2. 去副表 work_hour 撈取這家店的營業時間[cite: 1]
    const sqlHour = "SELECT * FROM work_hour WHERE id = ?";
    const [hourData] = await pool.query(sqlHour, [restaurantId]);

    // 防呆：如果找不到這家店，就把他踢回列表頁
    if (resData.length === 0) {
      return res.redirect("/restaurant");
    }

    // 3. 把撈到的資料傳給前端 EJS，並告訴 index 要裝上 'edit' 的身體
    res.render("restaurant-Lia/index", { 
      pageName: 'edit',
      restaurantData: resData[0], // 傳送第一筆(也是唯一一筆)餐廳資料
      workHourData: hourData[0] || {} // 傳送營業時間資料
    }); 

  } catch (error) {
    console.error("❌ 撈取編輯資料失敗：", error);
    res.status(500).send("伺服器出錯囉");
  }
});

// 處理編輯資料的提交
router.post("/edit/:id", async (req, res) => {
  const restaurantId = req.params.id;
  const { 
    name, branch, desc_brief, county, district, address, telephone, average_range, station_id,
    mon, tue, wed, thu, fri, sat, sun, holiday 
  } = req.body; // 這裡跟新增一樣[cite: 3]

  try {
    const finalStationId = station_id ? station_id : null;
    
    // 1. 更新主表 restaurant[cite: 1]
    const sqlRes = `
      UPDATE restaurant 
      SET name=?, branch=?, desc_brief=?, county=?, district=?, address=?, telephone=?, average_range=?, station_id=?
      WHERE id=?
    `;
    await pool.query(sqlRes, [name, branch, desc_brief, county, district, address, telephone, average_range, finalStationId, restaurantId]);

    // 2. 更新副表 work_hour[cite: 1]
    const sqlHour = `
      UPDATE work_hour 
      SET mon=?, tue=?, wed=?, thu=?, fri=?, sat=?, sun=?, holiday=?
      WHERE id=?
    `;
    await pool.query(sqlHour, [mon, tue, wed, thu, fri, sat, sun, holiday, restaurantId]);

    // 3. 修改成功，踢回列表頁
    res.redirect("/restaurant");
    
  } catch (error) {
    console.error("❌ 更新店家失敗：", error);
    res.status(500).send("更新過程出錯了！");
  }
});

// 處理刪除功能
router.post("/delete/:id", async (req, res,next) => {
  const restaurantId = req.params.id;

  try {
    // 💡 小技巧：由於 work_hour 的 id 是關聯到 restaurant 的 id[cite: 1]，
    // 如果你有設定 Foreign Key 的 ON DELETE CASCADE，刪除主表就會自動刪除副表。
    // 但如果沒設定，保險起見我們手動先刪副表，再刪主表！
    await pool.query('DELETE FROM vote WHERE restaurant_id = ?', [restaurantId]);
    await pool.query("DELETE FROM restaurant_badge WHERE restaurant_id = ?;",[restaurantId])

    await pool.query("DELETE FROM work_hour WHERE id = ?", [restaurantId]);
    await pool.query("DELETE FROM restaurant WHERE id = ?", [restaurantId]);

    res.redirect("/restaurant");
  } catch (error) {
    console.error("❌ 刪除店家失敗：", error);
    res.status(500).send("刪除失敗！");
  }
});

export default router;