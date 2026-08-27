const crypto = require("crypto");
const ApiError = require("./ApiError");

const sortKeys = (value) => {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeys(value[key]);
        return acc;
      }, {});
  }
  return value;
};

const verifyNowPaymentsSignature = (payload, signature) => {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;

  if (!signature) {
    throw new ApiError(401, "Missing NOWPayments signature");
  }
  if (!secret) {
    throw new ApiError(500, "NOWPayments IPN secret is not configured");
  }
  if (!payload || typeof payload !== "object") {
    throw new ApiError(400, "Invalid webhook payload");
  }

  const signed = JSON.stringify(sortKeys(payload));
  const expected = crypto.createHmac("sha512", secret).update(signed).digest("hex");

  const received = Buffer.from(String(signature), "utf8");
  const computed = Buffer.from(expected, "utf8");

  if (received.length !== computed.length || !crypto.timingSafeEqual(received, computed)) {
    throw new ApiError(401, "Invalid NOWPayments signature");
  }
};

module.exports = verifyNowPaymentsSignature;