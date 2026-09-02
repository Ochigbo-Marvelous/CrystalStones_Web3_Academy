import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import crystalBasic from "../assets/brand/crystal-basic-blue.png";
import crystalIntermediate from "../assets/brand/crystal-intermediate-gold.png";
import crystalAdvanced from "../assets/brand/crystal-advanced-green.png";
import "../styles/dashboard.css";
import "../styles/courses.css";
import "../styles/course-player.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

const CRYSTAL_BY_LEVEL = {
  beginner: crystalBasic,
  intermediate: crystalIntermediate,
  advanced: crystalAdvanced,
};

const TRACK_ORDER = {
  beginner: [
    "crypto-foundations",
    "wallets-keys-self-custody",
    "exchanges-first-buy",
    "bnb-smart-chain-beginners",
    "crypto-safety-scams",
  ],
  intermediate: [
    "ethereum-smart-contracts",
    "defi-decentralized-finance",
    "tokenomics",
    "trading-markets",
    "nfts-digital-assets",
    "daos-governance",
    "rwa-specialization",
    "crystal-stones-ecosystem",
  ],
  advanced: [
    "web3-architecture",
    "security-specialization",
    "on-chain-research",
    "regulation-industry",
    "build-your-own-token",
    "practical-capstone",
  ],
};

const crystalFor = (course) => CRYSTAL_BY_LEVEL[course?.level] || crystalBasic;

const isDone = (row) => {
  if (!row) return false;
  if (row.completed || row.is_completed || row.passed) return true;
  if (row.status === "completed" || row.status === "passed") return true;
  return Number(row.score || 0) >= 70;
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

const enrollmentLooksDone = (row) => {
  if (!row) return false;
  if (row.status === "completed" || row.status === "passed") return true;
  return Number(row.progress_percent || 0) >= 100;
};

async function courseIsFinished(course, enrollment, headers) {
  if (!course?.id) return false;
  if (readCourseDone(course.id) || enrollmentLooksDone(enrollment)) {
    markCourseDone(course.id);
    return true;
  }

  try {
    const modsRes = await fetch(`${API}/api/modules/course/${course.id}`, { headers });
    const modsJson = await modsRes.json();
    const mods = modsJson.data || [];
    if (!mods.length) return false;

    const flags = await Promise.all(
      mods.map(async (mod) => {
        try {
          const res = await fetch(`${API}/api/progress/module/${mod.id}`, { headers });
          const json = await res.json();
          return isDone(json.data);
        } catch {
          return false;
        }
      })
    );

    const allDone = flags.length > 0 && flags.every(Boolean);
    if (allDone) markCourseDone(course.id);
    return allDone;
  } catch {
    return false;
  }
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M8 5v14l11-7z" />
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

      <section className="cs-top cp-top">
        <div className="cs-top-copy">
          <span className="sk cp-sk-back" />
          <span className="sk cp-sk-title" />
          <span className="sk cp-sk-sub" />
        </div>
        <div className="cp-progress">
          <span className="sk cp-sk-meta" />
          <span className="sk cp-sk-bar" />
        </div>
      </section>

      <section className="cp-wrap">
        <span className="sk cp-sk-h2" />
        <div className="cp-road">
          <div className="cp-row">
            <span className="sk cp-sk-mod" />
            <span className="sk cp-sk-h" />
            <span className="sk cp-sk-mod" />
          </div>
          <span className="sk cp-sk-v" />
          <div className="cp-row">
            <span className="sk cp-sk-mod" />
            <span className="sk cp-sk-h" />
            <span className="sk cp-sk-mod" />
          </div>
          <span className="sk cp-sk-v" />
          <div className="cp-row">
            <span className="sk cp-sk-mod" />
            <span className="sk cp-sk-h" />
            <span className="sk cp-sk-mod" />
          </div>
        </div>
      </section>
    </div>
  );
}

function ModuleCard({ step, crystalImg, onOpen }) {
  return (
    <article
      className={`cp-card${step.completed ? " is-done" : ""}${step.unlocked ? "" : " is-lock"}`}
      onClick={() => onOpen(step)}
    >
      <img src={crystalImg} alt="" />
      <div className="cp-copy">
        <small>Module {step.index + 1}</small>
        <h3>{step.title}</h3>
        <p>{step.description || "Lessons and a brain teaser live inside this module."}</p>
        <b>
          {step.completed ? (
            <>
              <IconCheck /> Completed
            </>
          ) : step.unlocked ? (
            <>
              <IconPlay /> Start module
            </>
          ) : (
            <>
              <IconLock /> Locked
            </>
          )}
        </b>
      </div>
    </article>
  );
}

