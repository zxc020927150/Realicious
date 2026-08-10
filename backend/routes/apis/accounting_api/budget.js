import express from "express";
import { prisma } from "../../../lib/prisma.js";
import { getUserId } from "../../../middlewares/lia/get-user-id.js";

const router = express.Router();

// GET /api/accounting/budget
router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);

    const row = await prisma.user_budget.findUnique({
      where: { user_id: userId },
    });

    // 沒有設定過 → 給預設值
    res.json({
      success: true,
      budget: row?.daily_budget ?? 500,
      junkMode: row?.is_poor_mode_enabled === "Y",
    });
  } catch (err) {
    console.error("[lia] GET budget 失敗:", err);
    res.status(500).json({ success: false, message: "讀取失敗" });
  }
});

// PUT /api/accounting/budget
router.put("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { budget, junkMode } = req.body;

    const data = {};
    if (budget !== undefined) data.daily_budget = Number(budget);
    if (junkMode !== undefined) data.is_poor_mode_enabled = junkMode ? "Y" : "N";

    const row = await prisma.user_budget.upsert({
      where: { user_id: userId },
      update: data,
      create: {
        user_id: userId,
        daily_budget: data.daily_budget ?? 500,
        is_poor_mode_enabled: data.is_poor_mode_enabled ?? "N",
      },
    });

    res.json({
      success: true,
      budget: row.daily_budget,
      junkMode: row.is_poor_mode_enabled === "Y",
    });
  } catch (err) {
    console.error("[lia] PUT budget 失敗:", err);
    res.status(500).json({ success: false, message: "更新失敗" });
  }
});

export default router;