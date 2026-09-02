import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import crystalBasic from "../assets/brand/crystal-basic-blue.png";
import crystalIntermediate from "../assets/brand/crystal-intermediate-gold.png";
import crystalAdvanced from "../assets/brand/crystal-advanced-green.png";
import "../styles/dashboard.css";
import "../styles/courses.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

const CRYSTAL_BY_LEVEL = {
  beginner: crystalBasic,
  intermediate: crystalIntermediate,
  advanced: crystalAdvanced,
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

const TRACK_ORDER = {
  beginner: PLANNED.beginner.map((item) => item.slug),
  intermediate: PLANNED.intermediate.map((item) => item.slug),
  advanced: PLANNED.advanced.map((item) => item.slug),
};

const crystalFor = (course) => CRYSTAL_BY_LEVEL[course.level] || crystalBasic;

const levelLabel = (level) => {
  if (level === "beginner") return "Basic";
  if (level === "intermediate") return "Intermediate";
  if (level === "advanced") return "Advanced";
  return level;
};

const isModuleDone = (row) => {
  if (!row) return false;
  if (row.completed || row.is_completed || row.passed) return true;
  if (row.status === "completed" || row.status === "passed") return true;
  return Number(row.score || 0) >= 70 || Number(row.progress_percent || 0) >= 100;
};

const isCourseComplete = (progress) => {
  if (!progress) return false;
  if (progress.status === "completed" || progress.status === "passed") return true;
  return Number(progress.percent || 0) >= 100;
};

const courseDoneKey = (courseId) => `csa_course_done_${courseId}`;

const readCourseDone = (courseId) => {
  try {
    return localStorage.getItem(courseDoneKey(courseId)) === "1";
  } catch {
    return false;
  }
};

const markCourseDone = (courseId) => {
  if (!courseId) return;
  try {
    localStorage.setItem(courseDoneKey(courseId), "1");
  } catch {
    /* ignore */
  }
};

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function TrackSkeleton() {
  return (
    <section className="cs-track cs-sk-track">
      <header className="cs-track-head">
        <div>
          <span className="sk cs-sk-h2" />
          <span className="sk cs-sk-copy" />
        </div>
        <span className="sk cs-sk-badge" />
      </header>
      <div className="cs-grid">
        <span className="sk cs-sk-card" />
        <span className="sk cs-sk-card" />
        <span className="sk cs-sk-card cs-sk-wide" />
        <span className="sk cs-sk-card" />
        <span className="sk cs-sk-card" />
      </div>
    </section>
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

      <section className="cs-top">
        <div className="cs-top-copy">
          <span className="sk cs-sk-title" />
          <span className="sk cs-sk-sub" />
        </div>
        <span className="sk cs-sk-search" />
      </section>

      <div className="cs-tracks">
        <TrackSkeleton />
        <TrackSkeleton />
        <TrackSkeleton />
      </div>
    </div>
  );
}

function CourseCard({ course, progress, lockReason, crystalImg, onOpen, priceUsd }) {
  const pct = Math.round(progress?.percent || 0);
  const enrolled = Boolean(progress);
  const done = isCourseComplete(progress);
  const soon = lockReason === "soon";
  const pay = lockReason === "pay";
  const locked = lockReason === "track" || lockReason === "sequence";

  return (
    <article
      className={`cs-card${soon ? " is-soon" : ""}${locked ? " is-locked" : ""}${pay ? " is-pay" : ""}${done ? " is-done" : ""}`}
      onClick={() => onOpen(course)}
    >
      <img src={crystalImg} alt="" />
      <div className="cs-card-copy">
        <h3>{course.title}</h3>
        <small>{levelLabel(course.level)}</small>
        {soon ? (
          <p>Coming soon</p>
        ) : pay ? (
          <p>${Number(priceUsd || 10)} · Unlock track</p>
        ) : lockReason === "sequence" ? (
          <p>Finish the previous course first</p>
        ) : lockReason === "track" ? (
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
      {locked || soon || pay ? (
        <span className="cs-card-lock" aria-hidden="true">
          <IconLock />
        </span>
      ) : null}
    </article>
  );
}

function TrackBox({
  tone,
  title,
  copy,
  badge,
  locked,
  soon,
  buyable,
  onBuy,
  courses,
  progressMap,
  lockReasonFor,
  onOpen,
  priceUsd,
}) {
  return (
    <section className={`cs-track cs-track-${tone}${locked ? " is-locked" : ""}${soon ? " is-soon" : ""}`}>
      <header className="cs-track-head">
        <div>
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>
        <span
          className={`cs-track-badge${locked || soon ? " locked" : ""}${buyable ? " buy" : ""}`}
          onClick={buyable ? onBuy : undefined}
          onKeyDown={buyable ? (e) => e.key === "Enter" && onBuy() : undefined}
          role={buyable ? "button" : undefined}
          tabIndex={buyable ? 0 : undefined}
        >
          {locked || soon || buyable ? <IconLock /> : null}
          {badge}
        </span>
      </header>
      <div className="cs-grid">
        {courses.length === 0 ? (
          <p className="db-empty">No courses in this track yet.</p>
        ) : (
          courses.map((course) => (
            <CourseCard
              key={course.slug || course.id}
              course={course}
              progress={progressMap[Number(course.id)]}
              lockReason={lockReasonFor(course, locked, soon)}
              crystalImg={crystalFor(course)}
              onOpen={onOpen}
              priceUsd={priceUsd}
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
  const [access, setAccess] = useState({ intermediate: false, intermediate_price_usd: 10 });
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

    const load = async () => {
      const [me, list, enrolled, pay] = await Promise.all([
        fetch(`${API}/api/auth/me`, { headers }).then((res) => res.json()),
        fetch(`${API}/api/courses`, { headers }).then((res) => res.json()),
        fetch(`${API}/api/enrollments`, { headers }).then(async (res) => {
          const json = await res.json().catch(() => ({}));
          if (res.status === 401) throw new Error("Not authorized");
          return json;
        }),
        fetch(`${API}/api/payments/access`, { headers }).then(async (res) => {
          const json = await res.json().catch(() => ({}));
          return json;
        }),
      ]);

      if (me?.data?.user) setUser(me.data.user);
      if (!list.success) throw new Error(list.message || "Could not load courses");
      const catalog = list.data || [];
      setCourses(catalog);
      if (pay?.success && pay.data) setAccess(pay.data);

      const map = {};
      (enrolled.data || []).forEach((row) => {
        map[Number(row.course_id)] = {
          percent: Number(row.progress_percent || 0),
          status: row.status || "active",
        };
      });

      const enrolledIds = new Set((enrolled.data || []).map((row) => Number(row.course_id)));
      const toCheck = catalog.filter(
        (course) =>
          enrolledIds.has(Number(course.id)) &&
          !isCourseComplete(map[Number(course.id)]) &&
          !readCourseDone(course.id)
      );

      await Promise.all(
        toCheck.map(async (course) => {
          try {
            const modsRes = await fetch(`${API}/api/modules/course/${course.id}`, { headers });
            const modsJson = await modsRes.json();
            const mods = modsJson.data || [];
            if (!mods.length) return;
            const flags = await Promise.all(
              mods.map(async (mod) => {
                try {
                  const res = await fetch(`${API}/api/progress/module/${mod.id}`, { headers });
                  const json = await res.json();
                  return isModuleDone(json.data);
                } catch {
                  return false;
                }
              })
            );
            const done = flags.filter(Boolean).length;
            const percent = Math.round((done / mods.length) * 100);
            const status = percent >= 100 ? "completed" : map[Number(course.id)]?.status || "active";
            map[Number(course.id)] = { percent, status };
            if (percent >= 100) markCourseDone(course.id);
          } catch {
            /* keep enrollment row */
          }
        })
      );

      catalog.forEach((course) => {
        if (readCourseDone(course.id)) {
          const current = map[Number(course.id)] || { percent: 0, status: "active" };
          map[Number(course.id)] = {
            percent: Math.max(Number(current.percent || 0), 100),
            status: "completed",
          };
        }
      });

      setProgressMap(map);
    };

    load()
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

    Object.keys(byLevel).forEach((level) => {
      const order = TRACK_ORDER[level] || [];
      byLevel[level].sort((a, b) => {
        const ai = order.indexOf(a.slug);
        const bi = order.indexOf(b.slug);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    });

    return byLevel;
  }, [courses, query]);

  const priorComplete = (course) => {
    const order = TRACK_ORDER[course.level] || [];
    const index = order.indexOf(course.slug);
    if (index <= 0) return true;
    for (let i = 0; i < index; i += 1) {
      const prior = courses.find((item) => item.slug === order[i]);
      if (!prior) return false;
      if (readCourseDone(prior.id)) continue;
      if (!isCourseComplete(progressMap[Number(prior.id)])) return false;
    }
    return true;
  };

  const lockReasonFor = (course, trackLocked, trackSoon) => {
    if (trackSoon || course.preview) return "soon";
    if (course.level === "intermediate" && !access.intermediate) return "pay";
    if (trackLocked) return "track";
    if (!priorComplete(course)) return "sequence";
    return null;
  };

  const goCheckout = () => navigate("/checkout/intermediate");

  const openCourse = async (course) => {
    if (enrolling) return;
    if (course.level === "advanced" || course.preview) return;
    if (course.level === "intermediate" && !access.intermediate) {
      goCheckout();
      return;
    }
    if (!priorComplete(course)) return;

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
      if (res.status === 402) {
        goCheckout();
        return;
      }
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

  const price = access.intermediate_price_usd || 10;

  return (
    <div className="db">
      <Navbar user={user} />

      <section className="cs-top">
        <div className="cs-top-copy">
          <h1>Courses</h1>
          <p>Basic is free. Intermediate is $10 for the whole track. You can skip Basic if you already know it.</p>
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
          tone="basic"
          title="Basic"
          copy="Free for every learner. Start at Foundations, then unlock the next course when you finish."
          badge="Unlocked"
          courses={grouped.beginner}
          progressMap={progressMap}
          lockReasonFor={lockReasonFor}
          onOpen={openCourse}
        />
        <TrackBox
          tone="intermediate"
          title="Intermediate"
          copy={`Skip Basic if you already know the foundations. $${price} USD unlocks every Intermediate course. Pay in USDT on BNB Smart Chain (BEP-20).`}
          badge={access.intermediate ? "Unlocked" : `$${price} · Buy track`}
          buyable={!access.intermediate}
          onBuy={goCheckout}
          courses={grouped.intermediate}
          progressMap={progressMap}
          lockReasonFor={lockReasonFor}
          onOpen={openCourse}
          priceUsd={price}
        />
        <TrackBox
          tone="advanced"
          title="Advanced"
          copy="Video lessons and the builder path. Coming later. One payment will unlock every course in this track."
          badge="Coming soon"
          locked
          soon
          courses={grouped.advanced}
          progressMap={progressMap}
          lockReasonFor={lockReasonFor}
          onOpen={openCourse}
        />
      </div>
    </div>
  );
}