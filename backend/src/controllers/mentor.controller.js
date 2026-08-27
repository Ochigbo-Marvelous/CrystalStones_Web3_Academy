const asyncHandler = require("../utils/asyncHandler");
const mentorService = require("../services/mentor.service");

const askMentor = asyncHandler(async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({
      success: false,
      message: "Question is required",
    });
  }

  const result = await mentorService.askMentor(req.user.id, question);

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  askMentor,
};