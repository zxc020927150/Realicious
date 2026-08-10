import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
	// 透過 http headers 去設定 cookies
	res.locals.pageName = "home";
	res.locals.title = "首頁";
	res.render("homepage");
});

export default router;
