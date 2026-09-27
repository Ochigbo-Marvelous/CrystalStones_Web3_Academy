
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import crystalBasic from "../assets/brand/crystal-basic-blue.png";
import crystalIntermediate from "../assets/brand/crystal-intermediate-gold.png";
import crystalAdvanced from "../assets/brand/crystal-advanced-green.png";
import mentorBot from "../assets/brand/mentor-bot.PNG";
import brain from "../assets/brand/mentor-brain.png";
import MentorBody from "../components/MentorReply";
import "../styles/dashboard.css";
import "../styles/courses.css";
import "../styles/course-player.css";
import "../styles/landing-mentor.css";

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

function StudyMentor({ hint }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [chat, setChat] = useState([]);
  const box = useRef(null);

  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [chat, busy, open]);

  const ask = async (event) => {
    event.preventDefault();
    const question = input.trim();
    if (question.length < 3 || busy) return;
    const token = localStorage.getItem("token");
    setInput("");
    setChat((rows) => [...rows, { role: "user", text: question }]);
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/mentor/ask`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });
      const data = await res.json().catch(() => ({}));
      const answer = data?.data?.answer || data.message || "Crystal Mentor could not finish that answer just now.";
      if (!res.ok || /route\s+\/api\/mentor|not found|stack|sql|token failed/i.test(String(answer))) {
        throw new Error("unavailable");
      }
      setChat((rows) => [...rows, { role: "mentor", text: answer }]);
    } catch {
      setChat((rows) => [
        ...rows,
        { role: "mentor", text: "Could not reach Crystal Mentor. Try again in a moment." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open ? (
        <div className="lp-fab-panel" role="dialog" aria-label="Crystal Mentor">
          <div className="lp-fab-head">
            <img src={mentorBot} alt="" />
            <span>
              <strong>Crystal Mentor</strong>
              <small>Ask here, then close this and continue. Education only.</small>
            </span>
          </div>
          <div className="lp-fab-chat" ref={box}>
            {chat.length === 0 ? (
              <div className="lp-fab-empty">
                <div className="lp-fab-brain" aria-hidden="true">
                  <div className="lp-fab-brain-spin">
                    <img src={brain} alt="" />
                  </div>
                  <span className="lp-fab-particle p1"><BtcIcon /></span>
                  <span className="lp-fab-particle p2"><EthIcon /></span>
                  <span className="lp-fab-particle p3"><CrystalCoin /></span>
                  <span className="lp-fab-particle p4"><PiIcon /></span>
                  <span className="lp-fab-particle p5"><SumIcon /></span>
                  <span className="lp-fab-particle p6"><RootIcon /></span>
                </div>
                <p>{hint}</p>
              </div>
            ) : (
              chat.map((item, index) => (
                <div key={`${item.role}-${index}`} className={`lp-fab-bubble ${item.role}`}>
                  {item.role === "mentor" ? <MentorBody text={item.text} /> : item.text}
                </div>
              ))
            )}
            {busy ? <div className="lp-fab-bubble mentor">Thinking…</div> : null}
          </div>
          <form className="lp-fab-form" onSubmit={ask}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Crystal Mentor..."
              maxLength={500}
              disabled={busy}
            />
            <button type="submit" disabled={busy}>
              {busy ? "…" : "➤"}
            </button>
          </form>
        </div>
      ) : null}
      <button
        type="button"
        className={`lp-fab${open ? " is-open" : ""}`}
        style={{ display: "grid", placeItems: "center", padding: 0 }}
        aria-label={open ? "Close Crystal Mentor" : "Open Crystal Mentor"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <span>✕</span> : <img src={mentorBot} alt="" />}
      </button>
    </>
  );
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
      <StudyMentor hint="Ask about this course without leaving the page. Not a buy signal." />
    </div>
  );
}
