const asyncHandler = require("../utils/asyncHandler");
const certificateService = require("../services/certificate.service");

const listMine = asyncHandler(async (req, res) => {
  const data = await certificateService.listMine(req.user.id);
  res.status(200).json({ success: true, data });
});

const getMine = asyncHandler(async (req, res) => {
  const data = await certificateService.getMine(req.user.id, req.params.track);
  res.status(200).json({ success: true, data });
});

const verifyPublic = asyncHandler(async (req, res) => {
  const data = await certificateService.verifyPublic(req.params.code);
  res.status(200).json({ success: true, data });
});

module.exports = { listMine, getMine, verifyPublic };