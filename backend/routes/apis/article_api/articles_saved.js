// {
//     "articles_saved":
//         {
//             "user_id":"1",
//             "saved_article_id": "1",
//                 }
//
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

//insert into saved_article (user_id, saved_article_id) values (1, 1);
// delete from saved_article where user_id = 1 and saved_article_id = 1;

const extractArticleContent = (content) => {
	if (!content) return "";

	if (typeof content === "object" && !Array.isArray(content)) {
		return typeof content.text === "string" ? content.text : "";
	}

	if (typeof content === "string") {
		try {
			const parsed = JSON.parse(content);
			return typeof parsed?.text === "string" ? parsed.text : content;
		} catch {
			return content;
		}
	}

	return "";
};

const parseArticleId = (value) => {
	try {
		const articleId = BigInt(value);
		return articleId > 0n ? articleId : null;
	} catch {
		return null;
	}
};

// 取得登入者收藏的文章
router.get("/saved-articles", authenticateToken, async (req, res) => {
	const userId = Number(req.user.id);

	try {
		const savedArticles = await prisma.saved_article.findMany({
			where: { user_id: userId },
			orderBy: [{ created_at: "desc" }, { saved_article_id: "desc" }],
			select: {
				created_at: true,
				article: {
					select: {
						id: true,
						title: true,
						content: true,
						updated_at: true,
						users: {
							select: { account: true },
						},
						article_sub_category: {
							select: {
								sub_category_id: true,
								sub_category: {
									select: { name: true },
								},
							},
						},
					},
				},
			},
		});

		res.json({
			articles: savedArticles.map(({ article, created_at }) => ({
				id: article.id.toString(),
				title: article.title,
				content: extractArticleContent(article.content),
				date: article.updated_at
					? dayjs(article.updated_at).tz("Asia/Taipei").format("YYYY/MM/DD")
					: "",
				author: article.users?.account || "未知作者",
				category:
					article.article_sub_category?.[0]?.sub_category?.name || "未分類",
				subCategoryId:
					article.article_sub_category?.[0]?.sub_category_id !== undefined
						? Number(article.article_sub_category[0].sub_category_id)
						: null,
				savedAt: created_at
					? dayjs(created_at).tz("Asia/Taipei").format("YYYY/MM/DD")
					: "",
			})),
		});
	} catch (error) {
		console.error("取得收藏文章失敗：", error);
		res.status(500).json({ message: "取得收藏文章失敗" });
	}
});

// 收藏文章
router.post("/saved-articles", authenticateToken, async (req, res) => {
	const { saved_article_id } = req.body;
	const userId = Number(req.user.id);

	try {
		const existingSave = await prisma.saved_article.findUnique({
			where: {
				user_id_saved_article_id: {
					user_id: userId,
					saved_article_id: BigInt(saved_article_id),
				},
			},
		});
		if (existingSave) {
			await prisma.saved_article.delete({
				where: {
					user_id_saved_article_id: {
						user_id: userId,
						saved_article_id: BigInt(saved_article_id),
					},
				},
				select: { user_id: true },
			});
			return res.status(200).json({
				isSaved: false,
				message: "已取消收藏",
			});
		} else {
			await prisma.saved_article.create({
				data: {
					user_id: userId,
					saved_article_id: BigInt(saved_article_id),
				},
				select: { user_id: true },
			});
		}
		return res.status(201).json({
			isSaved: true,
			message: "已收藏",
		});
	} catch (error) {
		console.error("收藏 API 發生錯誤:", error);
		res.status(500).json({
			message: "伺服器錯囉",
		});
	}
});

// 明確取消收藏，避免 toggle API 因畫面狀態過期而重新加入收藏
router.delete(
	"/saved-articles/:articleId",
	authenticateToken,
	async (req, res) => {
		const articleId = parseArticleId(req.params.articleId);
		if (!articleId) {
			return res.status(400).json({ message: "文章編號格式錯誤" });
		}

		const userId = Number(req.user.id);

		try {
			await prisma.saved_article.deleteMany({
				where: {
					user_id: userId,
					saved_article_id: articleId,
				},
			});

			return res.json({ isSaved: false, message: "已取消收藏" });
		} catch (error) {
			console.error("取消收藏文章失敗：", error);
			return res.status(500).json({ message: "取消收藏文章失敗" });
		}
	},
);

export default router;
