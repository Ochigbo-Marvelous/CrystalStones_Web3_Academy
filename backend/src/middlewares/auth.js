const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const pool = require("../config/db");
const { isBlocked } = require("../utils/tokenBlocklist");

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : null;

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
    throw new ApiError(
      403,
      `Admin only. Signed in as ${req.user?.email || "unknown"} with role "${req.user?.role || "none"}".`
    );
  }
  next();
});

module.exports = { protect, requireAdmin };