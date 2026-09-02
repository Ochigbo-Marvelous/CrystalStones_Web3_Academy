const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const securityLogger = require("../utils/securityLogger");
const nowpayments = require("./nowpayments.client");

const PAID_STATUSES = new Set(["finished", "confirmed"]);
const EXPIRED_STATUSES = new Set(["expired", "failed", "refunded"]);
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

const TRACKS = {
  intermediate: {
    key: "intermediate",
    level: "intermediate",
    title: "Intermediate Track",
    live: true,
    priceUsd: () => {
      const n = Number(process.env.INTERMEDIATE_PRICE_USD || 10);
      return Number.isFinite(n) && n > 0 ? n : 10;
    },
  },
  advanced: {
    key: "advanced",
    level: "advanced",
    title: "Advanced Track",
    live: false,
    priceUsd: () => null,
  },
};

let schemaReady = false;

const hasColumn = async (table, column) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS ok
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0].ok) > 0;
};

const hasPaymentColumn = (column) => hasColumn("payment_orders", column);

const ensureSchema = async () => {
  if (schemaReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_track_access (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT NOT NULL,
      track VARCHAR(32) NOT NULL,
      payment_order_id INT NULL,
      granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_track (user_id, track)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  if (!(await hasPaymentColumn("track"))) {
    await pool.query("ALTER TABLE payment_orders ADD COLUMN track VARCHAR(32) NULL");
    await pool.query("ALTER TABLE payment_orders ADD INDEX idx_payment_track (track)");
  }

  const price = TRACKS.intermediate.priceUsd();
  await pool.query(
    `UPDATE courses
     SET is_paid = 1, price_usd = ?
     WHERE level = 'intermediate' AND is_published = TRUE`,
    [price]
  );

  schemaReady = true;
};

const checkoutView = (order) => ({
  ...order,
  track: order.track || null,
  track_title: TRACKS[order.track]?.title || order.course_title || "Course",
  network: "BNB Smart Chain (BEP-20)",
  asset: "USDT",
  warning:
    "Send only USDT via BNB Smart Chain BEP-20. Sending funds on another network may result in loss. This is not a Crystal Stones token payment.",
});

const resolveTrack = (name) => {
  const track = TRACKS[String(name || "").toLowerCase()];
  if (!track) throw new ApiError(400, "Unknown track");
  if (!track.live) throw new ApiError(403, "This track is not available yet");
  const amountUsd = track.priceUsd();
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new ApiError(400, "Track price is invalid");
  }
  return { ...track, amountUsd };
};

const userOwnsTrack = async (userId, trackKey) => {
  await ensureSchema();
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) return false;

  const [entitled] = await pool.query(
    "SELECT id FROM user_track_access WHERE user_id = ? AND track = ? LIMIT 1",
    [uid, trackKey]
  );
  if (entitled.length) return true;

  const [paid] = await pool.query(
    `SELECT id FROM payment_orders
     WHERE user_id = ? AND track = ? AND status = 'paid'
     LIMIT 1`,
    [uid, trackKey]
  );
  return paid.length > 0;
};

const grantTrackAccess = async (connection, userId, trackKey, orderId) => {
  await connection.query(
    `INSERT INTO user_track_access (user_id, track, payment_order_id)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE payment_order_id = VALUES(payment_order_id)`,
    [userId, trackKey, orderId]
  );
};

const enrollTrackCourses = async (connection, userId, trackKey) => {
  const track = TRACKS[trackKey];
  if (!track) return;
  const [rows] = await connection.query(
    "SELECT id FROM courses WHERE level = ? AND is_published = TRUE",
    [track.level]
  );
  for (const row of rows) {
    await connection.query(
      `INSERT INTO enrollments (user_id, course_id, status, progress_percent)
       SELECT ?, ?, 'active', 0
       FROM DUAL
       WHERE NOT EXISTS (
         SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?
       )`,
      [userId, row.id, userId, row.id]
    );
  }
};

