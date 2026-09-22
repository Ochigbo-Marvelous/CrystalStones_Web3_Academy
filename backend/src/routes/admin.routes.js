const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect, requireAdmin, requireAdmin2fa } = require("../middlewares/auth");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 400 : 80,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `admin:${req.user?.id || req.ip}`,
  validate: false,
  message: {
    success: false,
    message: "Too many admin requests. Try again later.",
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 20 : 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `admin-otp:${req.user?.id || req.ip}`,
  validate: false,
  message: {
    success: false,
    message: "Too many admin codes. Try again in 15 minutes.",
  },
});

router.post("/otp/send", protect, requireAdmin, otpLimiter, adminController.sendOtp);
router.post("/otp/verify", protect, requireAdmin, otpLimiter, adminController.verifyOtp);

router.use(protect, requireAdmin, requireAdmin2fa, adminLimiter);

router.get("/overview", adminController.overview);
router.get("/users", adminController.users);
router.get("/tracks", adminController.tracks);
router.get("/certificates", adminController.certificates);

module.exports = router;