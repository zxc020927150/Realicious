// ------------------------------------
// 1. 引進區 (Imports) - 所有的工具都先拿進來
// ------------------------------------

import "dotenv/config";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import flash from "connect-flash";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { registerChatHandlers } from "./sockets/chatSocket.js";
import { authenticateSocket } from "./middlewares/hua/socketAuth.js";
import fs from "fs";

import articleUploadRouter from "./routes/apis/article_api/photo_uploads.js";

import {
  authcheck,
  authcheck_login,
  isAdmin,
} from "./middlewares/hua/hua_authcheck.js"; //後台驗證
import loginRouter from "./routes/hua/hua_login.js"; // 後台登入處理
import userManagerRouter from "./routes/hua/hua_userManager.js"; //後台 user
import userApiRouter from "./routes/user_api/user.js"; //前台 user
import articleRouter from "./routes/articles.js";
import rootRouter from "./routes/root.js";

// article api
import articleApiRouter from "./routes/apis/article_api/category.js";
import articleListRouter from "./routes/apis/article_api/articles.js";
import articlePageRouter from "./routes/apis/article_api/page.js";
import userArticleRouter from "./routes/apis/article_api/user_articles.js";
import saveArticleRouter from "./routes/apis/article_api/articles_saved.js";
import getCommentRouter from "./routes/apis/article_api/comment.js";
import getArticleSaved from "./routes/apis/article_api/saved_count.js";
import getPopularArticles from "./routes/apis/article_api/popular_articles.js";

import upload from "./utils/upload-images.js";
import accountingRouter from "./routes/accounting.js";
import dietDetailRouter from "./routes/accounting-detail.js";
import restaurantRouter from "./routes/restaurant.js";

// accounting api
import accountingPingRouter from "./routes/apis/accounting_api/ping.js";
import accountingTxRouter from "./routes/apis/accounting_api/transactions.js";
import accountingBudgetRouter from "./routes/apis/accounting_api/budget.js";
import accountingPetRouter from "./routes/apis/accounting_api/pet.js";

//商城管理
import productRoutes from "./routes/shop/products.js";
import tagsRoutes from "./routes/shop/tags.js";
import ordersRoutes from "./routes/shop/orders.js";
import cartRoutes from "./routes/shop/cart.js";
import paymentRoutes from "./routes/shop/payment.js";
import pointsRoutes from "./routes/shop/points.js";
import ticketsRoutes from "./routes/shop/tickets.js";
import favoritesRoutes from "./routes/shop/favorites.js";
import cors from "cors";
import db from "./utils/connect-mysql.js";
import path from "path";

// 捷運地圖
import stationRouter from "./routes/station.js";

// ------------------------------------
// 2. 初始化區 (Initialization) - 建立分身與核心設定
// ------------------------------------
const app = express();
const port = process.env.PORT || 3001;
fs.mkdirSync(path.join(process.cwd(), "public/article"), { recursive: true });
// ★【 app.set 就放在這裡 】★
app.set("view engine", "ejs");

// ------------------------------------
// 3. 中介軟體區 (Middleware) - 所有的翻譯官與檢查哨
// ------------------------------------
app.use(cors({ origin: true })); // 測試用 開放所有來源


// ###############################################################
// Socket 初始化設定 Socket 初始化設定 Socket 初始化設定 Socket 初始化設定

// 1. 建立 HTTP Server
const httpServer = createServer(app);

