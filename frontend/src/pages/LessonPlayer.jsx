import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import crystalBasic from "../assets/brand/crystal-basic-blue.png";
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
const courseDoneKey = (courseId) => `csa_course_done_${courseId}`;

const readSeen = (moduleId) => {
  try {
    return JSON.parse(localStorage.getItem(seenKey(moduleId)) || "[]");
  } catch {
    return [];
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
          <span className="sk lp-sk-back" />
          <span className="sk lp-sk-title" />
          <span className="sk lp-sk-sub" />
        </div>
        <div className="cp-progress">
          <span className="sk lp-sk-meta" />
          <span className="sk lp-sk-bar" />
        </div>
      </section>

      <div className="cs-layout lp-layout">
        <aside className="cs-side lp-sk-side">
          <span className="sk lp-sk-side-h" />
          <span className="sk lp-sk-side-item" />
          <span className="sk lp-sk-side-item" />
          <span className="sk lp-sk-side-item" />
          <span className="sk lp-sk-side-item" />
        </aside>
        <section className="lp-main">
          <div className="lp-hero">
            <span className="sk lp-sk-crystal" />
            <div>
              <span className="sk lp-sk-small" />
              <span className="sk lp-sk-h2" />
            </div>
          </div>
          <span className="sk lp-sk-line" />
          <span className="sk lp-sk-line" />
          <span className="sk lp-sk-line is-short" />
          <div className="lp-nav">
            <span className="sk lp-sk-btn" />
            <span className="sk lp-sk-btn" />
          </div>
        </section>
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

function Rich({ text }) {
  const parts = String(text).split(/(\*\*[\s\S]*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function TableBlock({ body }) {
  const rows = String(body)
    .trim()
    .split("\n")
    .map((line) =>
      line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0)
    )
    .filter((row) => row.length > 1);

  if (rows.length === 0) return null;
  const [head, ...rest] = rows;

  return (
    <figure className="lp-table-wrap">
      <figcaption className="lp-figure-label">Table</figcaption>
      <table className="lp-table">
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th key={i}>
                <Rich text={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rest.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c}>
                  <Rich text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function DiagramBlock({ body }) {
  const text = String(body || "").trim();
  const lines = text.split("\n").map((line) => line.replace(/\s+$/, ""));

  const usePre = lines.some(
    (line) =>
      /_{2,}|-{3,}|[┌┐└┘│─]/.test(line) ||
      (line.includes("[") && line.includes("]")) ||
      /^\s{2,}\S.+\s{4,}\S/.test(line)
  );

  if (!usePre) {
    const flow = [];
    const captions = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (/^[|vV]+$/.test(trimmed)) {
        if (flow[flow.length - 1]?.type !== "down") flow.push({ type: "down" });
        return;
      }
      if (/\s-->\s|\s->\s/.test(trimmed) || trimmed.includes("-->")) {
        const parts = trimmed
          .split(/\s*-->\s*|\s+->\s+/)
          .map((part) => part.trim())
          .filter(Boolean);
        flow.push({ type: "row", parts });
        return;
      }
      if (/^\(.+\)$/.test(trimmed) || /[.?!]$/.test(trimmed) || trimmed.length > 56) {
        captions.push(trimmed.replace(/^\(|\)$/g, ""));
        return;
      }
      flow.push({ type: "row", parts: [trimmed] });
    });

    if (flow.some((item) => item.type === "row")) {
      return (
        <figure className="lp-diagram-wrap">
          <figcaption className="lp-figure-label">Diagram</figcaption>
          <div className="lp-flow">
            {flow.map((item, index) =>
              item.type === "down" ? (
                <div key={index} className="lp-flow-down" aria-hidden>
                  ↓
                </div>
              ) : (
                <div key={index} className="lp-flow-row">
                  {item.parts.map((part, partIndex) => (
                    <span key={partIndex} className="lp-flow-node-wrap">
                      {partIndex > 0 ? <span className="lp-flow-arrow">→</span> : null}
                      <span className="lp-flow-node">{part}</span>
                    </span>
                  ))}
                </div>
              )
            )}
          </div>
          {captions.length ? <p className="lp-diagram-caption">{captions.join(" ")}</p> : null}
        </figure>
      );
    }
  }

  return (
    <figure className="lp-diagram-wrap">
      <figcaption className="lp-figure-label">Diagram</figcaption>
      <pre className="lp-diagram">{text}</pre>
    </figure>
  );
}

function NoteBlock({ body }) {
  return (
    <aside className="lp-note">
      <strong className="lp-note-label">Academy note</strong>
      <p>
        <Rich text={String(body || "").trim()} />
      </p>
    </aside>
  );
}

function NormalBlocks({ text, skipTitle }) {
  const blocks = String(text)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    if (block.startsWith("### ")) {
      return (
        <h4 key={index}>
          <Rich text={block.slice(4)} />
        </h4>
      );
    }
    if (block.startsWith("## ")) {
      return (
        <h3 key={index}>
          <Rich text={block.slice(3)} />
        </h3>
      );
    }
    if (block.startsWith("# ")) {
      const title = block.slice(2).trim();
      if (skipTitle && title.toLowerCase() === String(skipTitle).trim().toLowerCase()) {
        return null;
      }
      return (
        <h2 key={index}>
          <Rich text={title} />
        </h2>
      );
    }

    const lines = block.split("\n");
    const bulletCount = lines.filter((line) => /^\s*[-•]\s+/.test(line)).length;
    if (bulletCount > 0 && bulletCount >= Math.max(1, lines.length - 1)) {
      return (
        <ul key={index}>
          {lines
            .filter((line) => /^\s*[-•]\s+/.test(line))
            .map((line, lineIndex) => (
              <li key={lineIndex}>
                <Rich text={line.trim().replace(/^[-•]\s+/, "")} />
              </li>
            ))}
        </ul>
      );
    }

    if (lines.every((line) => /^\d+\.\s/.test(line.trim()))) {
      return (
        <ol key={index}>
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>
              <Rich text={line.trim().replace(/^\d+\.\s/, "")} />
            </li>
          ))}
        </ol>
      );
    }

    return (
      <p key={index}>
        <Rich text={block} />
      </p>
    );
  });
}

