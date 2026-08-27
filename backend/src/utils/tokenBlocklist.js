const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const blockToken = async (token) => {
  const decoded = jwt.decode(token);
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 30 * 60 * 1000);

  await pool.query(
    `INSERT IGNORE INTO token_blocklist (token_hash, expires_at)
     VALUES (?, ?)`,
    [hashToken(token), expiresAt]
  );
};

const isBlocked = async (token) => {
  const [rows] = await pool.query(
    "SELECT id FROM token_blocklist WHERE token_hash = ? AND expires_at > NOW()",
    [hashToken(token)]
  );
  return rows.length > 0;
};

module.exports = { blockToken, isBlocked };