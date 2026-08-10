// {
//     "comment":
//         {
//               "author":"wei",
//               "content":"文章內容",
//               "created_at":"2026/07/19",
// }

import express from "express";
import { prisma } from "../../../lib/prisma.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { authenticateToken } from "../../../middlewares/hua/auth.js";
import { formatAvatarUrl } from "../../../utils/formatAvatar.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

// select c.*, u.account, up.avatar from comment c
// join users u on c.user_id = u.id
// join user_profile up on c.user_id = up.profile_id
// where c.article_id = 1 order by created_at;

// 記得匯入你寫好的 formatAvatarUrl 工具函式
// import { formatAvatarUrl } from './utils/formatAvatarUrl';

const getCommentData = async (req) => {
	const { article_id } = req.query;
	if (!article_id) {
		throw new Error("Missing article_id");
	}

	const comments = await prisma.comment.findMany({
		where: {
			article_id: BigInt(article_id),
		},
		select: {
			content: true,
			created_at: true,
			users: {
				select: {
					account: true,
					user_profile: {
						select: {
							nick_name: true,
							avatar: true,
						},
					},
				},
			},
		},
		orderBy: {
			created_at: "desc",
		},
	});

	return {
		comment: comments.map((comment) => ({
			avatar: formatAvatarUrl(comment.users?.user_profile?.avatar, req),
			nick_name: comment.users?.user_profile?.nick_name,
			author: comment.users?.account || "未知用戶",
			content: comment.content || "",
			created_at: comment.created_at
				? dayjs(comment.created_at).tz("Asia/Taipei").format("YYYY/MM/DD")
				: "",
		})),
	};
};

router.get("/comments", async (req, res) => {
	try {
		const comments = await getCommentData(req);
		res.json(comments);
		//console.log(comments);
	} catch (error) {
		console.error("Fetch comments error:", error);
		res.status(400).json({ error: error.message || "伺服器錯誤" });
	}
});

router.post("/comments", authenticateToken, async (req, res) => {
	try {
		const { article_id, content } = req.body;
		const userId = Number(req.user.id);

		if (!article_id || !userId || !content) {
			return res
				.status(400)
				.json({ error: "缺少必要欄位 (article_id, user_id, content)" });
		}
		if (content.trim() === "") {
			return res.status(400).json({ error: "留言內容不能為空" });
		}

		const newComment = await prisma.comment.create({
			data: {
				article_id: BigInt(article_id),
				user_id: userId,
				content: content.trim(),
			},
			select: {
				content: true,
				created_at: true,
				users: {
					select: {
						account: true,
						user_profile: {
							select: {
								nick_name: true,
								avatar: true,
							},
						},
					},
				},
			},
		});

		const formattedComment = {
			avatar:
				formatAvatarUrl(newComment.users?.user_profile?.avatar, req) ?? null,
			nick_name: newComment.users?.user_profile?.nick_name ?? null,
			author: newComment.users?.account || "未知用戶",
			content: newComment.content || "",
			created_at: newComment.created_at
				? dayjs(newComment.created_at).tz("Asia/Taipei").format("YYYY/MM/DD")
				: "",
		};

		res.status(201).json({
			message: "留言成功！",
			comment: formattedComment,
		});
	} catch (error) {
		console.error("Create comment error:", error);
		res.status(500).json({ error: "伺服器儲存留言失敗" });
	}
});
export default router;
