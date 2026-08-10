import express from "express";
import { prisma } from "../../../lib/prisma.js";
import { getUserId } from "../../../middlewares/lia/get-user-id.js";

const router = express.Router();

// GET /api/accounting/transactions
router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);

    const rows = await prisma.diet_detail.findMany({
      where: { user_id: userId },
      orderBy: [{ consume_date: "desc" }, { id: "desc" }],
    });

    // 資料庫的樣子 → 前端的樣子
    const txs = rows.map((r) => ({
      id: String(r.id),
      type: r.type === "I" ? "income" : "expense",
      amount: r.amount,
      category: r.category,
      name: r.user_remark ?? "",
      date: r.consume_date.toISOString().slice(0, 10),
    }));

    res.json({ success: true, txs });
  } catch (err) {
    console.error("[lia] GET transactions 失敗:", err);
    res.status(500).json({ success: false, message: "讀取失敗" });
  }
});
// POST /api/accounting/transactions
router.post("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { type, amount, category, name, date } = req.body;

    // 檢查：缺一不可
    if (!type || !amount || !category || !date) {
      return res.status(400).json({ success: false, message: "欄位不完整" });
    }

    const created = await prisma.diet_detail.create({
      data: {
        user_id: userId,
        type: type === "income" ? "I" : "S",
        amount: Number(amount),
        category,
        user_remark: name || null,
        consume_date: new Date(date + "T00:00:00Z"),
      },
    });

    res.json({
      success: true,
      tx: {
        id: String(created.id),
        type: created.type === "I" ? "income" : "expense",
        amount: created.amount,
        category: created.category,
        name: created.user_remark ?? "",
        date: created.consume_date.toISOString().slice(0, 10),
      },
    });
  } catch (err) {
    console.error("[lia] POST transactions 失敗:", err);
    res.status(500).json({ success: false, message: "新增失敗" });
  }
});

// DELETE /api/accounting/transactions/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);

    // 只能刪自己的
    const result = await prisma.diet_detail.deleteMany({
      where: { id, user_id: userId },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: "找不到這筆" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[lia] DELETE transactions 失敗:", err);
    res.status(500).json({ success: false, message: "刪除失敗" });
  }
});

// PUT /api/accounting/transactions/:id
router.put("/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    const { type, amount, category, name, date } = req.body;

    if (!type || !amount || !category || !date) {
      return res.status(400).json({ success: false, message: "欄位不完整" });
    }

    // 只能改自己的
    const result = await prisma.diet_detail.updateMany({
      where: { id, user_id: userId },
      data: {
        type: type === "income" ? "I" : "S",
        amount: Number(amount),
        category,
        user_remark: name || null,
        consume_date: new Date(date + "T00:00:00Z"),
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: "找不到這筆" });
    }

    const updated = await prisma.diet_detail.findUnique({ where: { id } });

    res.json({
      success: true,
      tx: {
        id: String(updated.id),
        type: updated.type === "I" ? "income" : "expense",
        amount: updated.amount,
        category: updated.category,
        name: updated.user_remark ?? "",
        date: updated.consume_date.toISOString().slice(0, 10),
      },
    });
  } catch (err) {
    console.error("[lia] PUT transactions 失敗:", err);
    res.status(500).json({ success: false, message: "更新失敗" });
  }
});

export default router;