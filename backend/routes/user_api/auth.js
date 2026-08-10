import express from 'express';
import session from 'express-session';
import passport from './passport.js';
import jwt from 'jsonwebtoken';
import { authenticateToken } from "../../middlewares/hua/auth.js";
import { prisma } from "../../lib/prisma.js";

const router = express.Router();

function getSafeReturnPath(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
}

// Session 設定 (Passport OAuth 過程需暫存狀態)
router.use(session({ secret: process.env.SESSION_SECRET || 'your_secret_key', resave: false, saveUninitialized: false }));
router.use(passport.initialize());
router.use(passport.session());

// ==========================================
// 1. Google 登入 (一般未登入狀態使用)
// ==========================================
router.get('/google', (req, res, next) => {
  req.session.returnTo = getSafeReturnPath(req.query.next);
  passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })(req, res, next);
});

// ==========================================
// 2. Google 綁定 (已登入使用者在個人頁點擊綁定)
// ==========================================
// 前端透過 query 帶入目前的 JWT: /auth/google/bind?token=xxx
router.get('/google/bind', (req, res, next) => {
  const { token } = req.query;
  
  if (!token) {
    return res.redirect('http://localhost:3000/account?error=missing_token');
  }

  // 將目前的 token 當作 state 丟給 Google，OAuth 完成後 Google 會原封不動帶回 Callback
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    state: token.toString(), 
  })(req, res, next);
});

// ==========================================
// 3. Google Callback (同時處理「登入」與「綁定」)
// ==========================================
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/user/login?error=oauth_failed' }),
  async (req, res) => {
    try {
      const googleUser = req.user; // Passport strategy 回傳的使用者（需有 google_id 與 email）
      const stateToken = req.query.state; // 如果是「綁定」，這裡會拿到剛才傳過去的 JWT

      // ----------------------------------------
      // 情境 A：這是「綁定 Google」流程
      // ----------------------------------------
      if (stateToken) {
        try {
          // 1. 解碼 JWT 取得當前登入者 ID
          const decoded = jwt.verify(stateToken, process.env.JWT_SECRET || 'your_jwt_secret');
          const currentUserId = decoded.id;

          // 2. 防呆：檢查這個 Google 帳號是否已經被「其他使用者」綁定過
          const existingGoogleUser = await prisma.users.findUnique({
            where: { google_id: googleUser.google_id || googleUser.id },
          });

          if (existingGoogleUser && existingGoogleUser.id !== currentUserId) {
            return res.redirect('http://localhost:3000/user/account/password?error=google_already_linked');
          }

          // 3. 執行綁定：將 google_id 更新到當前登入者資料庫
          await prisma.users.update({
            where: { id: currentUserId },
            data: {
              google_id: googleUser.google_id || googleUser.id,
              updated_at: new Date(),
            },
          });

          return res.redirect('http://localhost:3000/user/account/password?success=google_linked');
        } catch (jwtError) {
          console.error('綁定 JWT 驗證失敗:', jwtError);
          return res.redirect('http://localhost:3000/user/account/password?error=invalid_token');
        }
      }

      // ----------------------------------------
      // 情境 B：這是「一般 Google 登入」流程
      // ----------------------------------------
      const fullUser = await prisma.users.findUnique({
        where: { id: googleUser.id },
        include: { user_profile: true } 
      });

      if (!fullUser) {
        return res.redirect('http://localhost:3000/user/login?error=user_not_found');
      }

      // 製作 JWT Payload
      const tokenPayload = {
        id: fullUser.id,
        account: fullUser.account,
        role: fullUser.role,
        nick_name: fullUser.user_profile?.nick_name || '', 
        avatar: fullUser.user_profile?.avatar || ''        
      };

      // 簽發 JWT Token
      const token = jwt.sign(
        tokenPayload, 
        process.env.JWT_SECRET || 'your_jwt_secret', 
        { expiresIn: '1d' } 
      );

      // 帶 Token 回前端原本請求的頁面（例如結帳頁）
      const returnTo = getSafeReturnPath(req.session.returnTo);
      delete req.session.returnTo;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const destination = new URL(returnTo, frontendUrl);
      destination.searchParams.set('token', token);
      return res.redirect(destination.toString());

    } catch (error) {
      console.error('Google Callback 處理失敗:', error);
      return res.redirect('http://localhost:3000/user/login?error=server_error');
    }
  }
);

// ==========================================
// 4. 解除 Google 綁定 API (保持原本很棒的防呆)
// ==========================================
router.post('/google/unbind', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '找不到使用者' });
    }

    // 安全檢查：若該使用者沒有設密碼，禁止解除綁定，否則會變成孤兒帳號
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: '您尚未設定密碼，請先設定密碼後再解除 Google 綁定，避免無法登入！',
      });
    }

    // 將 google_id 欄位清空 (設為 null)
    await prisma.users.update({
      where: { id: userId },
      data: {
        google_id: null,
        updated_at: new Date(),
      },
    });

    return res.json({
      success: true,
      message: '成功解除 Google 帳號綁定',
    });
  } catch (error) {
    console.error('Unbind Google error:', error);
    return res.status(500).json({ success: false, message: '解除綁定失敗' });
  }
});

export default router;
