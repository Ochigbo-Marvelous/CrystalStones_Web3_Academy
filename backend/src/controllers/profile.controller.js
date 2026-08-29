const asyncHandler = require("../utils/asyncHandler");
const profileService = require("../services/profile.service");
const avatarService = require("../services/avatar.service");

const getProfile = asyncHandler(async (req, res) => {
  const user = await profileService.getProfile(req.user.id);
  res.status(200).json({ success: true, data: user });
});

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
  await profileService.changePassword(req.user.id, current_password, new_password);
  res.status(200).json({
    success: true,
    message: "Password updated successfully",
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

const uploadAvatar = asyncHandler(async (req, res) => {
  const avatar = await avatarService.saveAvatar(req.user.id, req.file);
  res.status(200).json({
    success: true,
    message: "Avatar updated",
    data: { avatar },
  });
});

const sendEmailChangeCode = asyncHandler(async (req, res) => {
  const result = await profileService.sendEmailChangeCode(req.user.id, req.body.email);
  res.status(200).json({ success: true, message: result.message });
});

const confirmEmailChange = asyncHandler(async (req, res) => {
  const user = await profileService.confirmEmailChange(
    req.user.id,
    req.body.email,
    req.body.code
  );
  res.status(200).json({
    success: true,
    message: "Email updated",
    data: user,
  });
});

const deleteAccount = asyncHandler(async (req, res) => {
  await profileService.deleteAccount(req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: "Account deleted",
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getCertificates,
  uploadAvatar,
  sendEmailChangeCode,
  confirmEmailChange,
  deleteAccount,
};