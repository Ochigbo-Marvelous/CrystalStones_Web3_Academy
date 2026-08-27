const pool = require("../config/db");

const RANKS = [
  { name: "Novice", minModules: 0 },
  { name: "Explorer", minModules: 3 },
  { name: "Practitioner", minModules: 6 },
  { name: "Scholar", minModules: 10 },
  { name: "Expert", minModules: 15 },
  { name: "Master", minModules: 25 },
  { name: "Academy Graduate", minModules: 40 },
];

const checkAndAwardAchievements = async (userId) => {
  // Get user stats
  const [progress] = await pool.query(
    `SELECT COUNT(*) as completed_modules 
     FROM module_progress 
     WHERE user_id = ? AND quiz_passed = TRUE`,
    [userId]
  );

  const completedModules = progress[0].completed_modules;

  const [courses] = await pool.query(
    `SELECT COUNT(*) as completed_courses 
     FROM enrollments 
     WHERE user_id = ? AND status = 'completed'`,
    [userId]
  );

  const completedCourses = courses[0].completed_courses;

  const [user] = await pool.query(
    "SELECT current_streak FROM users WHERE id = ?",
    [userId]
  );

  const currentStreak = user[0].current_streak;

  // Get already earned achievements
  const [earned] = await pool.query(
    "SELECT achievement_id FROM user_achievements WHERE user_id = ?",
    [userId]
  );

  const earnedIds = earned.map((e) => e.achievement_id);

  // Get all achievements
  const [achievements] = await pool.query("SELECT * FROM achievements");

  const newlyEarned = [];

  for (const achievement of achievements) {
    if (earnedIds.includes(achievement.id)) continue;

    let shouldAward = false;

    switch (achievement.required_condition) {
      case "complete_first_module":
        shouldAward = completedModules >= 1;
        break;
      case "complete_first_course":
        shouldAward = completedCourses >= 1;
        break;
      case "complete_3_modules":
        shouldAward = completedModules >= 3;
        break;
      case "streak_3":
        shouldAward = currentStreak >= 3;
        break;
      case "complete_all_courses":
        // Simple version – can improve later
        shouldAward = completedCourses >= 5;
        break;
    }

    if (shouldAward) {
      await pool.query(
        "INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)",
        [userId, achievement.id]
      );
      newlyEarned.push(achievement);
    }
  }

  // Update rank
  await updateUserRank(userId, completedModules);

  return newlyEarned;
};

const updateUserRank = async (userId, completedModules) => {
  let newRank = "Novice";

  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (completedModules >= RANKS[i].minModules) {
      newRank = RANKS[i].name;
      break;
    }
  }

  await pool.query("UPDATE users SET current_rank = ? WHERE id = ?", [newRank, userId]);
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
  const [achievements] = await pool.query(
    `SELECT a.*, 
            CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END as earned,
            ua.earned_at
     FROM achievements a
     LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
     ORDER BY a.id ASC`,
    [userId]
  );

  return achievements;
};

module.exports = {
  checkAndAwardAchievements,
  getUserAchievements,
  getAllAchievements,
  updateUserRank,
};