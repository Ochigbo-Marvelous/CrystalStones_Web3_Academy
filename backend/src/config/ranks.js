const RANK_LADDER = Object.freeze([
  { name: "Novice", xp: 0 },
  { name: "Explorer", xp: 100 },
  { name: "Scholar", xp: 400 },
  { name: "Adept", xp: 800 },
  { name: "Expert", xp: 1400 },
  { name: "Master", xp: 2400 },
]);

const RANK_ORDER = RANK_LADDER.map((item) => item.name);

const toCount = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
};

const computeXp = ({
  completedCourses = 0,
  completedModules = 0,
  overallProgress = 0,
  streak = 0,
} = {}) => {
  return Math.max(
    0,
    toCount(completedModules) * 80 +
      toCount(completedCourses) * 200 +
      Math.round(Number(overallProgress) || 0) +
      toCount(streak) * 10
  );
};

const rankIndexForXp = (xp) => {
  let index = 0;
  for (let i = RANK_LADDER.length - 1; i >= 0; i -= 1) {
    if (xp >= RANK_LADDER[i].xp) {
      index = i;
      break;
    }
  }
  return index;
};

const buildRankProgress = (input = {}) => {
  const xp = computeXp(input);
  const currentIndex = rankIndexForXp(xp);
  const current = RANK_LADDER[currentIndex];
  const next = RANK_LADDER[currentIndex + 1] || null;
  const floor = current.xp;
  const target = next ? next.xp : floor + 400;
  const span = Math.max(1, target - floor);
  const into = Math.min(span, Math.max(0, xp - floor));

  return {
    rank: current.name,
    next_rank: next ? next.name : current.name,
    level: currentIndex + 1,
    xp,
    xp_into: into,
    xp_target: span,
    xp_total_next: target,
    remaining: next ? Math.max(0, target - xp) : 0,
    percent: Math.min(100, Math.round((into / span) * 100)),
  };
};

module.exports = {
  RANK_LADDER,
  RANK_ORDER,
  computeXp,
  buildRankProgress,
};