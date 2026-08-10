import express from 'express';
import nodemailer from 'nodemailer';
import { prisma } from "../../lib/prisma.js";
import crypto from 'crypto';

const router = express.Router();

// 建立 Nodemailer 發信器 (使用剛剛在 .env 設定的資訊)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// -------------------------------------------------------------
// [POST] /user/api/verification/send-code - 生成並寄送驗證碼
// -------------------------------------------------------------
router.post('/send-code', async (req, res) => {
  // 1. 新增 scene 參數 (可傳入 'register' 或 'forgot-password')
  const { email, scene } = req.body;
console.log(req.body)
  // 基本前端防呆
  if (!email || !scene) {
    return res.status(400).json({ success: false, message: '請提供 Email 與 應用場景(scene)' });
  }

  const validScenes = ['register', 'forgot-password'];
  if (!validScenes.includes(scene)) {
    return res.status(400).json({ success: false, message: '無效的應用場景' });
  }

  try {
    // 2. 先檢查使用者是否存在 (假設你的 Prisma Model 叫 user)
    const userExists = await prisma.users.findUnique({
      where: { account: email }
    });

    // 3. 根據不同場景進行不同的邏輯判定
    if (scene === 'register') {
      // 场景 A：註冊 -> 若帳號已存在，直接攔截並提示
      if (userExists) {
        return res.status(400).json({ success: false, message: '此帳號已註冊過，請直接登入' });
      }
    } 
    
    else if (scene === 'forgot-password') {
      // 场景 B：忘記密碼 -> 若帳號「不存在」，欺騙前端已發送，保護隱私不發信
      if (!userExists) {
        return res.status(200).json({
          success: true,
          message: '驗證碼已成功寄出，請至信箱收取',
        });
      }
    }

    // ==========================================
    // 4. 【核心發信邏輯】(若通過上方檢查，才會執行到這)
    // ==========================================
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expireAt = new Date(Date.now() + 3 * 60 * 1000);

    await prisma.$transaction([
      prisma.emailVerification.deleteMany({
        where: { email: email, isVerified: false },
      }),
      prisma.emailVerification.create({
        data: {
          email: email,
          code: verificationCode,
          expireAt: expireAt,
        },
      }),
    ]);

    const mailOptions = {
      from: `"REALICIOUS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: scene === 'register' ? '【REALICIOUS】歡迎註冊，請收取您的驗證碼' : '【REALICIOUS】重設密碼驗證碼',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">您好：</h2>
          <p style="font-size: 16px; color: #555;">您正在進行 ${scene === 'register' ? '帳號註冊' : '重設密碼'} 的身分驗證，您的驗證碼為：</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #1a73e8; letter-spacing: 5px; background: #f1f3f4; padding: 10px 20px; border-radius: 5px;">
              ${verificationCode}
            </span>
          </div>
          <p style="font-size: 14px; color: #999;">此驗證碼將於 <strong style="color: #d93025;">3 分鐘後</strong> 失效。如果您並未要求此驗證碼，請直接忽略此信件。</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: '驗證碼已成功寄出，請至信箱收取',
    });

  } catch (error) {
    console.error('發送驗證碼時發生錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤，無法發送驗證碼' });
  }
});


// -------------------------------------------------------------
// [POST] user/api/verification/verify-code - 驗證驗證碼
// -------------------------------------------------------------
router.post('/verify-code', async (req, res) => {
  const { email, code ,scene } = req.body;

  // 1. 基本防呆
  if (!email || !code) {
    return res.status(400).json({ success: false, message: '請提供 Email 與 驗證碼' });
  }

  try {
    // 2. 從資料庫撈出該 Email 最新一筆「尚未驗證過」的紀錄
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email: email,
        isVerified: false, // 確保這組驗證碼還沒被用過
      },
      orderBy: {
        createdAt: 'desc', // 抓最新產生的一筆，避免使用者重複點擊發送時對比到舊的
      },
    });

    // 3. 安全性檢查：如果根本找不到紀錄
    if (!verification) {
      return res.status(400).json({ 
        success: false, 
        message: '找不到對應的驗證碼，或驗證碼已被使用，請重新發送' 
      });
    }

    // 4. 【核心關鍵】檢查時間是否過期
    const now = new Date(); // 取得當前伺服器時間 (底層為標準時間戳記)
    const expireTime = new Date(verification.expireAt); // 讀取該驗證碼的過期時間

    // 如果現在時間大於過期時間，代表 3 分鐘已經過去了
    if (now > expireTime) {
      return res.status(400).json({ 
        success: false, 
        message: '驗證碼已過期（超過 3 分鐘），請重新取得驗證碼' 
      });
    }

    // 5. 檢查驗證碼是否相符
    if (verification.code !== code.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: '驗證碼錯誤，請重新輸入' 
      });
    }

    // ==========================================
    // 6. 驗證成功！根據 scene 執行不同任務
    // ==========================================

    if (scene === 'register') {
      // 註冊場景：直接把狀態改成已驗證即可
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { isVerified: true },
      });

      return res.status(200).json({
        success: true,
        message: '驗證成功。'
      });
    } 
    
    else if (scene === 'forgot-password') {
      // 忘記密碼場景：生成一組隨機且安全、無法預測的加密 Token (Token 給 15 分鐘時效)
      const token = crypto.randomBytes(32).toString('hex');
      const tokenExpireAt = new Date(Date.now() + 15 * 60 * 1000); 

      // 更新紀錄：標記已驗證，同時塞入 resetToken，並將過期時間往後延 15 分鐘（讓使用者有時間改密碼）
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { 
          isVerified: true,
          resetToken: token,
          expireAt: tokenExpireAt // 覆蓋原本的 3 分鐘，延長至 15 分鐘密碼輸入時間
        },
      });

      // 關鍵！把這個 token 回傳給前端
      return res.status(200).json({
        success: true,
        message: '身分驗證成功，正在導向重設密碼頁面',
        resetToken: token // 👈 前端收到這個之後，要帶進重設密碼頁面網址
      });
    }

  } catch (error) {
    console.error('驗證驗證碼時發生錯誤:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器錯誤，無法完成驗證',
    });
  }
});

export default router;