const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const achievementService = require("./achievement.service");
const { RANK_ORDER, buildRankProgress } = require("../config/ranks");

const submitQuiz = async (userId, moduleId, answers) => {
  const uid = Number(userId);
  const mid = Number(moduleId);
  if (!Number.isInteger(uid) || uid <= 0 || !Number.isInteger(mid) || mid <= 0) {
    throw new ApiError(400, "Invalid request");
  }
  if (!Array.isArray(answers)) {
    throw new ApiError(400, "Answers are required");
  }

  const [modules] = await pool.query(
    `SELECT m.id, m.course_id
     FROM modules m
     JOIN courses c ON m.course_id = c.id
     WHERE m.id = ?
     LIMIT 1`,
    [mid]
  );

  if (modules.length === 0) {
    throw new ApiError(404, "Module not found");
  }

  const module = modules[0];

  const [enrollments] = await pool.query(
    "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1",
    [uid, module.course_id]
  );

  if (enrollments.length === 0) {
    throw new ApiError(403, "You must be enrolled in this course to take the quiz");
  }

  const [questions] = await pool.query(
    "SELECT id, correct_option FROM brain_teasers WHERE module_id = ?",
    [mid]
  );

  if (questions.length === 0) {
    throw new ApiError(400, "No brain teasers found for this module");
  }

  const answerMap = new Map(
    answers.map((item) => [Number(item.questionId), String(item.selected || "").toLowerCase()])
  );

  let correctCount = 0;
  for (const question of questions) {
    const selected = answerMap.get(Number(question.id));
    if (selected && selected === String(question.correct_option).toLowerCase()) {
      correctCount += 1;
    }
  }

  const totalQuestions = questions.length;
  const score = (correctCount / totalQuestions) * 100;
  const passed = score >= 70;

  await pool.query(
    `INSERT INTO quiz_attempts (user_id, module_id, score, total_questions, correct_answers, passed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [uid, mid, score, totalQuestions, correctCount, passed]
  );

  const [existingProgress] = await pool.query(
    "SELECT id FROM module_progress WHERE user_id = ? AND module_id = ? LIMIT 1",
    [uid, mid]
  );

  if (existingProgress.length > 0) {
    await pool.query(
      `UPDATE module_progress
       SET quiz_passed = ?, quiz_score = ?, is_completed = ?, completed_at = ?
       WHERE user_id = ? AND module_id = ?`,
      [passed, score, passed, passed ? new Date() : null, uid, mid]
    );
  } else {
    await pool.query(
      `INSERT INTO module_progress (user_id, module_id, is_completed, quiz_passed, quiz_score, completed_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uid, mid, passed, passed, score, passed ? new Date() : null]
    );
  }

  let currentRank = "Novice";

  if (passed) {
    await recalculateCourseProgress(uid, module.course_id);
    currentRank = await updateUserRank(uid);
    await recordStudyActivity(uid, 1);
  }

  const newlyEarned = await achievementService.checkAndAwardAchievements(uid);

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
    "SELECT id FROM certificates WHERE user_id = ? AND course_id = ? LIMIT 1",
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
    "SELECT * FROM module_progress WHERE user_id = ? AND module_id = ? LIMIT 1",
    [userId, moduleId]
  );

  return progress[0] || null;
};

const updateUserRank = async (userId) => {
  const [[modulesDone]] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM module_progress
     WHERE user_id = ? AND quiz_passed = TRUE`,
    [userId]
  );

  const [[coursesDone]] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM enrollments
     WHERE user_id = ? AND (status = 'completed' OR progress_percent >= 100)`,
    [userId]
  );

  const [[progressAvg]] = await pool.query(
    `SELECT IFNULL(AVG(progress_percent), 0) AS avg_progress
     FROM enrollments
     WHERE user_id = ?`,
    [userId]
  );

  const [[userRow]] = await pool.query(
    "SELECT current_streak FROM users WHERE id = ? LIMIT 1",
    [userId]
  );

  const progress = buildRankProgress({
    completedCourses: Number(coursesDone.count || 0),
    completedModules: Number(modulesDone.count || 0),
    overallProgress: Number(progressAvg.avg_progress || 0),
    streak: Number(userRow?.current_streak || 0),
  });

  await pool.query("UPDATE users SET current_rank = ? WHERE id = ?", [
    progress.rank,
    userId,
  ]);

  return progress.rank;
};

const recordStudyActivity = async (userId, minutes = 1) => {
  const add = Math.min(Math.max(Number(minutes) || 0, 0), 5);
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) return null;

  await pool.query(
    `UPDATE users
     SET
       total_study_minutes = total_study_minutes + ?,
       current_streak = CASE
         WHEN DATE(last_activity_date) = CURDATE() THEN IFNULL(current_streak, 0)
         WHEN DATE(last_activity_date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN IFNULL(current_streak, 0) + 1
         ELSE 1
       END,
       longest_streak = GREATEST(
         IFNULL(longest_streak, 0),
         CASE
           WHEN DATE(last_activity_date) = CURDATE() THEN IFNULL(current_streak, 0)
           WHEN DATE(last_activity_date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN IFNULL(current_streak, 0) + 1
           ELSE 1
         END
       ),
       last_activity_date = CURDATE()
     WHERE id = ?`,
    [add, uid]
  );

  const [rows] = await pool.query(
    "SELECT current_streak, longest_streak, last_activity_date FROM users WHERE id = ? LIMIT 1",
    [uid]
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