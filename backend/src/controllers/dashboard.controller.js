const asyncHandler = require("../utils/asyncHandler");
const dashboardService = require("../services/dashboard.service");

const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardData(req.user.id);

  res.status(200).json({
    success: true,
    data,
  });
});

module.exports = {
  getDashboard,
};