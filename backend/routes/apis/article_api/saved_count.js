import express from "express";
import { prisma } from "../../../lib/prisma.js";

const router = express.Router();

router.get("/saved-count", async (req, res) => {
	try {
		const { article_id } = req.query;
		if (!article_id) {
			return res.status(400).json({ error: "Missing article_id" });
		}

		// console.log(
		// 	"article_id from query:",
		// 	article_id,
		// 	"type:",
		// 	typeof article_id,
		// );

		const count = await prisma.saved_article.count({
			where: {
				saved_article_id: BigInt(article_id),
			},
		});

		// console.log("count result:", count);

		res.json({ saved: { count } });
	} catch (error) {
		console.error("Fetch saved count error:", error);
		res.status(500).json({ error: "伺服器錯誤" });
	}
});

export default router;
