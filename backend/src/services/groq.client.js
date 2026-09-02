const fs = require("fs");
const path = require("path");
const https = require("https");

const DEFAULT_MODEL = "openai/gpt-oss-20b";
const GROQ_HOST = "api.groq.com";

const PREFERRED_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "qwen/qwen3.8-27b",
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
];

const loadEnv = () => {
  if (String(process.env.GROQ_API_KEY || "").trim()) return;
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "backend/.env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../../.env"),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const name = trimmed.slice(0, eq).trim();
      if (!name || process.env[name]) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[name] = value;
    }
    if (String(process.env.GROQ_API_KEY || "").trim()) return;
  }
};

loadEnv();

const redact = (text) =>
  String(text || "")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]+\b/g, "[redacted-token]");

const readKey = () =>
  String(process.env.GROQ_API_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^Bearer\s+/i, "")
    .trim();

const envModel = () =>
  String(process.env.GROQ_MODEL || "").trim().replace(/^["']|["']$/g, "");

const readTimeout = () => {
  const n = Number(process.env.GROQ_TIMEOUT_MS);
  return Number.isFinite(n) && n >= 3000 ? n : 25000;
};

const isConfigured = () => {
  loadEnv();
  const key = readKey();
  return key.startsWith("gsk_") && key.length > 20;
};

const groqRequest = (method, urlPath, key, timeoutMs, body) =>
  new Promise((resolve, reject) => {
    const payload = body ? Buffer.from(JSON.stringify(body)) : null;
    const headers = { Authorization: `Bearer ${key}` };
    if (payload) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = payload.length;
    }

    const req = https.request(
      {
        hostname: GROQ_HOST,
        path: urlPath,
        method,
        headers,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let json = {};
          try {
            json = raw ? JSON.parse(raw) : {};
          } catch {
            json = { raw };
          }
          resolve({ status: res.statusCode || 0, json });
        });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      const err = new Error("Groq timed out");
      err.code = "GROQ_TIMEOUT";
      reject(err);
    });
    req.on("error", (err) => {
      err.code = err.code || "GROQ_NETWORK";
      reject(err);
    });
    if (payload) req.write(payload);
    req.end();
  });

let modelCache = { at: 0, ids: [] };

const listModelIds = async (key) => {
  if (Date.now() - modelCache.at < 10 * 60 * 1000 && modelCache.ids.length) {
    return modelCache.ids;
  }
  const { status, json } = await groqRequest("GET", "/openai/v1/models", key, 10000);
  if (status === 401 || status === 403) {
    const err = new Error("Groq rejected the API key");
    err.code = "GROQ_AUTH";
    err.status = status;
    throw err;
  }
  const ids = Array.isArray(json?.data)
    ? json.data.map((row) => row && row.id).filter(Boolean)
    : [];
  if (ids.length) modelCache = { at: Date.now(), ids };
  return ids;
};

const isChatModel = (id) =>
  Boolean(id) && !/whisper|tts|guard|orpheus|safeguard/i.test(id);

const resolveModels = async (key) => {
  let ids = [];
  try {
    ids = await listModelIds(key);
  } catch (err) {
    if (err.code === "GROQ_AUTH") throw err;
    ids = [];
  }

  const ordered = [];
  const configured = envModel();
  if (configured && isChatModel(configured) && (!ids.length || ids.includes(configured))) {
    ordered.push(configured);
  }
  for (const id of PREFERRED_MODELS) {
    if (!ids.length || ids.includes(id)) ordered.push(id);
  }
  for (const id of ids) {
    if (isChatModel(id)) ordered.push(id);
  }
  if (!ordered.length) ordered.push(DEFAULT_MODEL);
  return [...new Set(ordered)];
};

const modelMissing = (status, message) =>
  (status === 400 || status === 404) &&
  /model|does not exist|not have access|unknown|deprecat/i.test(String(message || ""));

const pickText = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (!part) return "";
        if (typeof part === "string") return part;
        return part.text || part.content || part.output_text || "";
      })
      .join("\n")
      .trim();
  }
  if (typeof value === "object") {
    return String(value.text || value.content || value.output_text || "").trim();
  }
  return String(value).trim();
};

const readMessageText = (json) => {
  const choice = json?.choices?.[0] || {};
  const msg = choice.message || {};
  return (
    pickText(msg.content) ||
    pickText(choice.text) ||
    pickText(msg.reasoning_content) ||
    pickText(json?.output_text) ||
    ""
  );
};

const buildBody = (model, messages) => {
  const body = {
    model,
    temperature: 0.25,
    max_completion_tokens: 2048,
    max_tokens: 2048,
    messages,
  };
  if (/gpt-oss/i.test(model)) body.reasoning_effort = "low";
  if (/qwen/i.test(model)) body.reasoning_effort = "none";
  return body;
};

const chat = async (messages) => {
  loadEnv();
  const key = readKey();
  if (!isConfigured()) {
    const err = new Error("GROQ_API_KEY missing or not a Groq key");
    err.code = "GROQ_UNCONFIGURED";
    throw err;
  }

  const models = await resolveModels(key);
  let lastError = null;

  for (const model of models) {
    try {
      const { status, json } = await groqRequest(
        "POST",
        "/openai/v1/chat/completions",
        key,
        readTimeout(),
        buildBody(model, messages)
      );

      if (status === 401 || status === 403) {
        const err = new Error("Groq rejected the API key");
        err.code = "GROQ_AUTH";
        err.status = status;
        throw err;
      }

      if (!status || status >= 400) {
        const message = json?.error?.message || `Groq HTTP ${status}`;
        const err = new Error(message);
        err.code = "GROQ_HTTP";
        err.status = status;
        lastError = err;
        continue;
      }

      const text = redact(readMessageText(json));
      if (!text) {
        const err = new Error("Groq returned an empty answer");
        err.code = "GROQ_EMPTY";
        lastError = err;
        continue;
      }
      return text;
    } catch (err) {
      if (err.code === "GROQ_AUTH" || err.code === "GROQ_UNCONFIGURED") throw err;
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error("Groq failed");
};

module.exports = {
  isConfigured,
  chat,
  readModel: () => envModel() || DEFAULT_MODEL,
};