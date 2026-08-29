import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import crystal01 from "../assets/brand/crystal-01-blue.png";
import "../styles/dashboard.css";
import "../styles/courses.css";
import "../styles/course-player.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

const isDone = (row) => {
  if (!row) return false;
  if (row.completed || row.is_completed || row.passed) return true;
  if (row.status === "completed" || row.status === "passed") return true;
  return Number(row.score || 0) >= 70;
};

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
      <div className="sk sk-nav" />
      <div className="sk sk-hero" />
      <div className="sk-main">
        <span className="sk" />
        <span className="sk" />
      </div>
    </div>
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

      const courseRes = await fetch(`${API}/api/courses/slug/${slug}`, { headers }).then((res) => res.json());
      if (!courseRes.success || !courseRes.data) {
        throw new Error(courseRes.message || "Course not found");
      }
      const current = courseRes.data;
      setCourse(current);

      const enrolledRes = await fetch(`${API}/api/enrollments`, { headers })
        .then((res) => res.json())
        .catch(() => ({ data: [] }));
      const enrolled = (enrolledRes.data || []).some((row) => row.course_id === current.id);

      if (!enrolled) {
        if (current.is_paid) {
          navigate(`/checkout/${current.id}`, { replace: true });
          return;
        }
        await fetch(`${API}/api/enrollments/${current.id}`, {
          method: "POST",
          headers,
        });
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

  const doneCount = steps.filter((item) => item.completed).length;
  const percent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

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
          <small>{doneCount}/{steps.length} modules</small>
          <div className="cs-bar">
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
      </section>

      {error ? <p className="db-empty cs-error">{error}</p> : null}

      <section className="cp-wrap">
        <h2>Learning path</h2>
        <div className={`cp-road cp-count-${Math.min(steps.length, 3)}`}>
          {steps.map((step, index) => (
            <article
              key={step.id}
              className={`cp-card cp-m${index + 1}${step.completed ? " is-done" : ""}${step.unlocked ? "" : " is-lock"}`}
              onClick={() => openModule(step)}
            >
              <img src={crystal01} alt="" />
              <div className="cp-copy">
                <small>Module {index + 1}</small>
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
          ))}
          {steps.length > 1 ? (
            <div className={`cp-arrow cp-a12${steps[1]?.unlocked ? " is-on" : ""}`} aria-hidden="true">
              <span />
            </div>
          ) : null}
          {steps.length > 2 ? (
            <div className={`cp-arrow cp-a23${steps[2]?.unlocked ? " is-on" : ""}`} aria-hidden="true">
              <span />
            </div>
          ) : null}
        </div>
        <p className="cp-note">Finish the quiz in a module to unlock the next one.</p>
      </section>
    </div>
  );
}