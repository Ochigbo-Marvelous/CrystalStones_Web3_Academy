const asyncHandler = require("../utils/asyncHandler");
const mentorService = require("../services/mentor.service");

const askMentor = asyncHandler(async (req, res) => {
  const result = await mentorService.askMentor(req.user.id, req.body.question);

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = { askMentor };