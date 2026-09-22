import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import academyLogo from "../assets/brand/crystal-hero-hex.png";
import crystalBasic from "../assets/brand/crystal-basic-blue.png";
import crystalIntermediate from "../assets/brand/crystal-intermediate-gold.png";
import crystalAdvanced from "../assets/brand/crystal-advanced-green.png";
import mentorCrystal from "../assets/brand/crystal-hero.png";
import brain from "../assets/brand/mentor-brain.png";
import iconBook from "../assets/brand/icon-book.png";
import iconClock from "../assets/brand/icon-clock.png";
import iconCert from "../assets/brand/icon-cert.png";
import { rankImage } from "../lib/rankAssets";
import {
  isBadMentorLine,
  readMentorThread,
  writeMentorThread,
} from "../lib/mentorStorage";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
const COMPLETED_PER_PAGE = 3;
const COMPLETED_MAX_PAGES = 100;

const crystalForLevel = (level) => {
  if (level === "intermediate") return crystalIntermediate;
  if (level === "advanced") return crystalAdvanced;
  return crystalBasic;
};

const formatTime = (mins = 0) => {
  const n = Number(mins) || 0;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

const formatDays = (days = 0) => {
  const n = Number(days) || 0;
  return `${n} day${n === 1 ? "" : "s"}`;
};

function BtcIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#f7931a" />
      <path fill="#fff" d="M15.2 11.3c.7-.4 1.1-1 1-1.8-.2-1.2-1.3-1.6-2.7-1.7V6.3h-1.4v1.4H11V6.3H9.6v1.5H7.8v1.5h1.1c.4 0 .6.2.6.6v5.3c0 .3-.2.5-.5.5H7.8V17h1.8v1.5H11V17h1.1v1.5h1.4V17c1.6-.1 2.8-.7 3-2 .1-1-.3-1.6-1.3-2zM11 9.4h1.6c.7 0 1.2.2 1.3.8.1.5-.3.9-1.1.9H11V9.4zm2 5.8H11v-1.9h2.1c.8 0 1.3.3 1.4.9.1.6-.4 1-1.5 1z" />
    </svg>
  );
}

function EthIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#627eea" d="M12 2.2 5.6 12.3 12 16l6.4-3.7L12 2.2z" />
      <path fill="#8ea0f0" d="M12 16 5.6 12.3 12 21.8l6.4-9.5L12 16z" />
    </svg>
  );
}

function CrystalCoin() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="12,2 21,7.5 21,16.5 12,22 3,16.5 3,7.5" fill="#0b1422" stroke="#3b7aee" strokeWidth="1.6" />
      <polygon points="12,6 16.5,8.6 16.5,13.4 12,16 7.5,13.4 7.5,8.6" fill="none" stroke="#e03a28" strokeWidth="1.4" />
    </svg>
  );
}

function PiIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M9 7v11M15 7c3 0 3 5 0 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SumIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 5H7l7 7-7 7h11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function RootIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 13h3l2.5 6L14 5h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Skeleton() {
  return (
    <div className="db sk-screen">
      <header className="sk-nav-row">
        <span className="sk sk-brand" />
        <span className="sk sk-pills" />
        <span className="sk sk-user" />
      </header>

      <section className="sk-hero-row">
        <div className="sk-hero-copy">
          <span className="sk sk-title" />
          <span className="sk sk-sub" />
          <div className="sk-hero-actions">
            <span className="sk sk-btn" />
            <span className="sk sk-btn" />
          </div>
        </div>
        <span className="sk sk-crystal" />
        <span className="sk sk-streak" />
      </section>

      <section className="sk-stats">
        <span className="sk" />
        <span className="sk" />
        <span className="sk" />
        <span className="sk" />
        <span className="sk" />
      </section>

      <section className="sk-main">
        <div className="sk-left">
          <span className="sk sk-card" />
          <span className="sk sk-card" />
        </div>
        <div className="sk-right">
          <span className="sk sk-mentor" />
          <span className="sk sk-rank" />
        </div>
      </section>
    </div>
  );
}

