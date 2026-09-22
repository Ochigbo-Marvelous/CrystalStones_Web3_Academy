const express = require("express");
const rateLimit = require("express-rate-limit");
const oauth = require("../services/oauth.service");
const { setSessionCookie } = require("../utils/sessionCookie");

const router = express.Router();
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

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
    setSessionCookie(res, token);
    res.redirect(`${frontendUrl}/auth/callback#token=${encodeURIComponent(token)}`);
  } catch (err) {
    res.redirect(
      `${frontendUrl}/auth/callback?error=${encodeURIComponent(err.message || "Google sign-in failed")}`
    );
  }
});

module.exports = router;