function LessonBody({ content, skipTitle }) {
  const src = String(content || "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!src) return <p>This lesson has no content yet.</p>;

  const tokens = [];
  const re =
    /TABLE[ \t]*\n([\s\S]*?)\n[ \t]*ENDTABLE[ \t]*|DIAGRAM[ \t]*\n([\s\S]*?)\n[ \t]*ENDDIAGRAM[ \t]*|NOTE[ \t]*\n([\s\S]*?)\n[ \t]*ENDNOTE[ \t]*/g;
  let last = 0;
  let match = re.exec(src);
  let key = 0;

  while (match) {
    if (match.index > last) {
      tokens.push(
        <NormalBlocks
          key={`t-${key}`}
          text={src.slice(last, match.index)}
          skipTitle={skipTitle}
        />
      );
      key += 1;
    }
    if (match[1] !== undefined) tokens.push(<TableBlock key={`t-${key}`} body={match[1]} />);
    else if (match[2] !== undefined) tokens.push(<DiagramBlock key={`t-${key}`} body={match[2]} />);
    else tokens.push(<NoteBlock key={`t-${key}`} body={match[3]} />);
    key += 1;
    last = match.index + match[0].length;
    match = re.exec(src);
  }

  if (last < src.length) {
    tokens.push(
      <NormalBlocks key={`t-${key}`} text={src.slice(last)} skipTitle={skipTitle} />
    );
  }

  return tokens;
}

export default function LessonPlayer() {
  const { slug, moduleId } = useParams();
  const navigate = useNavigate();
  const numericModuleId = Number(moduleId);

  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [module, setModule] = useState(null);
  const [moduleList, setModuleList] = useState([]);
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
      setModuleList(ordered);

      const lessonRes = await fetch(`${API}/api/lessons/module/${numericModuleId}`, { headers }).then((res) => res.json());
      const lessonList = [...(lessonRes.data || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      setLessons(lessonList);

      const quizRes = await fetch(`${API}/api/brain-teasers/module/${numericModuleId}`, { headers })
        .then((res) => res.json())
        .catch(() => ({ data: [] }));
      setQuestions(quizRes.data || []);

      const opened = readSeen(numericModuleId);
      setSeen(opened);

      let startId = lessonList[0]?.id || null;
      for (let i = 0; i < lessonList.length; i += 1) {
        const unlocked = i === 0 || opened.includes(lessonList[i - 1].id);
        if (!unlocked) break;
        startId = lessonList[i].id;
        if (!opened.includes(lessonList[i].id)) break;
      }

      setActiveId(startId);
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

  const lessonUnlocked = (index) => {
    if (index <= 0) return true;
    return seen.includes(lessons[index - 1]?.id);
  };

  const writeSeen = (id) => {
    if (!id || seen.includes(id)) return seen;
    const next = [...seen, id];
    localStorage.setItem(seenKey(numericModuleId), JSON.stringify(next));
    setSeen(next);
    return next;
  };

  const openLesson = (lesson) => {
    const index = lessons.findIndex((item) => item.id === lesson.id);
    if (index < 0 || !lessonUnlocked(index)) return;
    setQuizResult(null);
    setMode("lesson");
    setActiveId(lesson.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    if (!activeLesson) return;
    const nextSeen = writeSeen(activeLesson.id);
    if (activeIndex < lessons.length - 1) {
      setQuizResult(null);
      setMode("lesson");
      setActiveId(lessons[activeIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const finishedAll = lessons.every((item) => nextSeen.includes(item.id));
    if (finishedAll) {
      setMode("quiz");
      setActiveId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  const openQuiz = () => {
    if (!allLessonsSeen) return;
    setMode("quiz");
    setActiveId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

      if (json.data?.passed && course?.id && moduleList.length > 0) {
        const moduleIndex = moduleList.findIndex((item) => item.id === numericModuleId);
        const remaining = moduleList.filter((_, i) => i !== moduleIndex);
        if (remaining.length === 0) {
          markCourseDone(course.id);
        } else {
          const flags = await Promise.all(
            remaining.map(async (mod) => {
              try {
                const prog = await fetch(`${API}/api/progress/module/${mod.id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                }).then((r) => r.json());
                return isDone(prog.data);
              } catch {
                return false;
              }
            })
          );
          if (flags.every(Boolean)) markCourseDone(course.id);
        }
      }
    } catch (err) {
      setError(err.message || "Could not submit quiz");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <Skeleton />;

  const nextLabel =
    activeIndex >= lessons.length - 1
      ? allLessonsSeen || seen.includes(activeLesson?.id)
        ? "Take quiz"
        : "Finish lesson"
      : seen.includes(activeLesson?.id)
        ? "Next lesson"
        : "Finish lesson";

  return (
    <div className="db">
      <Navbar user={user} />

      <section className="cs-top cp-top">
        <div className="cs-top-copy">
          <Link to={`/courses/${slug}`} className="cp-back">
            ← Back to {course?.title || "course"}
          </Link>
          <h1>{module?.title || "Module"}</h1>
          <p>
            {module?.description ||
              "Finish each lesson to unlock the next. Pass the quiz to unlock the next module."}
          </p>
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
          {lessons.map((lesson, index) => {
            const unlocked = lessonUnlocked(index);
            const finished = seen.includes(lesson.id);
            return (
              <button
                type="button"
                key={lesson.id}
                className={mode === "lesson" && lesson.id === activeId ? "active" : ""}
                disabled={!unlocked}
                onClick={() => openLesson(lesson)}
              >
                <span>
                  {index + 1}. {lesson.title}
                </span>
                <b>{finished ? "✓" : unlocked ? "" : "Lock"}</b>
              </button>
            );
          })}
          <button
            type="button"
            className={mode === "quiz" ? "active" : ""}
            disabled={!allLessonsSeen}
            onClick={openQuiz}
          >
            <span>Quiz</span>
            <b>{allLessonsSeen ? "Go" : "Lock"}</b>
          </button>
        </aside>

        <section className="lp-main">
          {mode === "lesson" && activeLesson ? (
            <>
              <div className="lp-hero">
                <img src={crystalBasic} alt="" />
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

              <article className="lp-body">
                <LessonBody content={activeLesson.content} skipTitle={activeLesson.title} />
              </article>

              <div className="lp-nav">
                <button type="button" className="db-btn ghost" onClick={goPrev} disabled={activeIndex <= 0}>
                  Previous
                </button>
                <button type="button" className="db-btn" onClick={goNext}>
                  {nextLabel}
                </button>
              </div>
            </>
          ) : null}

          {mode === "quiz" ? (
            <form className="lp-quiz" onSubmit={submitQuiz}>
              <div className="lp-hero">
                <img src={crystalBasic} alt="" />
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