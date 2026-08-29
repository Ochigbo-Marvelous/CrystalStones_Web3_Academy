const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

const errorHandler = require("./middlewares/errorHandler");
const config = require("./config");

const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const moduleRoutes = require("./routes/module.routes");
const lessonRoutes = require("./routes/lesson.routes");
const brainTeaserRoutes = require("./routes/brainTeaser.routes");
const enrollmentRoutes = require("./routes/enrollment.routes");
const progressRoutes = require("./routes/progress.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const profileRoutes = require("./routes/profile.routes");
const achievementRoutes = require("./routes/achievement.routes");
const mentorRoutes = require("./routes/mentor.routes");
const paymentRoutes = require("./routes/payment.routes");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === "development" ? 2000 : 400,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health" || req.originalUrl === "/api/health",
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: {
    success: false,
    message: "Too many email requests. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/email/send-code", emailLimiter);
app.use("/api/auth/password/forgot", emailLimiter);

app.use(cookieParser());
app.use(
  express.json({
    limit: "10kb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Crystal Stones Academy API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/brain-teasers", brainTeaserRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/payments", paymentRoutes);

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

module.exports = app;