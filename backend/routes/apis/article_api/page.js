// {
//     "articles": [
//         {
//
//             "author":"wei",
//             "title":"這是我的文章",
//             "content":"內容內容",
//             "category":"內容內容",
//             "updated_date":"2026/07/12",
//                 }
//             ]
// }

import express from "express";
import { prisma } from "../../../lib/prisma.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

// select a.title, a.content, a.updated_at as date, u.account as author, sc.name as category from article a
// join users u on a.user_id = u.id
// join article_sub_category b on a.id = b.article_id
// join sub_category sc on sc.id = b.sub_category_id;

const getArticleListData = async (articleId, userId) => {
	const selectFields = {
		id: true,
		title: true,
		content: true,
		updated_at: true,
		users: {
			select: {
				account: true,
			},
		},
		article_sub_category: {
			select: {
				sub_category: {
					select: {
						name: true,
					},
				},
			},
		},
	};

	if (articleId) {
		const article = await prisma.article.findFirst({
			where: { id: BigInt(articleId) },
			select: selectFields,
		});
		if (!article) return { page: [] };

		let isSaved = false;
		if (userId !== undefined && userId !== null) {
			const existing = await prisma.saved_article.findUnique({
				where: {
					user_id_saved_article_id: {
						user_id: Number(userId),
						saved_article_id: article.id,
					},
				},
			});
			if (existing) {
				isSaved = true;
			}
		}

		return {
			page: [
				{
					title: article.title,
					content: article.content?.text ?? "",
					date: article.updated_at
						? dayjs(article.updated_at).tz("Asia/Taipei").format("YYYY/MM/DD")
						: "",
					author: article.users?.account,
					category:
						article.article_sub_category?.[0]?.sub_category?.name || "未分類",
					isSaved,
				},
			],
		};
	}

	const pages = await prisma.article.findMany({
		select: selectFields,
		orderBy: { id: "asc" },
	});

	let savedSet = null;
	if (userId !== undefined && userId !== null) {
		const savedRows = await prisma.saved_article.findMany({
			where: {
				user_id: Number(userId),
				saved_article_id: { in: pages.map((p) => p.id) },
			},
			select: { saved_article_id: true },
		});
		savedSet = new Set(savedRows.map((r) => r.saved_article_id.toString()));
	}
	return {
		page: pages.map((article) => ({
			title: article.title,
			content: article.content?.text ?? "",
			date: article.updated_at
				? dayjs(article.updated_at).tz("Asia/Taipei").format("YYYY/MM/DD")
				: "",
			author: article.users?.account,
			category:
				article.article_sub_category?.[0]?.sub_category?.name || "未分類",
			isSaved: savedSet ? savedSet.has(article.id.toString()) : false,
		})),
	};
};

router.get("/page", async (req, res) => {
	try {
		const { id, user_id } = req.query;
		const pages = await getArticleListData(
			id,
			user_id === undefined ? undefined : Number(user_id),
		);
		res.json(pages);
		res.locals.pageName = "pages";
	} catch (error) {
		console.error("API error:", error);
		res.status(500).json({ error: "Server Error" });
	}
});

export default router;
