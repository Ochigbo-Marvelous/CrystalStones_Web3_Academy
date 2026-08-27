const asyncHandler = require("../utils/asyncHandler");
const achievementService = require("../services/achievement.service");

const getMyAchievements = asyncHandler(async (req, res) => {
  const achievements = await achievementService.getUserAchievements(req.user.id);

  res.status(200).json({
    success: true,
    results: achievements.length,
    data: achievements,
  });
});

const getAllAchievements = asyncHandler(async (req, res) => {
  const achievements = await achievementService.getAllAchievements(req.user.id);

  res.status(200).json({
    success: true,
    results: achievements.length,
    data: achievements,
  });
});

module.exports = {
  getMyAchievements,
  getAllAchievements,
};