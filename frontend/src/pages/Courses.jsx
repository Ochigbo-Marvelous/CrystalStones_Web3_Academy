import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import crystal01 from "../assets/brand/crystal-01-blue.png";
import crystal02 from "../assets/brand/crystal-02-cyan.png";
import crystal03 from "../assets/brand/crystal-03-teal.png";
import crystal04 from "../assets/brand/crystal-04-green.png";
import crystal05 from "../assets/brand/crystal-05-gold.png";
import crystal06 from "../assets/brand/crystal-06-orange.png";
import crystal07 from "../assets/brand/crystal-07-red.png";
import crystal08 from "../assets/brand/crystal-08-magenta.png";
import "../styles/dashboard.css";
import "../styles/courses.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

const CRYSTALS = [
  crystal01, crystal06, crystal08, crystal02,
  crystal07, crystal03, crystal05, crystal04,
];

const CRYSTAL_BY_SLUG = {
  "crypto-foundations": crystal01,
};

const crystalFor = (course) => {
  if (course.thumbnail) return course.thumbnail;
  if (CRYSTAL_BY_SLUG[course.slug]) return CRYSTAL_BY_SLUG[course.slug];
  return CRYSTALS[(Number(course.id) || 0) % CRYSTALS.length];
};

const levelLabel = (level) => {
  if (level === "beginner") return "Beginner";
  if (level === "intermediate") return "Intermediate";
  if (level === "advanced") return "Advanced";
  return level;
};

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 5.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 0-3 3z" />
      <path d="M5 5.5A3 3 0 0 0 8 8.5V21" />
    </svg>
  );
}
function IconLayers() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8.5 12 4l8 4.5-8 4.5z" />
      <path d="M4 12.5 12 17l8-4.5" />
      <path d="M4 16.5 12 21l8-4.5" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 3 6 13h6l-1 8 7-10h-6z" />
    </svg>
  );
}

const CATEGORIES = [
  { value: "all", label: "All Courses", Icon: IconGrid },
  { value: "beginner", label: "Basic", Icon: IconBook },
  { value: "intermediate", label: "Intermediate", Icon: IconLayers },
  { value: "advanced", label: "Advanced", Icon: IconBolt },
];

function Skeleton() {
  return (
    <div className="db sk-screen">
      <div className="sk sk-nav" />
      <div className="sk sk-hero" />
      <div className="sk-main">
        <span className="sk" />
        <span className="sk" />
      </div>
    </div>
  );
}

export default function Courses() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    const started = Date.now();
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/api/auth/me`, { headers }).then((res) => res.json()),
      fetch(`${API}/api/courses`, { headers }).then((res) => res.json()),
      fetch(`${API}/api/enrollments`, { headers }).then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error("Not authorized");
        return json;
      }),
    ])
      .then(([me, list, enrolled]) => {
        if (me?.data?.user) setUser(me.data.user);
        if (!list.success) throw new Error(list.message || "Could not load courses");
        setCourses(list.data || []);

        const map = {};
        (enrolled.data || []).forEach((row) => {
          map[Number(row.course_id)] = {
            percent: Number(row.progress_percent || 0),
            status: row.status || "active",
          };
        });
        setProgressMap(map);
      })
      .catch((err) => {
        if (String(err.message).toLowerCase().includes("not authorized")) {
          localStorage.removeItem("token");
          navigate("/signin", { replace: true });
          return;
        }
        setError(err.message || "Could not load courses");
      })
      .finally(() => {
        const wait = Math.max(0, 1000 - (Date.now() - started));
        setTimeout(() => setReady(true), wait);
      });
  }, [navigate]);

  const counts = useMemo(
    () => ({
      all: courses.length,
      beginner: courses.filter((item) => item.level === "beginner").length,
      intermediate: courses.filter((item) => item.level === "intermediate").length,
      advanced: courses.filter((item) => item.level === "advanced").length,
    }),
    [courses]
  );

  const visible = useMemo(() => {
    return courses.filter((course) => {
      const hay = `${course.title} ${course.description || ""}`.toLowerCase();
      const matchQuery = hay.includes(query.trim().toLowerCase());
      const matchCategory = category === "all" || course.level === category;
      return matchQuery && matchCategory;
    });
  }, [courses, query, category]);

  const openCourse = (course) => {
    if (course.level === "advanced") return;
    const progress = progressMap[Number(course.id)];
    if (course.is_paid && !progress) {
      navigate(`/checkout/${course.id}`);
      return;
    }
    navigate(`/courses/${course.slug}`);
  };

  if (!ready) return <Skeleton />;

  return (
    <div className="db">
      <Navbar user={user} />

      <section className="cs-top">
        <div className="cs-top-copy">
          <h1>Courses</h1>
          <p>Expand your knowledge. Master the crystals.</p>
        </div>
        <label className="cs-search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16.2 16.2 20 20" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses..."
          />
        </label>
      </section>

      {error ? <p className="db-empty cs-error">{error}</p> : null}

      <div className="cs-layout">
        <aside className="cs-side">
          <h3>Categories</h3>
          <div className="cs-side-list">
            {CATEGORIES.map((item) => {
              const Icon = item.Icon;
              return (
                <button
                  key={item.value}
                  type="button"
                  className={category === item.value ? "active" : ""}
                  onClick={() => setCategory(item.value)}
                >
                  <span className="cs-side-label">
                    <Icon />
                    {item.label}
                  </span>
                  <b>{counts[item.value]}</b>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="cs-grid">
          {visible.length === 0 ? (
            <p className="db-empty">No courses in this filter yet.</p>
          ) : (
            visible.map((course) => {
              const progress = progressMap[Number(course.id)];
              const pct = Math.round(progress?.percent || 0);
              const enrolled = Boolean(progress);
              const done = progress?.status === "completed" || pct >= 100;
              const soon = course.level === "advanced";
              return (
                <article
                  className={`cs-card${soon ? " is-soon" : ""}${done ? " is-done" : ""}`}
                  key={course.id}
                  onClick={() => openCourse(course)}
                >
                  <img src={crystalFor(course)} alt="" />
                  <div className="cs-card-copy">
                    <h3>{course.title}</h3>
                    <small>{levelLabel(course.level)}</small>
                    {soon ? (
                      <p>Coming soon</p>
                    ) : enrolled ? (
                      <>
                        <p>{done ? "Completed" : `${pct}% Complete`}</p>
                        <div className="cs-bar">
                          <span style={{ width: `${done ? 100 : Math.max(pct, 4)}%` }} />
                        </div>
                      </>
                    ) : (
                      <>
                        <p>{course.is_paid ? `$${course.price_usd}` : "Free"}</p>
                        <div className="cs-bar">
                          <span style={{ width: "0%" }} />
                        </div>
                      </>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}