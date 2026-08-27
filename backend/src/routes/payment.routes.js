const express = require("express");
const rateLimit = require("express-rate-limit");
const paymentController = require("../controllers/payment.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many payment checks. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/create/:courseId", protect, paymentController.createPaymentOrder);
router.get("/:orderId", protect, paymentController.getPaymentOrder);
router.post("/:orderId/sync", protect, syncLimiter, paymentController.syncPaymentOrder);
router.post("/webhook/nowpayments", paymentController.handleWebhook);

module.exports = router;