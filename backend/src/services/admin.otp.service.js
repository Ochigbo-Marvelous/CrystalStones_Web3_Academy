const crypto = require("crypto");
const dns = require("dns");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const { setAdminCookie, clearAdminCookie } = require("../utils/sessionCookie");

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* node < 17 */
}

const mailer = () => {
  const user =
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.MAIL_USER ||
    process.env.EMAIL_FROM;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.MAIL_PASS;
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST;
  if (!user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const shared = {
    family: 4,
    auth: { user, pass },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  };

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465 || String(process.env.SMTP_SECURE || "") === "true",
      ...shared,
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    ...shared,
  });
};

const hashCode = (code) =>
  crypto.createHash("sha256").update(`${code}:${process.env.JWT_SECRET || "otp"}`).digest("hex");

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_otp (
      user_id INT NOT NULL,
      code_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id)
    )
  `);
};

const deliver = async (to, code) => {
  const text = `Your Crystal Web3 Academy admin code is ${code}. It expires in 10 minutes.\nIf you did not request this, change your password.`;

  try {
    const authService = require("./auth.service");
    if (typeof authService.sendMail === "function") {
      await authService.sendMail({
        to,
        subject: "Crystal Web3 Academy admin code",
        text,
      });
      return;
    }
    if (typeof authService.sendEmail === "function") {
      await authService.sendEmail(to, "Crystal Web3 Academy admin code", text);
      return;
    }
  } catch (err) {
    if (!/Cannot find module/.test(String(err.message))) {
      console.error("ADMIN_OTP_AUTH_MAIL", err.message);
    }
  }

  const from =
    process.env.MAIL_FROM ||
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER;
  const transport = mailer();
  if (!transport || !from) {
    throw new ApiError(
      500,
      "Admin email is not configured. Use the same EMAIL_USER / EMAIL_PASS as signup codes."
    );
  }

  await transport.sendMail({
    from,
    to,
    subject: "Crystal Web3 Academy admin code",
    text,
  });
};

const consoleFallbackOk = () =>
  process.env.ADMIN_OTP_CONSOLE === "true" || process.env.NODE_ENV === "development";

const sendAdminOtp = async (user) => {
  if (!user?.email) throw new ApiError(400, "Admin account has no email");

  await ensureTable();
  const code = String(crypto.randomInt(100000, 1000000));
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `INSERT INTO admin_otp (user_id, code_hash, expires_at, attempts)
     VALUES (?, ?, ?, 0)
     ON DUPLICATE KEY UPDATE code_hash = VALUES(code_hash), expires_at = VALUES(expires_at), attempts = 0`,
    [user.id, hashCode(code), expires]
  );

  const masked = String(user.email).replace(/(.{2}).+(@.+)/, "$1***$2");

  try {
    await deliver(user.email, code);
  } catch (err) {
    if (err instanceof ApiError && !consoleFallbackOk()) throw err;
    console.error("ADMIN_OTP_MAIL", err.message || err);
    if (!consoleFallbackOk()) {
      throw new ApiError(500, "Could not send the admin code. Check email settings.");
    }
    console.warn(
      `\n======== ADMIN OTP (email failed, console fallback) ========\n${user.email}\nCODE: ${code}\nValid 10 minutes. Not for production.\n============================================================\n`
    );
    return { sent: true, email: masked, via: "console" };
  }

  try {
    const securityLogger = require("../utils/securityLogger");
    await securityLogger("ADMIN_OTP_SEND", { userId: user.id });
  } catch {
    /* ignore */
  }

  return { sent: true, email: masked };
};

const verifyAdminOtp = async (user, rawCode, res) => {
  await ensureTable();
  const code = String(rawCode || "").replace(/\D/g, "").slice(0, 6);
  if (code.length !== 6) throw new ApiError(400, "Enter the 6-digit code");

  const [rows] = await pool.query("SELECT * FROM admin_otp WHERE user_id = ? LIMIT 1", [user.id]);
  const row = rows[0];
  if (!row) throw new ApiError(400, "Request a new code");
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new ApiError(400, "Code expired. Request a new one");
  }
  if (Number(row.attempts) >= 5) {
    throw new ApiError(429, "Too many attempts. Request a new code");
  }

  if (row.code_hash !== hashCode(code)) {
    await pool.query("UPDATE admin_otp SET attempts = attempts + 1 WHERE user_id = ?", [user.id]);
    throw new ApiError(400, "Wrong code");
  }

  await pool.query("DELETE FROM admin_otp WHERE user_id = ?", [user.id]);
  const token = jwt.sign({ id: user.id, purpose: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "12h",
  });
  setAdminCookie(res, token);
  try {
    const securityLogger = require("../utils/securityLogger");
    await securityLogger("ADMIN_OTP_OK", { userId: user.id });
  } catch {
    /* ignore */
  }
  return { ok: true };
};

const clearAdminStep = (res) => clearAdminCookie(res);

module.exports = { sendAdminOtp, verifyAdminOtp, clearAdminStep };