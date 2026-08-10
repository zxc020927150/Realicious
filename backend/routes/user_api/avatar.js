import express from "express";
import path from "path";
import fs from "fs";
import { authenticateToken } from "../../middlewares/hua/auth.js";
import { uploadAvatar } from "../../middlewares/hua/upload.js";
import { prisma } from "../../lib/prisma.js";

const router = express();

// 🔄 專屬的大頭貼上傳/更新 API
router.post(
  "/",
  authenticateToken,
  uploadAvatar.single("avatar"), // multer 會自動處理，如果沒傳檔案 req.file 就會是 undefined
  async (req, res) => {
    try {
      const userId = Number(req.user.id);
      const { avatarType, defaultUrl } = req.body;

      let avatarPathInDb = "";
      let fullAvatarUrl = "";

      // 🌟 1. 判斷這次是「選擇預設頭像」還是「上傳自訂照片」
      if (avatarType === "default" || defaultUrl) {
        // --- 情況 A：選預設頭像 ---
        if (!defaultUrl) {
          return res.status(400).json({ success: false, message: "請提供預設頭像路徑" });
        }
        avatarPathInDb = defaultUrl; // 例如：/user/default_avatars/chicken_normal.png
        fullAvatarUrl = defaultUrl;   // 預設圖片在前端，直接回傳相對路徑即可
      } else if (req.file) {
        // --- 情況 B：上傳自訂照片 ---
        const fileName = req.file.filename;
        avatarPathInDb = `/user/avatars/${fileName}`; // 存入後端 public/user/avatars/
        fullAvatarUrl = `${req.protocol}://${req.get("host")}${avatarPathInDb}`; // 拼接完整後端網址
      } else {
        // 兩者都不是，跳出錯誤
        return res.status(400).json({ success: false, message: "請選擇預設頭像或上傳檔案" });
      }

      // 🌟 2. 撈出原本的大頭貼路徑，處理舊檔案刪除
      const currentProfile = await prisma.user_profile.findUnique({
        where: { profile_id: userId },
        select: { avatar: true },
      });

      if (currentProfile && currentProfile.avatar) {
        const oldAvatar = currentProfile.avatar;

        // ⚠️ 防呆重點：
        // 1. 外部網址 (Google 登入) 不刪除
        // 2. 前端預設圖 (/user/default_avatars/...) 不刪除
        const isExternalUrl = oldAvatar.startsWith("http://") || oldAvatar.startsWith("https://");
        const isDefaultAvatar = oldAvatar.startsWith("/user/default_avatars/");

        // 只有「自訂上傳的照片」才執行實體檔案刪除
        if (!isExternalUrl && !isDefaultAvatar) {
          const oldFilePath = path.join(process.cwd(), "public", oldAvatar);

          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            // console.log(`[Clean-up] 成功刪除使用者自訂的舊頭像: ${oldFilePath}`);
          }
        }
      }

      // 🌟 3. 更新資料庫
      await prisma.user_profile.upsert({
        where: { profile_id: userId },
        create: {
          profile_id: userId,
          avatar: avatarPathInDb,
        },
        update: {
          avatar: avatarPathInDb,
        },
      });

      // 🌟 4. 回傳結果給前端
      return res.json({
        success: true,
        message: "頭像更新成功",
        avatar: fullAvatarUrl,
      });
    } catch (err) {
      console.error("更新頭像失敗:", err);
      return res
        .status(500)
        .json({ success: false, message: "伺服器內部錯誤" });
    }
  }
);

export default router;