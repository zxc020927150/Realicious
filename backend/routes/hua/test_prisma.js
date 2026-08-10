// routes/test_prisma.js
import express from 'express';
import db from "../../utils/connect-mysql.js";
import { prisma } from "../../lib/prisma.js";

// import { prisma } from '../utils/prisma-client.js'; // 根據你的實際路徑調整

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // 測試方法 A：使用你最關心的「原生 SQL 語法」
    // 假設你原本就有 users 資料表，我們撈前 3 筆出來看看
    const rawUsers = await prisma.$queryRaw`
      SELECT id, account, role FROM users LIMIT 3
    `;

    // 測試方法 B：使用 Prisma 內建的 ORM 語法（體驗一下它的威力）
    // 當你打出 prisma. 時，應該會出現自動補全提示
    const ormUsers = await prisma.users.findMany({
      take: 3,
      select: {
        id: true,
        account: true,
        role: true
      }
    });

    // 如果兩邊都有順利撈到資料，就回應給前端
    res.json({
      status: 'success',
      message: 'Prisma 運作完全正常！與舊資料庫連線成功！',
      methodA_rawSql: rawUsers,
      methodB_ormApi: ormUsers
    });

  } catch (err) {
    console.error('Prisma 測試失敗，錯誤原因：', err);
    res.status(500).json({
      status: 'error',
      message: '連線或語法有誤，請檢查後台終端機錯誤訊息',
      error: err.message
    });
  }
});

export default router;