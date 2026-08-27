const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const securityLogger = require("../utils/securityLogger");
const priceService = require("./price.service");

const createPaymentOrder = async (userId, courseId) => {
  const [courses] = await pool.query(
    "SELECT * FROM courses WHERE id = ? AND is_published = TRUE",
    [courseId]
  );

  if (courses.length === 0) {
    throw new ApiError(404, "Course not found");
  }

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

  const [existingOrder] = await pool.query(
    `SELECT * FROM payment_orders 
     WHERE user_id = ? AND course_id = ? AND status = 'pending' 
     AND (expires_at IS NULL OR expires_at > NOW())`,
    [userId, courseId]
  );

  if (existingOrder.length > 0) {
    return existingOrder[0];
  }

  const amountUsd = Number(course.price_usd);
  const conversion = await priceService.convertUsdToCrystal(amountUsd);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const [result] = await pool.query(
    `INSERT INTO payment_orders 
     (user_id, course_id, amount_usd, amount_crystal, crystal_rate_used, status, provider, expires_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 'paynovax', ?)`,
    [
      userId,
      courseId,
      conversion.amountUsd,
      conversion.amountCrystal,
      conversion.crystalRateUsed,
      expiresAt,
    ]
  );

  const [orders] = await pool.query(
    "SELECT * FROM payment_orders WHERE id = ?",
    [result.insertId]
  );

  await securityLogger("PAYMENT_ORDER_CREATED", {
    userId,
    orderId: result.insertId,
    courseId,
    amountUsd: conversion.amountUsd,
    amountCrystal: conversion.amountCrystal,
    crystalRateUsed: conversion.crystalRateUsed,
    rateSource: conversion.rateSource,
  });

  return orders[0];
};

const getPaymentOrder = async (userId, orderId) => {
  const [orders] = await pool.query(
    `SELECT po.*, c.title as course_title, c.slug as course_slug
     FROM payment_orders po
     JOIN courses c ON po.course_id = c.id
     WHERE po.id = ? AND po.user_id = ?`,
    [orderId, userId]
  );

  if (orders.length === 0) {
    throw new ApiError(404, "Payment order not found");
  }

  return orders[0];
};

const markOrderAsPaid = async (orderId, txHash = null) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      "SELECT * FROM payment_orders WHERE id = ? FOR UPDATE",
      [orderId]
    );

    if (orders.length === 0) {
      throw new ApiError(404, "Payment order not found");
    }

    const order = orders[0];

    if (order.status === "paid") {
      await connection.commit();
      return { alreadyPaid: true, order };
    }

    if (order.status !== "pending") {
      throw new ApiError(
        400,
        `Cannot mark order as paid. Current status: ${order.status}`
      );
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
  expireOldOrders,
};