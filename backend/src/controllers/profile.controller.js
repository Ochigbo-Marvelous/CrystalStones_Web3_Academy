const asyncHandler = require("../utils/asyncHandler");
const profileService = require("../services/profile.service");

const updateProfile = asyncHandler(async (req, res) => {
  const user = await profileService.updateProfile(req.user.id, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  const result = await profileService.changePassword(
    req.user.id,
    current_password,
    new_password
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

const getCertificates = asyncHandler(async (req, res) => {
  const certificates = await profileService.getCertificates(req.user.id);

  res.status(200).json({
    success: true,
    results: certificates.length,
    data: certificates,
  });
});

module.exports = {
  updateProfile,
  changePassword,
  getCertificates,
};