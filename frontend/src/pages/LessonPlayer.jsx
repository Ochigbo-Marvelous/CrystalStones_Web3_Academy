import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import crystal01 from "../assets/brand/crystal-01-blue.png";
import "../styles/dashboard.css";
import "../styles/courses.css";
import "../styles/course-player.css";
import "../styles/lesson-player.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

const isDone = (row) => {
  if (!row) return false;
  if (row.completed || row.is_completed || row.passed) return true;
  if (row.status === "completed" || row.status === "passed") return true;
  return Number(row.score || 0) >= 70;
};

const seenKey = (moduleId) => `csa_seen_lessons_${moduleId}`;

const readSeen = (moduleId) => {
  try {
    return JSON.parse(localStorage.getItem(seenKey(moduleId)) || "[]");
  } catch {
    return [];
  }
};

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

function YoutubeFrame({ url }) {
  const match = String(url).match(/(?:youtu\.be\/|v=)([A-Za-z0-9_-]{6,})/);
  if (!match) return null;
  return (
    <div className="lp-video">
      <iframe
        src={`https://www.youtube.com/embed/${match[1]}`}
        title="Lesson video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function LessonBody({ content }) {
  const blocks = String(content || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return <p>This lesson has no content yet.</p>;
  }

  return blocks.map((block, index) => {
    if (block.startsWith("### ")) return <h4 key={index}>{block.slice(4)}</h4>;
    if (block.startsWith("## ")) return <h3 key={index}>{block.slice(3)}</h3>;
    if (block.startsWith("# ")) return <h2 key={index}>{block.slice(2)}</h2>;
    if (block.startsWith("- ")) {
      return (
        <ul key={index}>
          {block.split("\n").map((line, i) => (
            <li key={i}>{line.replace(/^- /, "")}</li>
          ))}
        </ul>
      );
    }
    return <p key={index}>{block}</p>;
  });
}

export default function LessonPlayer() {
  const { slug, moduleId } = useParams();
  const navigate = useNavigate();
  const numericModuleId = Number(moduleId);

  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [mode, setMode] = useState("lesson");
  const [seen, setSeen] = useState([]);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }
    if (!Number.isInteger(numericModuleId) || numericModuleId <= 0) {
      navigate("/courses", { replace: true });
      return;
    }

    const started = Date.now();
    const headers = { Authorization: `Bearer ${token}` };

    const load = async () => {
      const me = await fetch(`${API}/api/auth/me`, { headers }).then((res) => res.json());
      if (me?.data?.user) setUser(me.data.user);

      const courseRes = await fetch(`${API}/api/courses/slug/${slug}`, { headers }).then((res) => res.json());
      if (!courseRes.success || !courseRes.data) throw new Error(courseRes.message || "Course not found");
      const currentCourse = courseRes.data;
      setCourse(currentCourse);

      const modsRes = await fetch(`${API}/api/modules/course/${currentCourse.id}`, { headers }).then((res) => res.json());
      const ordered = [...(modsRes.data || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      const currentModule = ordered.find((item) => item.id === numericModuleId);
      if (!currentModule) throw new Error("Module not found");

      const index = ordered.findIndex((item) => item.id === numericModuleId);
      if (index > 0) {
        const prev = ordered[index - 1];
        const prevProgress = await fetch(`${API}/api/progress/module/${prev.id}`, { headers })
          .then((res) => res.json())
          .catch(() => ({}));
        if (!isDone(prevProgress.data)) {
          navigate(`/courses/${slug}`, { replace: true });
          return;
        }
      }

      setModule(currentModule);

      const lessonRes = await fetch(`${API}/api/lessons/module/${numericModuleId}`, { headers }).then((res) => res.json());
      const lessonList = [...(lessonRes.data || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      setLessons(lessonList);

      const quizRes = await fetch(`${API}/api/brain-teasers/module/${numericModuleId}`, { headers })
        .then((res) => res.json())
        .catch(() => ({ data: [] }));
      setQuestions(quizRes.data || []);

      const opened = readSeen(numericModuleId);
      const firstId = lessonList[0]?.id || null;
      const nextSeen = firstId && !opened.includes(firstId) ? [...opened, firstId] : opened;
      setSeen(nextSeen);
      localStorage.setItem(seenKey(numericModuleId), JSON.stringify(nextSeen));
      setActiveId(firstId);
      setMode("lesson");
    };

    load()
      .catch((err) => setError(err.message || "Could not load module"))
      .finally(() => {
        const wait = Math.max(0, 1000 - (Date.now() - started));
        setTimeout(() => setReady(true), wait);
      });
  }, [navigate, numericModuleId, slug]);

  const activeLesson = useMemo(
    () => lessons.find((item) => item.id === activeId) || null,
    [lessons, activeId]
  );
  const activeIndex = lessons.findIndex((item) => item.id === activeId);
  const allLessonsSeen = lessons.length > 0 && lessons.every((item) => seen.includes(item.id));

  const markSeen = (id) => {
    setSeen((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem(seenKey(numericModuleId), JSON.stringify(next));
      return next;
    });
  };

  const openLesson = (lesson) => {
    markSeen(lesson.id);
    setQuizResult(null);
    setMode("lesson");
    setActiveId(lesson.id);
  };

  const goNext = () => {
    if (activeIndex < lessons.length - 1) {
      openLesson(lessons[activeIndex + 1]);
      return;
    }
    if (allLessonsSeen) {
      setMode("quiz");
      setActiveId(null);
    }
  };

  const goPrev = () => {
    if (mode === "quiz") {
      const last = lessons[lessons.length - 1];
      if (last) openLesson(last);
      return;
    }
    if (activeIndex > 0) openLesson(lessons[activeIndex - 1]);
  };

  const submitQuiz = async (event) => {
    event.preventDefault();
    if (!allLessonsSeen || busy) return;
    if (questions.some((q) => !answers[q.id])) {
      setError("Answer every question before submitting.");
      return;
    }

    const token = localStorage.getItem("token");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/progress/quiz/${numericModuleId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: questions.map((q) => ({
            questionId: q.id,
            selected: answers[q.id],
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Could not submit quiz");
      }
      setQuizResult(json.data);
    } catch (err) {
      setError(err.message || "Could not submit quiz");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <Skeleton />;

  return (
    <div className="db">
      <Navbar user={user} />

      <section className="cs-top cp-top">
        <div className="cs-top-copy">
          <Link to={`/courses/${slug}`} className="cp-back">
            ← Back to {course?.title || "course"}
          </Link>
          <h1>{module?.title || "Module"}</h1>
          <p>{module?.description || "Read each lesson, then pass the quiz to unlock the next module."}</p>
        </div>
        <div className="cp-progress">
          <small>
            {mode === "quiz" ? "Quiz" : `Lesson ${Math.max(activeIndex, 0) + 1} of ${lessons.length || 0}`}
          </small>
          <div className="cs-bar">
            <span
              style={{
                width: `${lessons.length ? Math.round((seen.length / lessons.length) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </section>

      {error ? <p className="db-empty cs-error">{error}</p> : null}

      <div className="cs-layout lp-layout">
        <aside className="cs-side">
          <h3>Lessons</h3>
          {lessons.map((lesson, index) => (
            <button
              type="button"
              key={lesson.id}
              className={mode === "lesson" && lesson.id === activeId ? "active" : ""}
              onClick={() => openLesson(lesson)}
            >
              <span>
                {index + 1}. {lesson.title}
              </span>
              <b>{seen.includes(lesson.id) ? "✓" : ""}</b>
            </button>
          ))}
          <button
            type="button"
            className={mode === "quiz" ? "active" : ""}
            disabled={!allLessonsSeen}
            onClick={() => {
              if (!allLessonsSeen) return;
              setMode("quiz");
              setActiveId(null);
            }}
          >
            <span>Quiz</span>
            <b>{allLessonsSeen ? "Go" : "Lock"}</b>
          </button>
        </aside>

        <section className="lp-main">
          {mode === "lesson" && activeLesson ? (
            <>
              <div className="lp-hero">
                <img src={crystal01} alt="" />
                <div>
                  <small>Lesson {activeIndex + 1}</small>
                  <h2>{activeLesson.title}</h2>
                  {activeLesson.duration_minutes ? (
                    <p>{activeLesson.duration_minutes} min read</p>
                  ) : null}
                </div>
              </div>

              {activeLesson.video_url ? (
                activeLesson.video_url.includes("youtu") ? (
                  <YoutubeFrame url={activeLesson.video_url} />
                ) : (
                  <video className="lp-file" src={activeLesson.video_url} controls />
                )
              ) : null}

              <div className="lp-body">
                <LessonBody content={activeLesson.content} />
              </div>

              <div className="lp-nav">
                <button type="button" className="db-btn ghost" onClick={goPrev} disabled={activeIndex <= 0}>
                  Previous
                </button>
                <button type="button" className="db-btn" onClick={goNext}>
                  {activeIndex >= lessons.length - 1 ? (allLessonsSeen ? "Take quiz" : "Finish lesson") : "Next lesson"}
                </button>
              </div>
            </>
          ) : null}

          {mode === "quiz" ? (
            <form className="lp-quiz" onSubmit={submitQuiz}>
              <div className="lp-hero">
                <img src={crystal01} alt="" />
                <div>
                  <small>Brain teaser</small>
                  <h2>Module quiz</h2>
                  <p>Pass this to unlock the next module.</p>
                </div>
              </div>

              {questions.length === 0 ? (
                <p className="db-empty">No quiz has been added for this module yet.</p>
              ) : (
                questions.map((question, index) => (
                  <fieldset key={question.id} className="lp-q">
                    <legend>
                      {index + 1}. {question.question}
                    </legend>
                    {["a", "b", "c", "d"].map((key) => {
                      const label = question[`option_${key}`];
                      if (!label) return null;
                      return (
                        <label key={key}>
                          <input
                            type="radio"
                            name={`q-${question.id}`}
                            value={key}
                            checked={answers[question.id] === key}
                            onChange={() =>
                              setAnswers((prev) => ({ ...prev, [question.id]: key }))
                            }
                          />
                          <span>{label}</span>
                        </label>
                      );
                    })}
                  </fieldset>
                ))
              )}

              {quizResult ? (
                <div className={`lp-result${quizResult.passed ? " is-pass" : ""}`}>
                  <b>{quizResult.passed ? "Passed" : "Try again"}</b>
                  <p>
                    Score {Math.round(quizResult.score || 0)}% · {quizResult.correctAnswers}/
                    {quizResult.totalQuestions} correct
                  </p>
                  {quizResult.passed ? (
                    <button type="button" className="db-btn" onClick={() => navigate(`/courses/${slug}`)}>
                      Continue path
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="lp-nav">
                <button type="button" className="db-btn ghost" onClick={goPrev}>
                  Back to lessons
                </button>
                <button type="submit" className="db-btn" disabled={busy || questions.length === 0}>
                  {busy ? "Checking..." : "Submit quiz"}
                </button>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </div>
  );
}