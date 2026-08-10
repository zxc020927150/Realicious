import express from "express";
// import db from "../../utils/hua/hua_db.js";
import db from "../../utils/connect-mysql.js";

import bcrypt from 'bcrypt';


const router = express.Router();
router.use((req,res,next)=>{
  res.locals.title = "userCreate";
  res.locals.message = "";
  res.locals.error = "";
  res.locals.values = "";
  next();
})

router.get('/',(req,res)=>{
  res.render("hua/hua_userCreate",
    {message:req.flash('message')}
  );

})
router.post("/",async(req,res)=>{
  const {account,password} =req.body
  
  if (!account || !account.trim() || !password || !password.trim()) {
    return res.render("hua/hua_userCreate", { 
      error: "帳號或密碼不能為空！",
      values: { account } // 把帳號傳回去，讓使用者不用重打
    });
  }

  try{
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result]=await db.query
    ("INSERT INTO users (account,password) VALUES(?,?);",[account,hashedPassword])

    const [rows] = await db.query("SELECT id FROM users WHERE account = ? ;",[account])
    const user_profile_id = rows[0].id
    await db.query("INSERT INTO user_profile (profile_id) VALUES(?);",[user_profile_id])

    if(result.affectedRows > 0){
      req.flash("message","新增成功")
      return res.redirect('/userManager/userCreate')
      // return res.render('hua/hua_userCreate',{message:"新增成功"})
    }else{
      return res.render('hua/hua_userCreate',{error:"新增失敗，請稍後再試"})
    }

  }catch(err){
    if(err.code==='ER_DUP_ENTRY'){
      return res.render('hua/hua_userCreate',{error:"帳號已被註冊"})
    }
    console.error(err);
    res.status(500).send(`伺服器錯誤`);
  }

})


export default router;