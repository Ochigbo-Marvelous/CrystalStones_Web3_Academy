const pool = require("../config/db");


const securityLogger = async (event, details = {}) => {
  try {
    const userId = details.userId || details.user_id || null;
    const ipAddress = details.ip || details.ip_address || null;

    // Keep a clean meta object without duplicated top-level fields
    const meta = { ...details };
    delete meta.userId;
    delete meta.user_id;
    delete meta.ip;
    delete meta.ip_address;

    await pool.query(
      `INSERT INTO security_logs (event, user_id, ip_address, meta)
       VALUES (?, ?, ?, ?)`,
      [event, userId, ipAddress, JSON.stringify(meta)]
    );
  } catch (err) {
    // Fallback only – do not crash request
    console.error("[SECURITY_LOG_FAILED]", event, err.message);
  }
};

module.exports = securityLogger;