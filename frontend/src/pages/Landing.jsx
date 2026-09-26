import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/brand/crystal-hero-hex.png";
import crystalHex from "../assets/brand/crystal-hero-hex.png";
import astronaut from "../assets/brand/flag.png";
import ranksStairs from "../assets/brand/stairs.png";
import hexCommunity from "../assets/brand/growth/01-community.png";
import hexEngagement from "../assets/brand/growth/02-engagement.png";
import hexValue from "../assets/brand/growth/03-value.png";
import hexAdoption from "../assets/brand/growth/04-adoption.png";
import hexProgress from "../assets/brand/growth/05-progress.png";
import hexMastery from "../assets/brand/growth/06-mastery.png";
import hexDepth from "../assets/brand/growth/07-depth.png";
import hexLegacy from "../assets/brand/growth/08-legacy.png";
import whyTracks from "../assets/brand/why/01-tracks.png";
import whyProgress from "../assets/brand/why/02-progress.png";
import whyMentor from "../assets/brand/why/03-mentor.png";
import whySafety from "../assets/brand/why/04-safety.png";
import whyCerts from "../assets/brand/why/05-certificates.png";
import whyCheckout from "../assets/brand/why/06-checkout.png";
import whyConstellation from "../assets/brand/why.png";
import crystalBasic from "../assets/brand/crystal-basic-blue.png";
import crystalIntermediate from "../assets/brand/crystal-intermediate-gold.png";
import crystalAdvanced from "../assets/brand/crystal-advanced-green.png";
import brain from "../assets/brand/mentor-brain.png";
import "../styles/landing.css";
import "../styles/landing-mentor.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
const SUPPORT_GMAIL =
  "https://mail.google.com/mail/?view=cm&fs=1&to=info@crystalweb3academy.org&su=Crystal%20Web3%20Academy%20support";
const SUPPORT_MAIL =
  "mailto:info@crystalweb3academy.org?subject=Crystal%20Web3%20Academy%20support";

const SPOKES = [
  { id: "network", label: "Network", x: 50, y: 8, copy: "Public chains run because people participate. This academy does not pay you to stake." },
  { id: "gaming", label: "Gaming", x: 78, y: 18, copy: "On-chain games are an application class. Literacy first, play later." },
  { id: "travel", label: "Travel", x: 92, y: 38, copy: "A future rail in the wider Crystal Stones map. Not a booking desk here." },
  { id: "causes", label: "CEX", x: 92, y: 62, copy: "A CEX is a company ledger. It is not the blockchain." },
  { id: "rwa", label: "RWA", x: 78, y: 82, copy: "Real-world assets are a claim to verify not a proven vault." },
  { id: "markets", label: "Markets", x: 50, y: 92, copy: "A CEX is a company ledger. It is not the blockchain." },
  { id: "education", label: "Education", x: 22, y: 82, copy: "Structured tracks, Mentor, progress, certificates. Not a buy signal." },
  { id: "commerce", label: "Commerce", x: 8, y: 62, copy: "Spend only where a merchant actually accepts the rail you are using." },
  { id: "assets", label: "Assets", x: 8, y: 38, copy: "Project exposure is not a guaranteed return. We will not tell you to buy." },
  { id: "payments", label: "Payments", x: 22, y: 18, copy: "Move value on a public book. Verify the network before you send." },
];

const GROWTH = [
  { n: "01", title: "Community", copy: "Connect with others", icon: hexCommunity, chips: ["Learners", "Mentor", "Tracks"] },
  { n: "02", title: "Engagement", copy: "Show up and participate", icon: hexEngagement, chips: ["Lessons", "Daily", "Streak"] },
  { n: "03", title: "Value", copy: "Build through contribution", icon: hexValue, chips: ["Skills", "Proof", "Build"] },
  { n: "04", title: "Adoption", copy: "Build habits that last", icon: hexAdoption, chips: ["Habits", "Modules", "Practice"] },
  { n: "05", title: "Progress", copy: "XP, streak, quizzes", icon: hexProgress, chips: ["XP", "Streak", "Quizzes"] },
  { n: "06", title: "Mastery", copy: "Deepen your skills", icon: hexMastery, chips: ["Basic", "Intermediate", "Capstone"] },
  { n: "07", title: "Depth", copy: "Explore advanced paths", icon: hexDepth, chips: ["Research", "Security", "On-chain"] },
  { n: "08", title: "Legacy", copy: "Leave a lasting impact", icon: hexLegacy, chips: ["Certificate", "Rank", "Impact"] },
];

