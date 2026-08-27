import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import crystal from "../assets/brand/crystal-hero.png";
import logo from "../assets/brand/logo-hex.png";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

const formatTime = (mins = 0) => {
  const n = Number(mins) || 0;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

function Navbar({ user }) {
  return (
    <header className="db-nav">
      <div className="db-brand">
        <img src={logo} alt="" />
        <div>
          <strong>Crystal Stones Academy</strong>
          <span>Forge Knowledge. Achieve Mastery.</span>
        </div>
      </div>

      <nav className="db-pills">
        <NavLink to="/dashboard" end>Dashboard</NavLink>
        <NavLink to="/courses">Courses</NavLink>
        <NavLink to="/mentor">Crystal Mentor</NavLink>
        <NavLink to="/achievements">Achievements</NavLink>
        <NavLink to="/profile">Profile</NavLink>
      </nav>

      <div className="db-user">
        <div className="db-user-meta">
          <b>{user?.full_name || user?.username || "Learner"}</b>
          <small>{user?.current_rank || "Novice"}</small>
        </div>
        <div className="db-avatar">
          {user?.avatar ? <img src={user.avatar} alt="" /> : (user?.username || "U").slice(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

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

  if (!data && !error) return <Skeleton />;

  const user = data?.user || {};
  const stats = data?.stats || {};
  const inProgress = data?.in_progress || [];
  const firstName = (user.full_name || user.username || "Learner").split(" ")[0];

  return (
    <div className="db">
      <Navbar user={user} />

      <section className="db-hero">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <p>Stay focused, keep learning.</p>
          <div className="db-actions">
            <button
              className="db-btn"
              onClick={() => document.getElementById("course-search")?.scrollIntoView({ behavior: "smooth" })}
            >
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
          <span>Fire Streak</span>
          <strong>{stats.current_streak || 0} days</strong>
          <small>Keep the streak alive</small>
        </aside>
      </section>

      {error ? (
        <p className="db-empty" style={{ width: "min(1180px, calc(100% - 32px))", margin: "0 auto 16px" }}>
          {error}
        </p>
      ) : null}

      <section className="db-stats">
        <article><small>Courses Enrolled</small><b>{stats.total_courses || 0}</b></article>
        <article><small>Completion %</small><b>{Math.round(stats.overall_progress || 0)}%</b></article>
        <article><small>Total Study Time</small><b>{formatTime(stats.total_study_minutes)}</b></article>
        <article><small>Current Rank</small><b>{user.current_rank || "Novice"}</b></article>
        <article><small>Certificates</small><b>{stats.certificates_earned || 0}</b></article>
      </section>

      <section className="db-main">
        <div className="db-card">
          <div className="db-card-head"><h2>In Progress</h2></div>
          {inProgress.length === 0 ? (
            <p className="db-empty">No course in progress yet. Start with a Basic course below.</p>
          ) : (
            inProgress.map((course) => (
              <div className="db-row" key={course.id || course.course_id}>
                <div>
                  <b>{course.title}</b>
                  <div className="db-empty">{course.level}</div>
                </div>
                <div className="db-bar">
                  <span style={{ width: `${Math.round(course.progress_percent || 0)}%` }} />
                </div>
                <span>{Math.round(course.progress_percent || 0)}%</span>
              </div>
            ))
          )}
        </div>

        <div className="db-card">
          <div className="db-card-head">
            <h2>Crystal Mentor</h2>
            <small>Online</small>
          </div>
          <p className="db-mentor">
            Hello {firstName}. Ask me about Crystal Stones, courses, or your next lesson.
          </p>
          <button className="db-btn" onClick={() => navigate("/mentor")}>Open Mentor</button>
          <div style={{ marginTop: 18 }}>
            <small className="db-empty">Rank</small>
            <h2>{user.current_rank || "Novice"}</h2>
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
              <article className="db-course" key={course.id}>
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