import express from "express";
import db from "../../src/db-connect.js";
import multer from 'multer'


const router = express.Router();

const productUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "public/images"),
    filename: (req, file, cb) => {
      const ext = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[file.mimetype];
      cb(null, v4() + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    cb(null, !!{ "image/jpeg": 1, "image/png": 1, "image/webp": 1 }[file.mimetype]);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// [READ] 獲取列表
// [READ] 獲取列表 (更新版：支援關鍵字搜尋與分類篩選)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const category_id = req.query.category_id || "";
    const keyword = req.query.keyword || ""; // 新增：接收關鍵字
    const limit = 9;
    const offset = (page - 1) * limit;

    let whereClause = " WHERE 1 ";
    let params = [];

    // 1. 分類篩選
    if (category_id) {
      whereClause += " AND p.category_id = ? ";
      params.push(category_id);
    }

    // 2. 關鍵字搜尋 (支援商品名稱、ID 或 商店 ID)
    if (keyword) {
      whereClause += " AND (p.name LIKE ? OR p.id = ? OR p.restaurant_id = ?) ";
      params.push(`%${keyword}%`, keyword, keyword);
    }

    const dataSql = `
      SELECT p.*, c.name as category_name,
        (SELECT url FROM product_imgs WHERE product_id = p.id ORDER BY is_main DESC, id ASC LIMIT 1) as main_img
      FROM \`products\` p
      LEFT JOIN \`categories\` c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.id DESC LIMIT ? OFFSET ?`;
    
    const [data] = await db.query(dataSql, [...params, limit, offset]);

    const countSql = `SELECT COUNT(*) as total FROM \`products\` p ${whereClause}`;
    const [countResult] = await db.query(countSql, params);
    const total = countResult[0].total;

    res.json({
      success: true,
      data,
      pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// [READ] 單一商品
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.name as category_name,
        (SELECT url FROM product_imgs WHERE product_id = p.id ORDER BY is_main DESC, id ASC LIMIT 1) as main_img
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id=?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: "商品不存在" });
    const [images] = await db.query(
      "SELECT url, alt_text, is_main FROM product_imgs WHERE product_id = ? ORDER BY is_main DESC, id ASC",
      [req.params.id]
    );
    res.json({ success: true, data: { ...rows[0], images } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// [CREATE] 新增商品 (含圖片上傳)
router.post("/add", (req, res, next) => {
  productUpload.array("photos", 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, error: "圖片單檔不能超過 5MB" });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ success: false, error: "最多僅能上傳 5 張圖片" });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
    if (err) return res.status(400).json({ success: false, error: err.message });
    next();
  });
}, async (req, res) => {
  const { name, stock_qty, price, discount, restaurant_id, category_id, description, is_active } = req.body;
  const files = req.files || [];
  try {
    const sql = "INSERT INTO `products` (`name`, `stock_qty`, `price`, `discount`, `restaurant_id`, `category_id`, `description`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const [result] = await db.query(sql, [name, stock_qty, price, discount || 1.0, restaurant_id || 1, category_id || 1, description || '', is_active ?? 1]);
    const productId = result.insertId;

    if (files.length > 0) {
      const imgSql = "INSERT INTO `product_imgs` (`product_id`, `url`, `is_main`) VALUES ?";
      const values = files.map((f, i) => [productId, `/images/${f.filename}`, i === 0 ? 1 : 0]);
      await db.query(imgSql, [values]);
    }

    res.json({ success: true, newId: productId, uploaded: files.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
}
});

// [UPDATE] 修改商品 (含圖片上傳)
router.put("/edit/:id", (req, res, next) => {
  productUpload.array("photos", 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ success: false, error: "圖片單檔不能超過 5MB" });
      if (err.code === "LIMIT_UNEXPECTED_FILE") return res.status(400).json({ success: false, error: "最多僅能上傳 5 張圖片" });
      return res.status(400).json({ success: false, error: err.message });
    }
    if (err) return res.status(400).json({ success: false, error: err.message });
    next();
  });
}, async (req, res) => {
  const { id } = req.params;
  const { name, price, discount, category_id, description } = req.body;
  const files = req.files || [];
  try {
    const sql = "UPDATE `products` SET `name`=?, `price`=?, `discount`=?, `category_id`=?, `description`=? WHERE `id`=?";
    const [result] = await db.query(sql, [name, price, discount, category_id, description, id]);

    if (files.length > 0) {
      const imgSql = "INSERT INTO `product_imgs` (`product_id`, `url`, `is_main`) VALUES ?";
      const hasExisting = await db.query("SELECT 1 FROM `product_imgs` WHERE `product_id` = ? LIMIT 1", [id]);
      const values = files.map((f, i) => [id, `/images/${f.filename}`, hasExisting[0].length === 0 && i === 0 ? 1 : 0]);
      await db.query(imgSql, [values]);
    }

    res.json({ success: !!result.affectedRows, uploaded: files.length });
  } catch (error) {
    console.error("更新失敗:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// [UPDATE STATUS] 切換上下架
router.patch("/toggle/:id", async (req, res) => {
  try {
    const sql = "UPDATE `products` SET `is_active` = 1 - `is_active` WHERE id = ?";
    const [result] = await db.query(sql, [req.params.id]);
    res.json({ success: !!result.affectedRows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// [DELETE] 刪除商品
router.delete("/delete/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM `products` WHERE id=?", [req.params.id]);
    res.json({ success: !!result.affectedRows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
