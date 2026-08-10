import express from "express";
// import db from "../../utils/hua/hua_db.js";
import db from "../../utils/connect-mysql.js";

import dayjs from 'dayjs';
import userListRouter from "./hua_userList.js";
import userCreateRouter from "./hua_userCreate.js";
import userUpdateRouter from "./hua_userUpdate.js";
import userDeleteRouter from "./hua_userDelete.js";
import test from "./test_prisma.js"

const router = express.Router();

router.use("/test",test)
router.use("/userList",userListRouter)
router.use("/userCreate",userCreateRouter)
router.use("/userUpdate",userUpdateRouter)
router.use("/userDelete",userDeleteRouter)
router.use((req, res, next) => {
  res.locals.dayjs = dayjs; // 把 dayjs 變成全域模板變數
  next();
});

router.get("/",(req,res)=>{
  const message = req.flash('error');
  res.render("hua/hua_userManager",{title:"會員管理後台"});
})

export default router;