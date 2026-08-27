const express = require("express");
const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate");
const { signupSchema, loginSchema } = require("../validations/auth.validation");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.post("/signup", validate(signupSchema), authController.signup);
router.post("/login", validate(loginSchema), authController.login);
router.get("/me", protect, authController.getMe);

router.get("/github", authController.githubStart);
router.get("/github/callback", authController.githubCallback);
router.get("/google", authController.googleStart);

module.exports = router;