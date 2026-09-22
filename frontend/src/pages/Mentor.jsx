import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import crystal from "../assets/brand/crystal-hero-hex.png";
import brain from "../assets/brand/mentor-brain.png";
import {
  isBadMentorLine,
  readMentorThread,
  writeMentorThread,
} from "../lib/mentorStorage";
import "../styles/dashboard.css";
import "../styles/mentor.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

const SUGGESTIONS = [
  "What is Crystal Stones?",
  "How do I start the Basic track?",
  "What is a wallet in crypto?",
  "How do the module quizzes work?",
];

function BtcIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#f7931a" />
      <path
        fill="#fff"
        d="M18.2 16.7c1.7-.4 2.8-1.3 2.6-3.1-.2-1.4-1.2-2-2.6-2.3V9.1h-1.7v2.1c-.4 0-.9 0-1.3.1V9.1h-1.7v2.2c-.4 0-1.3 0-1.9 0v1.8s1 0 1 0c.5 0 .7.3.7.7v5.6c0 .1 0 .5-.4.5 0 0-1 0-1 0l-.3 2h2.1V23h1.7v-2.1c.5 0 .9 0 1.3 0V23h1.7v-2.2c2.2-.3 3.7-1.2 3.8-3.2.1-1.6-.7-2.4-2.3-2.9zm-4.1-3.8c1.7 0 2.6.5 2.6 1.8s-1.2 1.8-2.6 1.8v-3.6zm2.9 7.6c0 1.5-1.3 2-3 2v-4c1.8 0 3 .6 3 2z"
      />
    </svg>
  );
}

function EthIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <polygon points="16,3 16,13 25,16" fill="#8c8c8c" />
      <polygon points="16,3 7,16 16,13" fill="#c0c0c0" />
      <polygon points="16,18 16,29 25,17.5" fill="#8c8c8c" />
      <polygon points="16,29 16,18 7,17.5" fill="#c0c0c0" />
      <polygon points="16,13 25,16 16,18 7,16" fill="#3c3c3b" />
    </svg>
  );
}

function CrystalIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <polygon
        points="16,2 28,9 28,23 16,30 4,23 4,9"
        fill="none"
        stroke="#3b7aee"
        strokeWidth="2"
      />
      <polygon points="16,8 22,12 22,20 16,24 10,20 10,12" fill="#3b7aee" />
      <polygon points="16,8 10,12 16,16 22,12" fill="#e03a28" opacity="0.9" />
    </svg>
  );
}

function MathMark({ children }) {
  return (
    <svg viewBox="0 0 48 24" aria-hidden="true">
      <text x="24" y="17" textAnchor="middle" fill="#9ec0ff" fontSize="13" fontFamily="Georgia, serif">
        {children}
      </text>
    </svg>
  );
}

function BrainField() {
  return (
    <div className="mn-brain" aria-hidden="true">
      <span className="mn-brain-ring" />
      <span className="mn-brain-ring delay" />
      <div className="mn-brain-spin">
        <img src={brain} alt="" />
      </div>
      <span className="mn-orbit o1"><BtcIcon /></span>
      <span className="mn-orbit o2"><EthIcon /></span>
      <span className="mn-orbit o3"><CrystalIcon /></span>
      <span className="mn-orbit o4"><MathMark>π</MathMark></span>
      <span className="mn-orbit o5"><MathMark>∑</MathMark></span>
      <span className="mn-orbit o6"><MathMark>√</MathMark></span>
      <span className="mn-orbit o7"><MathMark>E=mc²</MathMark></span>
      <span className="mn-orbit o8"><MathMark>∞</MathMark></span>
    </div>
  );
}

function Inline({ text }) {
  const parts = String(text || "").split(/(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 3) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return <span key={index}>{part.replace(/\*/g, "")}</span>;
  });
}

function MentorBody({ text }) {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n");

  const nodes = [];
  let para = [];
  let list = [];
  let key = 0;

  const flushPara = () => {
    const next = para.join(" ").trim();
    para = [];
    if (!next) return;
    if (/^\*[^*].*\*$/.test(next) && !next.startsWith("**")) {
      nodes.push(
        <span key={key} className="mn-cite">
          {next.slice(1, -1)}
        </span>
      );
      key += 1;
      return;
    }
    nodes.push(
      <p key={key}>
        <Inline text={next} />
      </p>
    );
    key += 1;
  };

  const flushList = () => {
    if (!list.length) return;
    nodes.push(
      <ul key={key}>
        {list.map((item, index) => (
          <li key={index}>
            <Inline text={item} />
          </li>
        ))}
      </ul>
    );
    key += 1;
    list = [];
  };

  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushPara();
      return;
    }
    if (/^[-•]\s+/.test(line) || /^\*\s+[^*]/.test(line)) {
      flushPara();
      list.push(line.replace(/^[-•]\s+/, "").replace(/^\*\s+/, ""));
      return;
    }
    flushList();
    para.push(line);
  });
  flushList();
  flushPara();
  return nodes;
}

