const express = require("express");
const rateLimit = require("express-rate-limit");
const paymentController = require("../controllers/payment.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 20 : 8,
  message: { success: false, message: "Too many payment requests. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `pay-create:${req.user?.id || req.ip}`,
  validate: false,
});

const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 40 : 10,
  message: { success: false, message: "Too many payment checks. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `pay-sync:${req.user?.id || req.ip}`,
  validate: false,
});

router.post("/webhook/nowpayments", paymentController.handleWebhook);
router.get("/access", protect, paymentController.getAccess);
router.post("/track/:track", protect, createLimiter, paymentController.createTrackOrder);
router.post("/create/:courseId", protect, createLimiter, paymentController.createPaymentOrder);
router.get("/:orderId", protect, paymentController.getPaymentOrder);
router.post("/:orderId/sync", protect, syncLimiter, paymentController.syncPaymentOrder);

module.exports = router;