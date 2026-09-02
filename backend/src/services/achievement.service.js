const pool = require("../config/db");

const POINTS = {
  complete_first_module: 100,
  complete_first_course: 250,
  complete_3_modules: 200,
  complete_10_modules: 400,
  streak_3: 150,
  streak_7: 300,
  complete_3_courses: 400,
  complete_all_courses: 1000,
  quizzes_5: 250,
  quiz_perfect: 300,
  track_basic: 500,
  track_intermediate: 750,
  track_advanced: 1000,
};

const targetFor = (condition, stats) => {
  switch (condition) {
    case "complete_first_module":
    case "complete_first_course":
    case "quiz_perfect":
    case "track_basic":
    case "track_intermediate":
    case "track_advanced":
      return 1;
    case "complete_3_modules":
      return 3;
    case "complete_10_modules":
      return 10;
    case "streak_3":
      return 3;
    case "streak_7":
      return 7;
    case "complete_3_courses":
      return 3;
    case "quizzes_5":
      return 5;
    case "complete_all_courses":
      return Math.max(1, stats.publishedCourses);
    default:
      return 1;
  }
};

const currentFor = (condition, stats) => {
  switch (condition) {
    case "complete_first_module":
      return Math.min(stats.modules, 1);
    case "complete_first_course":
      return Math.min(stats.courses, 1);
    case "complete_3_modules":
      return Math.min(stats.modules, 3);
    case "complete_10_modules":
      return Math.min(stats.modules, 10);
    case "streak_3":
      return Math.min(stats.streak, 3);
    case "streak_7":
      return Math.min(stats.streak, 7);
    case "complete_3_courses":
      return Math.min(stats.courses, 3);
    case "complete_all_courses":
      return Math.min(stats.courses, Math.max(1, stats.publishedCourses));
    case "quizzes_5":
      return Math.min(stats.passedQuizzes, 5);
    case "quiz_perfect":
      return Math.min(stats.perfectQuizzes, 1);
    case "track_basic":
      return stats.tracks.has("basic") || stats.tracks.has("beginner") ? 1 : 0;
    case "track_intermediate":
      return stats.tracks.has("intermediate") ? 1 : 0;
    case "track_advanced":
      return stats.tracks.has("advanced") ? 1 : 0;
    default:
      return 0;
  }
};

const loadStats = async (userId) => {
  const [[modules]] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM module_progress
     WHERE user_id = ? AND quiz_passed = TRUE`,
    [userId]
  );
  const [[courses]] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM enrollments
     WHERE user_id = ? AND (status = 'completed' OR progress_percent >= 100)`,
    [userId]
  );
  const [[user]] = await pool.query(
    "SELECT current_streak FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  const [[published]] = await pool.query(
    "SELECT COUNT(*) AS count FROM courses WHERE is_published = TRUE"
  );
  const [[passedQuizzes]] = await pool.query(
    "SELECT COUNT(*) AS count FROM quiz_attempts WHERE user_id = ? AND passed = TRUE",
    [userId]
  );
  const [[perfectQuizzes]] = await pool.query(
    "SELECT COUNT(*) AS count FROM quiz_attempts WHERE user_id = ? AND score >= 100",
    [userId]
  );

  let tracks = new Set();
  try {
    const [certs] = await pool.query(
      "SELECT level FROM certificates WHERE user_id = ?",
      [userId]
    );
    tracks = new Set(certs.map((row) => row.level).filter(Boolean));
  } catch (err) {
    if (err.code !== "ER_BAD_FIELD_ERROR") throw err;
  }

  return {
    modules: Number(modules.count || 0),
    courses: Number(courses.count || 0),
    streak: Number(user?.current_streak || 0),
    publishedCourses: Number(published.count || 0),
    passedQuizzes: Number(passedQuizzes.count || 0),
    perfectQuizzes: Number(perfectQuizzes.count || 0),
    tracks,
  };
};

const shouldAward = (condition, stats) => {
  const target = targetFor(condition, stats);
  return currentFor(condition, stats) >= target && target > 0;
};

const checkAndAwardAchievements = async (userId) => {
  const stats = await loadStats(userId);
  const [earned] = await pool.query(
    "SELECT achievement_id FROM user_achievements WHERE user_id = ?",
    [userId]
  );
  const earnedIds = new Set(earned.map((row) => row.achievement_id));
  const [achievements] = await pool.query("SELECT * FROM achievements");
  const newlyEarned = [];

  for (const achievement of achievements) {
    if (earnedIds.has(achievement.id)) continue;
    if (!shouldAward(achievement.required_condition, stats)) continue;

    try {
      await pool.query(
        "INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)",
        [userId, achievement.id]
      );
      newlyEarned.push(achievement);
    } catch (err) {
      if (err.code !== "ER_DUP_ENTRY") throw err;
    }
  }

  return newlyEarned;
};

const getUserAchievements = async (userId) => {
  const [achievements] = await pool.query(
    `SELECT a.id, a.name, a.description, a.badge_icon, ua.earned_at
     FROM user_achievements ua
     JOIN achievements a ON ua.achievement_id = a.id
     WHERE ua.user_id = ?
     ORDER BY ua.earned_at DESC`,
    [userId]
  );
  return achievements;
};

const getAllAchievements = async (userId) => {
  await checkAndAwardAchievements(userId);
  const stats = await loadStats(userId);
  const [achievements] = await pool.query(
    `SELECT a.*,
            CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END AS earned,
            ua.earned_at
     FROM achievements a
     LEFT JOIN user_achievements ua
       ON a.id = ua.achievement_id AND ua.user_id = ?
     ORDER BY a.id ASC`,
    [userId]
  );

  return achievements.map((row) => {
    const target = targetFor(row.required_condition, stats);
    const progress = currentFor(row.required_condition, stats);
    const earned = Boolean(Number(row.earned));
    let status = "locked";
    if (earned) status = "earned";
    else if (progress > 0) status = "in_progress";

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      badge_icon: row.badge_icon,
      required_condition: row.required_condition,
      earned,
      earned_at: row.earned_at,
      status,
      progress,
      target,
      points: POINTS[row.required_condition] || 100,
    };
  });
};

module.exports = {
  checkAndAwardAchievements,
  getUserAchievements,
  getAllAchievements,
};