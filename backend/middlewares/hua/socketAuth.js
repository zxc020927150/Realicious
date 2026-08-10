import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateSocket = (socket, next) => {
  try {
    // 1. 嘗試從 handshake 拿 Token（優先從 auth 拿，備選從 Cookie 或 Header 拿）
    let token = socket.handshake.auth?.token;

    // 如果前端放在 Cookie 裡傳過來
    if (!token && socket.handshake.headers.cookie) {
      // 簡單從 cookie 字串中解析 token (若有使用 cookie 模組可直接解析)
      const cookies = Object.fromEntries(
        socket.handshake.headers.cookie.split("; ").map((c) => c.split("="))
      );
      token = cookies.token;
    }

    // 2. 沒驗證憑證直接拒絕連線
    if (!token) {
      return next(new Error("未提供驗證憑證，請先登入"));
    }

    // 3. 解密並把使用者資料掛載到 socket.user
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded; // 🌟 這樣 chatSockets.js 就能拿到 socket.user.id

    next(); // 放行連線
  } catch (err) {
    console.error("Socket Token 驗證失敗:", err.message);
    return next(new Error("憑證無效或已過期，請重新登入"));
  }
};