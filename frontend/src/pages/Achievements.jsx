import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "../styles/dashboard.css";
import "../styles/achievements.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

const BADGE_KIND = {
  complete_first_module: "star",
  complete_first_course: "ribbon",
  complete_3_modules: "hex",
  complete_10_modules: "hex",
  streak_3: "shield",
  streak_7: "flame",
  complete_3_courses: "ribbon",
  complete_all_courses: "trophy",
  quizzes_5: "spark",
  quiz_perfect: "star",
  track_basic: "crystal",
  track_intermediate: "crystal",
  track_advanced: "crystal",
};

const KIND_COLOR = {
  star: { earned: "#f0c14b", progress: "#4da3ff", locked: "#5b6780" },
  ribbon: { earned: "#e8a23c", progress: "#4da3ff", locked: "#5b6780" },
  shield: { earned: "#3ecf8e", progress: "#4da3ff", locked: "#5b6780" },
  flame: { earned: "#ff5a4d", progress: "#4da3ff", locked: "#5b6780" },
  hex: { earned: "#4da3ff", progress: "#6aa8ff", locked: "#5b6780" },
  spark: { earned: "#7ab8ff", progress: "#4da3ff", locked: "#5b6780" },
  trophy: { earned: "#f0c14b", progress: "#4da3ff", locked: "#5b6780" },
  crystal: { earned: "#5ad0ff", progress: "#4da3ff", locked: "#5b6780" },
  medal: { earned: "#c5cde0", progress: "#4da3ff", locked: "#5b6780" },
};

const TRACKS = [
  {
    key: "beginner",
    aliases: ["beginner", "basic"],
    title: "Basic Track",
    hint: "Awarded after every live Basic course is complete.",
  },
  {
    key: "intermediate",
    aliases: ["intermediate"],
    title: "Intermediate Track",
    hint: "Awarded after the Intermediate track is unlocked and finished.",
  },
  {
    key: "advanced",
    aliases: ["advanced"],
    title: "Advanced Track",
    hint: "Coming soon. One certificate when the track goes live and is finished.",
  },
];

