const asyncHandler = require("../utils/asyncHandler");
const adminService = require("../services/admin.service");
const adminOtp = require("../services/admin.otp.service");

const overview = asyncHandler(async (req, res) => {
  const data = await adminService.getOverview();
  res.status(200).json({ success: true, data });
});

const users = asyncHandler(async (req, res) => {
  const data = await adminService.listUsers({
    q: req.query.q,
    track: req.query.track,
    rank: req.query.rank,
    page: req.query.page,
  });
  res.status(200).json({ success: true, data });
});

const tracks = asyncHandler(async (req, res) => {
  const data = await adminService.listTracks();
  res.status(200).json({ success: true, data });
});

const certificates = asyncHandler(async (req, res) => {
  const data = await adminService.listCertificates();
  res.status(200).json({ success: true, data });
});

const sendOtp = asyncHandler(async (req, res) => {
  const data = await adminOtp.sendAdminOtp(req.user);
  res.status(200).json({ success: true, data });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const data = await adminOtp.verifyAdminOtp(req.user, req.body?.code, res);
  res.status(200).json({ success: true, data });
});

module.exports = { overview, users, tracks, certificates, sendOtp, verifyOtp };