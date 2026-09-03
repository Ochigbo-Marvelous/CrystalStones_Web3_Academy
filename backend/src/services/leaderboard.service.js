const pool = require("../config/db");
const { buildRankProgress } = require("../config/ranks");

const TOP_N = 12;

const getLeaderboard = async (userId) => {
  const uid = Number(userId);

  const [users] = await pool.query(
    `SELECT id, username, current_rank, current_streak FROM users`
  );

  const [enrollments] = await pool.query(
    `SELECT user_id, progress_percent, status FROM enrollments`
  );

  const [modules] = await pool.query(
    `SELECT user_id, COUNT(*) AS count
     FROM module_progress
     WHERE quiz_passed = TRUE
     GROUP BY user_id`
  );

  const [certs] = await pool.query(
    `SELECT user_id, COUNT(*) AS count FROM certificates GROUP BY user_id`
  );

  const enrollByUser = new Map();
  for (const row of enrollments) {
    const id = Number(row.user_id);
    if (!enrollByUser.has(id)) enrollByUser.set(id, []);
    enrollByUser.get(id).push(row);
  }

  const modulesByUser = new Map(
    modules.map((row) => [Number(row.user_id), Number(row.count) || 0])
  );
  const certsByUser = new Map(
    certs.map((row) => [Number(row.user_id), Number(row.count) || 0])
  );

  const ranked = users.map((user) => {
    const list = enrollByUser.get(Number(user.id)) || [];
    const totalCourses = list.length;
    const completedCourses = list.filter(
      (item) => item.status === "completed" || Number(item.progress_percent) >= 100
    ).length;
    const overallProgress =
      totalCourses > 0
        ? list.reduce((sum, item) => sum + Number(item.progress_percent || 0), 0) / totalCourses
        : 0;

    const rankProgress = buildRankProgress({
      completedCourses,
      completedModules: modulesByUser.get(Number(user.id)) || 0,
      overallProgress,
      streak: user.current_streak,
    });

    const xpInto = Number(rankProgress.xp_into) || 0;
    const xpTarget = Number(rankProgress.xp_target) || 100;
    const level = Number(rankProgress.level) || 1;

    return {
      place: 0,
      user_id: Number(user.id),
      username: user.username || "Learner",
      rank: rankProgress.rank || user.current_rank || "Novice",
      level,
      xp: Number(rankProgress.xp) || xpInto,
      xp_into: xpInto,
      xp_target: xpTarget,
      remaining: Number(rankProgress.remaining) || 0,
      next_rank: rankProgress.next_rank || null,
      percent: Number(rankProgress.percent) || 0,
      certificates: certsByUser.get(Number(user.id)) || 0,
      is_you: Number(user.id) === uid,
    };
  });

  ranked.sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    if (b.xp_into !== a.xp_into) return b.xp_into - a.xp_into;
    return String(a.username).localeCompare(String(b.username));
  });

  const rows = ranked.map((row, i) => ({ ...row, place: i + 1 }));
  const you = rows.find((row) => row.is_you) || null;
  const top = rows.slice(0, TOP_N);
  const visible = you && !top.some((row) => row.is_you) ? [...top, you] : top;

  return {
    total: rows.length,
    you,
    rows: visible,
  };
};

module.exports = { getLeaderboard };