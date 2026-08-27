const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const pool = require("../config/db");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, no token provided");
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
    next();
  } catch (error) {
    throw new ApiError(401, "Not authorized, token failed");
  }
});

module.exports = { protect };