function BoardRow({ row }) {
  return (
    <li className={`db-board-row${row.is_you ? " is-you" : ""}`}>
      <span className={`db-board-place p${Math.min(Number(row.place) || 4, 4)}`}>#{row.place}</span>
      <img src={rankImage(row.rank)} alt="" width={32} height={32} />
      <div className="db-board-copy">
        <b>
          {row.username}
          {row.is_you ? <em> you</em> : null}
        </b>
        <small>
          {row.rank} · {row.xp_into ?? row.xp ?? 0} / {row.xp_target || 100} XP
        </small>
      </div>
      {Number(row.certificates) > 0 ? (
        <span className="db-board-certs">
          {row.certificates} cert{Number(row.certificates) === 1 ? "" : "s"}
        </span>
      ) : (
        <span className="db-board-certs"> </span>
      )}
    </li>
  );
}

function CourseRow({ course, done, onOpen }) {
  const pct = done ? 100 : Math.round(course.progress_percent || 0);
  return (
    <div className="db-progress-row">
      <img src={crystalForLevel(course.level)} alt="" />
      <div className="db-progress-copy">
        <b>{course.title}</b>
        <small>{course.level === "beginner" ? "Basic" : course.level}</small>
      </div>
      <div className="db-progress-meta">
        <div className="db-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <em>{done ? "Completed" : `${pct}% Complete`}</em>
      </div>
      <button className="db-btn slim" type="button" onClick={() => onOpen(course)}>
        {done ? "Review" : "Continue"}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [mentorInput, setMentorInput] = useState("");
  const [mentorBusy, setMentorBusy] = useState(false);
  const [thread, setThread] = useState([]);
  const [completedPage, setCompletedPage] = useState(1);
  const [board, setBoard] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const started = Date.now();

    Promise.all([
      fetch(`${API}/api/dashboard`, { headers }).then((res) => res.json()),
      fetch(`${API}/api/leaderboard`, { headers })
        .then((res) => res.json())
        .catch(() => null),
    ])
      .then(([dash, boardJson]) => {
        if (!dash.success) throw new Error(dash.message || "Dashboard failed");
        setData(dash.data);
        if (dash.data?.user) {
          localStorage.setItem("user", JSON.stringify(dash.data.user));
          setThread(readMentorThread(dash.data.user.id));
        }
        if (boardJson?.success && boardJson.data) setBoard(boardJson.data);
      })
      .catch((err) => {
          if (String(err.message).toLowerCase().includes("not authorized")) {
           setError(err.message || "Could not load dashboard");
            return;
        }
        setError(err.message || "Could not load dashboard");
      })
      .finally(() => {
        const wait = Math.max(0, 1000 - (Date.now() - started));
        setTimeout(() => setReady(true), wait);
      });
  }, [navigate]);

  const userId = data?.user?.id;

  const saveThread = (next) => {
    const clipped = next
      .filter((item) => item && item.text && !isBadMentorLine(item.text))
      .slice(-40);
    writeMentorThread(userId, clipped);
    setThread(clipped);
  };

  const askMentor = async (event) => {
    event.preventDefault();
    const question = mentorInput.trim().slice(0, 500);
    if (!question || mentorBusy || !userId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    setMentorBusy(true);

    const pending = [...thread, { role: "user", text: question, at: Date.now() }];
    saveThread(pending);
    setMentorInput("");

    try {
      const res = await fetch(`${API}/api/mentor/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      });
      const json = await res.json().catch(() => ({}));
      const answer =
        res.ok && json?.success && json?.data?.answer
          ? String(json.data.answer)
          : "Mentor is unavailable right now.";
      saveThread([...pending, { role: "mentor", text: answer, at: Date.now() }]);
    } catch {
      saveThread([...pending, { role: "mentor", text: "Mentor is unavailable right now.", at: Date.now() }]);
    } finally {
      setMentorBusy(false);
    }
  };

  const completed = useMemo(() => data?.completed || [], [data]);
  const totalCompletedPages = useMemo(() => {
    const pages = Math.ceil(completed.length / COMPLETED_PER_PAGE);
    return Math.min(COMPLETED_MAX_PAGES, Math.max(1, pages || 1));
  }, [completed]);

  const safeCompletedPage = Math.min(completedPage, totalCompletedPages);

  const pagedCompleted = useMemo(() => {
    const start = (safeCompletedPage - 1) * COMPLETED_PER_PAGE;
    return completed.slice(start, start + COMPLETED_PER_PAGE);
  }, [completed, safeCompletedPage]);

  if (!ready) return <Skeleton />;

  const user = data?.user || {};
  const stats = data?.stats || {};
  const inProgress = data?.in_progress || [];
  const rank = data?.rank_progress || {};
  const displayRank = rank.rank || user.current_rank || "Novice";
  const crystalId = user.username || "Learner";
  const progress = Math.round(stats.overall_progress || 0);

  const openCourse = (course) => {
    navigate(`/courses/${course.slug || course.course_id}`);
  };

  return (
    <div className="db">
      <Navbar user={{ ...user, current_rank: displayRank }} />

      <section className="db-hero">
        <div className="db-hero-copy">
          <h1>Welcome back, {crystalId}</h1>
          <p>Stay focused, keep learning.</p>
          <div className="db-actions">
            <button
              className="db-btn"
              onClick={() => {
                if (inProgress[0]) return openCourse(inProgress[0]);
                if (completed[0]) return openCourse(completed[0]);
                navigate("/courses");
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 0-3 3z" />
                <path d="M5 4.5A3 3 0 0 0 8 7.5v15" />
              </svg>
              Continue Learning
            </button>
            <button className="db-btn ghost" onClick={() => navigate("/courses")}>
              Explore Courses
            </button>
          </div>
        </div>

        <img className="db-hero-crystal" src={academyLogo} alt="" />

        <aside className="db-streak">
          <div className="db-streak-top">Fire Streak</div>
          <strong>{formatDays(stats.current_streak)}</strong>
          <small>Keep the streak alive!</small>
        </aside>
      </section>

      {error ? (
        <p className="db-empty" style={{ width: "min(1180px, calc(100% - 32px))", margin: "0 auto 16px" }}>
          {error}
        </p>
      ) : null}

      <section className="db-stats">
        <article>
          <img src={iconBook} alt="" />
          <div>
            <small>Courses Enrolled</small>
            <b>{stats.total_courses || 0}</b>
            <em>Active journeys</em>
          </div>
        </article>

        <article>
          <span className="db-ring">
            <svg viewBox="0 0 36 36">
              <path d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 1 1 0-31" />
              <path
                style={{ strokeDasharray: `${progress}, 100` }}
                d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 1 1 0-31"
              />
            </svg>
          </span>
          <div>
            <small>Completion %</small>
            <b>{progress}%</b>
            <em>Overall progress</em>
          </div>
        </article>

        <article>
          <img src={iconClock} alt="" />
          <div>
            <small>Total Study Time</small>
            <b>{formatTime(stats.total_study_minutes)}</b>
            <em>Keep going!</em>
          </div>
        </article>

        <article>
          <img src={rankImage(displayRank)} alt="" />
          <div>
            <small>Current Rank</small>
            <b>{displayRank}</b>
            <em>Level {rank.level || 1}</em>
          </div>
        </article>

        <article>
          <img src={iconCert} alt="" />
          <div>
            <small>Certificates</small>
            <b>{stats.certificates_earned || 0}</b>
            <em>Track certs</em>
          </div>
        </article>
      </section>

      <section className="db-main">
        <div className="db-left">
          <div className="db-card db-equal">
            <div className="db-card-head">
              <h2>In Progress</h2>
              <button className="db-link" type="button" onClick={() => navigate("/courses")}>
                View All
              </button>
            </div>
            <div className="db-card-body">
              {inProgress.length === 0 ? (
                <p className="db-empty">No course in progress. Start or continue from Courses.</p>
              ) : (
                inProgress.map((course) => (
                  <CourseRow
                    key={course.id || course.course_id}
                    course={course}
                    onOpen={openCourse}
                  />
                ))
              )}
            </div>
          </div>

          <div className="db-card db-equal">
            <div className="db-card-head">
              <h2>Completed</h2>
              <small>{completed.length} finished</small>
            </div>
            <div className="db-card-body">
              {completed.length === 0 ? (
                <p className="db-empty">Finish a course to see it here. You can always reopen it.</p>
              ) : (
                pagedCompleted.map((course) => (
                  <CourseRow
                    key={`done-${course.id || course.course_id}`}
                    course={course}
                    done
                    onOpen={openCourse}
                  />
                ))
              )}
            </div>
            {completed.length > 0 ? (
              <div className="db-pager">
                <button
                  type="button"
                  className="db-btn ghost slim"
                  disabled={safeCompletedPage <= 1}
                  onClick={() => setCompletedPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <span>
                  Page {safeCompletedPage} of {totalCompletedPages}
                </span>
                <button
                  type="button"
                  className="db-btn ghost slim"
                  disabled={safeCompletedPage >= totalCompletedPages}
                  onClick={() => setCompletedPage((p) => Math.min(totalCompletedPages, p + 1))}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="db-side">
          <div className="db-card db-mentor-card">
            <div className="db-card-head">
              <h2>Crystal Mentor</h2>
              <button className="db-link" type="button" onClick={() => navigate("/mentor")}>
                Open full chat
              </button>
            </div>
            <div className="db-mentor-box">
              <img src={mentorCrystal} alt="" />
              <p>Hello {crystalId}! Ask about Crystal Stones, a lesson, or your next path.</p>
            </div>
            <div className="db-chat">
              {thread.length === 0 ? (
                <div className="db-chat-empty">
                  <div className="db-brain" aria-hidden="true">
                    <div className="db-brain-spin">
                      <img src={brain} alt="" />
                    </div>
                    <span className="db-particle p1"><BtcIcon /></span>
                    <span className="db-particle p2"><EthIcon /></span>
                    <span className="db-particle p3"><CrystalCoin /></span>
                    <span className="db-particle p4"><PiIcon /></span>
                    <span className="db-particle p5"><SumIcon /></span>
                    <span className="db-particle p6"><RootIcon /></span>
                  </div>
                  <p>Your conversation will appear here.</p>
                </div>
              ) : (
                thread.slice(-8).map((item) => (
                  <div key={`${item.role}-${item.at}-${item.text}`} className={`db-bubble ${item.role}`}>
                    {item.text}
                  </div>
                ))
              )}
            </div>
            <form className="db-mentor-form" onSubmit={askMentor}>
              <input
                value={mentorInput}
                onChange={(e) => setMentorInput(e.target.value)}
                placeholder="Ask me anything..."
                maxLength={500}
              />
              <button type="submit" disabled={mentorBusy}>
                {mentorBusy ? "..." : "➤"}
              </button>
            </form>
          </div>

          <div className="db-card db-rank-card">
            <div className="db-card-head">
              <h2>Rank Progress</h2>
              <small>Level {rank.level || 1}</small>
            </div>
            <div className="db-rankbox">
              <div>
                <b>{displayRank}</b>
                <small>
                  {rank.xp_into || 0} / {rank.xp_target || 100} XP
                </small>
              </div>
              <img src={rankImage(displayRank)} alt="" />
            </div>
            <div className="db-bar wide">
              <span style={{ width: `${rank.percent || 0}%` }} />
            </div>
            <p className="db-rank-note">
              {rank.remaining || 0} XP until {rank.next_rank || "next rank"}
            </p>
          </div>

          <div className="db-card db-board-card">
            <div className="db-card-head">
              <h2>Leaderboard</h2>
              <small>
                {board?.you?.place ? `You #${board.you.place}` : `${board?.total || 0} learners`}
              </small>
            </div>
            {!board?.rows?.length ? (
              <p className="db-empty">Rankings appear as learners earn XP.</p>
            ) : (
              <ul className="db-board-list">
                {board.rows.map((row) => (
                  <BoardRow key={`${row.user_id}-${row.place}`} row={row} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}