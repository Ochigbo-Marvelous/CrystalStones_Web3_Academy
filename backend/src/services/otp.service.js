const crypto = require("crypto");
const path = require("path");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const { sendMail } = require("./mail.service");

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const TICKET_TTL = "10m";
const BRAND = "Crystal Web3 Academy";
const LOGO_PATH = path.resolve(
  __dirname,
  "../../../frontend/src/assets/brand/crystal-hero-hex.png"
);

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

const codeHtml = (line, code) => `<div style="margin:0;padding:24px;background:#070b14;font-family:Arial,Helvetica,sans-serif;color:#d7e6ff;">
  <div style="max-width:480px;margin:0 auto;text-align:left;">
    <img src="cid:crystal-logo" alt="${BRAND}" width="72" height="72" style="display:block;margin:0 0 18px 0;border:0;" />
    <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:#d7e6ff;">${line}</p>
    <p style="margin:0 0 6px;font-size:13px;color:#9aa8bd;">Your code:</p>
    <p style="margin:0 0 16px;font-size:28px;letter-spacing:4px;font-weight:700;color:#ffffff;">${code}</p>
    <p style="margin:0 0 24px;font-size:13px;color:#9aa8bd;">This code expires in 10 minutes.</p>
    <p style="margin:0;font-size:12px;color:#8b97ad;">${BRAND}</p>
  </div>
</div>`;

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
    text: `${line}\n\nYour code: ${code}\nThis code expires in 10 minutes.\n\n${BRAND}`,
    html: codeHtml(line, code),
    attachments: [
      {
        filename: "crystal-hero-hex.png",
        path: LOGO_PATH,
        cid: "crystal-logo",
      },
    ],
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