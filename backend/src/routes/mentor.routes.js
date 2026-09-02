const express = require("express");
const rateLimit = require("express-rate-limit");
const mentorController = require("../controllers/mentor.controller");
const validate = require("../middlewares/validate");
const { askMentorSchema } = require("../validations/mentor.validation");
const { protect } = require("../middlewares/auth");

const router = express.Router();

const mentorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 40 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `mentor-user:${req.user?.id || req.ip}`,
  validate: false,
  message: {
    success: false,
    message: "Too many mentor questions. Try again in 15 minutes.",
  },
});

router.use(protect);
router.post("/ask", mentorLimiter, validate(askMentorSchema), mentorController.askMentor);

module.exports = router;