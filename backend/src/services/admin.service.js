const pool = require("../config/db");
const { RANK_ORDER } = require("../config/ranks");

const TRACK_LABEL = {
  beginner: "Basic",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const TRACK_COLOR = {
  beginner: "#3b7aee",
  intermediate: "#c9a227",
  advanced: "#3ecf8e",
};

const RANK_COLOR = {
  Novice: "#5b6780",
  Explorer: "#3b7aee",
  Scholar: "#6aa8ff",
  Adept: "#c9a227",
  Expert: "#e03a28",
  Master: "#3ecf8e",
};

const hasTable = async (name) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS ok
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [name]
  );
  return Number(rows[0].ok) > 0;
};


const pct = (n, total) => {
  const t = Number(total) || 0;
  const v = Number(n) || 0;
  if (t <= 0) return 0;
  return Math.round((v / t) * 1000) / 10;
};

const deltaPct = (now, prev) => {
  const a = Number(now) || 0;
  const b = Number(prev) || 0;
  if (b <= 0) return a > 0 ? 100 : 0;
  return Math.round(((a - b) / b) * 1000) / 10;
};

const series = (rows, total, labelKey = "label") =>
  rows.map((row) => ({
    key: row.key,
    label: row[labelKey] || row.label,
    count: Number(row.count) || 0,
    percent: pct(row.count, total),
    color: row.color,
  }));

const countBetween = async (sql, from, to) => {
  const [[row]] = await pool.query(sql, [from, to]);
  return Number(row.count || 0);
};

