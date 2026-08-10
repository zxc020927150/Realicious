
/**
 * 處理並格式化大頭貼網址
 * @param avatar 來自資料庫的 avatar 字串
 * @param req (可選) Express 的 Request 物件，用來動態取得當前網域 (protocol + host)
 */
export function formatAvatarUrl(avatar, req) {
  if (!avatar) return "";

  const avatarStr = avatar.trim();

  // 情況 1：Google 等第三方完整網址 -> 原樣回傳
  if (avatarStr.startsWith("http://") || avatarStr.startsWith("https://")) {
    return avatarStr;
  }

  // 情況 2：前端 public 裡的預設小雞圖 -> 原樣回傳相對路徑
  if (
    avatarStr.startsWith("/user/default_avatars/") ||
    avatarStr.includes("chicken_")
  ) {
    return avatarStr;
  }

  // 情況 3：使用者上傳在後端靜態資料夾的圖片 -> 拼接後端網域
  const cleanPath = avatarStr.startsWith("/") ? avatarStr : `/${avatarStr}`;

  if (req) {
    return `${req.protocol}://${req.get("host")}${cleanPath}`;
  }

  // 🌟 特殊情況：如果是在 Socket.io 裡面沒有 req 物件，可使用環境變數或預設後端網址
  const SERVER_URL = process.env.SERVER_URL || "http://localhost:3001";
  return `${SERVER_URL}${cleanPath}`;
}