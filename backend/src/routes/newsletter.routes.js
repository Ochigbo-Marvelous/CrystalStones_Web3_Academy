
const express = require("express");
const rateLimit = require("express-rate-limit");
const newsletterController = require("../controllers/newsletter.controller");
const validate = require("../middlewares/validate");
const { subscribeSchema } = require("../validations/newsletter.validation");

const router = express.Router();

const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 20 : 8,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    message: "Too many newsletter tries. Wait 15 minutes.",
  },
});

router.post("/", newsletterLimiter, validate(subscribeSchema), newsletterController.subscribe);

module.exports = router;