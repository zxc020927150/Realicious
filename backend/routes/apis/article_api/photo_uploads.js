import express from "express";
import uploadArticleImage from "../../../utils/upload-article-images.js";

const router = express.Router();

router.post(
	"/uploads/article-images",
	uploadArticleImage.single("upload"), // CKEditor 固定送 upload 欄位
	(req, res) => {
		if (!req.file) {
			return res.status(400).json({ message: "請上傳 png、jpg 或 webp 圖片" });
		}

		res.status(201).json({
			url: `${req.protocol}://${req.get("host")}/article/${req.file.filename}`,
		});
	},
);

export default router;
