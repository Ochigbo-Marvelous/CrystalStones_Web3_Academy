const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const pool = require("../config/db");
const { isBlocked } = require("../utils/tokenBlocklist");
const { readSessionToken, readAdminToken } = require("../utils/sessionCookie");

const protect = asyncHandler(async (req, res, next) => {
  const token = readSessionToken(req);

  if (!token) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  if (await isBlocked(token)) {
    throw new ApiError(401, "Not authorized, token revoked");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      "SELECT id, full_name, username, email, avatar, role, created_at FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!rows.length) {
      throw new ApiError(401, "User not found");
    }

    req.user = rows[0];
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Not authorized, token failed");
  }
});

const requireAdmin = asyncHandler(async (req, res, next) => {
  const role = String(req.user?.role || "")
    .trim()
    .toLowerCase();

  if (role !== "admin") {
    throw new ApiError(404, `Route ${req.originalUrl} not found`);
  }
  next();
});

const requireAdmin2fa = asyncHandler(async (req, res, next) => {
  const token = readAdminToken(req);
  if (!token) {
    throw new ApiError(403, "ADMIN_OTP_REQUIRED");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "admin" || Number(decoded.id) !== Number(req.user.id)) {
      throw new ApiError(403, "ADMIN_OTP_REQUIRED");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(403, "ADMIN_OTP_REQUIRED");
  }

  next();
});

module.exports = { protect, requireAdmin, requireAdmin2fa };