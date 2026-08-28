const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const { sendMail } = require("./mail.service");

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const TICKET_TTL = "10m";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const hashCode = (email, purpose, code) =>
  crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}:${purpose}:${code}:${process.env.JWT_SECRET}`)
    .digest("hex");

const issueTicket = (email, purpose) =>
  jwt.sign({ email: normalizeEmail(email), purpose }, process.env.JWT_SECRET, {
    expiresIn: TICKET_TTL,
  });

const readTicket = (ticket, purpose) => {
  try {
    const decoded = jwt.verify(ticket, process.env.JWT_SECRET);
    if (decoded.purpose !== purpose || !decoded.email) {
      throw new Error("bad ticket");
    }
    return decoded;
  } catch {
    throw new ApiError(401, "Email verification expired. Request a new code.");
  }
};

const sendCode = async ({ email, purpose, subject, line }) => {
  const normalized = normalizeEmail(email);

  const [recent] = await pool.query(
    `SELECT created_at FROM email_verifications
     WHERE email = ? AND purpose = ?
     ORDER BY id DESC LIMIT 1`,
    [normalized, purpose]
  );

  if (recent[0] && Date.now() - new Date(recent[0].created_at).getTime() < RESEND_MS) {
    throw new ApiError(429, "Wait 60 seconds before requesting another code");
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await pool.query(
    `INSERT INTO email_verifications (email, purpose, code_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [normalized, purpose, hashCode(normalized, purpose, code), expiresAt]
  );

  await sendMail({
    to: normalized,
    subject,
    text: `${line}\n\nYour code: ${code}\nThis code expires in 10 minutes.\n\nCrystal Stones Academy`,
  });

  return { expiresInSeconds: 600 };
};

const verifyCode = async ({ email, purpose, code }) => {
  const normalized = normalizeEmail(email);
  const cleanCode = String(code || "").trim();

  if (!/^\d{6}$/.test(cleanCode)) {
    throw new ApiError(400, "Enter the 6-digit code");
  }

  const [rows] = await pool.query(
    `SELECT * FROM email_verifications
     WHERE email = ? AND purpose = ? AND consumed_at IS NULL
     ORDER BY id DESC LIMIT 1`,
    [normalized, purpose]
  );

  const row = rows[0];
  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    throw new ApiError(400, "Invalid or expired code");
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    throw new ApiError(400, "Too many attempts. Request a new code");
  }

  await pool.query("UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?", [row.id]);

  if (row.code_hash !== hashCode(normalized, purpose, cleanCode)) {
    throw new ApiError(400, "Invalid or expired code");
  }

  await pool.query("UPDATE email_verifications SET consumed_at = NOW() WHERE id = ?", [row.id]);
  return { email: normalized, ticket: issueTicket(normalized, purpose) };
};

module.exports = { sendCode, verifyCode, readTicket, normalizeEmail };