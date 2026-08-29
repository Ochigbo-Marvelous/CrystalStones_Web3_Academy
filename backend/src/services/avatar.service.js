const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const pool = require("../config/db");
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

const isJpeg = (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
const isPng = (buf) =>
  buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
const isWebp = (buf) =>
  buf.length >= 12 &&
  buf.toString("ascii", 0, 4) === "RIFF" &&
  buf.toString("ascii", 8, 12) === "WEBP";

const unlinkQuiet = (filePath) => {
  fs.unlink(filePath, () => {});
};

const removeOwnedAvatar = (avatarPath, userId) => {
  if (!avatarPath || typeof avatarPath !== "string") return;
  if (!avatarPath.startsWith("/uploads/avatars/")) return;

  const base = path.basename(avatarPath);
  if (!base.startsWith(`${userId}-`)) return;

  const full = path.join(AVATAR_DIR, base);
  const resolved = path.resolve(full);
  if (!resolved.startsWith(path.resolve(AVATAR_DIR) + path.sep)) return;
  unlinkQuiet(resolved);
};

const saveAvatar = async (userId, file) => {
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) {
    throw new ApiError(400, "Invalid user");
  }
  if (!file?.path) {
    throw new ApiError(400, "No image uploaded");
  }

  const header = Buffer.alloc(12);
  const fd = fs.openSync(file.path, "r");
  try {
    fs.readSync(fd, header, 0, 12, 0);
  } finally {
    fs.closeSync(fd);
  }

  if (!isJpeg(header) && !isPng(header) && !isWebp(header)) {
    unlinkQuiet(file.path);
    throw new ApiError(400, "Invalid image file");
  }

  const [rows] = await pool.query("SELECT avatar FROM users WHERE id = ? LIMIT 1", [uid]);
  if (rows.length === 0) {
    unlinkQuiet(file.path);
    throw new ApiError(404, "User not found");
  }

  const relative = `/uploads/avatars/${file.filename}`;
  await pool.query("UPDATE users SET avatar = ? WHERE id = ?", [relative, uid]);
  removeOwnedAvatar(rows[0].avatar, uid);

  return relative;
};

module.exports = {
  AVATAR_DIR,
  handleAvatarUpload,
  saveAvatar,
};