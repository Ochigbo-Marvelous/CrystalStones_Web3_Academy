import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/brand/crystal-hero-hex.png";
import NotFound from "./NotFound";
import "../styles/admin.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "learners", label: "Learners" },
  { id: "tracks", label: "Tracks" },
  { id: "certificates", label: "Certificates" },
];

const roleOf = () => {
  try {
    return String(JSON.parse(localStorage.getItem("user") || "{}").role || "")
      .trim()
      .toLowerCase();
  } catch {
    return "";
  }
};

const headers = () => {
  const token = localStorage.getItem("token") || "";
  return { Authorization: `Bearer ${token}` };
};

const photo = (avatar) => {
  if (!avatar) return logo;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `${API}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
};

const fmtDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const deltaText = (n) => {
  if (n === null || n === undefined) return "Live now";
  const v = Number(n) || 0;
  const sign = v > 0 ? "↑" : v < 0 ? "↓" : "→";
  return `${sign} ${Math.abs(v)}% vs prior 30 days`;
};

function Donut({ slices, total, center }) {
  const parts = slices || [];
  const sum = parts.reduce((a, b) => a + Number(b.count || 0), 0) || 1;
  let acc = 0;
  const stops = parts.map((s) => {
    const from = (acc / sum) * 100;
    acc += Number(s.count || 0);
    const to = (acc / sum) * 100;
    return `${s.color || "#3a4a63"} ${from}% ${to}%`;
  });
  const bg = parts.length
    ? `conic-gradient(${stops.join(", ")})`
    : "conic-gradient(#243044 0 100%)";

  return (
    <div className="ad-donut-wrap">
      <div className="ad-donut" style={{ background: bg }}>
        <span>
          <b>{center ?? total ?? 0}</b>
        </span>
      </div>
      <ul className="ad-legend">
        {parts.map((s) => (
          <li key={s.key || s.label}>
            <i style={{ background: s.color }} />
            <span>{s.label}</span>
            <em>{s.percent}%</em>
            <small>{s.count}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IconPeople() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.4" />
      <path d="M3.5 19c.8-3 3-4.6 5.5-4.6S13.2 16 14 19" />
      <path d="M14 19c.5-2.2 2-3.4 4-3.4 1.5 0 2.7.7 3.4 1.9" />
    </svg>
  );
}
function IconFire() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M12 2s3 4 3 7a3 3 0 1 1-6 0c0-2 1.2-4.2 3-7z" opacity=".35" />
      <path d="M8 11c0 4 2.2 7 4 9 1.8-2 4-5 4-9 0-1.8-.7-3.4-2-4.6C13.4 9.2 12 11 12 11s-1.5-2.2-2.2-4.4C8.7 7.8 8 9.3 8 11z" />
    </svg>
  );
}
function IconRibbon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5 8 21l4-2.2L16 21l-1-7.5" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [certs, setCerts] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [gate, setGate] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpInfo, setOtpInfo] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [hidden, setHidden] = useState(false);

  const loadOverview = () => {
    setBusy(true);
    fetch(`${API}/api/admin/overview`, { headers: headers(), credentials: "include" })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setError("Session expired. Go to Sign in, then open /admin again.");
          return null;
        }
        if (res.status === 404) {
          setHidden(true);
          return null;
        }
        if (res.status === 403 && json.message === "ADMIN_OTP_REQUIRED") {
          setGate(true);
          return null;
        }
        if (!res.ok) throw new Error(json.message || `Admin failed (${res.status})`);
        setGate(false);
        return json.data;
      })
      .then((data) => {
        if (data) setOverview(data);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Admin failed");
      })
      .finally(() => setBusy(false));
  };

  useEffect(() => {
    const ac = new AbortController();
    fetch(`${API}/api/admin/overview`, {
      headers: headers(),
      credentials: "include",
      signal: ac.signal,
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setError("Session expired. Go to Sign in, then open /admin again.");
          return null;
        }
        if (res.status === 404) {
          setHidden(true);
          return null;
        }
        if (res.status === 403 && json.message === "ADMIN_OTP_REQUIRED") {
          setGate(true);
          return null;
        }
        if (!res.ok) throw new Error(json.message || `Admin failed (${res.status})`);
        setGate(false);
        return json.data;
      })
      .then((data) => {
        if (data) setOverview(data);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Admin failed");
      })
      .finally(() => setBusy(false));
    return () => ac.abort();
  }, [navigate]);

  const sendCode = () => {
    setOtpBusy(true);
    setError("");
    fetch(`${API}/api/admin/otp/send`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      credentials: "include",
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Could not send code");
        setOtpInfo(`Code sent to ${json.data?.email || "your admin email"}. Check inbox and spam.`);
      })
      .catch((err) => setError(err.message))
      .finally(() => setOtpBusy(false));
  };

  const verifyCode = (e) => {
    e.preventDefault();
    setOtpBusy(true);
    setError("");
    fetch(`${API}/api/admin/otp/verify`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code: otp }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Wrong code");
        setGate(false);
        loadOverview();
      })
      .catch((err) => setError(err.message))
      .finally(() => setOtpBusy(false));
  };

  const loadUsers = (query) => {
    fetch(`${API}/api/admin/users?q=${encodeURIComponent(query || "")}`, { headers: headers() })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Could not load learners");
        setUsers(json.data);
      })
      .catch((err) => setError(err.message));
  };

  const loadTracks = () => {
    fetch(`${API}/api/admin/tracks`, { headers: headers() })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Could not load tracks");
        setTracks(json.data || []);
      })
      .catch((err) => setError(err.message));
  };

  const loadCerts = () => {
    fetch(`${API}/api/admin/certificates`, { headers: headers() })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Could not load certificates");
        setCerts(json.data || []);
      })
      .catch((err) => setError(err.message));
  };

  const openTab = (id) => {
    setTab(id);
    if (id === "learners") loadUsers(q);
    if (id === "tracks") loadTracks();
    if (id === "certificates") loadCerts();
  };

  const search = (e) => {
    e.preventDefault();
    loadUsers(q);
  };

  const goDashboard = (e) => {
    e.preventDefault();
    fetch(`${API}/api/auth/me`, { headers: headers(), credentials: "include" })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (json?.data?.token) localStorage.setItem("token", json.data.token);
        if (json?.data?.user) localStorage.setItem("user", JSON.stringify(json.data.user));
      })
      .catch(() => {})
      .finally(() => {
        navigate("/dashboard");
      });
  };

  const kpis = overview?.kpis;
  const charts = overview?.charts;

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    const f = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${f(from)} – ${f(to)}`;
  }, []);

  if (hidden || roleOf() !== "admin") {
    return <NotFound />;
  }

  return (
    <div className="ad">
      <aside className="ad-side">
        <Link className="ad-brand" to="/dashboard" onClick={goDashboard}>
          <img src={logo} alt="" />
          <span>
            <strong>Crystal Web3</strong>
            <small>Academy</small>
          </span>
        </Link>
        <nav>
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "is-on" : ""}
              onClick={() => openTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <Link className="ad-back" to="/dashboard" onClick={goDashboard}>
          ← Dashboard
        </Link>
      </aside>

      <main className="ad-main">
        <header className="ad-top">
          <div>
            <h1>Crystal Web3 Academy</h1>
            <p>Admin Dashboard</p>
          </div>
          <span className="ad-range">{range}</span>
        </header>

        {error ? <p className="ad-error">{error}</p> : null}
        {busy && !overview && !gate ? <p className="ad-muted">Loading live numbers…</p> : null}

        {gate ? (
          <section className="ad-card" style={{ maxWidth: 420, marginBottom: 18 }}>
            <h2>Admin verification</h2>
            <p className="ad-muted">A 6-digit code is emailed to the admin address. Valid 10 minutes.</p>
            {otpInfo ? <p className="ad-muted">{otpInfo}</p> : null}
            <button type="button" className="ad-search" style={{ margin: "12px 0" }} onClick={sendCode} disabled={otpBusy}>
              {otpBusy ? "Sending…" : "Send code"}
            </button>
            <form className="ad-search" onSubmit={verifyCode}>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
              />
              <button type="submit" disabled={otpBusy || otp.length !== 6}>Unlock</button>
            </form>
          </section>
        ) : null}

        {tab === "overview" && overview ? (
          <>
            <section className="ad-kpis">
              <article className="ad-kpi is-learners">
                <span>
                  <i className="ad-kpi-ico"><IconPeople /></i>
                  Total learners
                </span>
                <b>{kpis.learners.value}</b>
                <small className={kpis.learners.delta > 0 ? "is-up" : kpis.learners.delta < 0 ? "is-down" : "is-flat"}>
                  {deltaText(kpis.learners.delta)}
                </small>
              </article>
              <article className="ad-kpi is-streak">
                <span>
                  <i className="ad-kpi-ico"><IconFire /></i>
                  Active streaks
                </span>
                <b>{kpis.streak_kept.value}</b>
                <small className="is-flat">{deltaText(kpis.streak_kept.delta)}</small>
              </article>
              <article className="ad-kpi is-certs">
                <span>
                  <i className="ad-kpi-ico"><IconRibbon /></i>
                  Certificates
                </span>
                <b>{kpis.certificates.value}</b>
                <small className={kpis.certificates.delta > 0 ? "is-up" : kpis.certificates.delta < 0 ? "is-down" : "is-flat"}>
                  {deltaText(kpis.certificates.delta)}
                </small>
              </article>
              <article className="ad-kpi is-unlocks">
                <span>
                  <i className="ad-kpi-ico"><IconLock /></i>
                  Intermediate unlocks
                </span>
                <b>{kpis.intermediate_unlocks.value}</b>
                <small className="is-flat">{deltaText(kpis.intermediate_unlocks.delta)}</small>
              </article>
            </section>

            <section className="ad-grid">
              <div className="ad-card">
                <h2>Track enrollment</h2>
                <Donut slices={charts.enrollment.slices} total={charts.enrollment.total} />
              </div>
              <div className="ad-card">
                <h2>Streak keep-rate</h2>
                <Donut
                  slices={charts.streaks.slices}
                  total={`${charts.streaks.keep_rate}%`}
                  center={`${charts.streaks.keep_rate}%`}
                />
              </div>
              <div className="ad-card">
                <h2>Certificates by track</h2>
                <Donut slices={charts.certificates.slices} total={charts.certificates.total} />
              </div>
              <div className="ad-card">
                <h2>Rank mix</h2>
                <Donut slices={charts.ranks.slices} total={charts.ranks.total} />
              </div>
              <div className="ad-card ad-recent">
                <div className="ad-card-head">
                  <h2>Recent learners</h2>
                  <button type="button" onClick={() => openTab("learners")}>View all</button>
                </div>
                <ul>
                  {(overview.recent || []).map((row) => (
                    <li key={row.id}>
                      <img src={photo(row.avatar)} alt="" />
                      <div>
                        <b>{row.username || row.name}</b>
                        <small>{row.rank}</small>
                      </div>
                      <em>{fmtDate(row.joined)}</em>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        ) : null}

        {tab === "learners" ? (
          <section className="ad-table-wrap">
            <form className="ad-search" onSubmit={search}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, username, email"
              />
              <button type="submit">Search</button>
            </form>
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Tracks</th>
                  <th>Rank</th>
                  <th>Streak</th>
                  <th>Certs</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {(users?.rows || []).map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="ad-person">
                        <img src={photo(row.avatar)} alt="" />
                        <span>
                          <b>{row.name}</b>
                          <small>@{row.username}</small>
                        </span>
                      </div>
                    </td>
                    <td>{(row.tracks || []).join(", ") || "—"}</td>
                    <td>{row.rank}</td>
                    <td>{row.streak}d</td>
                    <td>{row.certificates}</td>
                    <td>{fmtDate(row.joined)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="ad-muted">{users?.total || 0} learners</p>
          </section>
        ) : null}

        {tab === "tracks" ? (
          <section className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Track</th>
                  <th>Enrolled</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.label}</td>
                    <td>{row.enrollments}</td>
                    <td>{row.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {tab === "certificates" ? (
          <section className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Track</th>
                  <th>Code</th>
                  <th>Issued</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <b>{row.name}</b>
                      <small> @{row.username}</small>
                    </td>
                    <td>{row.track}</td>
                    <td>{row.code}</td>
                    <td>{fmtDate(row.issued_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </main>
    </div>
  );
}