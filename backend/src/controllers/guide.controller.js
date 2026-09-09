
const asyncHandler = require("../utils/asyncHandler");
const mentorService = require("../services/mentor.service");

const askGuest = asyncHandler(async (req, res) => {
  const question = req.body.question;
  let result;

  if (typeof mentorService.askGuest === "function") {
    result = await mentorService.askGuest(question);
  } else {
    const guestId = Number(process.env.MENTOR_GUEST_USER_ID || 1);
    result = await mentorService.askMentor(guestId, question);
  }

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = { askGuest };