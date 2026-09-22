const express = require("express");
const authController = require("../controllers/auth.controller");
const sessionController = require("../controllers/session.controller");
const validate = require("../middlewares/validate");
const {
  signupSchema,
  loginSchema,
  sendEmailCodeSchema,
  verifyEmailCodeSchema,
  resetPasswordSchema,
} = require("../validations/auth.validation");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.post("/signup", validate(signupSchema), authController.signup);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);
router.post("/session", sessionController.adoptToken);

router.post("/email/send-code", validate(sendEmailCodeSchema), authController.sendSignupCode);
router.post("/email/verify-code", validate(verifyEmailCodeSchema), authController.verifySignupCode);
router.post("/password/forgot", validate(sendEmailCodeSchema), authController.sendResetCode);
router.post("/password/reset", validate(resetPasswordSchema), authController.resetPassword);

router.get("/github", authController.githubStart);
router.get("/github/callback", authController.githubCallback);
router.get("/google", authController.googleStart);

module.exports = router;