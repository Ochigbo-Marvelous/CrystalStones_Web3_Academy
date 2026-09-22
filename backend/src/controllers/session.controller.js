const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { setSessionCookie, clearSessionCookie } = require("../utils/sessionCookie");
const { isBlocked } = require("../utils/tokenBlocklist");

const publicUser = (row) => {
  if (!row) return null;
  const copy = { ...row };
  delete copy.password;
  return copy;
};

const adoptToken = asyncHandler(async (req, res) => {
  const token = String(req.body?.token || "").trim();
  if (!token) throw new ApiError(400, "Missing session token");
  if (await isBlocked(token)) throw new ApiError(401, "Not authorized, token revoked");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Not authorized, token failed");
  }

  const [rows] = await pool.query(
    "SELECT id, full_name, username, email, avatar, role, created_at FROM users WHERE id = ?",
    [decoded.id]
  );
  if (!rows.length) throw new ApiError(401, "User not found");

  setSessionCookie(res, token);
  res.status(200).json({ success: true, data: { user: publicUser(rows[0]) } });
});

const dropSession = asyncHandler(async (req, res) => {
  clearSessionCookie(res);
  res.status(200).json({ success: true, data: { ok: true } });
});

module.exports = { adoptToken, dropSession };