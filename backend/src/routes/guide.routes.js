
const express = require("express");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const guideController = require("../controllers/guide.controller");
const validate = require("../middlewares/validate");

const router = express.Router();

const askGuestSchema = z.object({
  body: z.object({
    question: z.string().trim().min(3, "Ask a short question").max(500),
  }),
});

const guestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 30 : 8,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    message: "Too many questions from this network. Try again in 15 minutes.",
  },
});

router.post("/ask", guestLimiter, validate(askGuestSchema), guideController.askGuest);

module.exports = router;