const RANKS = [
  { n: "01", name: "Novice", xp: 0, next: 100, copy: "Account created. The book is still closed." },
  { n: "02", name: "Explorer", xp: 100, next: 400, copy: "First modules. You can name a seed from a PIN." },
  { n: "03", name: "Scholar", xp: 400, next: 800, copy: "A course finished. Quizzes are a habit." },
  { n: "04", name: "Adept", xp: 800, next: 1400, copy: "Safety holds when you are in a hurry." },
  { n: "05", name: "Expert", xp: 1400, next: 2400, copy: "Depth on a live track. Still not a buy signal." },
  { n: "06", name: "Master", xp: 2400, next: 2400, copy: "Track diploma. Teach only what you verified." },
];

const COURSES = [
  {
    key: "beginner",
    label: "Basic",
    crystal: crystalBasic,
    locked: false,
    price: "Free",
    items: ["Crypto Foundations", "Wallets & Self-Custody", "Crypto Safety"],
  },
  {
    key: "intermediate",
    label: "Intermediate",
    crystal: crystalIntermediate,
    locked: false,
    price: "$10 USDT BEP-20",
    items: ["Ethereum & Smart Contracts", "DeFi", "Crystal Stones Ecosystem"],
  },
  {
    key: "advanced",
    label: "Advanced",
    crystal: crystalAdvanced,
    locked: true,
    price: "Coming soon",
    items: ["Web3 Architecture", "On-chain Research", "Practical Capstone"],
  },
];

const WHY = [
  { n: "01", title: "Structured tracks", copy: "Basic is free. Intermediate is $10 USDT on BNB Smart Chain. Advanced comes later.", icon: whyTracks, x: 20, y: 32 },
  { n: "02", title: "Live progress", copy: "XP, rank, and a dashboard that matches what you actually finished.", icon: whyProgress, x: 50, y: 12 },
  { n: "03", title: "Crystal Mentor", copy: "Answers from academy lessons plus published project facts. Not price advice.", icon: whyMentor, x: 50, y: 50 },
  { n: "04", title: "Safety first", copy: "Seeds, networks, scams. Staff never ask for a phrase, a key, or remote control.", icon: whySafety, x: 20, y: 78 },
  { n: "05", title: "Certificates", copy: "One diploma per finished live track. Download when the work is done.", icon: whyCerts, x: 80, y: 32 },
  { n: "06", title: "Honest checkout", copy: "Intermediate: $10 USDT BEP-20. Not Crystal Stones token. Not a chat wallet.", icon: whyCheckout, x: 80, y: 78 },
];

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 5 6v6c0 5 3.4 8.4 7 9.5 3.6-1.1 7-4.5 7-9.5V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z" stroke="#3b7aee" strokeWidth="1.6" />
      <path d="M7 12v4.2c0 .8 2.2 2.3 5 2.3s5-1.5 5-2.3V12" stroke="#3b7aee" strokeWidth="1.6" />
    </svg>
  );
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

const pinScroll = (el, count, setPin, setStep) => {
  if (!el) return undefined;

  const onScroll = () => {
    const start = el.offsetTop;
    const total = Math.max(1, el.offsetHeight - window.innerHeight);
    const y = window.scrollY || window.pageYOffset;
    const scrolled = y - start;

    if (scrolled < 0) {
      setPin("pre");
      setStep(0);
      return;
    }
    if (scrolled >= total) {
      setPin("end");
      setStep(count - 1);
      return;
    }

    setPin("pin");
    setStep(Math.min(count - 1, Math.floor((scrolled / total) * count)));
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
};

const barWidth = (index, active) => {
  if (index < active) return "100%";
  if (index === active) return "72%";
  return "10%";
};

const isPhone = () => {
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return true;
  return window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 900px)").matches;
};

const openSupport = (event) => {
  if (!isPhone()) return;
  event.preventDefault();
  window.location.href = SUPPORT_MAIL;
};

