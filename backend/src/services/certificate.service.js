
const crypto = require("crypto");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");

const TRACKS = {
  beginner: {
    key: "beginner",
    label: "BASIC TRACK",
    curriculum: "COMPLETED THE BASIC TRACK CURRICULUM",
    focus: "CRYPTO FOUNDATIONS • WALLETS & SELF-CUSTODY • CRYPTO SAFETY",
  },
  intermediate: {
    key: "intermediate",
    label: "INTERMEDIATE TRACK",
    curriculum: "COMPLETED THE INTERMEDIATE TRACK CURRICULUM",
    focus: "ETHEREUM & SMART CONTRACTS • DEFI • CRYSTAL STONES ECOSYSTEM",
  },
};

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS track_certificates (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT NOT NULL,
      track VARCHAR(32) NOT NULL,
      certificate_code VARCHAR(64) NOT NULL,
      hex_id VARCHAR(32) NOT NULL,
      issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_track_cert_user (user_id, track),
      UNIQUE KEY uq_track_cert_code (certificate_code)
    )
  `);
};

const makeHex = () =>
  crypto
    .randomBytes(8)
    .toString("hex")
    .toUpperCase()
    .match(/.{4}/g)
    .join(",");

const crystalId = (user) => {
  const n = String(user.id).padStart(5, "0");
  return `CS-${n}`;
};

const viewOf = (row, user) => {
  const meta = TRACKS[row.track];
  return {
    id: row.id,
    track: row.track,
    label: meta.label,
    curriculum: meta.curriculum,
    focus: meta.focus,
    certificate_code: row.certificate_code,
    hex_id: row.hex_id,
    issued_at: row.issued_at,
    full_name: user.full_name,
    username: user.username,
    crystal_id: crystalId(user),
  };
};

const issueTrackIfReady = async (userId, courseId) => {
  const uid = Number(userId);
  const cid = Number(courseId);
  if (!Number.isInteger(uid) || uid <= 0 || !Number.isInteger(cid) || cid <= 0) return null;

  await ensureTable();

  const [[course]] = await pool.query(
    "SELECT level FROM courses WHERE id = ? AND is_published = TRUE LIMIT 1",
    [cid]
  );
  const track = course?.level;
  if (!TRACKS[track]) return null;

  const [[need]] = await pool.query(
    "SELECT COUNT(*) AS n FROM courses WHERE level = ? AND is_published = TRUE",
    [track]
  );
  const [[done]] = await pool.query(
    `SELECT COUNT(*) AS n
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = ?
       AND c.level = ?
       AND c.is_published = TRUE
       AND (e.status = 'completed' OR e.progress_percent >= 100)`,
    [uid, track]
  );

  if (Number(done.n) < Number(need.n) || Number(need.n) === 0) return null;

  const [existing] = await pool.query(
    "SELECT id FROM track_certificates WHERE user_id = ? AND track = ? LIMIT 1",
    [uid, track]
  );
  if (existing.length > 0) return existing[0];

  const prefix = track === "intermediate" ? "INTER" : "BASIC";
  const hex_id = makeHex();
  const certificate_code = `CW3-${prefix}-${hex_id.replace(/,/g, "").slice(0, 8)}`;

  const [result] = await pool.query(
    `INSERT INTO track_certificates (user_id, track, certificate_code, hex_id)
     VALUES (?, ?, ?, ?)`,
    [uid, track, certificate_code, hex_id]
  );

  return { id: result.insertId, track, certificate_code, hex_id };
};

const listMine = async (userId) => {
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) throw new ApiError(401, "Not authorized");
  await ensureTable();

  const [[user]] = await pool.query(
    "SELECT id, full_name, username FROM users WHERE id = ? LIMIT 1",
    [uid]
  );
  if (!user) throw new ApiError(404, "User not found");

  const [rows] = await pool.query(
    `SELECT * FROM track_certificates WHERE user_id = ? ORDER BY issued_at DESC`,
    [uid]
  );

  return rows.map((row) => viewOf(row, user));
};

const getMine = async (userId, track) => {
  const uid = Number(userId);
  const key = String(track || "").toLowerCase();
  if (!TRACKS[key]) throw new ApiError(404, "Certificate not found");
  if (!Number.isInteger(uid) || uid <= 0) throw new ApiError(401, "Not authorized");
  await ensureTable();

  const [[user]] = await pool.query(
    "SELECT id, full_name, username FROM users WHERE id = ? LIMIT 1",
    [uid]
  );
  if (!user) throw new ApiError(404, "User not found");

  const [rows] = await pool.query(
    "SELECT * FROM track_certificates WHERE user_id = ? AND track = ? LIMIT 1",
    [uid, key]
  );
  if (rows.length === 0) {
    throw new ApiError(404, "Finish this track to unlock the diploma.");
  }

  return viewOf(rows[0], user);
};

const verifyPublic = async (code) => {
  await ensureTable();
  const [rows] = await pool.query(
    `SELECT tc.*, u.full_name, u.username, u.id AS user_id
     FROM track_certificates tc
     JOIN users u ON u.id = tc.user_id
     WHERE tc.certificate_code = ?
     LIMIT 1`,
    [String(code || "").trim()]
  );
  if (rows.length === 0) throw new ApiError(404, "Certificate not found");
  const row = rows[0];
  return viewOf(row, { id: row.user_id, full_name: row.full_name, username: row.username });
};

module.exports = {
  issueTrackIfReady,
  listMine,
  getMine,
  verifyPublic,
};