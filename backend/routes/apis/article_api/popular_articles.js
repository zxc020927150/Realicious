// {
//     "popular":
//         {
//             "title":"這是我的文章",
//             "content":"內容內容",
//             "date":"2026/07/12",
//             "author":"2026/07/12",
// }

import express from "express";
import { prisma } from "../../../lib/prisma.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

const getPopularArticles = async (req) => {
	const popular_articles = await prisma.article.findMany({
		take: 3,
		select: {
			id: true,
			title: true,
			content: true,
			updated_at: true,
			_count: {
				select: {
					saved_article: true,
				},
			},
		},
		orderBy: {
			saved_article: {
				_count: "desc",
			},
		},
	});

	return {
		popular_article: popular_articles.map((popular_article) => ({
			id: popular_article.id.toString(),
			title: popular_article.title,
			content: popular_article.content?.text ?? "",
			updated_at: popular_article.updated_at
				? dayjs(popular_article.created_at)
						.tz("Asia/Taipei")
						.format("YYYY/MM/DD")
				: "",
			_count: popular_article._count,
		})),
	};
};

router.get("/popular-articles", async (req, res) => {
	try {
		const popular_articles = await getPopularArticles(req);
		res.json(popular_articles);
		// console.log(popular_articles);
	} catch (error) {
		console.error("Fetch comments error:", error);
		res.status(400).json({ error: error.message || "伺服器錯誤" });
	}
});

export default router;
