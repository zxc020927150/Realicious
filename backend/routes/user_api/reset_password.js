import express from "express";
import { authenticateToken } from "../../middlewares/hua/auth.js";
import bcrypt from 'bcrypt'; // 👈 記得引入 bcrypt 來加密新密碼
import { prisma } from "../../lib/prisma.js";

const router = express.Router();

// -------------------------------------------------------------
// [POST] /resetpassword - 執行重設密碼
// -------------------------------------------------------------
router.post('/', async (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  // 1. 基本防呆
  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ success: false, message: '請提供 Email、驗證 Token 與新密碼' });
  }

  // 密碼強度基本檢查（可依你們團隊的規範調整）
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: '新密碼長度至少需要 6 個字元' });
  }

  try {
    // 2. 尋找有沒有符合該 Email、Token 且「尚未過期」的驗證紀錄
    const now = new Date();
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email: email,
        resetToken: resetToken,
        isVerified: true, // 前一步已經驗證成功過
        expireAt: {
          gt: now // 👈 關鍵：過期時間大於現在時間（代表還沒過期）
        }
      }
    });

    // 3. 安全性檢查：如果找不到紀錄，代表 Token 錯誤、被竄改或過期了
    if (!verification) {
      return res.status(400).json({ 
        success: false, 
        message: '重設密碼連結已失效或權限不足，請重新申請驗證碼' 
      });
    }

    // 4. 加密新密碼
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // 5. 使用 Prisma Transaction 執行兩件事（確保同時成功或失敗）
    await prisma.$transaction([
      // A. 更新使用者的密碼 (假設你的欄位叫 password，帳號欄位叫 account)
      prisma.users.update({
        where: { account: email },
        data: { password: hashedPassword }
      }),
      
      // B. 立刻將該 Token 銷毀（設為 null），確保這張通行證只能用一次
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { resetToken: null } // 銷毀 Token
      })
    ]);

    // 6. 修改成功！
    return res.status(200).json({
      success: true,
      message: '密碼重設成功！請使用新密碼重新登入。'
    });

  } catch (error) {
    console.error('重設密碼時發生錯誤:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤，無法完成密碼重設' });
  }
});


// -------------------------------------------------------------
// [PUT] /resetpassword/profile - 執行重設密碼
// -------------------------------------------------------------
router.put('/profile', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!newPassword) {
    return res.status(400).json({ success: false, message: '請填寫新密碼' });
  }

  try {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: '找不到使用者' });

    // 判斷是否已經有密碼
    const hasPassword = !!user.password;

    // 如果已經有密碼，才需要檢查舊密碼
    if (hasPassword) {
      if (!oldPassword) {
        return res.status(400).json({ success: false, message: '請輸入舊密碼' });
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: '舊密碼不正確' });
      }
    }

    // Hash 加密並寫入
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
      },
    });

    return res.json({
      success: true,
      message: hasPassword ? '密碼修改成功！' : '密碼設定成功！',
    });
  } catch (error) {
    console.error('Password setup error:', error);
    return res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

export default router;
