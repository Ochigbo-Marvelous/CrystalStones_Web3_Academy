const nodemailer = require("nodemailer");
const ApiError = require("../utils/ApiError");

const transporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendMail = async ({ to, subject, text }) => {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const mailer = transporter();

  if (!mailer) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError(500, "Email is not configured");
    }
    console.log(`[DEV EMAIL] to=${to} subject=${subject}\n${text}`);
    return;
  }

  await mailer.sendMail({ from, to, subject, text });
};

module.exports = { sendMail };