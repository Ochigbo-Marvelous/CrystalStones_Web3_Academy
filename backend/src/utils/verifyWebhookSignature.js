const crypto = require("crypto");
const ApiError = require("./ApiError");

/**
 * Verify HMAC SHA-256 signature over the raw request body.
 * Expected header format: hex digest of HMAC(secret, rawBody)
 */
const verifyWebhookSignature = (req, signatureHeader = "x-signature") => {
  const signature = req.headers[signatureHeader];
  const secret = process.env.PAYNOVAX_WEBHOOK_SECRET;

  if (!signature) {
    throw new ApiError(401, "Missing webhook signature");
  }

  if (!secret) {
    throw new ApiError(500, "Webhook secret not configured");
  }

  if (!req.rawBody) {
    throw new ApiError(400, "Raw body unavailable for signature verification");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new ApiError(401, "Invalid webhook signature");
  }
};

module.exports = verifyWebhookSignature;