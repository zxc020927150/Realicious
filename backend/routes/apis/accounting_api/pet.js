import express from "express";
import { prisma } from "../../../lib/prisma.js";
import { getUserId } from "../../../middlewares/lia/get-user-id.js";

const router = express.Router();

// 哪些配件戴哪個部位（後端把關，防止前端亂送）
const HEAD_ITEMS = ["bow", "cap", "crown"];
const NECK_ITEMS = ["scarf"];
// 敏感字黑名單（基礎版，之後可再補）
const BAD_WORDS = [
  // 髒話
  "幹", "操", "靠北", "靠腰", "婊", "賤", "屌", "雞掰", "機掰", "幹你", "去死",
  "fuck", "shit", "bitch", "dick", "asshole",
  // 歧視／攻擊
  "智障", "白痴", "廢物", "低能", "殘廢", "娘炮",
  // 色情
  "做愛", "性交", "肛", "陰道", "陰莖", "屌", "奶子", "sex", "porn",
  // 政治敏感（依需要調整）
  "習近平", "毛澤東", "台獨", "法輪功",
];

// 檢查名字有沒有踩到黑名單（不分大小寫、去掉空格）
function hasBadWord(name) {
  const clean = name.toLowerCase().replace(/\s/g, "");
  return BAD_WORDS.some((word) => clean.includes(word.toLowerCase()));
}
// GET /api/accounting/pet小可愛
router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    const row = await prisma.user_pet.findUnique({ where: { user_id: userId } });

    res.json({
      success: true,
      petName: row?.pet_name ?? "小雞",
      equippedHead: row?.equipped_head ?? null,
      equippedNeck: row?.equipped_neck ?? null,
    });
  } catch (err) {
    console.error("[lia] GET pet 失敗:", err);
    res.status(500).json({ success: false, message: "讀取失敗" });
  }
});

// PUT /api/accounting/pet
router.put("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { petName, equippedHead, equippedNeck } = req.body;

    // 組要更新的欄位（只更新有送來的，沒送的不動）
    const data = {};

      if (petName !== undefined) {
      const n = String(petName).trim();
      if (!n) return res.status(400).json({ success: false, message: "名字不能空白" });
      if (n.length > 20) return res.status(400).json({ success: false, message: "名字太長（上限 20 字）" });
      if (hasBadWord(n)) {
        return res.status(400).json({ success: false, message: "這名字太over了啦，換一個嘛(´-ω-`)" });
      }
      data.pet_name = n;
    }

    // 頭飾：null=脫下，或必須是合法的頭飾 id
    if (equippedHead !== undefined) {
      if (equippedHead !== null && !HEAD_ITEMS.includes(equippedHead)) {
        return res.status(400).json({ success: false, message: "無效的頭部配件" });
      }
      data.equipped_head = equippedHead;
    }

    // 圍巾：null=脫下，或必須是合法的脖子 id
    if (equippedNeck !== undefined) {
      if (equippedNeck !== null && !NECK_ITEMS.includes(equippedNeck)) {
        return res.status(400).json({ success: false, message: "無效的脖子配件" });
      }
      data.equipped_neck = equippedNeck;
    }

    const row = await prisma.user_pet.upsert({
      where: { user_id: userId },
      update: data,
      create: {
        user_id: userId,
        pet_name: data.pet_name ?? "小雞",
        equipped_head: data.equipped_head ?? null,
        equipped_neck: data.equipped_neck ?? null,
      },
    });

    res.json({
      success: true,
      petName: row.pet_name,
      equippedHead: row.equipped_head,
      equippedNeck: row.equipped_neck,
    });
  } catch (err) {
    console.error("[lia] PUT pet 失敗:", err);
    res.status(500).json({ success: false, message: "更新失敗" });
  }
});

export default router;