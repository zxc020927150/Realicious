import express from "express";
import pool from "../utils/connect-mysql.js";

const router = express.Router();


// ----SQL查詢------------------------------------
//降低合併遺失風險-合併項目依照子sl.id排序
const STATION_QUERY_SQL = 
`SELECT 
    s.id as 站號,
    s.name AS 站名, 
    GROUP_CONCAT(sl.code ORDER BY sl.id SEPARATOR ' & ') AS 所有站碼,
    GROUP_CONCAT(sls.station_line_type_string ORDER BY sl.id SEPARATOR ' / ') AS 所有線路
    FROM station s
    LEFT JOIN station_line sl ON s.id = sl.station_id
    LEFT JOIN station_line_string sls ON sl.type_id = sls.station_line_type_id
    GROUP BY s.id, s.name`;

    

// ----READ: API JSON資料--------------------------------------
// !!!暫時不會用到，故反白 
// router.get("/api", async (req, res) => {
//   try {
//     const [rows] = await pool.query(STATION_QUERY_SQL);
//     res.json({ success: true, data: rows });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });



// ----READ: EJS 列表--------------------------------------
router.get("/list", async (req, res) => {
  try {
    const [rows] = await pool.query(STATION_QUERY_SQL);
    res.render("list_page", { data: rows });
  } catch (err) {
    res.status(500).send("無法載入列表");
  }
});



// ----CREATE: 顯示新增表單--------------------------------------
router.get("/add", async (req, res) => {
  try {
    //先把線路資料 通通填入 下拉式選單。
    const [rows] = await pool.query(`SELECT * FROM station_line_string`);
    res.render("add_page", { rows_line_type: rows });
  } catch (err) {
    res.status(500).send("無法載入_新增頁面");
  }
});

//-----------------------------------------------------------
//-----------------------------------------------------------
//-----------------------------------------------------------
//-----------------------------------------------------------

//edit get路由功能
router.get("/edit/:id", async (req, res) => {
  try {
    //動態路由:id
    const { id } = req.params;
    
    const [station] = await pool.query(`SELECT * FROM station WHERE id = ?`, [id]);
    const [line_types] = await pool.query(`SELECT * FROM station_line_string`);
    const [current_lines] = await pool.query(
      `SELECT * FROM station_line WHERE station_id = ?`,[id]);

    if (!station.length) {
      return res.status(404).send("找不到該車站");
    }

    res.render("edit_page", {
      station: station[0],
      types: line_types,
      currentLine: current_lines
    });
  } catch (err) {
    res.status(500).send("無法載入編輯頁面");
  }
});



