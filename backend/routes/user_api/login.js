import express from "express";
import db from "../../utils/connect-mysql.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validateBody, loginSchema } from "../../middlewares/hua/validate.js"; // 引入剛剛寫的驗證

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET ;

// 🟢 登入 API (POST /)
router.post("/", validateBody(loginSchema), async (req, res) => {
  // 這裡的 account 和 password 已經過 Zod 驗證
  const { account, password } = req.body;

  try {
    const [rows] = await db.query(
      `
    SELECT 
      u.id, 
      u.account, 
      u.password, 
      u.role AS role_code, 
      u.status,
      r.role_name,
      p.nick_name,
      p.avatar
    FROM users u
    LEFT JOIN roles r ON u.role = r.role_id
    LEFT JOIN user_profile p ON u.id = p.profile_id
    WHERE u.account = ?
  `,
      [account],
    );

    // 1. 判斷帳號是否存在
    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "帳號或密碼錯誤" });
    }

    const user = rows[0];

    // 2. 比對密碼
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "帳號或密碼錯誤" });
    }

    // 3. 檢查帳號狀態 (假設 1 為正常)
    if (user.status !== 1) {
      return res
        .status(403)
        .json({ success: false, message: "帳號已被停權或狀態異常" });
    }

    // 4. 簽發 JWT Token
    // Payload 只放不敏感的必要資訊，並設定過期時間（例如 1 天）
    const token = jwt.sign(
      {
        id: user.id,
        account: user.account,
        role: user.role_name,
      },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    // 🌟 核心修改：動態處理大頭貼網址
    let finalAvatarUrl = "";
    if (user.avatar) {
      const avatarStr = user.avatar.trim();

      // 情況 1：Google 等第三方完整網址 -> 原樣回傳
      if (avatarStr.startsWith("http://") || avatarStr.startsWith("https://")) {
        finalAvatarUrl = avatarStr;
      } 
      // 情況 2：前端 public 裡的預設小雞圖 (/user/default_avatars/ 或含 chicken_) -> 原樣回傳相對路徑！
      else if (
        avatarStr.startsWith("/user/default_avatars/") ||
        avatarStr.includes("chicken_")
      ) {
        finalAvatarUrl = avatarStr;
      } 
      // 情況 3：使用者上傳在後端靜態資料夾的圖片 -> 才拼接後端 3001 網域
      else {
        const cleanPath = avatarStr.startsWith("/") ? avatarStr : `/${avatarStr}`;
        finalAvatarUrl = `${req.protocol}://${req.get("host")}${cleanPath}`;
      }
    }
   // 5. 回傳成功 JSON 與 Token (完美符合前端 FAKE_USER_INIT 的規格)
  return res.json({
    success: true,
    message: "登入成功",
    token,
    user: {
      id: user.id,
      account: user.account,
      role: user.role_name,   // 對應前端 role: ""
      nick_name: user.nick_name || "", // 預防剛註冊的人沒有暱稱，給空字串
      avatar: finalAvatarUrl || ""        // 預防沒有頭像，給空字串
    }
  });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});

// 🔴 登出 API (POST /logout)
// 在 JWT 架構下，登出通常由前端清除本地端儲存的 Token 即可（因為後端是無狀態的 Stateless）。
// 但如果後端想做紀錄，或是原本有配合 Cookie，可以保留一個簡單的 API。
router.post("/logout", (req, res) => {
  return res.json({ success: true, message: "登出成功，請前端清除 Token" });
});

export default router;
