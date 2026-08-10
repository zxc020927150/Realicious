import express from "express";
// import db from "../../utils/hua/hua_db.js";
import db from "../../utils/connect-mysql.js";
import bcrypt from 'bcrypt';


const router = express.Router();

router.get("/",(req,res)=>{
  const message = req.flash('error');
  res.render("hua/hua_login",{message,title:"login"});
})

// login login login

router.post("/",async(req,res)=>{

const { account,password }=req.body;

try{
  const [rows]=await db.query('SELECT * FROM users WHERE account = ?', [account]);
  // 判斷有沒有這個帳號
  if(rows.length === 0){
    req.flash("error",`帳號或密碼錯誤！(無此帳號)`);
    return res.redirect("/login");
  };
  const user=rows[0];

// 2. 使用 bcrypt 比對「輸入的密碼」與「資料庫的雜湊密碼」
    const isMatch = await bcrypt.compare(password, user.password);

  // 判斷密碼正不正確
  // if(user.password === password ){
  if(isMatch){
    // 判斷帳號狀態正常／停權
    if(user.status === 1){
      if(user.role > 1){
        req.flash("error",`帳號或密碼錯誤！(權限不足)`);
        return res.redirect("/login");
      }
      req.session.user={
        id : user.id,
        account : user.account,
        role : user.role,
        status : user.status
      }
      // --- 關鍵邏輯開始 ---
      // 取得暫存的網址，如果沒有則預設回首頁
      const redirectUrl = req.session.returnTo || "/";
    
      // 記得把 session 裡的暫存刪掉，保持乾淨
      delete req.session.returnTo;

      // 判斷成功進行跳轉
      return res.redirect(redirectUrl);

    }else{
      req.flash("error",`帳號或密碼錯誤！(status異常)`);
      return res.redirect("/login");
    }
  }else{
    req.flash("error",`帳號或密碼錯誤！(密碼錯誤)`);
    return res.redirect("/login");
  }
}catch(err){
console.error(err);
res.status(500).send(`伺服器錯誤`)
}
});

// logout logout logout

router.get("/logout", (req, res) => {
  // 取得使用者按下登出前的那個頁面網址
  const backToPage = req.get('Referer') || '/';

  req.session.destroy((err) => {
    if (err) return res.send("登出失敗");
    res.clearCookie("connect.sid");

    // 邏輯判斷：
    // 1. 如果來源網址包含 "/users" (你的後台路徑)，就強制回登入頁
    // 2. 否則，就留在原地 (backToPage)
    if (backToPage.includes("/userManager")) {
      res.redirect("/login");
    } else {
      res.redirect(backToPage);
    }
  });
});

export default router;