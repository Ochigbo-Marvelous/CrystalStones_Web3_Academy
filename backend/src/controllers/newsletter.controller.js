
const asyncHandler = require("../utils/asyncHandler");
const newsletterService = require("../services/newsletter.service");

const subscribe = asyncHandler(async (req, res) => {
  const result = await newsletterService.subscribe(req.body.email, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.status(200).json({
    success: true,
    message: result.message,
    data: { email: result.email, isNew: result.isNew },
  });
});

module.exports = { subscribe };