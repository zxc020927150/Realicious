// {
//     "articles": [
//         {
//             "id":"1",
//             "title":"這是我的文章",
//             "content":"內容內容",
//             "date":"2026/07/12"
//         }
//     ]
// }

import express from "express";
import { prisma } from "../../../lib/prisma.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { sanitizeArticleHtml } from "../../../utils/sanitize-article-html.js";
import { authenticateToken } from "../../../middlewares/hua/auth.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

const getArticleData = async (subCategoryId, userId, keyword) => {
	const selectFields = {
		id: true,
		title: true,
		content: true,
		updated_at: true,
		article_sub_category: {
			select: {
				sub_category_id: true,
			},
		},
	};
	//let articles;
	const where = {};
	if (subCategoryId) {
		where.article_sub_category = {
			some: { sub_category_id: subCategoryId },
		};
	}
	if (keyword && keyword.trim()) {
		where.title = {
			contains: keyword.trim(),
		};
	}
	const articles = await prisma.article.findMany({
		where,
		select: selectFields,
		orderBy: { updated_at: "desc" },
	});

	let savedSet = null;
	if (userId !== undefined && userId !== null) {
		const savedRows = await prisma.saved_article.findMany({
			where: {
				user_id: Number(userId),
				saved_article_id: { in: articles.map((a) => a.id) },
			},
			select: { saved_article_id: true },
		});
		savedSet = new Set(savedRows.map((r) => r.saved_article_id.toString()));
	}

	return {
		article: articles.map((article) => {
			//  context型別問題判斷
			let extractedContent = "";

			if (article.content) {
				if (
					typeof article.content === "object" &&
					!Array.isArray(article.content)
				) {
					extractedContent = article.content.text || "";
				} else if (typeof article.content === "string") {
					try {
						const parsed = JSON.parse(article.content);
						extractedContent = parsed.text || article.content;
					} catch {
						extractedContent = article.content;
					}
				}
			}

			return {
				id: article.id.toString(),
				title: article.title,
				content: extractedContent,
				subCategoryId: article.article_sub_category?.[0]?.sub_category_id
					? Number(article.article_sub_category[0].sub_category_id)
					: null,
				date: article.updated_at
					? dayjs(article.updated_at).tz("Asia/Taipei").format("YYYY/MM/DD")
					: "",
				isSaved: savedSet ? savedSet.has(article.id.toString()) : false,
			};
		}),
	};
};

router.get("/articles", async (req, res) => {
	try {
		const { sub_cat_id, keyword } = req.query;
		const subCategoryId =
			sub_cat_id === undefined ? undefined : BigInt(sub_cat_id);
		const userId = req.user?.id;

		const articles = await getArticleData(subCategoryId, userId, keyword);
		res.json(articles);
		res.locals.pageName = "articles";
	} catch (error) {
		console.error("API error:", error);
		res.status(500).json({ error: "Server Error" });
	}
});

// 發佈文章
router.post("/articles", authenticateToken, async (req, res) => {
	try {
		const { title, content, subCategoryId, status = 1 } = req.body;
		const userId = Number(req.user.id);

		if (
			typeof title !== "string" ||
			typeof content !== "string" ||
			!title.trim() ||
			!content.trim() ||
			!userId ||
			!subCategoryId
		) {
			return res.status(400).json({
				message: "title、content、userId、subCategoryId 為必填",
			});
		}

		const cleanContent = sanitizeArticleHtml(content);

		if (!cleanContent.trim()) {
			return res
				.status(400)
				.json({ message: "文章內容不包含可儲存的文字或圖片" });
		}

		const article = await prisma.article.create({
			data: {
				title: title.trim(),
				content: { text: cleanContent },
				user_id: Number(userId),
				status: Number(status),
				article_sub_category: {
					create: {
						sub_category_id: BigInt(subCategoryId),
					},
				},
			},
			select: {
				id: true,
			},
		});

		res.status(201).json({
			success: true,
			articleId: article.id.toString(),
		});
	} catch (error) {
		console.error("新增文章失敗：", error);
		res.status(500).json({ message: "新增文章失敗" });
	}
});

// 編輯文章
router.put("/articles/:id", authenticateToken, async (req, res) => {
	try {
		const articleId = BigInt(req.params.id);
		const { title, content, subCategoryId } = req.body;
		if (!title || !content || !subCategoryId) {
			return res.status(400).json({ message: "標題、內容與分類皆為必填項目" });
		}
		const user_id = await prisma.article.findUnique({
			where: {
				id: articleId,
			},
			select: {
				user_id: true,
			},
		});

		const userId = Number(req.user.id);

		if (user_id["user_id"] !== userId) {
			return res.status(403).json({ message: "權限錯誤" });
		}

		const cleanContent = sanitizeArticleHtml(content);

		// 先清除舊分類
		await prisma.article_sub_category.deleteMany({
			where: {
				article_id: articleId,
			},
		});

		// 更新文章與建立新分類
		await prisma.article.update({
			where: {
				id: articleId,
			},
			data: {
				title: title.trim(),
				content: { text: cleanContent },
				article_sub_category: {
					create: {
						sub_category_id: BigInt(subCategoryId),
					},
				},
			},
		});

		res.json({ success: true, message: "文章更新成功" });
	} catch (error) {
		console.error("更新文章失敗：", error);
		res.status(500).json({ message: "更新文章失敗" });
	}
});

// 刪除文章
router.delete("/articles/:id", authenticateToken, async (req, res) => {
	try {
		const articleId = BigInt(req.params.id);
		const user_id = await prisma.article.findUnique({
			where: {
				id: articleId,
			},
			select: {
				user_id: true,
			},
		});
		const userId = Number(req.user.id);

		if (user_id["user_id"] !== userId) {
			return res.status(403).json({ message: "權限錯誤" });
		}
		await prisma.article_sub_category.deleteMany({
			where: {
				article_id: articleId,
			},
		});

		await prisma.saved_article.deleteMany({
			where: {
				saved_article_id: articleId,
			},
		});
		await prisma.article.delete({
			where: {
				id: articleId,
			},
		});

		res.json({ success: true, message: "文章已成功刪除" });
	} catch (error) {
		console.error("刪除文章失敗：", error);
		res.status(500).json({ message: "刪除文章失敗" });
	}
});

export default router;