function BadgeSvg({ kind = "star", tone = "locked" }) {
  const fill = KIND_COLOR[kind]?.[tone] || KIND_COLOR.star[tone];
  const dark = "#07111f";

  if (kind === "shield") {
    return (
      <svg className="ach-badge" viewBox="0 0 72 72" aria-hidden="true">
        <path fill={fill} d="M36 8l22 8v18c0 14-9 24-22 30C23 58 14 48 14 34V16z" />
        <path fill={dark} d="M36 14l16 6v14c0 10-6.5 17.5-16 22-9.5-4.5-16-12-16-22V20z" />
        <path
          d="M31 36.5l4 4 8-10"
          fill="none"
          stroke={fill}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "ribbon") {
    return (
      <svg className="ach-badge" viewBox="0 0 72 72" aria-hidden="true">
        <path fill={fill} d="M24 46l-6 18 18-8 18 8-6-18z" />
        <circle cx="36" cy="30" r="18" fill={fill} />
        <circle cx="36" cy="30" r="12" fill={dark} />
        <path fill={fill} d="M36 20l3.2 6.6 7.3 1.1-5.3 5.1 1.3 7.3L36 36.6l-6.5 3.5 1.3-7.3-5.3-5.1 7.3-1.1z" />
      </svg>
    );
  }

  if (kind === "hex" || kind === "crystal") {
    return (
      <svg className="ach-badge" viewBox="0 0 72 72" aria-hidden="true">
        <path fill={fill} d="M36 8l20 12v20L36 52 16 40V20z" />
        <path fill={dark} d="M36 16l13 8v14L36 46 23 38V24z" />
        <path fill={fill} d="M36 20l8 5v10l-8 5-8-5V25z" />
      </svg>
    );
  }

  if (kind === "flame") {
    return (
      <svg className="ach-badge" viewBox="0 0 72 72" aria-hidden="true">
        <path fill={fill} d="M36 8c8 10 18 16 18 30a18 18 0 1 1-36 0c0-8 6-16 10-22 2 8 8 10 8 18 0-12 0-20 0-26z" />
        <path fill={dark} d="M36 28c5 4 9 8 9 14a9 9 0 1 1-18 0c0-4 3-8 5-11 1 4 4 5 4 9 0-6 0-9 0-12z" />
      </svg>
    );
  }

  if (kind === "spark") {
    return (
      <svg className="ach-badge" viewBox="0 0 72 72" aria-hidden="true">
        <path fill={fill} d="M36 6l6 18 18 6-18 6-6 18-6-18-18-6 18-6z" />
        <circle cx="36" cy="30" r="7" fill={dark} />
      </svg>
    );
  }

  if (kind === "trophy") {
    return (
      <svg className="ach-badge" viewBox="0 0 72 72" aria-hidden="true">
        <path fill={fill} d="M22 16h28v10c0 10-6 16-14 16s-14-6-14-16z" />
        <path fill={fill} d="M18 18h6v8c-6 1-8-3-6-8zm30 0h6c2 5 0 9-6 8z" />
        <rect x="32" y="42" width="8" height="8" fill={fill} />
        <rect x="24" y="50" width="24" height="6" rx="2" fill={fill} />
        <circle cx="36" cy="26" r="6" fill={dark} />
      </svg>
    );
  }

  return (
    <svg className="ach-badge" viewBox="0 0 72 72" aria-hidden="true">
      <path
        fill={fill}
        d="M36 6l8.2 16.6 18.3 2.7-13.2 12.9 3.1 18.2L36 47.8 19.6 56.4l3.1-18.2L9.5 25.3l18.3-2.7z"
      />
      <circle cx="36" cy="30" r="9" fill={dark} />
      <path fill={fill} d="M36 24l2.4 4.8 5.3.8-3.8 3.7.9 5.3L36 36.1l-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z" />
    </svg>
  );
}

function StatStar({ gold }) {
  return (
    <svg className="ach-stat-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill={gold ? "#f0c14b" : "#4da3ff"}
        d="M12 2.4l2.5 5.2 5.7.8-4.1 4 .9 5.7L12 15.4 6.9 18.1l.9-5.7-4.1-4 5.7-.8z"
      />
    </svg>
  );
}

function StatHex() {
  return (
    <svg className="ach-stat-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4da3ff" d="M12 2.2 20 7v10l-8 4.8L4 17V7z" />
      <path fill="#07111f" d="M12 5.2 17.2 8.2v7.6L12 18.8 6.8 15.8V8.2z" />
      <path fill="#4da3ff" d="M12 8.1 14.6 9.6v3.1L12 14.2 9.4 12.7V9.6z" />
    </svg>
  );
}

function CompletionRing({ value }) {
  const r = 10;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const offset = c - (pct / 100) * c;
  return (
    <svg className="ach-ring" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r={r} fill="none" stroke="#1b2a44" strokeWidth="3.4" />
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        stroke="#4da3ff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 14 14)"
      />
    </svg>
  );
}

function IconAll() {
  return (
    <svg className="ach-side-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  );
}
function IconEarned() {
  return (
    <svg className="ach-side-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M8 4h8v8c0 4-2.2 6.5-4 8-1.8-1.5-4-4-4-8z" />
      <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M10 9.5l1.6 1.6L14.5 8" />
    </svg>
  );
}
function IconProgress() {
  return (
    <svg className="ach-side-ico" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M12 8v4l3 2" />
    </svg>
  );
}
function IconLocked() {
  return (
    <svg className="ach-side-ico" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="11" width="12" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11" />
    </svg>
  );
}

const FILTERS = [
  ["all", "All Achievements", IconAll],
  ["earned", "Earned", IconEarned],
  ["in_progress", "In Progress", IconProgress],
  ["locked", "Locked", IconLocked],
];

function Skeleton() {
  return (
    <div className="db sk-screen">
      <header className="sk-nav-row">
        <span className="sk sk-brand" />
        <span className="sk sk-pills" />
        <span className="sk sk-user" />
      </header>

      <section className="ach-page">
        <div className="ach-top">
          <div className="ach-hero">
            <span className="sk ach-sk-title" />
            <span className="sk ach-sk-sub" />
          </div>
          <div className="ach-stats">
            <span className="sk ach-sk-stat" />
            <span className="sk ach-sk-stat" />
            <span className="sk ach-sk-stat" />
            <span className="sk ach-sk-stat" />
          </div>
        </div>

        <div className="ach-certs">
          <span className="sk ach-sk-head" />
          <div className="ach-cert-grid">
            <span className="sk ach-sk-cert" />
            <span className="sk ach-sk-cert" />
            <span className="sk ach-sk-cert" />
          </div>
        </div>

        <div className="ach-layout">
          <aside className="ach-side">
            <span className="sk ach-sk-side-h" />
            <span className="sk ach-sk-side-item" />
            <span className="sk ach-sk-side-item" />
            <span className="sk ach-sk-side-item" />
            <span className="sk ach-sk-side-item" />
          </aside>
          <div className="ach-main">
            <span className="sk ach-sk-head" />
            <div className="ach-grid">
              <span className="sk ach-sk-card" />
              <span className="sk ach-sk-card" />
              <span className="sk ach-sk-card" />
              <span className="sk ach-sk-card" />
              <span className="sk ach-sk-card" />
              <span className="sk ach-sk-card" />
              <span className="sk ach-sk-card" />
              <span className="sk ach-sk-card" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Achievements() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [certs, setCerts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const started = Date.now();

    Promise.all([
      fetch(`${API}/api/auth/me`, { headers }).then((res) => res.json()),
      fetch(`${API}/api/achievements`, { headers }).then((res) => res.json()),
      fetch(`${API}/api/profile/certificates`, { headers })
        .then((res) => res.json())
        .catch(() => ({ data: [] })),
    ])
      .then(([me, list, certificateRes]) => {
        if (String(me.message || "").toLowerCase().includes("not authorized")) {
          localStorage.removeItem("token");
          navigate("/signin", { replace: true });
          return;
        }
        setUser(me.data?.user || null);
        setItems(Array.isArray(list.data) ? list.data : []);
        setCerts(Array.isArray(certificateRes.data) ? certificateRes.data : []);
        if (!list.success) setError(list.message || "Could not load achievements");
      })
      .catch(() => setError("Could not load achievements"))
      .finally(() => {
        const wait = Math.max(0, 1000 - (Date.now() - started));
        setTimeout(() => setReady(true), wait);
      });
  }, [navigate]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const stats = useMemo(() => {
    const total = items.length;
    const earned = items.filter((item) => item.status === "earned").length;
    const progress = items.filter((item) => item.status === "in_progress").length;
    const locked = items.filter((item) => item.status === "locked").length;
    const points = items
      .filter((item) => item.status === "earned")
      .reduce((sum, item) => sum + Number(item.points || 0), 0);
    const completion = total ? Math.round((earned / total) * 100) : 0;
    return { total, earned, progress, locked, points, completion };
  }, [items]);

  const counts = {
    all: stats.total,
    earned: stats.earned,
    in_progress: stats.progress,
    locked: stats.locked,
  };

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.status === filter);
  }, [items, filter]);

  const certFor = (track) =>
    certs.find((row) => {
      const level = String(row.level || row.course_level || "").toLowerCase();
      return track.aliases.includes(level);
    });

  if (!ready) return <Skeleton />;

  return (
    <div className="db">
      <Navbar user={user} />
      {toast ? <div className="ach-toast">{toast}</div> : null}
      <section className="ach-page">
        <div className="ach-top">
          <div className="ach-hero">
            <h1>Achievements</h1>
            <p>Celebrate your progress and milestones.</p>
          </div>

          <div className="ach-stats">
            <article>
              <span className="ach-ico">
                <StatStar />
              </span>
              <div>
                <small>Total Achievements</small>
                <b>{stats.total}</b>
              </div>
            </article>
            <article>
              <span className="ach-ico">
                <StatHex />
              </span>
              <div>
                <small>Earned</small>
                <b>{stats.earned}</b>
              </div>
            </article>
            <article>
              <span className="ach-ico ach-ico-ring">
                <CompletionRing value={stats.completion} />
              </span>
              <div>
                <small>Completion</small>
                <b>{stats.completion}%</b>
              </div>
            </article>
            <article>
              <span className="ach-ico">
                <StatStar gold />
              </span>
              <div>
                <small>Points</small>
                <b>{stats.points.toLocaleString()}</b>
              </div>
            </article>
          </div>
        </div>

        <div className="ach-certs">
          <div className="ach-main-head">
            <h2>Track certificates</h2>
            <small>One diploma per level. Download after the full track is complete.</small>
          </div>
          <div className="ach-cert-grid">
            {TRACKS.map((track) => {
              const cert = certFor(track);
              const soon = track.key === "advanced" && !cert;
              return (
                <article key={track.key} className={`ach-cert${cert ? " is-ready" : ""}${soon ? " is-soon" : ""}`}>
                  <BadgeSvg kind={cert ? "trophy" : "medal"} tone={cert ? "earned" : soon ? "locked" : "progress"} />
                  <div>
                    <h3>{track.title}</h3>
                    <p>{cert ? `Code ${cert.certificate_code}` : track.hint}</p>
                  </div>
                  <button
                    type="button"
                    className="ach-cert-btn"
                    disabled={!cert}
                    onClick={() => setToast("Certificate download comes in the next pass.")}
                  >
                    {cert ? "Download" : soon ? "Coming soon" : "Locked"}
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        {error ? <p className="db-empty">{error}</p> : null}

        <div className="ach-layout">
          <aside className="ach-side">
            <h3>Overview</h3>
            {FILTERS.map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                className={filter === key ? "active" : ""}
                onClick={() => setFilter(key)}
              >
                <Icon />
                <span>{label}</span>
                <b>{counts[key]}</b>
              </button>
            ))}
          </aside>

          <div className="ach-main">
            <div className="ach-main-head">
              <h2>Recent Achievements</h2>
            </div>
            {visible.length === 0 ? (
              <p className="db-empty">No achievements in this filter yet.</p>
            ) : (
              <div className="ach-grid">
                {visible.map((item) => {
                  const tone =
                    item.status === "earned"
                      ? "earned"
                      : item.status === "in_progress"
                        ? "progress"
                        : "locked";
                  const kind = BADGE_KIND[item.required_condition] || "star";
                  const pct = item.target
                    ? Math.min(100, Math.round((Number(item.progress || 0) / item.target) * 100))
                    : item.status === "earned"
                      ? 100
                      : 0;
                  return (
                    <article className={`ach-card is-${tone === "progress" ? "progress" : tone}`} key={item.id}>
                      <BadgeSvg kind={kind} tone={tone} />
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      {item.status !== "earned" && item.target ? (
                        <div className="ach-bar">
                          <span style={{ width: `${pct}%` }} />
                        </div>
                      ) : null}
                      <span className="ach-pill">
                        {item.status === "earned"
                          ? "Earned"
                          : item.status === "in_progress"
                            ? `In Progress ${item.progress}/${item.target}`
                            : "Locked"}
                      </span>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}