export default function CoursePlayer() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [doneMap, setDoneMap] = useState({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    const started = Date.now();
    const headers = { Authorization: `Bearer ${token}` };

    const load = async () => {
      const me = await fetch(`${API}/api/auth/me`, { headers }).then((res) => res.json());
      if (me?.data?.user) setUser(me.data.user);

      const [courseRes, catalogRes, enrolledRes] = await Promise.all([
        fetch(`${API}/api/courses/slug/${slug}`, { headers }).then((res) => res.json()),
        fetch(`${API}/api/courses`, { headers }).then((res) => res.json()),
        fetch(`${API}/api/enrollments`, { headers })
          .then((res) => res.json())
          .catch(() => ({ data: [] })),
      ]);

      if (!courseRes.success || !courseRes.data) {
        throw new Error(courseRes.message || "Course not found");
      }

      const current = courseRes.data;
      const catalog = catalogRes.data || [];
      const enrollments = enrolledRes.data || [];
      const progressById = {};
      enrollments.forEach((row) => {
        progressById[Number(row.course_id)] = row;
      });

      if (current.level === "advanced") {
        navigate("/courses", { replace: true });
        return;
      }

      if (current.level === "intermediate") {
        const accessRes = await fetch(`${API}/api/payments/access`, { headers });
        const accessJson = await accessRes.json().catch(() => ({}));
        if (!accessJson?.data?.intermediate) {
          navigate("/checkout/intermediate", { replace: true });
          return;
        }
      }

      const order = TRACK_ORDER[current.level] || [];
      const here = order.indexOf(current.slug);
      if (here > 0) {
        const prevSlug = order[here - 1];
        const prevCourse = catalog.find((item) => item.slug === prevSlug);
        const prevOk = prevCourse
          ? await courseIsFinished(prevCourse, progressById[Number(prevCourse.id)], headers)
          : false;
        if (!prevOk) {
          navigate("/courses", { replace: true });
          return;
        }
      }

      setCourse(current);

      const enrolled = enrollments.some((row) => Number(row.course_id) === Number(current.id));
      if (!enrolled) {
        const enrollRes = await fetch(`${API}/api/enrollments/${current.id}`, {
          method: "POST",
          headers,
        });
        if (enrollRes.status === 402) {
          navigate("/checkout/intermediate", { replace: true });
          return;
        }
        if (!enrollRes.ok && enrollRes.status !== 409) {
          const json = await enrollRes.json().catch(() => ({}));
          throw new Error(json.message || "Could not enroll");
        }
      }

      const modsRes = await fetch(`${API}/api/modules/course/${current.id}`, { headers }).then((res) => res.json());
      const list = modsRes.data || [];
      const ordered = [...list].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      setModules(ordered);

      const progressPairs = await Promise.all(
        ordered.map(async (mod) => {
          try {
            const res = await fetch(`${API}/api/progress/module/${mod.id}`, { headers });
            const json = await res.json();
            return [mod.id, isDone(json.data)];
          } catch {
            return [mod.id, false];
          }
        })
      );
      const nextMap = {};
      progressPairs.forEach(([id, done]) => {
        nextMap[id] = done;
      });
      setDoneMap(nextMap);

      if (ordered.length && progressPairs.every(([, done]) => done)) {
        markCourseDone(current.id);
      }
    };

    load()
      .catch((err) => setError(err.message || "Could not load course"))
      .finally(() => {
        const wait = Math.max(0, 1000 - (Date.now() - started));
        setTimeout(() => setReady(true), wait);
      });
  }, [navigate, slug]);

  const steps = useMemo(() => {
    return modules.map((mod, index) => {
      const previous = index === 0 ? null : modules[index - 1];
      const unlocked = index === 0 || Boolean(doneMap[previous?.id]);
      const completed = Boolean(doneMap[mod.id]);
      return { ...mod, unlocked, completed, index };
    });
  }, [modules, doneMap]);

  const rows = useMemo(() => {
    const next = [];
    for (let i = 0; i < steps.length; i += 2) {
      next.push(steps.slice(i, i + 2));
    }
    return next;
  }, [steps]);

  const doneCount = steps.filter((item) => item.completed).length;
  const percent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const crystalImg = crystalFor(course);

  const openModule = (step) => {
    if (!step.unlocked) return;
    navigate(`/courses/${slug}/modules/${step.id}`);
  };

  if (!ready) return <Skeleton />;

  return (
    <div className="db">
      <Navbar user={user} />

      <section className="cs-top cp-top">
        <div className="cs-top-copy">
          <Link to="/courses" className="cp-back">
            ← Back to courses
          </Link>
          <h1>{course?.title || "Course"}</h1>
          <p>{course?.description || "Complete each module to unlock the next."}</p>
        </div>
        <div className="cp-progress">
          <small>
            {doneCount}/{steps.length} modules
          </small>
          <div className="cs-bar">
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
      </section>

      {error ? <p className="db-empty cs-error">{error}</p> : null}

      <section className="cp-wrap">
        <h2>Learning path</h2>
        <div className="cp-road">
          {rows.map((pair, rowIndex) => (
            <div key={pair[0].id} className="cp-pair">
              <div className="cp-row">
                <ModuleCard step={pair[0]} crystalImg={crystalImg} onOpen={openModule} />
                {pair[1] ? (
                  <>
                    <div className={`cp-h-arrow${pair[1].unlocked ? " is-on" : ""}`} aria-hidden="true" />
                    <ModuleCard step={pair[1]} crystalImg={crystalImg} onOpen={openModule} />
                  </>
                ) : (
                  <span className="cp-row-fill" />
                )}
              </div>
              {rowIndex < rows.length - 1 ? (
                <div
                  className={`cp-v-arrow${rows[rowIndex + 1][0]?.unlocked ? " is-on" : ""}`}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          ))}
        </div>
        <p className="cp-note">Finish the quiz in a module to unlock the next one.</p>
      </section>
    </div>
  );
}