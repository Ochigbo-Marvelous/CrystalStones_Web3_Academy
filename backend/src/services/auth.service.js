const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const securityLogger = require("../utils/securityLogger");
const { blockToken } = require("../utils/tokenBlocklist");

const signup = async ({ full_name, username, email, password }) => {
  const [existing] = await pool.query(
    "SELECT id FROM users WHERE username = ? OR email = ?",
    [username, email]
  );

  if (existing.length > 0) {
    throw new ApiError(400, "Could not create account");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    `INSERT INTO users (full_name, username, email, password, provider)
     VALUES (?, ?, ?, ?, 'local')`,
    [full_name, username, email, hashedPassword]
  );

  const userId = result.insertId;
  const [users] = await pool.query(
    `SELECT id, full_name, username, email, avatar, role, current_rank, created_at
     FROM users WHERE id = ?`,
    [userId]
  );

  await securityLogger("SIGNUP_SUCCESS", { userId });
  return { user: users[0], token: generateToken(userId) };
};

const login = async ({ login, password }) => {
  const [users] = await pool.query(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [login, login]
  );

  if (users.length === 0) {
    await securityLogger("LOGIN_FAILED", { login });
    throw new ApiError(401, "Invalid credentials");
  }

  const user = users[0];

  if (!user.password) {
    await securityLogger("LOGIN_FAILED", { login, userId: user.id, reason: "oauth_only" });
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    await securityLogger("LOGIN_FAILED", { login, userId: user.id });
    throw new ApiError(401, "Invalid credentials");
  }

  delete user.password;
  await securityLogger("LOGIN_SUCCESS", { userId: user.id });
  return { user, token: generateToken(user.id) };
};

const logout = async (token) => {
  if (token) await blockToken(token);
};

module.exports = { signup, login, logout };