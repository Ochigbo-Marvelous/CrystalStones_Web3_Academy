const asyncHandler = require("../utils/asyncHandler");
const paymentService = require("../services/payment.service");
const ApiError = require("../utils/ApiError");
const verifyWebhookSignature = require("../utils/verifyWebhookSignature");

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

const handleWebhook = asyncHandler(async (req, res) => {
  verifyWebhookSignature(req, "x-signature");

  const { orderId, txHash, status } = req.body;

  if (!orderId) {
    throw new ApiError(400, "orderId is required");
  }

  if (status === "paid" || status === "completed") {
    await paymentService.markOrderAsPaid(orderId, txHash || null);
  }

  res.status(200).json({
    success: true,
    message: "Webhook processed",
  });
});

module.exports = {
  createPaymentOrder,
  getPaymentOrder,
  handleWebhook,
};