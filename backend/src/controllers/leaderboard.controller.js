
const asyncHandler = require("../utils/asyncHandler");
const leaderboardService = require("../services/leaderboard.service");

const getLeaderboard = asyncHandler(async (req, res) => {
  const data = await leaderboardService.getLeaderboard(req.user.id);

  res.status(200).json({
    success: true,
    data,
  });
});

module.exports = { getLeaderboard };