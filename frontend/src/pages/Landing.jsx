import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/brand/crystal-hero-hex.png";
import crystalHex from "../assets/brand/crystal-hero-hex.png";
import astronaut from "../assets/brand/crystal-growth-astronaut.png";
import "../styles/landing.css";

const SPOKES = [
  { id: "network", label: "Network", x: 50, y: 8, copy: "Public chains run because people participate. This academy does not pay you to stake." },
  { id: "gaming", label: "Gaming", x: 78, y: 18, copy: "On-chain games are an application class. Literacy first, play later." },
  { id: "travel", label: "Travel", x: 92, y: 38, copy: "A future rail in the wider Crystal Stones map. Not a booking desk here." },
  { id: "causes", label: "Causes", x: 92, y: 62, copy: "Support work you chose. Always verify the destination address yourself." },
  { id: "rwa", label: "RWA", x: 78, y: 82, copy: "Real-world assets are a claim to verify — not a proven vault." },
  { id: "markets", label: "Markets", x: 50, y: 92, copy: "A CEX is a company ledger. It is not the blockchain." },
  { id: "education", label: "Education", x: 22, y: 82, copy: "Structured tracks, Mentor, progress, certificates. Not a buy signal." },
  { id: "commerce", label: "Commerce", x: 8, y: 62, copy: "Spend only where a merchant actually accepts the rail you are using." },
  { id: "assets", label: "Assets", x: 8, y: 38, copy: "Project exposure is not a guaranteed return. We will not tell you to buy." },
  { id: "payments", label: "Payments", x: 22, y: 18, copy: "Move value on a public book. Verify the network before you send." },
];

const GROWTH = [
  { n: "01", title: "Community", copy: "Connect with others" },
  { n: "02", title: "Engagement", copy: "Show up and participate" },
  { n: "03", title: "Value", copy: "Build through contribution" },
  { n: "04", title: "Adoption", copy: "Build habits that last" },
  { n: "05", title: "Progress", copy: "XP, streak, quizzes" },
  { n: "06", title: "Mastery", copy: "Deepen your skills" },
  { n: "07", title: "Depth", copy: "Explore advanced paths" },
  { n: "08", title: "Legacy", copy: "Leave a lasting impact" },
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
      <path d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z" stroke="#5ad0ff" strokeWidth="1.6" />
      <path d="M7 12v4.2c0 .8 2.2 2.3 5 2.3s5-1.5 5-2.3V12" stroke="#5ad0ff" strokeWidth="1.6" />
    </svg>
  );
}

function HexMark() {
  return (
    <span className="lp-hexmark">
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <polygon points="18,2 33,10.5 33,25.5 18,34 3,25.5 3,10.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </span>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [spoke, setSpoke] = useState("education");
  const [growthStep, setGrowthStep] = useState(0);
  const [growthPin, setGrowthPin] = useState("pre");
  const growthRef = useRef(null);
  const active = SPOKES.find((s) => s.id === spoke) || SPOKES[6];

  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/dashboard", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const el = growthRef.current;
    if (!el) return undefined;

    const onScroll = () => {
      const start = el.offsetTop;
      const total = Math.max(1, el.offsetHeight - window.innerHeight);
      const y = window.scrollY || window.pageYOffset;
      const scrolled = y - start;

      if (scrolled < 0) {
        setGrowthPin("pre");
        setGrowthStep(0);
        return;
      }
      if (scrolled >= total) {
        setGrowthPin("end");
        setGrowthStep(GROWTH.length - 1);
        return;
      }

      setGrowthPin("pin");
      setGrowthStep(Math.min(GROWTH.length - 1, Math.floor((scrolled / total) * GROWTH.length)));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="lp">
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
              <a href="#courses">Courses</a>
            </nav>
            <Link className="lp-signin" to="/signin">Sign in</Link>
            <Link className="lp-btn" to="/signup">Start Basic free</Link>
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
              <Link className="lp-btn" to="/signup"><BookIcon /> Start Learning Free</Link>
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
        style={{ height: `${GROWTH.length * 40}vh` }}
      >
        <div className={`lp-growth-sticky is-${growthPin}`}>
          <div className="lp-growth-art">
            <p className="lp-growth-kicker">Crystal growth — every step, everyday evolution</p>
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
                  {item.n === "05" && i === growthStep ? (
                    <div className="lp-growth-chips">
                      <span>XP</span>
                      <span>Streak</span>
                      <span>Quizzes</span>
                    </div>
                  ) : null}
                </div>
                <HexMark />
              </li>
            ))}
            <p className="lp-growth-foot">A learning path, not a price chart.</p>
          </ol>
        </div>
      </section>
    </div>
  );
}