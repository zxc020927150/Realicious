import express from "express";

import { authenticateToken } from "../../middlewares/hua/auth.js";
import { prisma } from "../../lib/prisma.js";

import loginRouter from "./login.js";
import authRouter from "./auth.js";
import verificationRouter from "./verification.js";
import registerRouter from "./register.js";
import resetpasswordRouter from "./reset_password.js";
import avatarRouter from "./avatar.js";
import chatroomsRouter from "./chatrooms.js";

const router = express.Router();

router.use("/login", loginRouter);
router.use("/auth", authRouter);
router.use("/verification", verificationRouter);
router.use("/register", registerRouter);
router.use("/resetpassword", resetpasswordRouter);
router.use("/avatar", avatarRouter);
router.use("/chatrooms", chatroomsRouter);

//  修改後的 Helper 函式：加入預設圖片不拼接 3001 的判斷
const getFullAvatarUrl = (req, avatarPath) => {
  if (!avatarPath) return "";

  const trimmedPath = avatarPath.trim();

  // 1. 如果是第三方登入（Google 等）的完整網址，直接回傳
  if (trimmedPath.startsWith("http://") || trimmedPath.startsWith("https://")) {
    return trimmedPath;
  }

  // 2.  關鍵新增：如果是前端 public 裡的預設小雞圖，直接原樣回傳相對路徑！
  if (
    trimmedPath.startsWith("/user/default_avatars/") ||
    trimmedPath.includes("chicken_")
  ) {
    return trimmedPath;
  }

  // 3. 只有真正上傳在後端靜態資料夾的圖片，才動態拼接後端 3001 網域
  const cleanPath = trimmedPath.startsWith("/")
    ? trimmedPath
    : `/${trimmedPath}`;
  return `${req.protocol}://${req.get("host")}${cleanPath}`;
};

// ==========================================
// 1. 在登入後取得簡易資料
// ==========================================
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const userRow = await prisma.users.findUnique({
      where: { id: userId, status: 1 },
      include: {
        roles: true,
        user_profile: true,
      },
    });

    if (!userRow) {
      return res
        .status(404)
        .json({ success: false, message: "找不到該用戶或帳號異常" });
    }

    // 🌟 這裡使用 helper 轉換網址
    const finalAvatarUrl = getFullAvatarUrl(req, userRow.user_profile?.avatar);

    return res.json({
      success: true,
      user: {
        id: userRow.id,
        account: userRow.account,
        role: userRow.roles?.role_name || "",
        nick_name: userRow.user_profile?.nick_name || "",
        avatar: finalAvatarUrl, // ⚠️ 改回傳拼好的完整網址
      },
    });
  } catch (err) {
    console.error("獲取用戶簡要資料失敗:", err);
    return res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});

// ==========================================
// 2. /profile/full (獲取詳細表單資料)
// ==========================================
router.get("/profile/full", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const profile = await prisma.user_profile.findUnique({
      where: { profile_id: userId },
    });

    let formattedBirthday = "";
    if (profile?.birthday) {
      formattedBirthday = profile.birthday.toISOString().split("T")[0];
    }

    // 🌟 這裡同樣使用 helper 轉換網址
    const finalAvatarUrl = getFullAvatarUrl(req, profile?.avatar);

    return res.json({
      success: true,
      data: {
        avatar: finalAvatarUrl, // ⚠️ 改回傳拼好的完整網址，讓前端的表單、Preview 都能正常顯示
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        nick_name: profile?.nick_name || "",
        city: profile?.city || "",
        district: profile?.district || "",
        address: profile?.address || "",
        phone: profile?.phone || undefined,
        birthday: formattedBirthday,
      },
    });
  } catch (err) {
    console.error("獲取用戶詳細資料失敗:", err);
    return res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});

// ==========================================
// 3. 🔄 新增：PUT /profile/full (修改用戶詳細資料)
// ==========================================
router.put("/profile/full", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const {
      first_name,
      last_name,
      nick_name,
      city,
      district,
      address,
      phone,
      birthday,
    } = req.body;

    const parsedBirthday = birthday ? new Date(birthday) : null;

    const updatedProfile = await prisma.user_profile.upsert({
      where: {
        profile_id: userId,
      },
      create: {
        profile_id: userId,
        first_name: first_name || null,
        last_name: last_name || null,
        nick_name: nick_name || null,
        city: city || null,
        district: district || null,
        address: address || null,
        phone: phone || null,
        birthday: parsedBirthday,
      },
      update: {
        first_name: first_name ?? undefined,
        last_name: last_name ?? undefined,
        nick_name: nick_name ?? undefined,
        city: city ?? undefined,
        district: district ?? undefined,
        address: address ?? undefined,
        phone: phone ?? undefined,
        birthday: parsedBirthday,
      },
    });

    return res.json({
      success: true,
      message: "個人資料更新成功",
      data: updatedProfile,
    });
  } catch (err) {
    console.error("更新用戶詳細資料失敗:", err);
    return res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});

// 1. 取得帳號與綁定狀態
router.get("/account-info", authenticateToken, async (req, res) => {
  try {
    // req.user.id 來自 JWT 解析出來的使用者 ID
    const userId = req.user.id;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        account: true,
        password: true, // 1. 記得把 password 撈出來
        google_id: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "找不到使用者" });
    }

    return res.json({
      success: true,
      data: {
        email: user.account,
        isGoogleLinked: !!user.google_id, // 若有 google_id 則為 true
        hasPassword: !!user.password, // 2. 新增：若 password 有值為 true，若為 null 則為 false
      },
    });
  } catch (error) {
    console.error("Fetch account-info error:", error);
    return res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
});

export default router;
