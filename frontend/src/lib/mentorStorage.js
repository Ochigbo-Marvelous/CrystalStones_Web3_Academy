const LEGACY_KEY = "mentor_thread";

const isBadMentorLine = (text = "") =>
  /route\s+\/api\/mentor|not found|stack|sql|token failed/i.test(String(text));

export const mentorStorageKey = (userId) => {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return `mentor_thread_${id}`;
};

const clean = (parsed) => {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item) => item && item.text && !isBadMentorLine(item.text)).slice(-40);
};

export const readMentorThread = (userId) => {
  const key = mentorStorageKey(userId);
  if (!key) return [];
  try {
    return clean(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return [];
  }
};

export const writeMentorThread = (userId, thread) => {
  const key = mentorStorageKey(userId);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(clean(thread)));
};

export const clearAllMentorThreads = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key === LEGACY_KEY || (key && key.startsWith("mentor_thread"))) {
      keys.push(key);
    }
  }
  keys.forEach((key) => localStorage.removeItem(key));
};

export { isBadMentorLine };