const fulfillTrack = async (userId, trackKey) => {
  if (!TRACKS[trackKey]) return;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await enrollTrackCourses(connection, userId, trackKey);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const pickAnchorCourseId = async (trackKey) => {
  const track = TRACKS[trackKey];
  const [own] = await pool.query(
    `SELECT id FROM courses
     WHERE level = ? AND is_published = TRUE
     ORDER BY id ASC
     LIMIT 1`,
    [track.level]
  );
  if (own.length) return own[0].id;

  const [any] = await pool.query(
    `SELECT id FROM courses WHERE is_published = TRUE ORDER BY id ASC LIMIT 1`
  );
  if (!any.length) throw new ApiError(409, "No published courses available to attach this payment");
  return any[0].id;
};

const createTrackOrder = async (userId, trackKey) => {
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) throw new ApiError(401, "Not authorized");

  await ensureSchema();
  const track = resolveTrack(trackKey);

  if (await userOwnsTrack(uid, track.key)) {
    await fulfillTrack(uid, track.key);
    throw new ApiError(409, "You already have this track");
  }

  const [existingOrder] = await pool.query(
    `SELECT * FROM payment_orders
     WHERE user_id = ? AND track = ? AND status = 'pending'
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY id DESC
     LIMIT 1`,
    [uid, track.key]
  );

  if (existingOrder.length > 0 && existingOrder[0].payment_address) {
    if (Number(existingOrder[0].amount_usd) === track.amountUsd) {
      return checkoutView(existingOrder[0]);
    }
    await pool.query(
      "UPDATE payment_orders SET status = 'expired' WHERE id = ? AND status = 'pending'",
      [existingOrder[0].id]
    );
  }

  const courseId = await pickAnchorCourseId(track.key);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const supportsUsdt = await hasPaymentColumn("amount_usdt");
  const supportsTrack = await hasPaymentColumn("track");

  const [result] = await pool.query(
    supportsUsdt
      ? `INSERT INTO payment_orders
         (user_id, course_id, amount_usd, amount_usdt, pay_currency, status, provider, expires_at${supportsTrack ? ", track" : ""})
         VALUES (?, ?, ?, NULL, 'USDTBSC', 'pending', 'nowpayments', ?${supportsTrack ? ", ?" : ""})`
      : `INSERT INTO payment_orders
         (user_id, course_id, amount_usd, status, provider, expires_at${supportsTrack ? ", track" : ""})
         VALUES (?, ?, ?, 'pending', 'nowpayments', ?${supportsTrack ? ", ?" : ""})`,
    supportsUsdt
      ? supportsTrack
        ? [uid, courseId, track.amountUsd, expiresAt, track.key]
        : [uid, courseId, track.amountUsd, expiresAt]
      : supportsTrack
        ? [uid, courseId, track.amountUsd, expiresAt, track.key]
        : [uid, courseId, track.amountUsd, expiresAt]
  );

  const orderId = result.insertId;

  let payment;
  try {
    payment = await nowpayments.createUsdtBscPayment({
      priceUsd: track.amountUsd,
      orderId,
      description: `Crystal Stones Academy — ${track.title}`,
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
      [usdtAmount, track.amountUsd / (usdtAmount || 1), providerId, address, providerExpiry, orderId]
    );
  }

  await securityLogger("PAYMENT_ORDER_CREATED", {
    userId: uid,
    orderId,
    track: track.key,
    amountUsd: track.amountUsd,
    amountUsdt: usdtAmount,
    provider: "nowpayments",
    providerOrderId: providerId,
  });

  const [orders] = await pool.query("SELECT * FROM payment_orders WHERE id = ?", [orderId]);
  return checkoutView(orders[0]);
};

const createPaymentOrder = async (userId, courseId) => {
  if (!Number.isInteger(courseId) || courseId <= 0) {
    throw new ApiError(400, "Invalid course id");
  }

  await ensureSchema();

  const [courses] = await pool.query(
    "SELECT * FROM courses WHERE id = ? AND is_published = TRUE",
    [courseId]
  );
  if (courses.length === 0) throw new ApiError(404, "Course not found");

  const course = courses[0];
  if (course.level === "advanced") {
    throw new ApiError(403, "Advanced is not available yet");
  }

  if (course.level === "intermediate") {
    return createTrackOrder(userId, "intermediate");
  }

  if (!course.is_paid) {
    throw new ApiError(400, "This course is free. No payment required.");
  }

  return createTrackOrder(userId, course.level);
};

const getPaymentOrder = async (userId, orderId) => {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new ApiError(400, "Invalid order id");
  }

  const [orders] = await pool.query(
    `SELECT po.*, c.title AS course_title, c.slug AS course_slug, c.level AS course_level
     FROM payment_orders po
     JOIN courses c ON po.course_id = c.id
     WHERE po.id = ? AND po.user_id = ?`,
    [orderId, userId]
  );

  if (orders.length === 0) throw new ApiError(404, "Payment order not found");
  return checkoutView(orders[0]);
};

const inferTrack = async (order) => {
  if (order.track && TRACKS[order.track]) return order.track;
  const [rows] = await pool.query("SELECT level FROM courses WHERE id = ?", [order.course_id]);
  const level = rows[0]?.level;
  if (level === "intermediate" || level === "advanced") return level;
  return null;
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
    const track = await inferTrack(order);

    if (order.status === "paid") {
      if (track) {
        await grantTrackAccess(connection, order.user_id, track, order.id);
        await enrollTrackCourses(connection, order.user_id, track);
      }
      await connection.commit();
      return { alreadyPaid: true, order };
    }
    if (order.status !== "pending" && order.status !== "expired") {
      throw new ApiError(400, `Cannot mark order as paid. Current status: ${order.status}`);
    }

    await connection.query(
      `UPDATE payment_orders
       SET status = 'paid', tx_hash = ?, paid_at = NOW()
       WHERE id = ?`,
      [txHash, orderId]
    );

    if (track) {
      await grantTrackAccess(connection, order.user_id, track, order.id);
      await enrollTrackCourses(connection, order.user_id, track);
    } else {
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
    }

    await connection.commit();

    await securityLogger("PAYMENT_PAID", {
      userId: order.user_id,
      orderId: order.id,
      track: track || null,
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

  if (PAID_STATUSES.has(status)) {
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
  }

  if (EXPIRED_STATUSES.has(status)) {
    await pool.query(
      `UPDATE payment_orders
       SET status = 'expired'
       WHERE id = ? AND status = 'pending'`,
      [orderId]
    );
    return { processed: true, enrolled: false, status };
  }

  return { processed: true, enrolled: false, status };
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
  if (order.status === "paid") {
    const track = order.track || (await inferTrack(order));
    if (track) await fulfillTrack(userId, track);
    return checkoutView(order);
  }
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

const getAccess = async (userId) => {
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) throw new ApiError(401, "Not authorized");
  await ensureSchema();

  const intermediate = await userOwnsTrack(uid, "intermediate");
  if (intermediate) await fulfillTrack(uid, "intermediate");

  return {
    intermediate,
    advanced: false,
    intermediate_price_usd: TRACKS.intermediate.priceUsd(),
    asset: "USDT",
    network: "BNB Smart Chain (BEP-20)",
  };
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
  createTrackOrder,
  getPaymentOrder,
  markOrderAsPaid,
  handleNowPaymentsIpn,
  syncPaymentOrder,
  expireOldOrders,
  getAccess,
  userOwnsTrack,
};