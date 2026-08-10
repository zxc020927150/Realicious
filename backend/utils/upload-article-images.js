import multer from "multer";
import { v4 as uuidv4 } from "uuid";

const extensionByMimeType = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
};

const storage = multer.diskStorage({
	destination: "public/article",
	filename: (req, file, cb) => {
		cb(null, `${uuidv4()}${extensionByMimeType[file.mimetype]}`);
	},
});

const fileFilter = (req, file, cb) => {
	if (!extensionByMimeType[file.mimetype]) {
		return cb(new Error("只接受 JPG、PNG、WebP 圖片"));
	}

	cb(null, true);
};

export default multer({
	storage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 },
});
