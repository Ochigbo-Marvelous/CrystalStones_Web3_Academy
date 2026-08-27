const ApiError = require("../utils/ApiError");

const PAY_CURRENCY = (process.env.NOWPAYMENTS_PAY_CURRENCY || "usdtbsc").toLowerCase();

const baseUrl = () =>
  process.env.NOWPAYMENTS_SANDBOX === "true"
    ? "https://api-sandbox.nowpayments.io/v1"
    : "https://api.nowpayments.io/v1";

const apiKey = () => {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) throw new ApiError(500, "NOWPayments API key is not configured");
  return key;
};

const request = async (path, { method = "GET", body } = {}) => {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      "x-api-key": apiKey(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      502,
      data.message || data.error || "NOWPayments request failed"
    );
  }

  return data;
};

const createUsdtBscPayment = async ({ priceUsd, orderId, description, ipnUrl }) => {
  const payment = await request("/payment", {
    method: "POST",
    body: {
      price_amount: Number(priceUsd),
      price_currency: "usd",
      pay_currency: PAY_CURRENCY,
      order_id: String(orderId),
      order_description: description,
      ipn_callback_url: ipnUrl,
      is_fixed_rate: true,
    },
  });

  if (String(payment.pay_currency || "").toLowerCase() !== PAY_CURRENCY) {
    throw new ApiError(502, "NOWPayments returned a network other than USDT BEP-20");
  }

  return payment;
};

const getPayment = async (providerPaymentId) =>
  request(`/payment/${providerPaymentId}`);

module.exports = {
  PAY_CURRENCY,
  createUsdtBscPayment,
  getPayment,
};