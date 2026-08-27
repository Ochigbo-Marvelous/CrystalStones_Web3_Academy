const asyncHandler = require("../utils/asyncHandler");
const progressService = require("../services/progress.service");

const submitQuiz = asyncHandler(async (req, res) => {
  const moduleId = Number(req.params.moduleId);
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({
      success: false,
      message: "Answers array is required",
    });
  }

  const result = await progressService.submitQuiz(req.user.id, moduleId, answers);

  res.status(200).json({
    success: true,
    data: result,
  });
});

const getModuleProgress = asyncHandler(async (req, res) => {
  const moduleId = Number(req.params.moduleId);
  const progress = await progressService.getModuleProgress(req.user.id, moduleId);

  res.status(200).json({
    success: true,
    data: progress,
  });
});

module.exports = {
  submitQuiz,
  getModuleProgress,
};