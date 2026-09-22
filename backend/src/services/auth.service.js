const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const securityLogger = require("../utils/securityLogger");
const { blockToken } = require("../utils/tokenBlocklist");
const otpService = require("./otp.service");

const signup = async ({ full_name, username, email, password, email_ticket }) => {
  const ticket = otpService.readTicket(email_ticket, "signup");
  const normalizedEmail = otpService.normalizeEmail(email);

  if (ticket.email !== normalizedEmail) {
    throw new ApiError(401, "Email verification does not match");
  }

  const [existing] = await pool.query(
    "SELECT id FROM users WHERE username = ? OR email = ?",
    [username, normalizedEmail]
  );
  if (existing.length > 0) throw new ApiError(400, "Could not create account");

  const hashedPassword = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    `INSERT INTO users (full_name, username, email, password, provider)
     VALUES (?, ?, ?, ?, 'local')`,
    [full_name, username, normalizedEmail, hashedPassword]
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

const sendSignupCode = async (email) => {
  const normalized = otpService.normalizeEmail(email);
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [normalized]);
  if (existing.length === 0) {
    await otpService.sendCode({
      email: normalized,
      purpose: "signup",
      subject: "Your Crystal Web3 Academy code",
      line: "Use this code to verify your email and create your account.",
    });
  }
  return { message: "If that email can be used, a code is on the way." };
};

const verifySignupCode = async (email, code) => {
  const result = await otpService.verifyCode({ email, purpose: "signup", code });
  return { email: result.email, email_ticket: result.ticket };
};

const sendResetCode = async (email) => {
  const normalized = otpService.normalizeEmail(email);
  const [users] = await pool.query(
    "SELECT id, password FROM users WHERE email = ?",
    [normalized]
  );
  if (users[0]?.password) {
    await otpService.sendCode({
      email: normalized,
      purpose: "reset",
      subject: "Reset your Crystal Web3 Academy password",
      line: "Use this code to reset your password.",
    });
    await securityLogger("PASSWORD_RESET_REQUESTED", { userId: users[0].id });
  }
  return { message: "If that email exists, a code is on the way." };
};

const resetPassword = async (email, code, newPassword) => {
  const verified = await otpService.verifyCode({ email, purpose: "reset", code });
  const [users] = await pool.query(
    "SELECT id, password FROM users WHERE email = ?",
    [verified.email]
  );
  if (!users[0]?.password) throw new ApiError(400, "Could not reset password");

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, users[0].id]);
  await securityLogger("PASSWORD_RESET", { userId: users[0].id });
  return { message: "Password updated. You can sign in now." };
};

module.exports = {
  signup,
  login,
  logout,
  sendSignupCode,
  verifySignupCode,
  sendResetCode,
  resetPassword,
};