// 2. 初始化 Socket.IO，設定跨域
const io = new Server(httpServer, {
  cors: {
    origin: true , // 測試用 開放所有來源
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

// 3. Socket 身分驗證 Middleware
io.use(authenticateSocket);

// 4. 監聽連線
io.on("connection", (socket) => {

  //所有事件處理全
  registerChatHandlers(io, socket);
});

// Socket 初始化設定  Socket 初始化設定 Socket 初始化設定 Socket 初始化設定
// #################################################################


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(flash());
app.use(cookieParser());
app.use(
  session({
    secret: "your_secret_key", // 用來加密 Cookie 的字串，隨便打
    resave: false, // 是否每次請求都重新儲存 session
    saveUninitialized: false, // 是否儲存未初始化的 session
    cookie: { maxAge: 1000 * 60 * 10 }, // Cookie 有效時間（毫秒），這裡是10分鐘
  }),
);

app.use("/user/api", userApiRouter); //前台 user
app.use(
  "/user/avatars",
  express.static(path.join(process.cwd(), "public/user/avatars")),
);

// 儲存登入狀態
app.use((req, res, next) => {
  // res.locals 裡面的東西，在所有 EJS 檔案都可以直接讀取
  res.locals.loginUser = req.session.user || null;
  next();
});

app.use(express.static("public/"));

//========商城管理==========//
app.use("/products", productRoutes);
app.use("/tags", tagsRoutes);
app.use("/orders", ordersRoutes);
app.use("/cart", cartRoutes);
app.use("/payment", paymentRoutes);
app.use("/favorites", favoritesRoutes);

// ── 訂單過期排程：每 5 分鐘取消 30 分鐘前未付款的訂單 ──
setInterval(
  async () => {
    try {
      const [result] = await db.query(
        "UPDATE `orders` SET status = 4 WHERE status = 1 AND created_at < NOW() - INTERVAL 30 MINUTE",
      );
      if (result.affectedRows > 0) {
        console.log(`⏰ 自動取消了 ${result.affectedRows} 筆逾期訂單`);
      }
    } catch (err) {
      console.error("❌ 訂單過期排程錯誤:", err.message);
    }
  },
  5 * 60 * 1000,
);
app.use("/points", pointsRoutes);
app.use("/tickets", ticketsRoutes);
app.use("/admin.html", authcheck, isAdmin);
app.use("/tags.html", authcheck, isAdmin);
app.use("/orders.html", authcheck, isAdmin);
app.use("/points.html", authcheck, isAdmin);
app.use("/admin.html", authcheck, isAdmin);
app.use("/tags.html", authcheck, isAdmin);
app.use("/orders.html", authcheck, isAdmin);
app.use("/points.html", authcheck, isAdmin);
app.use(express.static("public/shop"));
//========商城管理==========//

app.use("/", rootRouter);
app.use("/login", authcheck_login, loginRouter);

// 測試用，開啟權限判斷
// app.use("/userManager",authcheck,isAdmin,userManagerRouter)
// app.use("/articles",authcheck,isAdmin, articleRouter);
// app.use("/accounting",authcheck,isAdmin, accountingRouter);
// app.use("/accounting-detail",authcheck,isAdmin, dietDetailRouter);
// app.use("/restaurant",authcheck,isAdmin, restaurantRouter);
// app.use("/station",authcheck,isAdmin, stationRouter);

// 測試用，關閉權限判斷
app.use("/userManager", userManagerRouter);
app.use("/articles", articleRouter);

app.use("/api/article", articleApiRouter);
app.use("/api/article", articleListRouter);
app.use("/api/article", articlePageRouter);
app.use("/api/article", userArticleRouter);
app.use("/api/article", saveArticleRouter);
app.use("/api/article", getCommentRouter);
app.use("/api/article", getArticleSaved);
app.use("/api/article", getPopularArticles);

//記帳小雞
app.use("/api/accounting", accountingPingRouter);
app.use("/accounting", accountingRouter);
app.use("/accounting-detail", dietDetailRouter);
app.use("/api/accounting/transactions", accountingTxRouter);
app.use("/restaurant", restaurantRouter);
// app.use("/station", stationRouter);

// article image upload
app.use("/article", express.static(path.join(process.cwd(), "public/article")));
app.use("/api/article", articleUploadRouter);
app.use("/station", stationRouter);
app.use("/api/accounting/budget", accountingBudgetRouter);
app.use("/api/accounting/pet", accountingPetRouter);

// ------------------------------------
// 4. 路由區 (Routes) - 決定網址要去哪裡
// ------------------------------------

app.get("/", (req, res) => {
  res.send(`<a href="/login" >登入</a>`);
});

app.use((req, res) => {
  res.status(404);
  res.send(`<h2>404 NOT FOUND</h2>`);
});

//!!!不確定是否有使用
app.post("/try-upload", upload.single("avatar"), (req, res) => {
  res.json(req.file);
});
app.post("/try-uploads", upload.array("photos"), (req, res) => {
  res.json(req.files);
});

// ------------------------------------
// 5. 啟動區 (Start) - 啟動區
// ------------------------------------

httpServer.listen(port, (req, res) => {
  console.log(`伺服器啟動 http://localhost:${port} `);
});
