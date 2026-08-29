const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const ApiError = require("../utils/ApiError");

const AVATAR_DIR = path.join(__dirname, "../../uploads/avatars");
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext =
      file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg";
    cb(null, `${req.user.id}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new ApiError(400, "Avatar must be a JPG, PNG, or WebP image"));
      return;
    }
    cb(null, true);
  },
}).single("avatar");

const handleAvatarUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new ApiError(400, "Image must be under 2MB"));
      }
      return next(new ApiError(400, "Invalid upload"));
    }
    return next(err);
  });
};

module.exports = {
  AVATAR_DIR,
  handleAvatarUpload,
};