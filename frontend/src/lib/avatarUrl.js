const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const avatarSrc = (avatar) => {
  if (typeof avatar !== "string") return null;
  const value = avatar.trim();
  if (!value.startsWith("/uploads/avatars/")) return null;
  if (value.includes("..") || value.includes("\\")) return null;
  return `${API}${value}`;
};