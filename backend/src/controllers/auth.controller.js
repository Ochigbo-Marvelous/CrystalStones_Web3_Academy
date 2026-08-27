const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");
const oauthService = require("../services/oauth.service");

const signup = asyncHandler(async (req, res) => {
  const { full_name, username, email, password } = req.body;
  const result = await authService.signup({ full_name, username, email, password });

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const { login, password } = req.body;
  const result = await authService.login({ login, password });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});

const githubStart = asyncHandler(async (req, res) => {
  const { url, state } = oauthService.githubAuthUrl();
  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
  });
  res.redirect(url);
});

const githubCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/signin?error=github_denied`);
  }
  if (!state || state !== req.cookies?.oauth_state) {
    return res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_state`);
  }

  const result = await oauthService.githubCallback(code);
  res.clearCookie("oauth_state");
  res.redirect(oauthService.redirectWithToken(result.token));
});

const googleStart = asyncHandler(async (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/signup?error=google_not_configured`);
});

module.exports = {
  signup,
  login,
  getMe,
  githubStart,
  githubCallback,
  googleStart,
};