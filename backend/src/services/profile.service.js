const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const securityLogger = require("../utils/securityLogger");

const updateProfile = async (userId, data) => {
  const fields = [];
  const values = [];

  if (data.full_name !== undefined) {
    fields.push("full_name = ?");
    values.push(data.full_name);
  }

  if (data.avatar !== undefined) {
    fields.push("avatar = ?");
    values.push(data.avatar || null);
  }

  if (fields.length === 0) {
    throw new ApiError(400, "No data provided to update");
  }

  values.push(userId);

  await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

  const [users] = await pool.query(
    `SELECT id, full_name, username, email, avatar, role, current_rank, created_at 
     FROM users WHERE id = ?`,
    [userId]
  );

  await securityLogger("PROFILE_UPDATED", { userId });

  return users[0];
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const [users] = await pool.query("SELECT password FROM users WHERE id = ?", [userId]);

  if (users.length === 0) {
    throw new ApiError(404, "User not found");
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

const getCertificates = async (userId) => {
  const [certificates] = await pool.query(
    `SELECT c.id, c.certificate_code, c.issued_at, 
            co.title as course_title, co.slug as course_slug
     FROM certificates c
     JOIN courses co ON c.course_id = co.id
     WHERE c.user_id = ?
     ORDER BY c.issued_at DESC`,
    [userId]
  );

  return certificates;
};

module.exports = {
  updateProfile,
  changePassword,
  getCertificates,
};