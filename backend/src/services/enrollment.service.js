const pool = require("../config/db");
const ApiError = require("../utils/ApiError");

const enrollInCourse = async (userId, courseId) => {
  const [courses] = await pool.query("SELECT * FROM courses WHERE id = ?", [courseId]);
  if (courses.length === 0) {
    throw new ApiError(404, "Course not found");
  }

  const [existing] = await pool.query(
    "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
    [userId, courseId]
  );

  if (existing.length > 0) {
    throw new ApiError(409, "You are already enrolled in this course");
  }

  const [result] = await pool.query(
    `INSERT INTO enrollments (user_id, course_id, status, progress_percent)
     VALUES (?, ?, 'active', 0)`,
    [userId, courseId]
  );

  const [enrollment] = await pool.query("SELECT * FROM enrollments WHERE id = ?", [
    result.insertId,
  ]);

  return enrollment[0];
};

const getUserEnrollments = async (userId) => {
  const [enrollments] = await pool.query(
    `SELECT e.id, e.user_id, e.course_id, e.status, e.progress_percent,
            e.enrolled_at, e.completed_at,
            c.title, c.slug, c.thumbnail, c.level, c.is_paid
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     WHERE e.user_id = ?
     ORDER BY e.enrolled_at DESC`,
    [userId]
  );

  return enrollments.map((row) => ({
    ...row,
    course_id: Number(row.course_id),
    progress_percent: Number(row.progress_percent || 0),
  }));
};

const getEnrollment = async (userId, courseId) => {
  const [enrollments] = await pool.query(
    `SELECT e.*, c.title, c.slug, c.level
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     WHERE e.user_id = ? AND e.course_id = ?`,
    [userId, courseId]
  );

  if (enrollments.length === 0) {
    throw new ApiError(404, "You are not enrolled in this course");
  }

  return enrollments[0];
};

module.exports = {
  enrollInCourse,
  getUserEnrollments,
  getEnrollment,
};