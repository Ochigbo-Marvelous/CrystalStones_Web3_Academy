
const nodemailer = require("nodemailer");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const securityLogger = require("../utils/securityLogger");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (raw) =>
  String(raw || "")
    .trim()
    .toLowerCase()
    .slice(0, 120);

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      email VARCHAR(191) NOT NULL,
      ip VARCHAR(64) DEFAULT NULL,
      user_agent VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_newsletter_email (email)
    )
  `);
};

const mailer = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "") === "true",
    auth: { user, pass },
  });
};

const notify = async (email) => {
  const to = process.env.NEWSLETTER_TO || process.env.MAIL_TO || process.env.EMAIL_FROM;
  const from = process.env.MAIL_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER;
  const transport = mailer();
  if (!to || !from || !transport) return false;

  await transport.sendMail({
    from,
    to,
    subject: `Academy newsletter: ${email}`,
    text: `${email} subscribed to the Crystal Web3 Academy newsletter.`,
  });
  return true;
};

const subscribe = async (rawEmail, meta = {}) => {
  const email = normalizeEmail(rawEmail);
  if (!EMAIL_RE.test(email)) {
    throw new ApiError(400, "Enter a valid email");
  }

  await ensureTable();

  const [result] = await pool.query(
    `INSERT IGNORE INTO newsletter_subscribers (email, ip, user_agent)
     VALUES (?, ?, ?)`,
    [email, meta.ip || null, String(meta.userAgent || "").slice(0, 255) || null]
  );

  const isNew = Number(result.affectedRows) > 0;

  await securityLogger("NEWSLETTER_SUBSCRIBE", {
    email: email.slice(0, 80),
    isNew,
  });

  if (isNew) {
    try {
      await notify(email);
    } catch (err) {
      console.error("NEWSLETTER_MAIL_FAIL", err.message || err);
    }
  }

  return {
    email,
    isNew,
    message: isNew ? "You're on the list." : "You're already on the list.",
  };
};

module.exports = { subscribe };