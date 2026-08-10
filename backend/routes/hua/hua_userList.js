import express from "express";
import dayjs from "dayjs";
// import db from "../../utils/hua/hua_db.js";
import db from "../../utils/connect-mysql.js";


const router = express.Router();

router.use((req,res,next)=>{
  res.locals.title = "userList";
  res.locals.message = '';
  res.locals.error = "";
  res.locals.dayjs = dayjs;
  next();
})

// read

router.get("/", async (req, res) => {
  try {

    // 取得目前頁碼，沒有就是1
    let page = parseInt(req.query.page) || 1;
    let perpage = 10; //之後改成使用者自訂

    //查詢總筆數，計算有幾頁
    const [totalResult] = await db.query(
      "SELECT COUNT(*) AS total FROM users;",
    );
    const totalCount = totalResult[0].total;
    const totalPages = Math.ceil(totalCount / perpage);

    //確保不超出範圍
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    //計算要跳過幾筆
    const offset = (page - 1) * perpage;

    //抓取該頁資料
    const [rows] = await db.query
    ("SELECT * FROM USERS JOIN USER_PROFILE ON USERS.ID = PROFILE_ID LIMIT ? OFFSET ?"
      , [
      perpage,
      offset,
    ]);

    //設定頁面顯示
    let startPage = Math.max(1, page - 4); // 當前頁往前推 4 頁
    let endPage = Math.min(totalPages, startPage + 9); // 向後顯示共 10 頁

    // 修正：如果後面不夠湊滿 10 頁，就再往前推 startPage
    if (endPage - startPage < 9) {
      startPage = Math.max(1, endPage - 9);
    }

    //傳送資料
    res.render("hua/hua_userList", {
      users: rows,
      page: page,
      totalPages: totalPages,
      startPage: startPage,
      endPage: endPage,
      message:req.flash('message')
    });
  } catch (err) {
    console.error(`伺服器錯誤(users)`, err);
    res.status(500).send(`伺服器錯誤(users)`);
  }
});

export default router;
