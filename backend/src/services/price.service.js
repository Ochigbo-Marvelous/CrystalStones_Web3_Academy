const pool = require("../config/db");
const ApiError = require("../utils/ApiError");

const CRYSTAL_CONTRACT = "0xe252FCb1Aa2E0876E9B5f3eD1e15B9b4d11A0b00";

/**
 * Get admin-configured fallback rate from DB
 */
const getFallbackRate = async () => {
  const [rows] = await pool.query(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'crystal_usd_rate' LIMIT 1"
  );

  if (!rows.length) {
    throw new ApiError(500, "Crystal rate is not configured");
  }

  const rate = Number(rows[0].setting_value);
  if (!rate || rate <= 0) {
    throw new ApiError(500, "Invalid Crystal rate configuration");
  }

  return rate;
};

/**
 * Try live market price (DexScreener)
 * Returns null if unavailable
 */
const getLiveCrystalUsdRate = async () => {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${CRYSTAL_CONTRACT}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const pairs = Array.isArray(data?.pairs) ? data.pairs : [];

    if (!pairs.length) return null;

    // Prefer highest-liquidity pair with a usable priceUsd
    const sorted = pairs
      .filter((p) => p?.priceUsd && Number(p.priceUsd) > 0)
      .sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0));

    if (!sorted.length) return null;

    return Number(sorted[0].priceUsd);
  } catch (err) {
    return null;
  }
};

/**
 * Production price resolver:
 * 1) live market price
 * 2) admin fallback rate
 */
const getCrystalUsdRate = async () => {
  const live = await getLiveCrystalUsdRate();
  if (live && live > 0) {
    return {
      rate: live,
      source: "live",
    };
  }

  const fallback = await getFallbackRate();
  return {
    rate: fallback,
    source: "fallback",
  };
};

/**
 * Convert USD amount to Crystal amount
 */
const convertUsdToCrystal = async (amountUsd) => {
  const usd = Number(amountUsd);
  if (!usd || usd <= 0) {
    throw new ApiError(400, "Invalid USD amount");
  }

  const { rate, source } = await getCrystalUsdRate();
  const amountCrystal = usd / rate;

  return {
    amountUsd: usd,
    amountCrystal: Number(amountCrystal.toFixed(8)),
    crystalRateUsed: rate,
    rateSource: source,
  };
};

module.exports = {
  getCrystalUsdRate,
  convertUsdToCrystal,
  getFallbackRate,
};