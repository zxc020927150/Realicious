import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; // 1. 引入 jwt
import { prisma } from "../../lib/prisma.js";
import {
  validateBody,
  registerSchema,
} from "../../middlewares/hua/validate.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// -------------------------------------------------------------
// [POST] /user/api/register - 使用者註冊 (含自動登入)
// -------------------------------------------------------------
router.post("/", validateBody(registerSchema), async (req, res) => {
  const { account, verification, password } = req.body;

  try {
    // 1. 驗證 account (Email) 是否已經存在
    const existingUser = await prisma.users.findUnique({
      where: { account: account },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "該帳號已被註冊" });
    }

    // 2. 驗證 code (驗證碼) 是否有效
    const validCode = await prisma.emailVerification.findFirst({
      where: {
        email: account,
        code: verification,
        isVerified: false,
        expireAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!validCode) {
      return res.status(400).json({ success: false, message: "驗證碼無效或已過期" });
    }

    // 3. 將密碼進行加密 (Hash)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. 使用 Transaction 建立使用者與作廢驗證碼
    // 💡 老師將原本的「陣列式」改為「函式式」Transaction，這樣才能拿到建立成功的 newUser 資料！
    const [newUser] = await prisma.$transaction([
      prisma.users.create({
        data: {
          account: account,
          password: hashedPassword,
          status: 1, // 預設註冊狀態為正常 (對齊登入檢查的 status !== 1)
          user_profile: {
            create: {} 
          }
        },
        // 透過 include 把剛建立的 profile 以及關聯的 role 撈出來
        include: {
          user_profile: true,
          roles: true // 假設你的 users model 有設定與 roles 的關聯
        }
      }),
      prisma.emailVerification.update({
        where: { id: validCode.id },
        data: { isVerified: true },
      }),
    ]);

    // 5. 簽發 JWT Token (與登入 API 一模一樣的 Payload)
    const token = jwt.sign(
      {
        id: newUser.id,
        account: newUser.account,
        role: newUser.roles?.role_name || "user", // 防呆，若無關聯預設為 user
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 6. 回傳成功回應與 Token (完美對齊登入 API 的規格)
    return res.status(201).json({
      success: true,
      message: "註冊並登入成功！",
      token,
      user: {
        id: newUser.id,
        account: newUser.account,
        role: newUser.roles?.role_name || "user",
        nick_name: newUser.user_profile?.nick_name || "", // 剛註冊通常是空字串
        avatar: newUser.user_profile?.avatar || ""        // 剛註冊通常是空字串
      }
    });

  } catch (error) {
    console.error("註冊伺服器錯誤:", error);
    return res.status(500).json({ success: false, message: "伺服器錯誤，請稍後再試" });
  }
});

export default router;