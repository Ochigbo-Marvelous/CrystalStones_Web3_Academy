const express = require("express");
const rateLimit = require("express-rate-limit");
const leaderboardController = require("../controllers/leaderboard.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

const boardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 60 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `board-user:${req.user?.id || req.ip}`,
  validate: false,
  message: {
    success: false,
    message: "Too many leaderboard requests. Try again in a minute.",
  },
});

router.use(protect);
router.get("/", boardLimiter, leaderboardController.getLeaderboard);

module.exports = router;