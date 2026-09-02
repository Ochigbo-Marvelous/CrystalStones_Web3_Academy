import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import crystalBasic from "../assets/brand/crystal-basic-blue.png";
import crystalIntermediate from "../assets/brand/crystal-intermediate-red.png";
import crystalAdvanced from "../assets/brand/crystal-advanced-green.png";
import mentorCrystal from "../assets/brand/crystal-hero.png";
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

function CourseRow({ course, done, onOpen }) {
  const pct = done ? 100 : Math.round(course.progress_percent || 0);
  return (
    <div className="db-progress-row">
      <img src={course.thumbnail || crystalForLevel(course.level)} alt="" />
      <div>
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const started = Date.now();

    fetch(`${API}/api/dashboard`, { headers })
      .then((res) => res.json())
      .then((dash) => {
        if (!dash.success) throw new Error(dash.message || "Dashboard failed");
        setData(dash.data);
        if (dash.data?.user) {
          localStorage.setItem("user", JSON.stringify(dash.data.user));
          setThread(readMentorThread(dash.data.user.id));
        }
      })
      .catch((err) => {
        if (String(err.message).toLowerCase().includes("not authorized")) {
          localStorage.removeItem("token");
          navigate("/signin", { replace: true });
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
  const inProgress = useMemo(() => data?.in_progress || [], [data]);
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

        <img className="db-hero-crystal" src={crystalBasic} alt="" />

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
          <div className="db-card db-equal db-progress-card">
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

          <div className="db-card db-equal db-completed-card">
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
                <p className="db-chat-empty">Your conversation will appear here.</p>
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
        </div>
      </section>
    </div>
  );
}