import iconRank from "../assets/brand/icon-rank.png";

const RANK_IMAGES = {
  novice: iconRank,
  apprentice: iconRank,
  scholar: iconRank,
  adept: iconRank,
  expert: iconRank,
  master: iconRank,
};

export function rankImage(rank) {
  const key = String(rank || "Novice").trim().toLowerCase();
  return RANK_IMAGES[key] || iconRank;
}