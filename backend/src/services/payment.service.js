const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const securityLogger = require("../utils/securityLogger");
const nowpayments = require("./nowpayments.client");

const PAID_STATUSES = new Set(["finished", "confirmed"]);
const EXPIRED_STATUSES = new Set(["expired", "failed", "refunded"]);
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

const hasColumn = async (column) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS ok
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'payment_orders'
       AND COLUMN_NAME = ?`,
    [column]
  );
  return Number(rows[0].ok) > 0;
};

const checkoutView = (order) => ({
  ...order,
  network: "BNB Smart Chain (BEP-20)",
  asset: "USDT",
  warning:
    "Send only USDT via BNB Smart Chain BEP-20. Sending funds on another network may result in loss.",
});

const createPaymentOrder = async (userId, courseId) => {
  if (!Number.isInteger(courseId) || courseId <= 0) {
    throw new ApiError(400, "Invalid course id");
  }

  const [courses] = await pool.query(
    "SELECT * FROM courses WHERE id = ? AND is_published = TRUE",
    [courseId]
  );
  if (courses.length === 0) throw new ApiError(404, "Course not found");

  const course = courses[0];
  if (!course.is_paid) {
    throw new ApiError(400, "This course is free. No payment required.");
  }

  const [existingEnrollment] = await pool.query(
    "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
    [userId, courseId]
  );
  if (existingEnrollment.length > 0) {
    throw new ApiError(409, "You are already enrolled in this course");
  }

  const amountUsd = Number(course.price_usd);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new ApiError(400, "Course price is invalid");
  }

  const [existingOrder] = await pool.query(
    `SELECT * FROM payment_orders
     WHERE user_id = ? AND course_id = ? AND status = 'pending'
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY id DESC
     LIMIT 1`,
    [userId, courseId]
  );

  if (existingOrder.length > 0 && existingOrder[0].payment_address) {
    if (Number(existingOrder[0].amount_usd) === amountUsd) {
      return checkoutView(existingOrder[0]);
    }

    await pool.query(
      "UPDATE payment_orders SET status = 'expired' WHERE id = ? AND status = 'pending'",
      [existingOrder[0].id]
    );
  }

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const supportsUsdt = await hasColumn("amount_usdt");

  const [result] = await pool.query(
    supportsUsdt
      ? `INSERT INTO payment_orders
         (user_id, course_id, amount_usd, amount_usdt, pay_currency, status, provider, expires_at)
         VALUES (?, ?, ?, NULL, 'USDTBSC', 'pending', 'nowpayments', ?)`
      : `INSERT INTO payment_orders
         (user_id, course_id, amount_usd, status, provider, expires_at)
         VALUES (?, ?, ?, 'pending', 'nowpayments', ?)`,
    supportsUsdt
      ? [userId, courseId, amountUsd, expiresAt]
      : [userId, courseId, amountUsd, expiresAt]
  );

  const orderId = result.insertId;

  let payment;
  try {
    payment = await nowpayments.createUsdtBscPayment({
      priceUsd: amountUsd,
      orderId,
      description: `Course: ${course.title}`,
      ipnUrl: `${BACKEND_URL}/api/payments/webhook/nowpayments`,
    });
  } catch (error) {
    await pool.query("DELETE FROM payment_orders WHERE id = ? AND status = 'pending'", [orderId]);
    throw error;
  }

  const usdtAmount = Number(payment.pay_amount || 0);
  const providerId = String(payment.payment_id);
  const address = payment.pay_address || null;
  const providerExpiry = payment.expiration_estimate_date
    ? new Date(payment.expiration_estimate_date)
    : expiresAt;

  if (supportsUsdt) {
    await pool.query(
      `UPDATE payment_orders
       SET amount_usdt = ?, pay_currency = ?, provider_order_id = ?, payment_address = ?, expires_at = ?
       WHERE id = ?`,
      [usdtAmount, "USDTBSC", providerId, address, providerExpiry, orderId]
    );
  } else {
    await pool.query(
      `UPDATE payment_orders
       SET amount_crystal = ?, crystal_rate_used = ?, provider_order_id = ?, payment_address = ?, expires_at = ?
       WHERE id = ?`,
      [usdtAmount, amountUsd / (usdtAmount || 1), providerId, address, providerExpiry, orderId]
    );
  }

  await securityLogger("PAYMENT_ORDER_CREATED", {
    userId,
    orderId,
    courseId,
    amountUsd,
    amountUsdt: usdtAmount,
    provider: "nowpayments",
    providerOrderId: providerId,
  });

  const [orders] = await pool.query("SELECT * FROM payment_orders WHERE id = ?", [orderId]);
  return checkoutView(orders[0]);
};

const getPaymentOrder = async (userId, orderId) => {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new ApiError(400, "Invalid order id");
  }

  const [orders] = await pool.query(
    `SELECT po.*, c.title AS course_title, c.slug AS course_slug
     FROM payment_orders po
     JOIN courses c ON po.course_id = c.id
     WHERE po.id = ? AND po.user_id = ?`,
    [orderId, userId]
  );

  if (orders.length === 0) throw new ApiError(404, "Payment order not found");
  return checkoutView(orders[0]);
};

const markOrderAsPaid = async (orderId, txHash = null) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      "SELECT * FROM payment_orders WHERE id = ? FOR UPDATE",
      [orderId]
    );
    if (orders.length === 0) throw new ApiError(404, "Payment order not found");

    const order = orders[0];
    if (order.status === "paid") {
      await connection.commit();
      return { alreadyPaid: true, order };
    }
    if (order.status !== "pending") {
      throw new ApiError(400, `Cannot mark order as paid. Current status: ${order.status}`);
    }

    await connection.query(
      `UPDATE payment_orders
       SET status = 'paid', tx_hash = ?, paid_at = NOW()
       WHERE id = ?`,
      [txHash, orderId]
    );

    const [existingEnrollment] = await connection.query(
      "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
      [order.user_id, order.course_id]
    );

    if (existingEnrollment.length === 0) {
      await connection.query(
        `INSERT INTO enrollments (user_id, course_id, status, progress_percent)
         VALUES (?, ?, 'active', 0)`,
        [order.user_id, order.course_id]
      );
    }

    await connection.commit();

    await securityLogger("PAYMENT_PAID", {
      userId: order.user_id,
      orderId: order.id,
      courseId: order.course_id,
      txHash,
    });

    return { alreadyPaid: false, order };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const coverEnough = (expected, received) => {
  const need = Number(expected);
  const got = Number(received);
  if (!Number.isFinite(need) || need <= 0) return false;
  if (!Number.isFinite(got)) return false;
  return got + 1e-8 >= need * 0.995;
};

const processProviderStatus = async ({
  orderId,
  providerStatus,
  paidAmount,
  expectedAmount,
  txHash,
}) => {
  const status = String(providerStatus || "").toLowerCase();

  if (EXPIRED_STATUSES.has(status)) {
    await pool.query(
      `UPDATE payment_orders
       SET status = 'expired'
       WHERE id = ? AND status = 'pending'`,
      [orderId]
    );
    return { processed: true, enrolled: false, status };
  }

  if (!PAID_STATUSES.has(status)) {
    return { processed: true, enrolled: false, status };
  }

  if (!coverEnough(expectedAmount, paidAmount)) {
    await securityLogger("PAYMENT_UNDERPAID", {
      orderId,
      expectedAmount,
      paidAmount,
      providerStatus: status,
    });
    throw new ApiError(400, "Payment amount does not cover the course price");
  }

  const result = await markOrderAsPaid(orderId, txHash);
  return { processed: true, enrolled: !result.alreadyPaid, status: "paid" };
};

const handleNowPaymentsIpn = async (payload) => {
  const orderId = Number(payload.order_id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new ApiError(400, "Invalid NOWPayments order_id");
  }

  const [orders] = await pool.query("SELECT * FROM payment_orders WHERE id = ?", [orderId]);
  if (orders.length === 0) {
    await securityLogger("PAYMENT_IPN_UNKNOWN_ORDER", {
      orderId,
      paymentId: payload.payment_id,
    });
    return { processed: false, reason: "order_not_found" };
  }

  const order = orders[0];

  if (
    payload.payment_id &&
    order.provider_order_id &&
    String(payload.payment_id) !== String(order.provider_order_id)
  ) {
    throw new ApiError(401, "Payment id does not match this order");
  }

  if (
    String(payload.pay_currency || "").toLowerCase() &&
    String(payload.pay_currency).toLowerCase() !== "usdtbsc"
  ) {
    throw new ApiError(400, "Unsupported payment network");
  }

  const expected = order.amount_usdt || order.amount_crystal || payload.pay_amount;
  const received = payload.actually_paid || payload.pay_amount;

  return processProviderStatus({
    orderId,
    providerStatus: payload.payment_status,
    paidAmount: received,
    expectedAmount: expected,
    txHash:
      payload.outcome_hash ||
      payload.payin_hash ||
      payload.purchase_id ||
      String(payload.payment_id),
  });
};

const syncPaymentOrder = async (userId, orderId) => {
  const order = await getPaymentOrder(userId, orderId);
  if (order.status === "paid") return checkoutView(order);
  if (!order.provider_order_id) {
    throw new ApiError(400, "Payment has not been created with NOWPayments");
  }

  const payment = await nowpayments.getPayment(order.provider_order_id);
  await processProviderStatus({
    orderId: order.id,
    providerStatus: payment.payment_status,
    paidAmount: payment.actually_paid || payment.pay_amount,
    expectedAmount: order.amount_usdt || order.amount_crystal || payment.pay_amount,
    txHash: payment.outcome_hash || payment.purchase_id || String(payment.payment_id),
  });

  return getPaymentOrder(userId, orderId);
};

const expireOldOrders = async () => {
  await pool.query(
    `UPDATE payment_orders
     SET status = 'expired'
     WHERE status = 'pending' AND expires_at < NOW()`
  );
};

module.exports = {
  createPaymentOrder,
  getPaymentOrder,
  markOrderAsPaid,
  handleNowPaymentsIpn,
  syncPaymentOrder,
  expireOldOrders,
};