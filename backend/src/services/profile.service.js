const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const securityLogger = require("../utils/securityLogger");
const otpService = require("./otp.service");

const publicUser = async (userId) => {
  const [users] = await pool.query(
    `SELECT id, full_name, username, email, avatar, role, current_rank, provider, created_at,
            (password IS NOT NULL AND password != '') AS has_password
     FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  if (users.length === 0) throw new ApiError(404, "User not found");
  const user = users[0];
  user.has_password = Boolean(Number(user.has_password));
  return user;
};

const getProfile = async (userId) => publicUser(userId);

const updateProfile = async (userId, data) => {
  const fields = [];
  const values = [];

  if (data.full_name !== undefined) {
    fields.push("full_name = ?");
    values.push(data.full_name);
  }

  if (data.username !== undefined) {
    const username = String(data.username).trim();
    const [taken] = await pool.query(
      "SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1",
      [username, userId]
    );
    if (taken.length > 0) throw new ApiError(409, "That Crystal ID is already taken");
    fields.push("username = ?");
    values.push(username);
  }

  if (fields.length === 0) {
    throw new ApiError(400, "No data provided to update");
  }

  values.push(userId);
  await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
  await securityLogger("PROFILE_UPDATED", { userId });
  return publicUser(userId);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const [users] = await pool.query("SELECT password FROM users WHERE id = ?", [userId]);

  if (users.length === 0) {
    throw new ApiError(404, "User not found");
  }

  if (!users[0].password) {
    throw new ApiError(400, "This account uses GitHub login");
  }

  const isMatch = await bcrypt.compare(currentPassword, users[0].password);
  if (!isMatch) {
    await securityLogger("PASSWORD_CHANGE_FAILED", { userId });
    throw new ApiError(401, "Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);
  await securityLogger("PASSWORD_CHANGED", { userId });

  return { message: "Password updated successfully" };
};

const parseSnapshot = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const getCertificates = async (userId) => {
  const [certificates] = await pool.query(
    `SELECT id, certificate_code, issued_at, level, course_snapshot
     FROM certificates
     WHERE user_id = ?
     ORDER BY issued_at DESC`,
    [userId]
  );

  return certificates.map((row) => {
    const snapshot = parseSnapshot(row.course_snapshot);
    return {
      id: row.id,
      certificate_code: row.certificate_code,
      issued_at: row.issued_at,
      level: row.level || snapshot.level || null,
      title: snapshot.title || "Track certificate",
      courses: Array.isArray(snapshot.courses) ? snapshot.courses : [],
    };
  });
};

const sendEmailChangeCode = async (userId, email) => {
  const normalized = otpService.normalizeEmail(email);
  const current = await publicUser(userId);

  if (normalized === otpService.normalizeEmail(current.email)) {
    return { message: "That is already your email." };
  }

  const [taken] = await pool.query(
    "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
    [normalized, userId]
  );

  if (taken.length === 0) {
    await otpService.sendCode({
      email: normalized,
      purpose: "email_change",
      subject: "Confirm your new Crystal Stones Academy email",
      line: "Use this code to change the email on your account.",
    });
  }

  await securityLogger("EMAIL_CHANGE_REQUESTED", { userId });
  return { message: "If that email can be used, a code is on the way." };
};

const confirmEmailChange = async (userId, email, code) => {
  const verified = await otpService.verifyCode({
    email,
    purpose: "email_change",
    code,
  });

  const [taken] = await pool.query(
    "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
    [verified.email, userId]
  );
  if (taken.length > 0) throw new ApiError(409, "Could not change email");

  await pool.query("UPDATE users SET email = ? WHERE id = ?", [verified.email, userId]);
  await securityLogger("EMAIL_CHANGED", { userId });
  return publicUser(userId);
};

const deleteFrom = async (connection, table, userId) => {
  try {
    await connection.query("DELETE FROM ?? WHERE user_id = ?", [table, userId]);
  } catch (err) {
    if (err.code !== "ER_NO_SUCH_TABLE") throw err;
  }
};

const deleteAccount = async (userId, { password, confirm }) => {
  const [users] = await pool.query(
    "SELECT id, password, email FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  if (users.length === 0) throw new ApiError(404, "User not found");

  const user = users[0];
  if (user.password) {
    const ok = await bcrypt.compare(String(password || ""), user.password);
    if (!ok) throw new ApiError(401, "Current password is incorrect");
  }
  if (String(confirm || "") !== "DELETE") {
    throw new ApiError(400, "Type DELETE to confirm");
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await deleteFrom(connection, "quiz_attempts", userId);
    await deleteFrom(connection, "module_progress", userId);
    await deleteFrom(connection, "certificates", userId);
    await deleteFrom(connection, "enrollments", userId);
    await deleteFrom(connection, "payment_orders", userId);
    await deleteFrom(connection, "security_logs", userId);
    await connection.query("DELETE FROM email_verifications WHERE email = ?", [user.email]);
    await connection.query("DELETE FROM users WHERE id = ?", [userId]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  await securityLogger("ACCOUNT_DELETED", { userId });
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getCertificates,
  sendEmailChangeCode,
  confirmEmailChange,
  deleteAccount,
};