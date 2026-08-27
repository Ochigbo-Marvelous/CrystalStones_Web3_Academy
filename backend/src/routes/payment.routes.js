const express = require("express");
const paymentController = require("../controllers/payment.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

// Authenticated routes
router.post("/create/:courseId", protect, paymentController.createPaymentOrder);
router.get("/:orderId", protect, paymentController.getPaymentOrder);

// Webhook (public but protected by secret)
router.post("/webhook/paynovax", paymentController.handleWebhook);

module.exports = router;