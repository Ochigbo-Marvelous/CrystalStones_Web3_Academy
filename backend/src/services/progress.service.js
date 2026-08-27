const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const achievementService = require("./achievement.service");

const submitQuiz = async (userId, moduleId, answers) => {
  // answers format: [{ questionId: 1, selected: "b" }, ...]

  // 1. Check if user is enrolled in the course that owns this module
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

  // 2. Get all questions for this module
  const [questions] = await pool.query(
    "SELECT id, correct_option FROM brain_teasers WHERE module_id = ?",
    [moduleId]
  );

  if (questions.length === 0) {
    throw new ApiError(400, "No brain teasers found for this module");
  }

  // 3. Calculate score
  let correctCount = 0;

  for (const question of questions) {
    const userAnswer = answers.find((a) => a.questionId === question.id);
    if (userAnswer && userAnswer.selected === question.correct_option) {
      correctCount++;
    }
  }

  const totalQuestions = questions.length;
  const score = (correctCount / totalQuestions) * 100;
  const passed = score >= 70; // 70% pass mark

  // 4. Save quiz attempt
  await pool.query(
    `INSERT INTO quiz_attempts (user_id, module_id, score, total_questions, correct_answers, passed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, moduleId, score, totalQuestions, correctCount, passed]
  );

  // 5. Update or create module progress
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

  // 6. If passed, recalculate course progress
  if (passed) {
    await recalculateCourseProgress(userId, module.course_id);
  }

  // 7. Check and award achievements
  const newlyEarned = await achievementService.checkAndAwardAchievements(userId);

  return {
    score: Number(score.toFixed(2)),
    totalQuestions,
    correctAnswers: correctCount,
    passed,
    message: passed
      ? "Congratulations! You passed the quiz and unlocked the next module."
      : "You did not pass. Please review the module and try again.",
    newlyEarnedAchievements: newlyEarned || [],
  };
};

const recalculateCourseProgress = async (userId, courseId) => {
  // Get total modules in course
  const [modules] = await pool.query(
    "SELECT id FROM modules WHERE course_id = ?",
    [courseId]
  );

  const totalModules = modules.length;
  if (totalModules === 0) return;

  // Get completed modules by user
  const [completed] = await pool.query(
    `SELECT COUNT(*) as count 
     FROM module_progress mp
     JOIN modules m ON mp.module_id = m.id
     WHERE mp.user_id = ? AND m.course_id = ? AND mp.quiz_passed = TRUE`,
    [userId, courseId]
  );

  const completedCount = completed[0].count;
  const progressPercent = (completedCount / totalModules) * 100;

  // Update enrollment
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

  // If course completed → issue certificate
  if (isCompleted) {
    await issueCertificate(userId, courseId);
  }
};

const issueCertificate = async (userId, courseId) => {
  // Check if certificate already exists
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

module.exports = {
  submitQuiz,
  getModuleProgress,
  recalculateCourseProgress,
  issueCertificate,
};