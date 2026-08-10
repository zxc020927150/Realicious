// ../../middlewares/hua/upload.js
import multer from 'multer';
import path from 'path';

// 設定儲存位置與檔名
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 🌟 指定存在後端專案的 public/user/avatars 資料夾內
    cb(null, 'public/user/avatars'); 
  },
  filename: (req, file, cb) => {
    // 為了避免大家檔名重複互相覆蓋，用「時間戳記 + 亂數 + 原始副檔名」重新命名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

// 過濾檔案，只接受圖片
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只能上傳圖片檔案！'), false);
  }
};

export const uploadAvatar = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 限制 2MB
});