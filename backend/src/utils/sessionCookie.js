const COOKIE = "csa_session";
const ADMIN_COOKIE = "csa_admin";

const baseOpts = () => {
  const sameOrigin = process.env.SERVE_FRONTEND === "true";
  const prod = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    path: "/",
    sameSite: sameOrigin ? "lax" : "none",
    secure: prod || !sameOrigin,
  };
};

const setSessionCookie = (res, token) => {
  if (!token) return;
  res.cookie(COOKIE, token, {
    ...baseOpts(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearSessionCookie = (res) => {
  const opts = baseOpts();
  res.clearCookie(COOKIE, opts);
  res.clearCookie(ADMIN_COOKIE, opts);
};

const setAdminCookie = (res, token) => {
  if (!token) return;
  res.cookie(ADMIN_COOKIE, token, {
    ...baseOpts(),
    maxAge: 12 * 60 * 60 * 1000,
  });
};

const clearAdminCookie = (res) => {
  res.clearCookie(ADMIN_COOKIE, baseOpts());
};

const readSessionToken = (req) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const fromHeader = header.slice(7).trim();
    if (fromHeader) return fromHeader;
  }
  return req.cookies?.[COOKIE] || null;
};

const readAdminToken = (req) => req.cookies?.[ADMIN_COOKIE] || null;

module.exports = {
  COOKIE,
  ADMIN_COOKIE,
  setSessionCookie,
  clearSessionCookie,
  setAdminCookie,
  clearAdminCookie,
  readSessionToken,
  readAdminToken,
};