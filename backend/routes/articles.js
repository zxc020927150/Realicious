import express from "express";
import pool from "../utils/connect-mysql.js";

const router = express.Router();

// 取得文章列表
const getListData = async (req) => {
	let articles = [];
	const sql = `select a.id, a.title, a.content,
		up.first_name, u.account, a.status, a.is_pinned, a.created_at, a.updated_at from article a 
		join users u on a.user_id = u.id
		join user_profile up on u.id = up.profile_id
		order by a.id;`;

	const [rows] = await pool.query(sql);
	for (let i = 0; i < rows.length; i++) {
		articles.push({
			id: rows[i].id,
			author: rows[i].first_name,
			account: rows[i].account,
			title: rows[i].title,
			// content: rows[i].content["text"],
			content: rows[i].content?.text ?? "",
			created_at: rows[i].created_at,
			updated_at: rows[i].updated_at,
			pin: rows[i].is_pinned,
			hide: rows[i].status == 1 ? 1 : 0,
		});
	}

	return {
		articles,
	};
};

// 取得公告列表
const getAnnouncementData = async (req) => {
	let announcements = [];
	const sql = `select a.id, a.title, a.content, up.first_name,
		u.account, a.status, a.is_pinned, a.created_at, a.updated_at from announcement a 
		join users u on a.created_by = u.id
		join user_profile up on u.id = up.profile_id
		order by a.id;`;

	const [rows] = await pool.query(sql);
	for (let i = 0; i < rows.length; i++) {
		announcements.push({
			id: rows[i].id,
			author: rows[i].first_name,
			account: rows[i].account,
			title: rows[i].title,
			// content: rows[i].content["text"],
			content: rows[i].content?.text ?? "",
			created_at: rows[i].created_at,
			updated_at: rows[i].updated_at,
			pin: rows[i].is_pinned,
			hide: rows[i].status == 1 ? 1 : 0,
		});
	}

	return {
		announcements,
	};
};

// 取得分類資料
const getCategoryData = async (req) => {
	let categories = [];
	const sql = `select c.id, c.name, c.created_at, up.first_name, u.account from category c
join users u on c.created_by = u.id
join user_profile up on u.id = up.profile_id
order by c.id;`;
	const [rows] = await pool.query(sql);
	for (let i = 0; i < rows.length; i++) {
		categories.push({
			id: rows[i].id,
			name: rows[i].name,
			created_at: rows[i].created_at,
			created_by: rows[i].first_name,
			account: rows[i].account,
		});
	}

	return {
		categories,
	};
};

// 取得子分類資料
const getSubCategoryData = async (req) => {
	let sub_categories = [];
	const sql = `select sc.id, sc.name, sc.parent_id, c.name as parent_name, sc.created_at, up.first_name, u.account from sub_category sc
join users u on sc.created_by = u.id
join user_profile up on u.id = up.profile_id
join category c on sc.parent_id = c.id order by sc.id;`;
	const [rows] = await pool.query(sql);
	for (let i = 0; i < rows.length; i++) {
		sub_categories.push({
			id: rows[i].id,
			name: rows[i].name,
			parent_id: rows[i].parent_id,
			parent_name: rows[i].parent_name,
			created_at: rows[i].created_at,
			created_by: rows[i].first_name,
			account: rows[i].account,
		});
	}

	return {
		sub_categories,
	};
};

// 抓下拉選單資料
const getCategoryDropdown = async () => {
	const sql = `select id, name from category order by id;`;
	const [rows] = await pool.query(sql);
	return rows;
};

router.get("/list", async (req, res) => {
	const data1 = await getListData(req);
	res.locals.pageName = "articles-list";
	res.render("admin/articles/list", data1);
});

router.get("/announcement", async (req, res) => {
	const announcementData = await getAnnouncementData(req);
	res.locals.pageName = "articles-announcement";
	res.render("admin/articles/announcement", announcementData);
});

router.get("/categories", async (req, res) => {
	const { categories } = await getCategoryData(req);
	const { sub_categories } = await getSubCategoryData(req);
	const dropdownlist = await getCategoryDropdown();
	res.locals.pageName = "articles-categories";
	res.render("admin/articles/categories", {
		categories,
		sub_categories,
		dropdownlist,
	});
});

