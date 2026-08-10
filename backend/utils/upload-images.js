import multer from "multer";
import { v4 } from "uuid";

// 篩選檔案,同時決定副檔名
const extMap = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const fileFilter = (req, file, cb) => {
  // 錯誤先行
  cb(null, !!extMap[file.mimetype]);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    // 關鍵轉碼步驟：將 latin1 轉回 utf-8
    /*
    const originalName = Buffer.from(file.originalname, "latin1").toString(
      "utf8",
    );
    */
    const f = v4() + extMap[file.mimetype];
    cb(null, f);
  },
});

export default multer({ fileFilter, storage });
