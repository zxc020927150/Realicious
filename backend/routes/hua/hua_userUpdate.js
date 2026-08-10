import express from "express";
// import db from "../../utils/hua/hua_db.js";
import db from "../../utils/connect-mysql.js";


const router = express.Router();

router.use((req,res,next)=>{
  res.locals.title = "userUpdate";
  res.locals.message = req.flash("message") ||"";
  res.locals.error = req.flash("error") || "";
  next();
})

router.get('/:id',async(req,res)=>{
  const {id} = req.params;
  const [rows] = await db.query('select users.id,account,role,status,last_name,first_name,nick_name,city,district,address,phone,birthday from users join user_profile on users.id = profile_id where users.id = ?;',[id])
  res.render('hua/hua_userUpdate',{users : rows})
})

router.post('/revise',async(req,res)=>{
  try{
    const {id,account,role,status,last_name,first_name,nick_name,city,district,address,phone,birthday} = req.body;

    console.log(req.body)
    const [a] = await db.query('UPDATE users SET account = ?,role = ?,status =? WHERE id =?;',[account,role,status,id]);
    // const b = await db.query('UPDATE user_profile SET last_name = ?,first_name = ?,nick_name = ?,city = ?,district = ?,address = ?,phone = ?,birthday =? WHERE profile_id = ?;',[last_name,first_name,nick_name,city,district,address,phone,birthday,id]);
    const [b] = await db.query('UPDATE user_profile SET last_name = ?,first_name = ?,nick_name = ?,city = ?,district = ?,address = ?,phone = ? WHERE profile_id = ?;',[last_name,first_name,nick_name,city,district,address,phone,id]);
    console.log(a,b)
    if (a.affectedRows > 0 ) {console.log(`a成功`)}else{console.log(`a失敗`)};
    if (b.affectedRows > 0 ) {console.log(`b成功`)}else{console.log(`b失敗`)};


    req.flash("message","修改成功")
    res.redirect(`/userManager/userUpdate/${id}`)

  }catch(err){
    console.error(`更新失敗`,err)
    // res.status(500).send(`更新資料發生錯誤`)

    req.flash("error","更新資料發生錯誤")
    res.redirect(`/userManager/userUpdate/${id}`)
  }
})


export default router;