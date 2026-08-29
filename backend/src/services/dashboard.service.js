const pool = require("../config/db");
const { buildRankProgress } = require("../config/ranks");

const getDashboardData = async (userId) => {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  const [users] = await pool.query(
    `SELECT id, full_name, username, email, avatar, current_rank,
            total_study_minutes, current_streak, longest_streak
     FROM users WHERE id = ? LIMIT 1`,
    [id]
  );

  const user = users[0];
  if (!user) return null;

  const [enrollments] = await pool.query(
    `SELECT e.id, e.progress_percent, e.status, e.enrolled_at, e.completed_at,
            c.id as course_id, c.title, c.slug, c.thumbnail, c.level, c.total_modules, c.description
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     WHERE e.user_id = ?
     ORDER BY e.enrolled_at DESC`,
    [id]
  );

  const rows = enrollments.map((row) => ({
    ...row,
    course_id: Number(row.course_id),
    progress_percent: Number(row.progress_percent || 0),
  }));

  const totalCourses = rows.length;
  const completedCourses = rows.filter(
    (item) => item.status === "completed" || item.progress_percent >= 100
  ).length;
  const overallProgress =
    totalCourses > 0
      ? rows.reduce((sum, item) => sum + Number(item.progress_percent), 0) / totalCourses
      : 0;

  const [[certificateRow]] = await pool.query(
    "SELECT COUNT(*) AS count FROM certificates WHERE user_id = ?",
    [id]
  );
  const [[moduleRow]] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM module_progress
     WHERE user_id = ? AND quiz_passed = TRUE`,
    [id]
  );

  const inProgress = rows.filter(
    (item) => item.status === "active" && Number(item.progress_percent) < 100
  );
  const completed = rows.filter(
    (item) => item.status === "completed" || Number(item.progress_percent) >= 100
  );

  const rankProgress = buildRankProgress({
    completedCourses,
    completedModules: Number(moduleRow.count || 0),
    overallProgress,
    streak: user.current_streak,
  });

  if (rankProgress.rank !== user.current_rank) {
    await pool.query("UPDATE users SET current_rank = ? WHERE id = ?", [
      rankProgress.rank,
      id,
    ]);
    user.current_rank = rankProgress.rank;
  }

  return {
    user: {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      avatar: user.avatar,
      current_rank: user.current_rank,
      current_streak: Number(user.current_streak || 0),
      longest_streak: Number(user.longest_streak || 0),
    },
    stats: {
      total_courses: totalCourses,
      completed_courses: completedCourses,
      overall_progress: Number(overallProgress.toFixed(1)),
      total_study_minutes: Number(user.total_study_minutes || 0),
      certificates_earned: Number(certificateRow.count || 0),
      current_streak: Number(user.current_streak || 0),
    },
    rank_progress: rankProgress,
    in_progress: inProgress,
    completed,
    all_enrollments: rows,
  };
};

module.exports = {
  getDashboardData,
};