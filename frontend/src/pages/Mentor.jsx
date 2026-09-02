import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import crystal from "../assets/brand/crystal-hero.png";
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
                <b>Start a conversation</b>
                <p>Pick a prompt above or ask anything from the academy curriculum.</p>
              </div>
            ) : (
              thread.map((item) => (
                <div key={item.id || `${item.role}-${item.text}`} className={`mn-bubble ${item.role}`}>
                  {item.text}
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