// ==== 文章列表[置頂功能]
// req == request -> 從前端(fetch)送來的請求
// res == response -> 把結果送回給前端
router.put("/list/pin", async (req, res) => {
	let { is_pinned, articleId } = req.body;
	try {
		const sql = `update article set is_pinned = ? where id = ?`;
		await pool.query(sql, [is_pinned, articleId]);
		res.json({ success: true, message: "文章置頂狀態更新成功" });
	} catch (error) {
		res.json({
			success: false,
			message: "文章置頂狀態更新失敗",
			error: error.message,
		});
	}
});

// ====文章列表[隱藏功能]
router.put("/list/hide", async (req, res) => {
	let { status, articleId } = req.body;
	try {
		const sql = `update article set status = ? where id = ?`;
		await pool.query(sql, [status, articleId]);
		res.json({ success: true, message: "文章隱藏狀態更新成功" });
	} catch (error) {
		res.json({
			success: false,
			message: "文章隱藏狀態更新失敗",
			error: error.message,
		});
	}
});

// ====公告列表[置頂功能]
router.put("/announcement/pin", async (req, res) => {
	let { is_pinned, AnnouncementId } = req.body;
	try {
		const sql = `update announcement set is_pinned = ? where id = ?`;
		await pool.query(sql, [is_pinned, AnnouncementId]);
		res.json({ success: true, message: "公告置頂狀態更新成功" });
	} catch (error) {
		res.json({
			success: false,
			message: "公告置頂狀態更新失敗",
			error: error.message,
		});
	}
});

// ====公告列表[隱藏功能]
router.put("/announcement/hide", async (req, res) => {
	let { status, AnnouncementId } = req.body;
	try {
		const sql = `update announcement set status = ? where id = ?`;
		await pool.query(sql, [status, AnnouncementId]);
		res.json({ success: true, message: "公告隱藏狀態更新成功" });
	} catch (error) {
		res.json({
			success: false,
			message: "公告隱藏狀態更新失敗",
			error: error.message,
		});
	}
});

// ====公告列表[新增公告]
router.post("/announcement/add", async (req, res) => {
	let { title, content, created_by } = req.body;
	content = JSON.stringify({ text: content });
	try {
		const sql = `insert into announcement (title, content, created_by) values (?, ?, ?)`;
		await pool.query(sql, [title, content, created_by]);
		res.json({ success: true, message: "公告新增成功" });
	} catch (error) {
		console.log(error);
		res.json({
			success: false,
			message: "公告新增失敗",
			error: error.message,
		});
	}
});

// ====類別列表[新增類別]
router.post("/category/add", async (req, res) => {
	let { name, created_by } = req.body;
	try {
		const sql = `insert into category (name, created_by) values (?, ?)`;
		await pool.query(sql, [name, created_by]);
		res.json({
			success: true,
			message: "類別新增成功",
		});
	} catch (error) {
		console.log(error);
		res.json({
			success: false,
			message: "類別新增失敗",
			error: error.message,
		});
	}
});

// ====類別列表[新增子類別]
router.post("/category/add/sub", async (req, res) => {
	let { name, created_by, parent_id } = req.body;
	try {
		const sql = `insert into sub_category (name, parent_id, created_by) values (?, ?, ?)`;
		await pool.query(sql, [name, parent_id, created_by]);
		res.json({
			success: true,
			message: "子類別新增成功",
		});
	} catch (error) {
		console.log(error);
		res.json({
			success: false,
			message: "子類別新增失敗",
			error: error.message,
		});
	}
});

// ====類別列表[編輯類別]
router.put("/category/edit/:id", async (req, res) => {
	const { id } = req.params;
	const { name } = req.body;
	try {
		const sql = `update category set name = ? where id = ?`;
		await pool.query(sql, [name, id]);
		res.json({
			success: true,
			message: "類別編輯成功",
		});
	} catch (error) {
		console.log(error);
		res.json({
			success: false,
			message: "類別編輯失敗",
			error: error.message,
		});
	}
});

router.put("/category/edit/sub/:id", async (req, res) => {
	const { id } = req.params;
	const { name, parent_id } = req.body;
	try {
		const sql = `update sub_category set name = ?, parent_id = ? where id = ?`;
		await pool.query(sql, [name, parent_id, id]);
		res.json({
			success: true,
			message: "子類別編輯成功",
		});
	} catch (error) {
		console.log(error);
		res.json({
			success: false,
			message: "子類別編輯失敗",
			error: error.message,
		});
	}
});

