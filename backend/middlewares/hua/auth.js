import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (req, res, next) => {
  // 1. 嘗試從不同的地方獲取 Token
  let token = null;

  // 方式 A：從 Authorization Header 拿 (格式通常是: Bearer <TOKEN>)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 方式 B：從 Cookie 拿 (支援你的 Google 登入寫入的 cookie)
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. 如果完全沒帶 Token，直接擋掉
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "未提供驗證憑證，請先登入" 
    });
  }

  try {
    // 3. 驗證 Token 是否合法、是否過期
    // 如果驗證失敗（被竄改、過期），jwt.verify 會直接拋出錯誤 (Error) 進到 catch
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. 🌟 關鍵：將解密後的使用者資訊掛在 `req.user` 上
    // 這樣後續的 API 路由就能直接用 req.user 拿到登入者的 id, account, role
    req.user = decoded; 

    // 5. 驗證成功，放行！讓請求繼續走到下一個路由/控制器
    next();

  } catch (err) {
    console.error("Token 驗證失敗:", err.message);
    
    // 區分是「過期」還是「無效」
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "登入憑證已過期，請重新登入" });
    }
    
    return res.status(403).json({ success: false, message: "無效的憑證，拒絕存取" });
  }
};