const sessionIsLive = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const part = token.split(".")[1];
    if (!part) throw new Error("bad token");
    const base = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base + "=".repeat((4 - (base.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (payload.exp && payload.exp * 1000 <= Date.now()) throw new Error("expired");
    return true;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return false;
  }
};

export default function Landing() {
  const navigate = useNavigate();
  const [spoke, setSpoke] = useState("education");
  const [growthStep, setGrowthStep] = useState(0);
  const [growthPin, setGrowthPin] = useState("pre");
  const [rankStep, setRankStep] = useState(0);
  const [rankPin, setRankPin] = useState("pre");
  const [whyStep, setWhyStep] = useState(0);
  const [whyPin, setWhyPin] = useState("pre");
  const [gate, setGate] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [mentorInput, setMentorInput] = useState("");
  const [mentorBusy, setMentorBusy] = useState(false);
  const [mentorChat, setMentorChat] = useState([]);
  const growthRef = useRef(null);
  const ranksRef = useRef(null);
  const whyRef = useRef(null);
  const spaceRef = useRef(null);
  const mentorBox = useRef(null);
  const active = SPOKES.find((s) => s.id === spoke) || SPOKES[6];

  const goSignIn = (event) => {
    if (!sessionIsLive()) return;
    event.preventDefault();
    navigate("/dashboard");
  };

  useEffect(() => pinScroll(growthRef.current, GROWTH.length, setGrowthPin, setGrowthStep), []);
  useEffect(() => pinScroll(ranksRef.current, RANKS.length, setRankPin, setRankStep), []);
  useEffect(() => pinScroll(whyRef.current, WHY.length, setWhyPin, setWhyStep), []);

  useEffect(() => {
    const node = spaceRef.current;
    const growth = growthRef.current;
    if (!node || !growth) return undefined;
    const onScroll = () => {
      const live = window.scrollY >= growth.offsetTop - 40;
      node.classList.toggle("is-live", live);
      node.style.setProperty("--lp-spin", `${window.scrollY * 0.04}deg`);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mentorBox.current) {
      mentorBox.current.scrollTop = mentorBox.current.scrollHeight;
    }
  }, [mentorChat, mentorBusy]);

  const askLandingMentor = async (e) => {
    e.preventDefault();
    const question = mentorInput.trim();
    if (question.length < 3 || mentorBusy) return;
    setMentorInput("");
    setMentorChat((rows) => [...rows, { role: "user", text: question }]);
    setMentorBusy(true);
    try {
      const res = await fetch(`${API}/api/guide/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json().catch(() => ({}));
      const answer =
        data?.data?.answer ||
        data.message ||
        "Crystal Mentor could not finish that answer just now.";
      setMentorChat((rows) => [...rows, { role: "mentor", text: answer }]);
    } catch {
      setMentorChat((rows) => [
        ...rows,
        { role: "mentor", text: "Could not reach Crystal Mentor. Start the backend, then try again." },
      ]);
    } finally {
      setMentorBusy(false);
    }
  };

  return (
    <div className="lp">
      <div className="lp-space" ref={spaceRef} aria-hidden="true">
        <span className="lp-space-stars" />
        <span className="lp-space-orbit a" />
        <span className="lp-space-orbit b" />
        <span className="lp-space-orbit c" />
      </div>

      <div className="lp-shell">
        <header className="lp-nav">
          <Link className="lp-brand" to="/">
            <img src={logo} alt="" />
            <span>
              <strong>Crystal Web3 Academy</strong>
              <small>powered by Crystal Stones</small>
            </span>
          </Link>
          <div className="lp-nav-right">
            <nav>
              <a href="#ecosystem">Ecosystem</a>
              <a href="#growth">Growth</a>
              <a href="#ranks">Ranks</a>
              <a href="#why">Why</a>
              <a href="#courses">Courses</a>
            </nav>
            <Link className="lp-signin" to="/signin" onClick={goSignIn}>Sign in</Link>
            <Link className="lp-btn" to="/signup">Get started</Link>
          </div>
        </header>

        <section className="lp-hero" id="ecosystem">
          <div className="lp-hero-copy">
            <h1>
              Make Web3 <em>understandable</em>.
              <br />
              Verify before you trust.
            </h1>
            <p className="lp-lead">Education, not a buy signal.</p>
            <div className="lp-hero-cta">
              <Link className="lp-btn" to="/signup"><BookIcon /> Start Learning</Link>
              <a className="lp-btn ghost" href="#ecosystem"><ShieldIcon /> Explore Ecosystem</a>
            </div>
          </div>

          <div className="lp-orbit" style={{ position: "relative" }}>
            <div className="lp-radar" />
            <div className="lp-radar-sweep" />
            <div className="lp-compass" />
            <svg className="lp-lines" viewBox="0 0 100 100" aria-hidden="true">
              {SPOKES.map((s) => (
                <line key={s.id} x1="50" y1="50" x2={s.x} y2={s.y} className={s.id === spoke ? "is-on" : ""} />
              ))}
            </svg>
            <div
              className="lp-gem-wrap"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "54%",
                height: "54%",
                transform: "translate(-50%, -50%)",
                backgroundImage: `url(${crystalHex})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundSize: "contain",
                pointerEvents: "none",
                zIndex: 1,
              }}
              aria-hidden="true"
            />
            {SPOKES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`lp-spoke${s.id === spoke ? " is-on" : ""}${s.id === "education" && spoke === "education" ? " is-edu" : ""}`}
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
                onMouseEnter={() => setSpoke(s.id)}
                onFocus={() => setSpoke(s.id)}
                onClick={() => setSpoke(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        <div className="lp-caption">
          <CapIcon />
          <p><b>{active.label}.</b> {active.copy}</p>
        </div>
      </div>

      <section
        className="lp-growth"
        id="growth"
        ref={growthRef}
        style={{ height: `calc(100dvh + ${GROWTH.length * 18}vh)` }}
      >
        <div className={`lp-growth-sticky is-${growthPin}`}>
          <div className="lp-growth-art">
            <h2>
              Crystal growth
              <em>every step, everyday evolution</em>
            </h2>
            <img src={astronaut} alt="" />
          </div>

          <ol className="lp-growth-steps">
            {GROWTH.map((item, i) => (
              <li key={item.n} className={i === growthStep ? "is-on" : ""}>
                <span className="lp-growth-dot" />
                <div>
                  <small>{item.n}</small>
                  <strong>{item.title}</strong>
                  <p>{item.copy}</p>
                  {i === growthStep ? (
                    <div className="lp-growth-chips">
                      {item.chips.map((chip) => (
                        <span key={chip}>{chip}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <span className="lp-hexmark">
                  <img src={item.icon} alt="" />
                </span>
              </li>
            ))}
            <p className="lp-growth-foot">A learning path.</p>
          </ol>
        </div>
      </section>

      <section
        className="lp-ranks"
        id="ranks"
        ref={ranksRef}
        style={{ height: `calc(100dvh + ${RANKS.length * 18}vh)` }}
      >
        <div className={`lp-ranks-sticky is-${rankPin}`}>
          <div className="lp-stars" aria-hidden="true" />
          <div className="lp-ranks-copy">
            <p className="lp-growth-kicker">Academy ranks</p>
            <h2>
              Climb what you earn
              <em>XP from lessons, quizzes, and streaks.</em>
            </h2>
            <ol className="lp-rank-list">
              {RANKS.map((item, i) => (
                <li key={item.n} className={i === rankStep ? "is-on" : ""}>
                  <div className="lp-rank-row">
                    <small>{item.n}</small>
                    <strong>{item.name}</strong>
                    <span>{item.xp} XP</span>
                  </div>
                  <div className="lp-rank-bar">
                    <i style={{ width: barWidth(i, rankStep) }} />
                  </div>
                  {i === rankStep ? <p>{item.copy}</p> : null}
                </li>
              ))}
            </ol>
          </div>
          <div className="lp-ranks-art">
            <img src={ranksStairs} alt="" />
          </div>
        </div>
      </section>

      <section
        className="lp-why"
        id="why"
        ref={whyRef}
        style={{ height: `calc(100dvh + ${WHY.length * 12}vh)` }}
      >
        <div className={`lp-why-sticky is-${whyPin}`}>
          <div className="lp-why-copy">
            <p className="lp-why-kicker">Why learn with us</p>
            <h2>Why this academy</h2>
            <p className="lp-why-lead">
              A Web3 academy built with clarity, transparency, and real outcomes.
              <br />
              Track your growth. Learn in order. Finish the work, then the diploma.
            </p>
          </div>

          <div className="lp-why-map">
            <img className="lp-why-art" src={whyConstellation} alt="" />
          </div>

          <ol className="lp-why-list">
            {WHY.map((item, i) => (
              <li
                key={item.n}
                className={i === whyStep ? "is-on" : ""}
                onClick={() => setWhyStep(i)}
              >
                <span className="lp-hexmark">
                  <img src={item.icon} alt="" />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-courses" id="courses">
        <div className="lp-courses-inner">
          <div className="lp-courses-left">
            <h2>
              Three tracks.
              <em>One ladder.</em>
            </h2>
            <p>
              A vertical learning path from foundations to frontier.
              Master Web3 step by step.
            </p>
            <ol className="lp-course-path">
              {COURSES.map((track) => (
                <li key={track.key} className={track.locked ? "is-lock" : ""}>
                  <span className="lp-course-rail" aria-hidden="true" />
                  <img src={track.crystal} alt="" />
                  <div>
                    <small>{track.label}</small>
                    <ul>
                      {track.items.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                    <b>{track.price}</b>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="lp-courses-right">
            <div className="lp-courses-hex" aria-hidden="true">
              <img src={crystalHex} alt="" />
            </div>
            <div className="lp-courses-panel">
              <small>Sign in to explore</small>
              <p>Unlock the full academy experience and track your progress.</p>
              <button type="button" onClick={() => (sessionIsLive() ? navigate("/dashboard") : setGate(true))}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                Sign in to explore
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-foot-box">
          <div className="lp-foot-cta">
            <div className="lp-foot-brand">
              <img src={logo} alt="" />
              <div>
                <h2>Built by Crystal Stones</h2>
                <p>Real builders. Real education. Real Web3.</p>
              </div>
            </div>
            <a
              className="lp-foot-go"
              href="https://crystalstones.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="lp-hexmark" aria-hidden="true">
                <img src={logo} alt="" />
              </span>
              Open crystalstones.org
              <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="lp-foot-grid">
            <div>
              <small className="is-blue">Academy</small>
              <a href="#courses">Courses</a>
              <button type="button" onClick={() => setMentorOpen(true)}>Mentor</button>
              <a href="#ranks">Ranks</a>
            </div>
            <div>
              <small className="is-red">Legal</small>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Use</Link>
            </div>
            <div>
              <small className="is-blue">Community</small>
              <a href="https://t.me/CrystalStones" target="_blank" rel="noopener noreferrer">Telegram</a>
              <a href="https://x.com/crystalstones01" target="_blank" rel="noopener noreferrer">X (Twitter)</a>
            </div>
            <div className="lp-news">
              <small className="is-red">Contact</small>
              <p>Payment issues or questions. Write to the academy.</p>
              <a href={SUPPORT_GMAIL} target="_blank" rel="noopener noreferrer" onClick={openSupport}>
                info@crystalweb3academy.org
              </a>
            </div>
          </div>

          <div className="lp-foot-end">
            <img src={logo} alt="" />
            <p>
              Crystal Web3 Academy is education. <b>Not a buy signal.</b>
            </p>
            <span className="lp-foot-crystals" aria-hidden="true">
              <img src={crystalBasic} alt="" />
              <img src={crystalIntermediate} alt="" />
              <img src={crystalAdvanced} alt="" />
            </span>
            <small>© Crystal Web3 Academy. All rights reserved.</small>
          </div>
        </div>
      </footer>

      {gate ? (
        <div className="lp-gate" onClick={() => setGate(false)}>
          <div className="lp-gate-card" onClick={(e) => e.stopPropagation()}>
            <p className="lp-why-kicker">Crystal Web3 Academy</p>
            <h3>Sign in to explore courses</h3>
            <p>
              Basic is free. Intermediate is $10 USDT BEP-20 if you skip ahead.
              Advanced comes later.
            </p>
            <Link className="lp-btn" to="/signin" onClick={goSignIn}>Sign in</Link>
            <Link className="lp-btn ghost" to="/signup">Create account</Link>
            <button type="button" className="lp-gate-close" onClick={() => setGate(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}

      {mentorOpen ? (
        <div className="lp-fab-panel" role="dialog" aria-label="Crystal Mentor">
          <div className="lp-fab-head">
            <img src={logo} alt="" />
            <span>
              <strong>Crystal Mentor</strong>
              <small>Ask about the academy, tracks, or Crystal Stones. Education only.</small>
            </span>
          </div>
          <div className="lp-fab-chat" ref={mentorBox}>
            {mentorChat.length === 0 ? (
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
                <p>
                  No account needed. Ask about Basic, Intermediate, checkout, wallets, or Crystal Stones.
                  Not a buy signal.
                </p>
              </div>
            ) : (
              mentorChat.map((item, i) => (
                <div key={`${item.role}-${i}`} className={`lp-fab-bubble ${item.role}`}>
                  {item.text}
                </div>
              ))
            )}
            {mentorBusy ? <div className="lp-fab-bubble mentor">Thinking…</div> : null}
          </div>
          <form className="lp-fab-form" onSubmit={askLandingMentor}>
            <input
              value={mentorInput}
              onChange={(e) => setMentorInput(e.target.value)}
              placeholder="Ask Crystal Mentor..."
              maxLength={500}
              disabled={mentorBusy}
            />
            <button type="submit" disabled={mentorBusy}>
              {mentorBusy ? "…" : "➤"}
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className={`lp-fab${mentorOpen ? " is-open" : ""}`}
        aria-label={mentorOpen ? "Close Crystal Mentor" : "Open Crystal Mentor"}
        onClick={() => setMentorOpen((open) => !open)}
      >
        {mentorOpen ? <span>✕</span> : <img src={logo} alt="" />}
      </button>
    </div>
  );
}