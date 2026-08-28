import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import crystal from "../assets/brand/hero-crystal.png";
import mentorCrystal from "../assets/brand/crystal-hero.png";
import iconBook from "../assets/brand/icon-book.png";
import iconClock from "../assets/brand/icon-clock.png";
import iconCert from "../assets/brand/icon-cert.png";
import { rankImage } from "../lib/rankAssets";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
const MENTOR_KEY = "mentor_thread";

const formatTime = (mins = 0) => {
  const n = Number(mins) || 0;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

const readThread = () => {
  try {
    return JSON.parse(localStorage.getItem(MENTOR_KEY) || "[]");
  } catch {
    return [];
  }
};

function Skeleton() {
  return (
    <div className="db">
      <div className="sk sk-nav" />
      <div className="sk sk-hero" />
      <div className="sk-stats">
        <span className="sk" />
        <span className="sk" />
        <span className="sk" />
        <span className="sk" />
        <span className="sk" />
      </div>
      <div className="sk-main">
        <span className="sk" />
        <span className="sk" />
      </div>
      <div className="sk sk-find" />
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");
  const [error, setError] = useState("");
  const [mentorInput, setMentorInput] = useState("");
  const [mentorBusy, setMentorBusy] = useState(false);
  const [thread, setThread] = useState(readThread);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/api/dashboard`, { headers }).then((res) => res.json()),
      fetch(`${API}/api/courses`, { headers }).then((res) => res.json()),
    ])
      .then(([dash, list]) => {
        if (!dash.success) throw new Error(dash.message || "Dashboard failed");
        setData(dash.data);
        setCourses(list.data || []);
        if (dash.data?.user) {
          localStorage.setItem("user", JSON.stringify(dash.data.user));
        }
      })
      .catch((err) => {
        if (String(err.message).toLowerCase().includes("not authorized")) {
          localStorage.removeItem("token");
          navigate("/signin", { replace: true });
          return;
        }
        setError(err.message || "Could not load dashboard");
      });
  }, [navigate]);

  const filtered = useMemo(() => {
    return courses.filter((course) => {
      const matchLevel = level === "all" || course.level === level;
      const matchQuery = course.title.toLowerCase().includes(query.toLowerCase());
      return matchLevel && matchQuery;
    });
  }, [courses, level, query]);

  const openCourse = (course) => {
    if (course.is_paid) {
      navigate(`/checkout/${course.id}`);
      return;
    }
    navigate(`/courses/${course.slug || course.id}`);
  };

  const saveThread = (next) => {
    const clipped = next.slice(-40);
    localStorage.setItem(MENTOR_KEY, JSON.stringify(clipped));
    setThread(clipped);
  };

  const askMentor = async (event) => {
    event.preventDefault();
    const question = mentorInput.trim();
    if (!question || mentorBusy) return;

    const token = localStorage.getItem("token");
    setMentorBusy(true);

    const pending = [...thread, { role: "user", text: question, at: Date.now() }];
    saveThread(pending);
    setMentorInput("");

    try {
      const res = await fetch(`${API}/api/mentor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      const answer = json?.data?.answer || json.message || "I could not find an answer yet.";
      saveThread([...pending, { role: "mentor", text: answer, at: Date.now() }]);
    } catch {
      saveThread([...pending, { role: "mentor", text: "Mentor is unavailable right now.", at: Date.now() }]);
    } finally {
      setMentorBusy(false);
    }
  };

  if (!data && !error) return <Skeleton />;

  const user = data?.user || {};
  const stats = data?.stats || {};
  const inProgress = data?.in_progress || [];
  const rank = data?.rank_progress || {};
  const firstName = (user.full_name || user.username || "Learner").split(" ")[0];
  const progress = Math.round(stats.overall_progress || 0);

  return (
    <div className="db">
      <Navbar user={user} />

      <section className="db-hero">
        <div className="db-hero-copy">
          <h1>Welcome back, {firstName}</h1>
          <p>Stay focused, keep learning.</p>
          <div className="db-actions">
            <button
              className="db-btn"
              onClick={() => document.getElementById("course-search")?.scrollIntoView({ behavior: "smooth" })}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 0-3 3z" />
                <path d="M5 4.5A3 3 0 0 0 8 7.5v15" />
              </svg>
              Continue Learning
            </button>
            <button
              className="db-btn ghost"
              onClick={() => document.getElementById("course-search")?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore Courses
            </button>
          </div>
        </div>

        <img className="db-hero-crystal" src={crystal} alt="" />

        <aside className="db-streak">
          <div className="db-streak-top">Fire Streak</div>
          <strong>{stats.current_streak || 0} days</strong>
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
          <img src={rankImage(user.current_rank)} alt="" />
          <div>
            <small>Current Rank</small>
            <b>{user.current_rank || "Novice"}</b>
            <em>Level {rank.level || 1}</em>
          </div>
        </article>

        <article>
          <img src={iconCert} alt="" />
          <div>
            <small>Certificates</small>
            <b>{stats.certificates_earned || 0}</b>
            <em>Earned</em>
          </div>
        </article>
      </section>

      <section className="db-main">
        <div className="db-card">
          <div className="db-card-head">
            <h2>In Progress</h2>
            <button className="db-link" type="button" onClick={() => navigate("/courses")}>
              View All
            </button>
          </div>
          {inProgress.length === 0 ? (
            <p className="db-empty">No course in progress yet. Start with a Basic course below.</p>
          ) : (
            inProgress.map((course) => {
              const pct = Math.round(course.progress_percent || 0);
              return (
                <div className="db-progress-row" key={course.id || course.course_id}>
                  <img src={course.thumbnail || crystal} alt="" />
                  <div>
                    <b>{course.title}</b>
                    <small>{course.level === "beginner" ? "Basic" : course.level}</small>
                  </div>
                  <div className="db-progress-meta">
                    <div className="db-bar">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <em>{pct}% Complete</em>
                  </div>
                  <button
                    className="db-btn slim"
                    type="button"
                    onClick={() => navigate(`/courses/${course.slug || course.course_id}`)}
                  >
                    Continue
                  </button>
                </div>
              );
            })
          )}
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
              <p>Hello {firstName}! Ask about Crystal Stones, a lesson, or your next path.</p>
            </div>
            <div className="db-chat">
              {thread.length === 0 ? (
                <p className="db-chat-empty">Your conversation will appear here.</p>
              ) : (
                thread.slice(-8).map((item) => (
                  <div key={`${item.role}-${item.at}`} className={`db-bubble ${item.role}`}>
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
                <b>{rank.rank || user.current_rank || "Novice"}</b>
                <small>
                  {rank.xp_into || 0} / {rank.xp_target || 100} XP
                </small>
              </div>
              <img src={rankImage(rank.rank || user.current_rank)} alt="" />
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

      <section className="db-finder" id="course-search">
        <h2>Find a course</h2>
        <div className="db-finder-controls">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses"
          />
          <div className="db-filters">
            {[
              ["all", "All"],
              ["beginner", "Basic"],
              ["intermediate", "Intermediate"],
              ["advanced", "Advanced"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={level === value ? "active" : ""}
                onClick={() => setLevel(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="db-course-grid">
          {filtered.length === 0 ? (
            <p className="db-empty">No courses match that search.</p>
          ) : (
            filtered.map((course) => (
              <article
                className="db-course"
                key={course.id}
                onClick={() => openCourse(course)}
                style={{ cursor: "pointer" }}
              >
                <img src={crystal} alt="" />
                <h3>{course.title}</h3>
                <small>{course.level === "beginner" ? "Basic" : course.level}</small>
                <p>{course.is_paid ? `$${course.price_usd}` : "Free"}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}