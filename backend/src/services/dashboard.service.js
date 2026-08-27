const pool = require("../config/db");

const getDashboardData = async (userId) => {
  // 1. Get user basic info
  const [users] = await pool.query(
    `SELECT id, full_name, username, email, avatar, current_rank, 
            total_study_minutes, current_streak, longest_streak
     FROM users WHERE id = ?`,
    [userId]
  );

  const user = users[0];

  // 2. Get enrollments with progress
  const [enrollments] = await pool.query(
    `SELECT e.id, e.progress_percent, e.status, e.enrolled_at,
            c.id as course_id, c.title, c.slug, c.thumbnail, c.level, c.total_modules
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     WHERE e.user_id = ?
     ORDER BY e.enrolled_at DESC`,
    [userId]
  );

  // 3. Stats
  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.status === "completed").length;

  const overallProgress =
    totalCourses > 0
      ? enrollments.reduce((sum, e) => sum + Number(e.progress_percent), 0) / totalCourses
      : 0;

  // 4. Certificates count
  const [certificates] = await pool.query(
    "SELECT COUNT(*) as count FROM certificates WHERE user_id = ?",
    [userId]
  );

  // 5. In-progress courses (not completed)
  const inProgress = enrollments.filter((e) => e.status === "active");

  return {
    user: {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      avatar: user.avatar,
      current_rank: user.current_rank,
      current_streak: user.current_streak,
      longest_streak: user.longest_streak,
    },
    stats: {
      total_courses: totalCourses,
      completed_courses: completedCourses,
      overall_progress: Number(overallProgress.toFixed(1)),
      total_study_minutes: user.total_study_minutes,
      certificates_earned: certificates[0].count,
      current_streak: user.current_streak,
    },
    in_progress: inProgress,
    all_enrollments: enrollments,
  };
};

module.exports = {
  getDashboardData,
};