// ----UPDATE: 送出編輯表單--------------------------------------
router.post("/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { name, line_codes, line_types } = req.body;

  //<form>不可信，需統一轉成陣列 > [].concat(x)> 給它字串 → 把字串包進陣列> 結果永遠是一維陣列
  // 單筆or多筆資料會決定回來的是陣列還是字串，直接line_codes[0]會出錯。
  //array.filter(Boolean)濾掉所有空值（空字串、undefined、null、0）
  const codes = [].concat(line_codes).filter(Boolean);
  const types = [].concat(line_types).filter(Boolean);

  // 取得 connection 以便使用 transaction
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [duplicate] = await conn.query(`
      SELECT id FROM station WHERE name = ? AND id != ?`, [name, id]);

    if(duplicate.length > 0){
      //資料庫裡已存在的資料A
      const targetId = duplicate[0].id;

      // 取出 B 現有的所有線路
      const [bLines] = await conn.query(`
        SELECT * FROM station_line WHERE station_id = ?`, [id]);

        for(const line of bLines){
          // 確認 A 是否已有相同 type_id 的線路
          const [conflict] = await conn.query(`
            SELECT id FROM station_line WHERE station_id = ? AND type_id = ?`,
          [targetId, line.type_id]);

        if (conflict.length === 0) {
          // A 沒有這條線路 → 直接UPDATE station_id
          await conn.query(
            `UPDATE station_line SET station_id = ? WHERE id = ?`,
            [targetId, line.id]);
        }
      // A 已有相同線路 → 跳過（保留 A 的資料，B 的這筆會被 CASCADE 刪除）
    }

      // 此時 B 的 station_line 已全部過戶或確認 A 有對應線路
      // 刪除 B，CASCADE 清掉剩餘未過戶的孤兒資料（即 A 已有的重複線路）
      await conn.query(`DELETE FROM station WHERE id = ?`, [id]);

  }else{
    //【一般更名 / 線路更新模式】
      await conn.query(`UPDATE station SET name = ? WHERE id = ?`, [name, id]);
      await conn.query(`DELETE FROM station_line WHERE station_id = ?`, [id]);
    
      for (let i = 0; i < codes.length; i++) {
        if (!codes[i] || !types[i]) continue;
        await conn.query(
          `INSERT INTO station_line (station_id, code, type_id) VALUES (?, ?, ?)`,
          [id, codes[i], types[i]]
        );
      }

  }



    // const sql = `UPDATE station SET name = ? WHERE id = ?`;
    // await pool.query(sql, [name, id]);
    // //刪除舊的線路關聯
    // await pool.query(`DELETE FROM station_line WHERE station_id = ?`, [id]);

    // // 3. 重新插入新的線路資料 (迴圈處理)
    // for (let i = 0; i < line_codes.length; i++) {
    //   await pool.query(
    //     "INSERT INTO station_line (station_id, code, type_id) VALUES (?, ?, ?)",
    //     [id, line_codes[i], line_types[i]],
    //   );
    // }
    await conn.commit();
    res.redirect("/station/list");

  } catch (err) {
    await conn.rollback();
    console.error("Edit Error:", err);
    res.status(500).send(`操作失敗：${err.message}`);
  }finally{
    // 一定要釋放 connection，否則 pool 會耗盡
    conn.release();
  }
});





//路由功能: DELETE-------------------------------------------
router.get("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM station WHERE id = ?`, [id]);
    res.redirect("/station/list");
  } catch (err) {
    res.status(500).send("刪除動作有問題");
  }
});

export default router;


//-----------------------------------------------------------
//-----------------------------------------------------------

// 路由功能: SUBMIT新增資料(會發生搶奪其他比已註冊資料，銀行會不喜歡XD簡單說就是挖空別人資料)
// router.post("/add", async (req, res) => {
//   try {
//     const { _name, _line_code, _line_type } = req.body;

//     // 1. 基本驗證
//     if (!_name || !_line_code || !_line_type) {
//       return res.send(`<script>alert("錯誤：所有欄位都要填寫啊。"); window.history.back();</script>`);
//     }

//     // 2. 處理 station 表格的name (取得 ID)
//     const [rows_name_exist] = await pool.query(`SELECT id FROM station WHERE name = ?`, [_name]);
//     let _exist_station_id;

//     if (rows_name_exist.length > 0) {
//       _exist_station_id = rows_name_exist[0].id;
//     } else {
//       const [rows_name_new] = await pool.query(`INSERT INTO station(name) VALUES(?)`, [_name]);
//       _exist_station_id = rows_name_new.insertId;
//     }

//     // 3. 這邊是station_line，執行「完全複寫」邏輯
//     // !!! 此 SQL 會處理兩種衝突：
//     // 1. 如果 code 重複 -> 執行 UPDATE，把該站碼「搬家」到新線路/新站名
//     // 2. 如果 (station_id, type_id) 重複 -> 執行 UPDATE，更新該線路的站碼
//     await pool.query(
//       `INSERT INTO station_line (station_id, code, type_id)
//        VALUES (?, ?, ?)
//        ON DUPLICATE KEY UPDATE
//        station_id = VALUES(station_id),
//        type_id = VALUES(type_id),
//        code = VALUES(code)`,
//       [_exist_station_id, _line_code, _line_type]
//     );

//     res.redirect("/station/list");

//   } catch (err) {
//     console.error("SQL 錯誤細節:", err.code);

//     // !!! 唯獨「跨站搶碼」若你不想自動複寫（想彈窗報錯），則需保留此判斷
//     // !!! 但若使用上面的 ON DUPLICATE KEY UPDATE，它會直接「搶過來」
//     // !!! 如果你希望「被別站佔用時要報錯」而不是自動搶奪，請維持原有的 SELECT 檢查

//     res.send(`<script>alert("伺服器錯誤: ${err.message}"); window.history.back();</script>`);
//   }
// });

