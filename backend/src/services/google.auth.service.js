const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const config = require("../config");
const ApiError = require("../utils/ApiError");
const securityLogger = require("../utils/securityLogger");

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo";
const STATE_TTL_MS = 10 * 60 * 1000;
const states = new Map();

const clientId = () => String(process.env.GOOGLE_CLIENT_ID || "").trim();
const clientSecret = () => String(process.env.GOOGLE_CLIENT_SECRET || "").trim();
const callbackUrl = () =>
  String(process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || "http://localhost:5001"}/api/auth/google/callback`).trim();
const frontendUrl = () => {
  const raw = String(config.frontendUrl || process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  if (raw.includes(":5001")) return "http://localhost:5173";
  return raw || "http://localhost:5173";
};
const jwtSecret = () => config.jwtSecret || process.env.JWT_SECRET;
const jwtExpires = () => config.jwtExpiresIn || process.env.JWT_EXPIRES_IN || "7d";

const isConfigured = () =>
  clientId().includes(".apps.googleusercontent.com") && clientSecret().length > 8;

const hasColumn = async (table, column) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS ok
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0].ok) > 0;
};

const pruneStates = () => {
  const now = Date.now();
  for (const [key, row] of states) {
    if (row.exp < now) states.delete(key);
  }
};

const signToken = (userId) => {
  const secret = jwtSecret();
  if (!secret) throw new ApiError(500, "JWT secret is not configured");
  return jwt.sign({ id: userId }, secret, { expiresIn: jwtExpires() });
};

const publicUser = (row) => ({
  id: row.id,
  full_name: row.full_name,
  username: row.username,
  email: row.email,
  avatar: row.avatar,
  current_rank: row.current_rank || "Novice",
});

const slugify = (value) =>
  String(value || "learner")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18) || "learner";

const uniqueUsername = async (base) => {
  let candidate = base;
  for (let i = 0; i < 12; i += 1) {
    const [rows] = await pool.query("SELECT id FROM users WHERE username = ? LIMIT 1", [candidate]);
    if (rows.length === 0) return candidate;
    candidate = `${base}${Math.floor(10 + Math.random() * 89)}`;
  }
  return `${base}${Date.now().toString().slice(-4)}`;
};

const startGoogle = async () => {
  if (!isConfigured()) {
    throw new ApiError(503, "Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }
  pruneStates();
  const state = crypto.randomBytes(24).toString("hex");
  states.set(state, { exp: Date.now() + STATE_TTL_MS });
  const url = new URL(GOOGLE_AUTH);
  url.searchParams.set("client_id", clientId());
  url.searchParams.set("redirect_uri", callbackUrl());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("access_type", "online");
  return url.toString();
};

const googleTokens = async (code) => {
  const body = new URLSearchParams({
    code,
    client_id: clientId(),
    client_secret: clientSecret(),
    redirect_uri: callbackUrl(),
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new ApiError(401, "Google did not accept this sign-in. Try again.");
  }
  return json;
};

const googleProfile = async (accessToken) => {
  const res = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.email) {
    throw new ApiError(401, "Google did not return an email for this account.");
  }
  if (json.email_verified === false) {
    throw new ApiError(401, "That Google email is not verified.");
  }
  return json;
};

const upsertGoogleUser = async (profile) => {
  const email = String(profile.email).trim().toLowerCase();
  const googleId = String(profile.sub || "").slice(0, 64);
  const fullName = String(profile.name || email.split("@")[0]).slice(0, 80);
  const picture = String(profile.picture || "").slice(0, 500);
  const hasGoogleId = await hasColumn("users", "google_id");
  const hasProvider = await hasColumn("users", "auth_provider");
  const passCol = (await hasColumn("users", "password_hash")) ? "password_hash" : "password";

  if (hasGoogleId && googleId) {
    const [byGoogle] = await pool.query("SELECT * FROM users WHERE google_id = ? LIMIT 1", [googleId]);
    if (byGoogle[0]) {
      if (picture && (await hasColumn("users", "avatar")) && !byGoogle[0].avatar) {
        await pool.query("UPDATE users SET avatar = ? WHERE id = ?", [picture, byGoogle[0].id]);
        byGoogle[0].avatar = picture;
      }
      return byGoogle[0];
    }
  }

  const [byEmail] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  if (byEmail[0]) {
    const sets = [];
    const vals = [];
    if (hasGoogleId && googleId) {
      sets.push("google_id = ?");
      vals.push(googleId);
    }
    if (hasProvider) {
      sets.push("auth_provider = COALESCE(auth_provider, ?)");
      vals.push("google");
    }
    if (picture && (await hasColumn("users", "avatar")) && !byEmail[0].avatar) {
      sets.push("avatar = ?");
      vals.push(picture);
    }
    if (sets.length) {
      vals.push(byEmail[0].id);
      await pool.query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, vals);
    }
    return byEmail[0];
  }

  const username = await uniqueUsername(slugify(profile.given_name || email.split("@")[0]));
  const cols = ["full_name", "username", "email", passCol];
  const vals = [fullName, username, email, null];
  if (await hasColumn("users", "avatar")) {
    cols.push("avatar");
    vals.push(picture || null);
  }
  if (await hasColumn("users", "current_rank")) {
    cols.push("current_rank");
    vals.push("Novice");
  }
  if (hasGoogleId) {
    cols.push("google_id");
    vals.push(googleId || null);
  }
  if (hasProvider) {
    cols.push("auth_provider");
    vals.push("google");
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO users (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
      vals
    );
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [result.insertId]);
    return rows[0];
  } catch (err) {
    if (String(err.message || "").includes("password")) {
      const dummy = crypto.randomBytes(32).toString("hex");
      const idx = cols.indexOf(passCol);
      vals[idx] = dummy;
      const [result] = await pool.query(
        `INSERT INTO users (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
        vals
      );
      const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [result.insertId]);
      return rows[0];
    }
    throw err;
  }
};

const finishGoogle = async (code, state) => {
  if (!isConfigured()) throw new ApiError(503, "Google sign-in is not configured.");
  pruneStates();
  if (!state || !states.has(state)) throw new ApiError(401, "Google sign-in expired. Start again.");
  states.delete(state);
  if (!code) throw new ApiError(401, "Google did not return a code.");

  const tokens = await googleTokens(code);
  const profile = await googleProfile(tokens.access_token);
  const user = await upsertGoogleUser(profile);
  const token = signToken(user.id);

  await securityLogger("AUTH_GOOGLE", {
    userId: user.id,
    email: String(user.email || "").slice(0, 80),
  });

  return { token, user: publicUser(user) };
};

const frontendCallback = (token, error) => {
  const base = `${frontendUrl()}/auth/callback`;
  if (error) return `${base}?error=${encodeURIComponent(error)}`;
  return `${base}#token=${encodeURIComponent(token)}`;
};

module.exports = {
  isConfigured,
  startGoogle,
  finishGoogle,
  frontendCallback,
};