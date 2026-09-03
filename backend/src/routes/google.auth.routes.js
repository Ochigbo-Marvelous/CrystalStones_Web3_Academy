
const express = require("express");
const rateLimit = require("express-rate-limit");
const oauth = require("../services/oauth.service");

const router = express.Router();

const googleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 40 : 12,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    message: "Too many Google sign-in attempts. Try again in 15 minutes.",
  },
});

router.get("/google", googleLimiter, (req, res, next) => {
  try {
    const { url } = oauth.googleAuthUrl();
    res.redirect(url);
  } catch (err) {
    next(err);
  }
});

router.get("/google/callback", googleLimiter, async (req, res) => {
  try {
    const { token } = await oauth.googleCallback(req.query.code);
    res.redirect(oauth.redirectWithToken(token));
  } catch (err) {
    res.redirect(oauth.redirectWithError(err.message || "Google sign-in failed"));
  }
});

module.exports = router;