const getOverview = async () => {
  const [[head]] = await pool.query(
    `SELECT
        COUNT(*) AS learners,
        SUM(CASE WHEN current_streak > 0 THEN 1 ELSE 0 END) AS streak_kept,
        SUM(CASE WHEN current_streak = 0 THEN 1 ELSE 0 END) AS streak_lost,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins
     FROM users
     WHERE is_active = 1 OR is_active IS NULL`
  );

  const learners = Number(head.learners || 0);
  const streakKept = Number(head.streak_kept || 0);
  const streakLost = Number(head.streak_lost || 0);

  const [levelRows] = await pool.query(
    `SELECT c.level AS lvl, COUNT(DISTINCT e.user_id) AS count
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     GROUP BY c.level`
  );

  const levelMap = { beginner: 0, intermediate: 0, advanced: 0 };
  levelRows.forEach((row) => {
    if (levelMap[row.lvl] !== undefined) levelMap[row.lvl] = Number(row.count) || 0;
  });
  const enrollTotal = Object.values(levelMap).reduce((a, b) => a + b, 0) || learners;

  let intermediateUnlocks = levelMap.intermediate;
  if (await hasTable("user_track_access")) {
    const [[row]] = await pool.query(
      `SELECT COUNT(DISTINCT user_id) AS count
       FROM user_track_access
       WHERE track IN ('intermediate','Intermediate')`
    );
    intermediateUnlocks = Number(row.count || 0) || intermediateUnlocks;
  }

  let certByTrack = [];
  let certTotal = 0;
  if (await hasTable("track_certificates")) {
    const [rows] = await pool.query(
      `SELECT track AS key_name, COUNT(*) AS count
       FROM track_certificates
       GROUP BY track`
    );
    certByTrack = rows.map((row) => {
      const key = String(row.key_name || "").toLowerCase();
      const norm = key === "basic" ? "beginner" : key;
      return {
        key: norm,
        label: TRACK_LABEL[norm] || row.key_name,
        count: Number(row.count) || 0,
        color: TRACK_COLOR[norm] || "#5b6780",
      };
    });
    certTotal = certByTrack.reduce((a, b) => a + b.count, 0);
  }
  if (certTotal === 0 && (await hasTable("certificates"))) {
    const [rows] = await pool.query(
      `SELECT COALESCE(level, 'unknown') AS key_name, COUNT(*) AS count
       FROM certificates
       GROUP BY COALESCE(level, 'unknown')`
    );
    certByTrack = rows.map((row) => {
      const key = String(row.key_name || "").toLowerCase();
      return {
        key,
        label: TRACK_LABEL[key] || row.key_name,
        count: Number(row.count) || 0,
        color: TRACK_COLOR[key] || "#5b6780",
      };
    });
    certTotal = certByTrack.reduce((a, b) => a + b.count, 0);
  }

  const [rankRows] = await pool.query(
    `SELECT COALESCE(current_rank, 'Novice') AS rank_name, COUNT(*) AS count
     FROM users
     GROUP BY COALESCE(current_rank, 'Novice')`
  );
  const rankMap = Object.fromEntries(rankRows.map((r) => [r.rank_name, Number(r.count) || 0]));
  const rankSeries = (RANK_ORDER.length ? RANK_ORDER : Object.keys(rankMap)).map((name) => ({
    key: name,
    label: name,
    count: rankMap[name] || 0,
    color: RANK_COLOR[name] || "#5b6780",
  }));
  const rankTotal = rankSeries.reduce((a, b) => a + b.count, 0);

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const learnersNow = await countBetween(
    "SELECT COUNT(*) AS count FROM users WHERE created_at >= ? AND created_at < ?",
    d30,
    now
  );
  const learnersPrev = await countBetween(
    "SELECT COUNT(*) AS count FROM users WHERE created_at >= ? AND created_at < ?",
    d60,
    d30
  );

  let certNow = 0;
  let certPrev = 0;
  if (await hasTable("track_certificates")) {
    certNow = await countBetween(
      "SELECT COUNT(*) AS count FROM track_certificates WHERE issued_at >= ? AND issued_at < ?",
      d30,
      now
    );
    certPrev = await countBetween(
      "SELECT COUNT(*) AS count FROM track_certificates WHERE issued_at >= ? AND issued_at < ?",
      d60,
      d30
    );
  } else if (await hasTable("certificates")) {
    certNow = await countBetween(
      "SELECT COUNT(*) AS count FROM certificates WHERE issued_at >= ? AND issued_at < ?",
      d30,
      now
    );
    certPrev = await countBetween(
      "SELECT COUNT(*) AS count FROM certificates WHERE issued_at >= ? AND issued_at < ?",
      d60,
      d30
    );
  }

  const [recent] = await pool.query(
    `SELECT id, full_name, username, avatar, current_rank, current_streak, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT 8`
  );

  const trackSeries = ["beginner", "intermediate", "advanced"].map((key) => ({
    key,
    label: TRACK_LABEL[key],
    count: levelMap[key],
    color: TRACK_COLOR[key],
  }));

  return {
    period_label: "last 30 days vs prior 30",
    kpis: {
      learners: {
        value: learners,
        delta: deltaPct(learnersNow, learnersPrev),
      },
      streak_kept: {
        value: streakKept,
        delta: null,
      },
      certificates: {
        value: certTotal,
        delta: deltaPct(certNow, certPrev),
      },
      intermediate_unlocks: {
        value: intermediateUnlocks,
        delta: null,
      },
    },
    charts: {
      enrollment: {
        total: enrollTotal,
        slices: series(trackSeries, enrollTotal),
      },
      streaks: {
        total: learners,
        keep_rate: pct(streakKept, learners),
        slices: series(
          [
            { key: "kept", label: "Kept streak", count: streakKept, color: "#3b7aee" },
            { key: "lost", label: "No streak", count: streakLost, color: "#c9a227" },
          ],
          learners
        ),
      },
      certificates: {
        total: certTotal,
        slices: series(certByTrack, certTotal || 1),
      },
      ranks: {
        total: rankTotal,
        slices: series(rankSeries, rankTotal),
      },
    },
    recent: recent.map((row) => ({
      id: row.id,
      name: row.full_name || row.username,
      username: row.username,
      avatar: row.avatar,
      rank: row.current_rank || "Novice",
      streak: Number(row.current_streak || 0),
      joined: row.created_at,
    })),
  };
};