// 路由功能: SUBMIT新增資料(早期屍體: JS硬幹，像在打地鼠)
// router.post("/add", async (req, res) => {
//   try {
//     //注意: form裡面用到的name,都要符合POST路由的解構變數。
//     const { _name, _line_code, _line_type } = req.body;

//     //基本驗證
//     if (!_name || !_line_code || !_line_type) {
//       return res.status(400).send("錯誤：所有欄位都要填寫啊。");
//     }
//     if (_line_code.length > 4) {
//       return res.status(400).send("錯誤：站碼不得超過 4 個字元。");
//     }
//     //-----------------------------------------------------------
//     //-----------------------------------------------------------重複站名檢核區塊
//     //先檢查station資料庫有沒有相同 站名 的資料
//     const [rows_name_exist] = await pool.query(
//       `SELECT * FROM station WHERE name = ?`,
//       [_name],
//     );

//     let _exist_station_id;

//     if (rows_name_exist.length > 0) {
//       //如果站名已存在，則從物件陣列中接住第一個物件的id。
//       _exist_station_id = rows_name_exist[0].id;
//     } else {
//       //如果station資料庫 無站名重複資料，才進入新增資料流程
//       const [rows_update] = await pool.query(
//         `INSERT INTO station(name) VALUES(?)`,
//         [_name],
//       );
//       //在insert期間取得PK
//       _exist_station_id = rows_update.insertId;
//     }
//     //-----------------------------------------------------------
//     //-----------------------------------------------------------

//     // 先抓出這個站所有的線路資料
// const [all_lines_of_station] = await pool.query(
//   `SELECT * FROM station_line WHERE station_id = ?`, [_exist_station_id]
// );

// // 檢查：輸入的 code 是否已被該站的其他線路使用？
// const isCodeUsedByOtherLine = all_lines_of_station.find(
//   item => item.code === _line_code && item.type_id != _line_type
// );

// if (isCodeUsedByOtherLine) {
//   return res.status(400).send(`錯誤：站碼 ${_line_code} 在該站的其他線路已使用過。`);
// }

//     //-----------------------------------------------------------重複站碼 線路 檢核區塊
//     //-----------------------------------------------------------
//     const [rows_type_id_exist] = await pool.query(
//       `SELECT * FROM station_line WHERE station_id = ? AND type_id = ?`,
//       [_exist_station_id, _line_type],
//     );

//     //發現有重複，直接進入UPDATE流程
//     //把PK填入關聯table的FK，也就是station_line。
//     if (rows_type_id_exist.length > 0) {
//       // 追加檢查：比對資料庫現有的 code 與 使用者輸入的 _line_code
//       const existing_code = rows_type_id_exist[0].code;

//       if (existing_code === _line_code) {
//         // 情況 A: 站碼一模一樣，不需要做任何事
//         console.log(
//           `跳過更新: ${_name} 的站碼已經是 ${_line_code}，無須變動。`,
//         );
//         // 回傳 HTML 標籤，內含 JS alert
//         // return res.send(`
//         // <script>
//         //   alert("跳過更新：${_name} 的站碼已經是 ${_line_code}，無須變動。");
//         //   window.location.href = "/station/list";
//         // </script>
//         // `);
//       } else {
//         // 情況 B: 站碼不同，執行 UPDATE
//         await pool.query(
//           `UPDATE station_line SET code = ? WHERE station_id = ? AND type_id = ?`,
//           [_line_code, _exist_station_id, _line_type],
//         );
//         console.log(
//           `更新站碼成功: ${_name} 在線路 ${_line_type} 更新為 ${_line_code}`,
//         );
//       }
//     } else {
//       // 情況 C: 完全沒這筆資料，執行 INSERT
//       await pool.query(
//         `INSERT INTO station_line(station_id, code, type_id) VALUES(?,?,?)`,
//         [_exist_station_id, _line_code, _line_type],
//       );
//       console.log(`新增線路成功: ${_name} 綁定 ${_line_code}`);
//     }

//     res.redirect("/station/list");
//   } catch (err) {
//     console.error("SQL 錯誤細節:", err.message);
//     res.status(400).send(`資料庫新增失敗: ${err.sqlMessage}`);
//   }
// });

