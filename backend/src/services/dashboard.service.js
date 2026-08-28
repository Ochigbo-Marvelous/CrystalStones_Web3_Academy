const pool = require("../config/db");

const RANK_LADDER = [
  { name: "Novice", xp: 0 },
  { name: "Apprentice", xp: 100 },
  { name: "Scholar", xp: 300 },
  { name: "Adept", xp: 600 },
  { name: "Expert", xp: 1000 },
  { name: "Master", xp: 1600 },
];

const buildRankProgress = ({ rank, completedCourses, overallProgress, streak }) => {
  const xp = Math.max(
    0,
    completedCourses * 400 + Math.round(Number(overallProgress || 0) * 12) + Number(streak || 0) * 15
  );

  const currentIndex = Math.max(
    0,
    RANK_LADDER.findIndex((item) => item.name.toLowerCase() === String(rank || "Novice").toLowerCase())
  );
  const current = RANK_LADDER[currentIndex] || RANK_LADDER[0];
  const next = RANK_LADDER[currentIndex + 1] || null;
  const floor = current.xp;
  const target = next ? next.xp : floor + 400;
  const into = Math.min(target - floor, Math.max(0, xp - floor));

  return {
    rank: current.name,
    next_rank: next ? next.name : current.name,
    level: Math.max(1, currentIndex * 4 + 1 + completedCourses),
    xp,
    xp_into: into,
    xp_target: target - floor,
    xp_total_next: target,
    remaining: Math.max(0, target - xp),
    percent: Math.min(100, Math.round((into / Math.max(1, target - floor)) * 100)),
  };
};

const getDashboardData = async (userId) => {
  const [users] = await pool.query(
    `SELECT id, full_name, username, email, avatar, current_rank,
            total_study_minutes, current_streak, longest_streak
     FROM users WHERE id = ?`,
    [userId]
  );

  const user = users[0];

  const [enrollments] = await pool.query(
    `SELECT e.id, e.progress_percent, e.status, e.enrolled_at,
            c.id as course_id, c.title, c.slug, c.thumbnail, c.level, c.total_modules, c.description
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     WHERE e.user_id = ?
     ORDER BY e.enrolled_at DESC`,
    [userId]
  );

  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.status === "completed").length;
  const overallProgress =
    totalCourses > 0
      ? enrollments.reduce((sum, e) => sum + Number(e.progress_percent), 0) / totalCourses
      : 0;

  const [certificates] = await pool.query(
    "SELECT COUNT(*) as count FROM certificates WHERE user_id = ?",
    [userId]
  );

  const inProgress = enrollments.filter((e) => e.status === "active");
  const rankProgress = buildRankProgress({
    rank: user.current_rank,
    completedCourses,
    overallProgress,
    streak: user.current_streak,
  });

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
    rank_progress: rankProgress,
    in_progress: inProgress,
    all_enrollments: enrollments,
  };
};

module.exports = {
  getDashboardData,
};