// ====公告列表[編輯公告]
router.put("/announcement/edit/:id", async (req, res) => {
	const { id } = req.params;
	let { title, content } = req.body;
	content = JSON.stringify({ text: content });
	try {
		const sql = `update announcement set title = ?, content = ? where id = ?`;
		await pool.query(sql, [title, content, id]);
		res.json({
			success: true,
			message: "公告編輯成功",
		});
	} catch (error) {
		console.log(error);
		res.json({
			success: false,
			message: "公告編輯失敗",
			error: error.message,
		});
	}
});

// ====類別列表[刪除類別]
router.delete("/category/delete", async (req, res) => {
	let { id } = req.body;
	try {
		const sql = `delete from category where id = ?`;
		await pool.query(sql, [id]);
		res.json({
			success: true,
			message: "類別刪除成功",
		});
	} catch (error) {
		console.log(error);
		res.json({
			success: false,
			message: "類別刪除失敗",
			error: error.message,
		});
	}
});

// ====類別列表[刪除子類別]
router.delete("/category/delete/sub", async (req, res) => {
	let { id } = req.body;
	try {
		const sql = `delete from sub_category where id = ?`;
		await pool.query(sql, [id]);
		res.json({
			success: true,
			message: "子類別刪除成功",
		});
	} catch (error) {
		console.log(error);
		res.json({
			success: false,
			message: "子類別刪除失敗",
			error: error.message,
		});
	}
});
// router.get("/categories", async (req, res) => {
// 	const CategoryData = await getCategoryData(req);
// 	res.locals.pageName = "articles-categories";
// 	res.render("admin/articles/categories", CategoryData);
// });
// ❌ 不能這樣同個路徑兩個 get，會衝突，因為 Express 會從上到下匹配路由，一旦匹配到第一個就不會繼續往下找了，所以第二個永遠不會被執行到。
// router.get("/categories", async (req, res) => {
// 	const SubCategoryData = await getSubCategoryData(req);
// 	res.locals.pageName = "articles-categories";
// 	res.render("admin/articles/categories", SubCategoryData);
// });

router.get("/report", (req, res) => {
	res.locals.pageName = "articles-report";
	res.render("admin/articles/report", data);
});

router.get("/statistics", (req, res) => {
	res.locals.pageName = "articles-statistics";
	res.render("admin/articles/statistics", data);
});

export default router;

// 塞假資料用;
const data = {
	// 		articles: [
	// 			{
	// 				id: 1,
	// 				author: "wei",
	// 				title: "標題",
	// 				content: "內容",
	// 				created_at: "2024-06-01 12:00:00",
	// 				updated_at: "2024-06-01 12:00:00",
	// 				pin: 0,
	// 				hide: 0,
	// 			},
	// 			{
	// 				id: 2,
	// 				author: "ash",
	// 				title: "標題",
	// 				content: "內容",
	// 				created_at: "2024-06-01 12:00:00",
	// 				updated_at: "2024-06-01 12:00:00",
	// 				pin: 0,
	// 				hide: 0,
	// 			},
	// 			{
	// 				id: 3,
	// 				author: "weish",
	// 				title: "標題",
	// 				content: "內容",
	// 				created_at: "2024-06-01 12:00:00",
	// 				updated_at: "2024-06-01 12:00:00",
	// 				pin: 0,
	// 				hide: 0,
	// 			},
	// 		],
	// 	announcement: [
	// 		{
	// 			id: 1,
	// 			author: "wei",
	// 			title: "公告一",
	// 			content: "公告公告",
	// 			created_at: "2024-06-01 12:00:00",
	// 			updated_at: "2024-06-01 12:00:00",
	// 			pin: 0,
	// 			hide: 0,
	// 		},
	// 	],
	// 	categories: [
	// 		{
	// 			id: 1,
	// 			name: "wei",
	// 			parent: null,
	// 			edit: "0987654321",
	// 			delete: 1,
	// 		},
	// 	],

	reports: [
		{
			id: 1,
			reporter: "wei",
			author: "wei01",
			title: "文章001",
			content: "文章內容001",
			reason: "這篇文章有不當言論，請管理員處理。",
			created_at: "2024-06-01 12:00:00",
		},
	],
};