const listUsers = async ({ q = "", track = "", rank = "", page = 1 } = {}) => {
  const limit = 20;
  const p = Math.max(1, Number(page) || 1);
  const offset = (p - 1) * limit;
  const where = [];
  const params = [];

  if (q) {
    where.push("(u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)");
    const like = `%${String(q).slice(0, 80)}%`;
    params.push(like, like, like);
  }
  if (rank) {
    where.push("u.current_rank = ?");
    params.push(String(rank).slice(0, 40));
  }

  let join = "";
  if (track) {
    const level = track === "basic" ? "beginner" : track;
    join = `JOIN enrollments e ON e.user_id = u.id
            JOIN courses c ON c.id = e.course_id AND c.level = ?`;
    params.unshift(level);
  }

  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [[countRow]] = await pool.query(
    `SELECT COUNT(DISTINCT u.id) AS count FROM users u ${join} ${clause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.username, u.email, u.avatar, u.role,
            u.current_rank, u.current_streak, u.longest_streak, u.created_at,
            u.last_activity_date
     FROM users u
     ${join}
     ${clause}
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  const ids = rows.map((r) => r.id);
  let tracksByUser = {};
  if (ids.length) {
    const [trows] = await pool.query(
      `SELECT e.user_id, c.level
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.user_id IN (${ids.map(() => "?").join(",")})
       GROUP BY e.user_id, c.level`,
      ids
    );
    trows.forEach((row) => {
      if (!tracksByUser[row.user_id]) tracksByUser[row.user_id] = [];
      tracksByUser[row.user_id].push(TRACK_LABEL[row.level] || row.level);
    });
  }

  let certsByUser = {};
  if (ids.length && (await hasTable("track_certificates"))) {
    const [crows] = await pool.query(
      `SELECT user_id, COUNT(*) AS count FROM track_certificates
       WHERE user_id IN (${ids.map(() => "?").join(",")})
       GROUP BY user_id`,
      ids
    );
    crows.forEach((row) => {
      certsByUser[row.user_id] = Number(row.count) || 0;
    });
  }

  return {
    total: Number(countRow.count || 0),
    page: p,
    pages: Math.max(1, Math.ceil(Number(countRow.count || 0) / limit)),
    rows: rows.map((row) => ({
      id: row.id,
      name: row.full_name,
      username: row.username,
      email: row.email,
      avatar: row.avatar,
      role: row.role,
      rank: row.current_rank || "Novice",
      streak: Number(row.current_streak || 0),
      longest_streak: Number(row.longest_streak || 0),
      tracks: tracksByUser[row.id] || [],
      certificates: certsByUser[row.id] || 0,
      joined: row.created_at,
      last_active: row.last_activity_date,
    })),
  };
};

const listTracks = async () => {
  const [rows] = await pool.query(
    `SELECT c.id, c.title, c.slug, c.level, c.is_published,
            COUNT(e.id) AS enrollments,
            SUM(CASE WHEN e.status = 'completed' OR e.progress_percent >= 100 THEN 1 ELSE 0 END) AS completed
     FROM courses c
     LEFT JOIN enrollments e ON e.course_id = c.id
     GROUP BY c.id
     ORDER BY FIELD(c.level,'beginner','intermediate','advanced'), c.id`
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    level: row.level,
    label: TRACK_LABEL[row.level] || row.level,
    published: Boolean(row.is_published),
    enrollments: Number(row.enrollments || 0),
    completed: Number(row.completed || 0),
  }));
};

const listCertificates = async () => {
  if (await hasTable("track_certificates")) {
    const [rows] = await pool.query(
      `SELECT tc.id, tc.track, tc.certificate_code, tc.issued_at,
              u.full_name, u.username, u.email
       FROM track_certificates tc
       JOIN users u ON u.id = tc.user_id
       ORDER BY tc.issued_at DESC
       LIMIT 100`
    );
    return rows.map((row) => ({
      id: row.id,
      track: TRACK_LABEL[row.track] || row.track,
      code: row.certificate_code,
      issued_at: row.issued_at,
      name: row.full_name,
      username: row.username,
      email: row.email,
    }));
  }

  const [rows] = await pool.query(
    `SELECT c.id, c.level, c.certificate_code, c.issued_at,
            u.full_name, u.username, u.email
     FROM certificates c
     JOIN users u ON u.id = c.user_id
     ORDER BY c.issued_at DESC
     LIMIT 100`
  );
  return rows.map((row) => ({
    id: row.id,
    track: TRACK_LABEL[row.level] || row.level,
    code: row.certificate_code,
    issued_at: row.issued_at,
    name: row.full_name,
    username: row.username,
    email: row.email,
  }));
};

module.exports = { getOverview, listUsers, listTracks, listCertificates };