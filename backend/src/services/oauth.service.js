const crypto = require("crypto");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const securityLogger = require("../utils/securityLogger");

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";

const safeUsername = async (base) => {
  const cleaned = String(base || "user")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24) || "user";

  let username = cleaned;
  let i = 0;

  while (true) {
    const [rows] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    if (rows.length === 0) return username;
    i += 1;
    username = `${cleaned}${i}`;
  }
};

const upsertOauthUser = async ({ provider, providerId, fullName, email, usernameHint, avatar }) => {
  if (!email) {
    throw new ApiError(400, `${provider} did not provide an email`);
  }

  const [byProvider] = await pool.query(
    "SELECT * FROM users WHERE provider = ? AND provider_id = ?",
    [provider, String(providerId)]
  );

  if (byProvider.length > 0) {
    const user = byProvider[0];
    delete user.password;
    await securityLogger("OAUTH_LOGIN", { userId: user.id, provider });
    return { user, token: generateToken(user.id) };
  }

  const [byEmail] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

  if (byEmail.length > 0) {
    const user = byEmail[0];
    await pool.query(
      "UPDATE users SET provider = ?, provider_id = ?, avatar = COALESCE(avatar, ?) WHERE id = ?",
      [provider, String(providerId), avatar || null, user.id]
    );
    delete user.password;
    await securityLogger("OAUTH_LINKED", { userId: user.id, provider });
    return { user, token: generateToken(user.id) };
  }

  const username = await safeUsername(usernameHint);
  const [result] = await pool.query(
    `INSERT INTO users (full_name, username, email, password, provider, provider_id, avatar)
     VALUES (?, ?, ?, NULL, ?, ?, ?)`,
    [fullName || username, username, email, provider, String(providerId), avatar || null]
  );

  const [users] = await pool.query(
    `SELECT id, full_name, username, email, avatar, role, current_rank, created_at
     FROM users WHERE id = ?`,
    [result.insertId]
  );

  await securityLogger("OAUTH_SIGNUP", { userId: users[0].id, provider });
  return { user: users[0], token: generateToken(users[0].id) };
};

const githubAuthUrl = () => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) throw new ApiError(500, "GitHub login is not configured");

  const state = crypto.randomBytes(16).toString("hex");
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${backendUrl}/api/auth/github/callback`);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  return { url: url.toString(), state };
};

const githubCallback = async (code) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new ApiError(500, "GitHub login is not configured");
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${backendUrl}/api/auth/github/callback`,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new ApiError(401, "GitHub authorization failed");
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "crystal-stones-academy",
    },
  });
  const ghUser = await userRes.json();

  const emailRes = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "crystal-stones-academy",
    },
  });
  const emails = await emailRes.json();
  const primary = Array.isArray(emails)
    ? emails.find((item) => item.primary && item.verified) || emails.find((item) => item.verified)
    : null;

  return upsertOauthUser({
    provider: "github",
    providerId: ghUser.id,
    fullName: ghUser.name || ghUser.login,
    email: primary?.email || ghUser.email,
    usernameHint: ghUser.login,
    avatar: ghUser.avatar_url,
  });
};

const redirectWithToken = (token) =>
  `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`;

module.exports = {
  githubAuthUrl,
  githubCallback,
  redirectWithToken,
};