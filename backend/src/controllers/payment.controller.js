const asyncHandler = require("../utils/asyncHandler");
const paymentService = require("../services/payment.service");
const verifyNowPaymentsSignature = require("../utils/verifyWebhookSignature");

const createPaymentOrder = asyncHandler(async (req, res) => {
  const courseId = Number(req.params.courseId);
  const order = await paymentService.createPaymentOrder(req.user.id, courseId);

  res.status(201).json({
    success: true,
    message: "Payment order created successfully",
    data: order,
  });
});

const getPaymentOrder = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.orderId);
  const order = await paymentService.getPaymentOrder(req.user.id, orderId);

  res.status(200).json({
    success: true,
    data: order,
  });
});

const syncPaymentOrder = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.orderId);
  const order = await paymentService.syncPaymentOrder(req.user.id, orderId);

  res.status(200).json({
    success: true,
    data: order,
  });
});

const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-nowpayments-sig"];
  verifyNowPaymentsSignature(req.body, signature);

  const result = await paymentService.handleNowPaymentsIpn(req.body);

  res.status(200).json({
    success: true,
    message: "Webhook processed",
    data: result,
  });
});

module.exports = {
  createPaymentOrder,
  getPaymentOrder,
  syncPaymentOrder,
  handleWebhook,
};