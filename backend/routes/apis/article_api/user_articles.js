// {
//     "articles": [
//         {
//             "id":"1",
//             "title":"這是我的文章",
//             "content":"內容內容",
//             "date":"2026/07/12"
//                 }
//             ]
// }

import express from "express";
import { prisma } from "../../../lib/prisma.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { authenticateToken } from "../../../middlewares/hua/auth.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

//select a.id, a.title, a.content, a.updated_at from article a
// join users u on a.user_id = u.id where u.id = 1 ${id} order by a.id

// select a.id, a.title, a.content, a.updated_at from article a
// join users u on a.user_id = u.id
// join article_sub_category sc on a.id = sc.article_id
// where u.id = 1 and sc.sub_category_id = 2;

const getUserArticleData = async (userId, subCategoryId, keyword) => {
	const selectFields = {
		id: true,
		title: true,
		content: true,
		updated_at: true,
	};

	const where = { user_id: userId };

	if (subCategoryId !== undefined) {
		where.article_sub_category = {
			some: { sub_category_id: subCategoryId },
		};
	}
	if (keyword?.trim()) {
		where.title = {
			contains: keyword.trim(),
		};
	}

	const articles = await prisma.article.findMany({
		where,
		select: selectFields,
		orderBy: {
			updated_at: "desc",
		},
	});

	return {
		articles: articles.map((article) => ({
			id: article.id.toString(),
			title: article.title,
			content: article.content?.text ?? "",
			date: article.updated_at
				? dayjs(article.updated_at).tz("Asia/Taipei").format("YYYY/MM/DD")
				: "",
		})),
	};
};

router.get("/user-articles", authenticateToken, async (req, res) => {
	try {
		const { sub_cat_id, keyword } = req.query;
		const userId = Number(req.user.id);
		console.log(req.user.id);
		const subCategoryId =
			sub_cat_id === undefined ? undefined : BigInt(sub_cat_id);
		const articles = await getUserArticleData(userId, subCategoryId, keyword);

		res.json(articles);
		res.locals.pageName = "articles";
	} catch (error) {
		console.error("API error:", error);
		res.status(500).json({ error: "Server Error" });
	}
});

export default router;