function Skeleton() {
  return (
    <div className="db sk-screen">
      <header className="sk-nav-row">
        <span className="sk sk-brand" />
        <span className="sk sk-pills" />
        <span className="sk sk-user" />
      </header>
      <section className="mn-page">
        <div className="mn-hero">
          <span className="sk mn-sk-crystal" />
          <div>
            <span className="sk mn-sk-title" />
            <span className="sk mn-sk-sub" />
          </div>
        </div>
        <div className="mn-shell">
          <div className="mn-chat">
            <span className="sk mn-sk-bubble" />
            <span className="sk mn-sk-bubble is-user" />
            <span className="sk mn-sk-bubble" />
          </div>
          <div className="mn-composer">
            <span className="sk mn-sk-input" />
            <span className="sk mn-sk-send" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Mentor() {
  const navigate = useNavigate();
  const scroller = useRef(null);
  const nextId = useRef(1);
  const [user, setUser] = useState(null);
  const [thread, setThread] = useState([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const userId = user?.id;
  const greeting = useMemo(() => {
    const name = user?.username || user?.full_name || "learner";
    return `Ask me about Crystal Stones, the academy tracks, wallets, or Web3. I'll answer from the course knowledge, ${name}.`;
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    const started = performance.now();
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (String(data.message || "").toLowerCase().includes("not authorized")) {
          localStorage.removeItem("token");
          navigate("/signin", { replace: true });
          return;
        }
        const nextUser = data.data?.user || null;
        setUser(nextUser);
        setThread(readMentorThread(nextUser?.id));
      })
      .catch(() => setError("Could not load mentor"))
      .finally(() => {
        const wait = Math.max(0, 1000 - (performance.now() - started));
        setTimeout(() => setReady(true), wait);
      });
  }, [navigate]);

  useEffect(() => {
    if (!scroller.current) return;
    scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [thread, busy, ready]);

  const makeId = () => {
    nextId.current += 1;
    return nextId.current;
  };

  const pushThread = (next) => {
    setThread(next);
    writeMentorThread(userId, next);
  };

  const ask = async (text) => {
    const q = String(text || "").trim().slice(0, 500);
    if (!q || busy || !userId) return;

    const token = localStorage.getItem("token");
    const next = [...thread, { id: makeId(), role: "user", text: q }];
    pushThread(next);
    setQuestion("");
    setBusy(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/mentor/ask`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      const answer = data.data?.answer || data.message || "I could not find that in the academy knowledge yet.";
      if (!res.ok || isBadMentorLine(answer)) {
        throw new Error(data.message || "Mentor is unavailable right now");
      }
      pushThread([...next, { id: makeId(), role: "mentor", text: answer }]);
    } catch (err) {
      setError(err.message || "Mentor failed");
      pushThread([
        ...next,
        {
          id: makeId(),
          role: "mentor",
          text: "I could not reach the academy knowledge just now. Try again in a moment.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    ask(question);
  };

  if (!ready) return <Skeleton />;

  return (
    <div className="db">
      <Navbar user={user} />
      <section className="mn-page">
        <div className="mn-hero">
          <img src={crystal} alt="" />
          <div>
            <h1>Crystal Mentor</h1>
            <p>{greeting}</p>
          </div>
        </div>

        <div className="mn-chips">
          {SUGGESTIONS.map((item) => (
            <button key={item} type="button" onClick={() => ask(item)} disabled={busy}>
              {item}
            </button>
          ))}
        </div>

        {error ? <p className="mn-error">{error}</p> : null}

        <div className="mn-shell">
          <div className="mn-chat" ref={scroller}>
            {thread.length === 0 ? (
              <div className="mn-empty">
                <BrainField />
                <b>Start a conversation</b>
                <p>Pick a prompt above or ask anything from the academy curriculum.</p>
              </div>
            ) : (
              thread.map((item) => (
                <div key={item.id || `${item.role}-${item.text}`} className={`mn-bubble ${item.role}`}>
                  {item.role === "mentor" ? <MentorBody text={item.text} /> : item.text}
                </div>
              ))
            )}
            {busy ? <div className="mn-bubble mentor is-typing">Thinking...</div> : null}
          </div>

          <form className="mn-composer" onSubmit={onSubmit}>
            <input
              value={question}
              maxLength={500}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask Crystal Mentor..."
            />
            <button type="submit" disabled={busy || !question.trim()}>
              {busy ? "..." : "Ask"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}