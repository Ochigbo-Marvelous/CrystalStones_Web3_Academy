const express = require("express");
const profileController = require("../controllers/profile.controller");
const validate = require("../middlewares/validate");
const {
  updateProfileSchema,
  changePasswordSchema,
  changeEmailSchema,
  sendEmailCodeSchema,
  deleteAccountSchema,
} = require("../validations/profile.validation");
const { protect } = require("../middlewares/auth");
const { handleAvatarUpload } = require("../services/avatar.service");

const router = express.Router();

router.use(protect);

router.get("/", profileController.getProfile);
router.patch("/", validate(updateProfileSchema), profileController.updateProfile);
router.patch("/password", validate(changePasswordSchema), profileController.changePassword);
router.get("/certificates", profileController.getCertificates);
router.post("/avatar", handleAvatarUpload, profileController.uploadAvatar);
router.post("/email/send-code", validate(sendEmailCodeSchema), profileController.sendEmailChangeCode);
router.post("/email/confirm", validate(changeEmailSchema), profileController.confirmEmailChange);
router.delete("/", validate(deleteAccountSchema), profileController.deleteAccount);

module.exports = router;