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

const PLANNED = {
  beginner: [
    { slug: "crypto-foundations", title: "Crypto Foundations" },
    { slug: "wallets-keys-self-custody", title: "Wallets, Keys & Self-Custody" },
    { slug: "exchanges-first-buy", title: "Exchanges & Your First Buy" },
    { slug: "bnb-smart-chain-beginners", title: "Blockchain & BNB Smart Chain for Beginners" },
    { slug: "crypto-safety-scams", title: "Crypto Safety & Common Scams" },
  ],
  intermediate: [
    { slug: "ethereum-smart-contracts", title: "Ethereum, Smart Contracts & Tokens" },
    { slug: "defi-decentralized-finance", title: "DeFi & Decentralized Finance" },
    { slug: "tokenomics", title: "Tokenomics — How Coins Are Designed" },
    { slug: "trading-markets", title: "Trading & Markets" },
    { slug: "nfts-digital-assets", title: "NFTs & Digital Assets" },
    { slug: "daos-governance", title: "DAOs & Governance" },
    { slug: "rwa-specialization", title: "Real-World Assets (RWA)" },
    { slug: "crystal-stones-ecosystem", title: "Crystal Stones Ecosystem" },
  ],
  advanced: [
    { slug: "web3-architecture", title: "Web3 Architecture" },
    { slug: "security-specialization", title: "Security Specialization" },
    { slug: "on-chain-research", title: "On-Chain Research" },
    { slug: "regulation-industry", title: "Regulation & Industry" },
    { slug: "build-your-own-token", title: "Building Your Own Token" },
    { slug: "practical-capstone", title: "Practical Capstone" },
  ],
};

const crystalFor = (course, index = 0) => {
  if (course.thumbnail) return course.thumbnail;
  if (CRYSTAL_BY_SLUG[course.slug]) return CRYSTAL_BY_SLUG[course.slug];
  return CRYSTALS[(Number(course.id) || index) % CRYSTALS.length];
};

const levelLabel = (level) => {
  if (level === "beginner") return "Basic";
  if (level === "intermediate") return "Intermediate";
  if (level === "advanced") return "Advanced";
  return level;
};

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

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

function CourseCard({ course, progress, locked, soon, crystalImg, onOpen }) {
  const pct = Math.round(progress?.percent || 0);
  const enrolled = Boolean(progress);
  const done = progress?.status === "completed" || pct >= 100;

  return (
    <article
      className={`cs-card${soon ? " is-soon" : ""}${locked ? " is-locked" : ""}${done ? " is-done" : ""}`}
      onClick={() => onOpen(course)}
    >
      <img src={crystalImg} alt="" />
      <div className="cs-card-copy">
        <h3>{course.title}</h3>
        <small>{levelLabel(course.level)}</small>
        {soon ? (
          <p>Coming soon</p>
        ) : locked ? (
          <p>Locked with this track</p>
        ) : enrolled ? (
          <>
            <p>{done ? "Completed" : `${pct}% Complete`}</p>
            <div className="cs-bar">
              <span style={{ width: `${done ? 100 : Math.max(pct, 4)}%` }} />
            </div>
          </>
        ) : (
          <>
            <p>{course.isLive ? "Free · Enroll" : "Coming online"}</p>
            <div className="cs-bar">
              <span style={{ width: "0%" }} />
            </div>
          </>
        )}
      </div>
      {locked || soon ? (
        <span className="cs-card-lock" aria-hidden="true">
          <IconLock />
        </span>
      ) : null}
    </article>
  );
}

function TrackBox({ title, copy, badge, locked, soon, courses, progressMap, onOpen }) {
  return (
    <section className={`cs-track${locked ? " is-locked" : ""}${soon ? " is-soon" : ""}`}>
      <header className="cs-track-head">
        <div>
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>
        <span className={`cs-track-badge${locked || soon ? " locked" : ""}`}>
          {locked || soon ? <IconLock /> : null}
          {badge}
        </span>
      </header>
      <div className="cs-grid">
        {courses.length === 0 ? (
          <p className="db-empty">No courses in this track yet.</p>
        ) : (
          courses.map((course, index) => (
            <CourseCard
              key={course.slug || course.id}
              course={course}
              progress={progressMap[Number(course.id)]}
              locked={locked && !soon}
              soon={soon || course.preview}
              crystalImg={crystalFor(course, index)}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </section>
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
  const [enrolling, setEnrolling] = useState(false);

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

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byLevel = { beginner: [], intermediate: [], advanced: [] };

    courses.forEach((course) => {
      const hay = `${course.title} ${course.description || ""}`.toLowerCase();
      if (q && !hay.includes(q)) return;
      const level = course.level || "beginner";
      if (byLevel[level]) byLevel[level].push({ ...course, isLive: true });
    });

    Object.keys(PLANNED).forEach((level) => {
      const existing = new Set(byLevel[level].map((item) => item.slug));
      PLANNED[level].forEach((item) => {
        if (existing.has(item.slug)) return;
        if (q && !item.title.toLowerCase().includes(q)) return;
        byLevel[level].push({
          ...item,
          level,
          isLive: false,
          preview: true,
        });
      });
    });

    return byLevel;
  }, [courses, query]);

  const openCourse = async (course) => {
    if (enrolling) return;
    if (course.level === "advanced" || course.preview) return;
    if (course.level === "intermediate") return;

    const token = localStorage.getItem("token");
    const already = progressMap[Number(course.id)];
    if (already) {
      navigate(`/courses/${course.slug}`);
      return;
    }

    setEnrolling(true);
    try {
      const res = await fetch(`${API}/api/enrollments/${course.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 409) {
        throw new Error(json.message || "Could not enroll");
      }
      navigate(`/courses/${course.slug}`);
    } catch (err) {
      setError(err.message || "Could not enroll");
    } finally {
      setEnrolling(false);
    }
  };

  if (!ready) return <Skeleton />;

  return (
    <div className="db">
      <Navbar user={user} />

      <section className="cs-top">
        <div className="cs-top-copy">
          <h1>Courses</h1>
          <p>Learn by track. Unlock a level, then pick any course inside it.</p>
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

      <div className="cs-tracks">
        <TrackBox
          title="Basic"
          copy="Free for every learner. Start here if you're new to crypto."
          badge="Unlocked"
          courses={grouped.beginner}
          progressMap={progressMap}
          onOpen={openCourse}
        />
        <TrackBox
          title="Intermediate"
          copy="One payment unlocks every course in this track. Price in USD, paid as USDT on BNB Smart Chain (BEP-20)."
          badge="Locked · Price TBA"
          locked
          courses={grouped.intermediate}
          progressMap={progressMap}
          onOpen={openCourse}
        />
        <TrackBox
          title="Advanced"
          copy="Video lessons and the builder path. One payment unlocks every course in this track. Price in USD, paid as USDT on BNB Smart Chain (BEP-20)"
          badge="Coming soon"
          locked
          soon
          courses={grouped.advanced}
          progressMap={progressMap}
          onOpen={openCourse}
        />
      </div>
    </div>
  );
}