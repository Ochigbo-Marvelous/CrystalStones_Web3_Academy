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

const REVOKEABLE = new Set([
  "complete_all_courses",
  "track_basic",
  "track_intermediate",
  "track_advanced",
]);

const isBeginner = (level) => {
  const v = String(level || "").toLowerCase();
  return v === "beginner" || v === "basic";
};

const targetFor = (condition, stats) => {
  switch (condition) {
    case "complete_first_module":
    case "complete_first_course":
    case "quiz_perfect":
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
    case "track_basic":
      return Math.max(1, stats.basicPublished);
    case "track_intermediate":
      return Math.max(1, stats.intermediatePublished);
    case "track_advanced":
      return stats.advancedPublished > 0 ? stats.advancedPublished : 1;
    case "complete_all_courses":
      return Math.max(1, stats.livePublished);
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
    case "quizzes_5":
      return Math.min(stats.passedQuizzes, 5);
    case "quiz_perfect":
      return Math.min(stats.perfectQuizzes, 1);
    case "track_basic":
      return stats.basicPublished > 0 ? Math.min(stats.basicDone, stats.basicPublished) : 0;
    case "track_intermediate":
      return stats.intermediatePublished > 0
        ? Math.min(stats.intermediateDone, stats.intermediatePublished)
        : 0;
    case "track_advanced":
      return stats.advancedPublished > 0
        ? Math.min(stats.advancedDone, stats.advancedPublished)
        : 0;
    case "complete_all_courses":
      return Math.min(stats.liveDone, Math.max(1, stats.livePublished));
    default:
      return 0;
  }
};

const shouldAward = (condition, stats) => {
  if (condition === "track_advanced" && stats.advancedPublished === 0) return false;
  if (condition === "complete_all_courses" && stats.livePublished === 0) return false;
  if (condition === "track_basic" && stats.basicPublished === 0) return false;
  if (condition === "track_intermediate" && stats.intermediatePublished === 0) return false;
  const target = targetFor(condition, stats);
  return currentFor(condition, stats) >= target && target > 0;
};

const countQuiz = async (sql, userId) => {
  try {
    const [[row]] = await pool.query(sql, [userId]);
    return Number(row.count || 0);
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE" || err.code === "ER_BAD_FIELD_ERROR") return 0;
    throw err;
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

  const [byLevel] = await pool.query(
    `SELECT c.level,
            COUNT(*) AS published,
            SUM(
              CASE
                WHEN e.status = 'completed' OR e.progress_percent >= 100 THEN 1
                ELSE 0
              END
            ) AS done
     FROM courses c
     LEFT JOIN enrollments e
       ON e.course_id = c.id AND e.user_id = ?
     WHERE c.is_published = TRUE
     GROUP BY c.level`,
    [userId]
  );

  let basicPublished = 0;
  let basicDone = 0;
  let intermediatePublished = 0;
  let intermediateDone = 0;
  let advancedPublished = 0;
  let advancedDone = 0;

  for (const row of byLevel) {
    const published = Number(row.published || 0);
    const done = Number(row.done || 0);
    const level = String(row.level || "").toLowerCase();
    if (isBeginner(level)) {
      basicPublished += published;
      basicDone += done;
    } else if (level === "intermediate") {
      intermediatePublished += published;
      intermediateDone += done;
    } else if (level === "advanced") {
      advancedPublished += published;
      advancedDone += done;
    }
  }

  const livePublished = basicPublished + intermediatePublished;
  const liveDone = basicDone + intermediateDone;

  const passedQuizzes = await countQuiz(
    "SELECT COUNT(*) AS count FROM quiz_attempts WHERE user_id = ? AND passed = TRUE",
    userId
  );
  const perfectQuizzes = await countQuiz(
    "SELECT COUNT(*) AS count FROM quiz_attempts WHERE user_id = ? AND score >= 100",
    userId
  );

  return {
    modules: Number(modules.count || 0),
    courses: Number(courses.count || 0),
    streak: Number(user?.current_streak || 0),
    passedQuizzes,
    perfectQuizzes,
    basicPublished,
    basicDone,
    intermediatePublished,
    intermediateDone,
    advancedPublished,
    advancedDone,
    livePublished,
    liveDone,
  };
};

const checkAndAwardAchievements = async (userId) => {
  const stats = await loadStats(userId);
  const [earned] = await pool.query(
    `SELECT ua.achievement_id, a.required_condition
     FROM user_achievements ua
     JOIN achievements a ON a.id = ua.achievement_id
     WHERE ua.user_id = ?`,
    [userId]
  );
  const earnedIds = new Set(earned.map((row) => row.achievement_id));
  const [achievements] = await pool.query("SELECT * FROM achievements");
  const newlyEarned = [];

  for (const row of earned) {
    if (!REVOKEABLE.has(row.required_condition)) continue;
    if (shouldAward(row.required_condition, stats)) continue;
    await pool.query(
      "DELETE FROM user_achievements WHERE user_id = ? AND achievement_id = ?",
      [userId, row.achievement_id]
    );
    earnedIds.delete(row.achievement_id);
  }

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