const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const achievementService = require("./achievement.service");

const RANK_ORDER = ["Novice", "Apprentice", "Scholar", "Adept", "Expert", "Master"];

const submitQuiz = async (userId, moduleId, answers) => {
  const [modules] = await pool.query(
    `SELECT m.*, c.id as course_id
     FROM modules m
     JOIN courses c ON m.course_id = c.id
     WHERE m.id = ?`,
    [moduleId]
  );

  if (modules.length === 0) {
    throw new ApiError(404, "Module not found");
  }

  const module = modules[0];

  const [enrollments] = await pool.query(
    "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
    [userId, module.course_id]
  );

  if (enrollments.length === 0) {
    throw new ApiError(403, "You must be enrolled in this course to take the quiz");
  }

  const [questions] = await pool.query(
    "SELECT id, correct_option FROM brain_teasers WHERE module_id = ?",
    [moduleId]
  );

  if (questions.length === 0) {
    throw new ApiError(400, "No brain teasers found for this module");
  }

  let correctCount = 0;
  for (const question of questions) {
    const userAnswer = answers.find(
      (a) => Number(a.questionId) === Number(question.id)
    );
    if (
      userAnswer &&
      String(userAnswer.selected).toLowerCase() === String(question.correct_option).toLowerCase()
    ) {
      correctCount += 1;
    }
  }

  const totalQuestions = questions.length;
  const score = (correctCount / totalQuestions) * 100;
  const passed = score >= 70;

  await pool.query(
    `INSERT INTO quiz_attempts (user_id, module_id, score, total_questions, correct_answers, passed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, moduleId, score, totalQuestions, correctCount, passed]
  );

  const [existingProgress] = await pool.query(
    "SELECT id FROM module_progress WHERE user_id = ? AND module_id = ?",
    [userId, moduleId]
  );

  if (existingProgress.length > 0) {
    await pool.query(
      `UPDATE module_progress
       SET quiz_passed = ?, quiz_score = ?, is_completed = ?, completed_at = ?
       WHERE user_id = ? AND module_id = ?`,
      [passed, score, passed, passed ? new Date() : null, userId, moduleId]
    );
  } else {
    await pool.query(
      `INSERT INTO module_progress (user_id, module_id, is_completed, quiz_passed, quiz_score, completed_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, moduleId, passed, passed, score, passed ? new Date() : null]
    );
  }

  let currentRank = "Novice";

  if (passed) {
    await recalculateCourseProgress(userId, module.course_id);
    currentRank = await updateUserRank(userId);
    await recordStudyActivity(userId, 1);
  }

  const newlyEarned = await achievementService.checkAndAwardAchievements(userId);

  return {
    score: Number(score.toFixed(2)),
    totalQuestions,
    correctAnswers: correctCount,
    passed,
    current_rank: currentRank,
    message: passed
      ? "Congratulations! You passed the quiz and unlocked the next module."
      : "You did not pass. Please review the module and try again.",
    newlyEarnedAchievements: newlyEarned || [],
  };
};

const recalculateCourseProgress = async (userId, courseId) => {
  const [modules] = await pool.query(
    "SELECT id FROM modules WHERE course_id = ?",
    [courseId]
  );

  const totalModules = modules.length;
  if (totalModules === 0) return;

  const [completed] = await pool.query(
    `SELECT COUNT(*) as count
     FROM module_progress mp
     JOIN modules m ON mp.module_id = m.id
     WHERE mp.user_id = ? AND m.course_id = ? AND mp.quiz_passed = TRUE`,
    [userId, courseId]
  );

  const completedCount = Number(completed[0].count);
  const progressPercent = (completedCount / totalModules) * 100;
  const isCompleted = progressPercent >= 100;

  await pool.query(
    `UPDATE enrollments
     SET progress_percent = ?, status = ?, completed_at = ?
     WHERE user_id = ? AND course_id = ?`,
    [
      progressPercent,
      isCompleted ? "completed" : "active",
      isCompleted ? new Date() : null,
      userId,
      courseId,
    ]
  );

  if (isCompleted) {
    await issueCertificate(userId, courseId);
  }
};

const issueCertificate = async (userId, courseId) => {
  const [existing] = await pool.query(
    "SELECT id FROM certificates WHERE user_id = ? AND course_id = ?",
    [userId, courseId]
  );

  if (existing.length > 0) return;

  const certificateCode = `CSA-${userId}-${courseId}-${Date.now().toString().slice(-6)}`;

  await pool.query(
    `INSERT INTO certificates (user_id, course_id, certificate_code)
     VALUES (?, ?, ?)`,
    [userId, courseId, certificateCode]
  );
};

const getModuleProgress = async (userId, moduleId) => {
  const [progress] = await pool.query(
    "SELECT * FROM module_progress WHERE user_id = ? AND module_id = ?",
    [userId, moduleId]
  );

  return progress[0] || null;
};

const updateUserRank = async (userId) => {
  const [modulesDone] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM module_progress
     WHERE user_id = ? AND quiz_passed = TRUE`,
    [userId]
  );

  const [coursesDone] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM enrollments
     WHERE user_id = ? AND status = 'completed'`,
    [userId]
  );

  const [published] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM courses
     WHERE is_published = TRUE`
  );

  const moduleCount = Number(modulesDone[0].count);
  const courseCount = Number(coursesDone[0].count);
  const publishedCount = Number(published[0].count);

  let rank = "Novice";
  if (publishedCount > 0 && courseCount >= publishedCount) rank = "Master";
  else if (courseCount >= 5) rank = "Expert";
  else if (courseCount >= 3) rank = "Adept";
  else if (courseCount >= 1) rank = "Scholar";
  else if (moduleCount >= 1) rank = "Apprentice";

  await pool.query(
    "UPDATE users SET current_rank = ? WHERE id = ?",
    [rank, userId]
  );

  return rank;
};

const recordStudyActivity = async (userId, minutes = 1) => {
  const add = Math.min(Math.max(Number(minutes) || 0, 0), 5);

  await pool.query(
    `UPDATE users
     SET
       total_study_minutes = total_study_minutes + ?,
       current_streak = CASE
         WHEN last_activity_date = CURDATE() THEN current_streak
         WHEN last_activity_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN current_streak + 1
         ELSE 1
       END,
       longest_streak = GREATEST(
         IFNULL(longest_streak, 0),
         CASE
           WHEN last_activity_date = CURDATE() THEN IFNULL(current_streak, 0)
           WHEN last_activity_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN IFNULL(current_streak, 0) + 1
           ELSE 1
         END
       ),
       last_activity_date = CURDATE()
     WHERE id = ?`,
    [add, userId]
  );

  const [rows] = await pool.query(
    "SELECT current_streak, longest_streak, last_activity_date FROM users WHERE id = ?",
    [userId]
  );

  return {
    current_streak: Number(rows[0]?.current_streak || 0),
    added_minutes: add,
  };
};

module.exports = {
  submitQuiz,
  getModuleProgress,
  recalculateCourseProgress,
  issueCertificate,
  updateUserRank,
  recordStudyActivity,
  RANK_ORDER,
};