import express from "express";
// import db from "../../utils/hua/hua_db.js";
import db from "../../utils/connect-mysql.js";


const router = express.Router();

router.use((req,res,next)=>{
  res.locals.title = ""
  res.locals.message = "";
  res.locals.error = "";
  res.locals.page = "";
  next();
})

router.post("/",async(req,res)=>{
  const {id}=req.body
  try{
    const [result]=await db.query('DELETE FROM users where id = ?',[id]);

    if(result.affectedRows > 0){
      req.flash("message","刪除成功")
      return res.redirect('userList')
      return res.redirect('userList')
    }else{
      return res.render('hua/hua_userList',{error:"刪除失敗，請稍後再試"})
    }

  }catch(err){

    console.error(err);
    res.status(500).send(`伺服器錯誤`);
  }

})


export default router;