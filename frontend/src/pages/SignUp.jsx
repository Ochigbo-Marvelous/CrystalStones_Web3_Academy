import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/brand/logo-hex.png";
import crystal from "../assets/brand/crystal-hero.png";
import avatarDefault from "../assets/brand/avatar-crystal.png";
import iconLearn from "../assets/brand/icon-learn.png";
import iconMentor from "../assets/brand/icon-mentor.png";
import iconProgress from "../assets/brand/icon-progress.png";
import iconCommunity from "../assets/brand/icon-community.png";
import "../styles/signup.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.6-5.6-5.7S8.9 6 12 6c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.6 14.6 2.7 12 2.7 6.9 2.7 2.8 6.8 2.8 11.9S6.9 21.1 12 21.1c6.1 0 8.5-4.3 8.5-6.5 0-.4 0-.7-.1-1H12z" />
      <path fill="#4285F4" d="M20.5 14.6c.3-.8.5-1.7.5-2.7 0-.5 0-.9-.1-1.3H12v3.6h5.1c-.2.8-.7 1.8-1.6 2.4l2.4 1.8c1.6-1.5 2.6-3.7 2.6-3.8z" />
      <path fill="#FBBC05" d="M6.4 14.3l2.1 1.6C9.2 17.1 10.5 18 12 18c1.6 0 3-.6 4-1.6l2.4 1.8C16.7 19.8 14.6 21.1 12 21.1c-3.6 0-6.6-2.3-7.7-5.5l2.1-1.3z" />
      <path fill="#34A853" d="M6.4 9.5l2.1 1.6C9.3 9.3 10.5 8.4 12 8.4c1.3 0 2.5.5 3.4 1.3l2.5-2.4C16.4 5.8 14.4 4.8 12 4.8 8.5 4.8 5.5 6.9 4.3 10l2.1-.5z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#fff"
        d="M12 2.1c-5.5 0-10 4.5-10 10 0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1 .8-.2 1.6-.3 2.5-.3s1.7.1 2.5.3c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 4-1.3 6.8-5.1 6.8-9.5 0-5.5-4.5-10-10-10z"
      />
    </svg>
  );
}

const stars = [
  { left: "8%", delay: "0s", duration: "7s", color: "#4da3ff", size: 3 },
  { left: "18%", delay: "1.2s", duration: "9s", color: "#ff3b3b", size: 2 },
  { left: "27%", delay: "2.1s", duration: "6s", color: "#7ec8ff", size: 4 },
  { left: "39%", delay: "0.4s", duration: "8s", color: "#ff5d5d", size: 3 },
  { left: "48%", delay: "3s", duration: "10s", color: "#2f7bff", size: 2 },
  { left: "57%", delay: "1.6s", duration: "7.5s", color: "#ff3b3b", size: 3 },
  { left: "66%", delay: "2.8s", duration: "9.5s", color: "#67b4ff", size: 2 },
  { left: "74%", delay: "0.8s", duration: "6.8s", color: "#ff6b6b", size: 4 },
  { left: "83%", delay: "2.4s", duration: "8.4s", color: "#4da3ff", size: 3 },
  { left: "92%", delay: "1s", duration: "7.2s", color: "#ff3b3b", size: 2 },
];

export default function SignUp() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    code: "",
    username: "",
    password: "",
    confirm: "",
  });
  const [emailTicket, setEmailTicket] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [avatar, setAvatar] = useState(avatarDefault);
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const rules = useMemo(() => {
    const p = form.password;
    return [
      { id: "len", label: "8+ characters", ok: p.length >= 8 },
      { id: "case", label: "Upper and lowercase", ok: /[a-z]/.test(p) && /[A-Z]/.test(p) },
      { id: "num", label: "At least one number", ok: /\d/.test(p) },
      { id: "sym", label: "At least one symbol", ok: /[^A-Za-z0-9]/.test(p) },
      { id: "match", label: "Passwords match", ok: p.length > 0 && p === form.confirm },
    ];
  }, [form.password, form.confirm]);

  const ready =
    form.fullName.trim() &&
    form.email.trim() &&
    form.username.trim() &&
    emailTicket &&
    rules.every((r) => r.ok) &&
    !loading;

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "email") setEmailTicket("");
  };

  const startCooldown = () => {
    setCooldown(60);
    const timer = window.setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const onAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    setAvatarFile(file);
    setAvatar(URL.createObjectURL(file));
  };

  const sendCode = async () => {
    if (!form.email.trim()) {
      setError("Enter your email first");
      return;
    }
    setError("");
    setInfo("");
    setSendingCode(true);
    try {
      const res = await fetch(`${API}/api/auth/email/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not send code");
      setInfo(data.message || "Code sent");
      startCooldown();
    } catch (err) {
      setError(err.message || "Could not send code");
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(form.code.trim())) {
      setError("Enter the 6-digit code");
      return;
    }
    setError("");
    setInfo("");
    setVerifying(true);
    try {
      const res = await fetch(`${API}/api/auth/email/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), code: form.code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid code");
      setEmailTicket(data.data.email_ticket);
      setInfo("Email verified. You can create your account.");
    } catch (err) {
      setEmailTicket("");
      setError(err.message || "Invalid code");
    } finally {
      setVerifying(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.fullName.trim(),
          email: form.email.trim(),
          username: form.username.trim(),
          password: form.password,
          confirm_password: form.confirm,
          email_ticket: emailTicket,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not create account");

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      if (avatarFile) localStorage.setItem("pendingAvatarName", avatarFile.name);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || "Signup failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="su">
      <div className="su-grid">
        <aside className="su-side">
          <div className="su-brand">
            <img src={logo} alt="" />
            <div className="su-brand-text">
              <strong>CRYSTAL WEB3</strong>
              <span>— ACADEMY —</span>
              <p className="su-tag">Explore the future of digital assets and decentralized infrastructure.</p>
            </div>
          </div>
          <div className="su-feat">
            <img src={iconLearn} alt="" />
            <div>
              <h3>PERSONALIZED LEARNING</h3>
              <p>Adaptive paths crafted for you.<br /><b>Learn your way.</b></p>
            </div>
          </div>
          <div className="su-feat">
            <img src={iconMentor} alt="" />
            <div>
              <h3>EXPERT GUIDANCE</h3>
              <p>(CRYSTAL MENTOR)<br />Learn from masters. <b>Grow with guidance.</b></p>
            </div>
          </div>
          <div className="su-feat">
            <img src={iconProgress} alt="" />
            <div>
              <h3>TRACK PROGRESS</h3>
              <p>Crystal-clear analytics.<br /><b>See how you shine.</b></p>
            </div>
          </div>
          <div className="su-feat">
            <img src={iconCommunity} alt="" />
            <div>
              <h3>COMMUNITY ACCESS</h3>
              <p>Connect. Share. Elevate.<br /><b>You&apos;re not alone.</b></p>
            </div>
          </div>
        </aside>

        <form className="su-card" onSubmit={onSubmit}>
          <h1>Create your account</h1>
          <p className="lead">Verify your email before creating the account.</p>

          <div className="su-avatar">
            <img src={avatar} alt="Your avatar" />
            <label className="su-avatar-btn">
              Upload photo
              <input type="file" accept="image/*" onChange={onAvatar} hidden />
            </label>
          </div>

          <label className="su-label">FULL NAME</label>
          <input className="su-input" placeholder="Enter your full name" value={form.fullName} onChange={set("fullName")} />

          <label className="su-label">EMAIL</label>
          <input className="su-input" type="email" placeholder="Enter your email" value={form.email} onChange={set("email")} />

          <label className="su-label">EMAIL CODE</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <input
              className="su-input"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={form.code}
              onChange={set("code")}
            />
            <button
              type="button"
              className="su-primary"
              onClick={sendCode}
              disabled={sendingCode || cooldown > 0}
              style={{ width: "auto", padding: "0 16px", whiteSpace: "nowrap" }}
            >
              {cooldown > 0 ? `${cooldown}s` : sendingCode ? "SENDING" : "GET CODE"}
            </button>
          </div>
          <button
            type="button"
            className="su-oauth"
            onClick={verifyCode}
            disabled={verifying || !form.code}
            style={{ marginTop: 8 }}
          >
            {emailTicket ? "EMAIL VERIFIED" : verifying ? "VERIFYING..." : "VERIFY CODE"}
          </button>

          <label className="su-label">USERNAME</label>
          <input className="su-input" placeholder="Choose a username" value={form.username} onChange={set("username")} />
          <p className="su-note">This will be your unique Crystal ID.</p>

          <label className="su-label">PASSWORD</label>
          <input className="su-input" type="password" placeholder="Create a password" value={form.password} onChange={set("password")} />

          <label className="su-label">CONFIRM PASSWORD</label>
          <input className="su-input" type="password" placeholder="Confirm your password" value={form.confirm} onChange={set("confirm")} />

          <div className="su-rules">
            {rules.map((rule) => (
              <div className={`su-rule${rule.ok ? " ok" : ""}`} key={rule.id}>
                {rule.ok ? "✓" : "○"} {rule.label}
              </div>
            ))}
          </div>

          {info ? <p className="su-note">{info}</p> : null}
          {error ? <p className="su-error">{error}</p> : null}

          <button className="su-primary" type="submit" disabled={!ready}>
            {loading ? "CREATING..." : "CREATE ACCOUNT"}
          </button>

          <div className="su-or">or</div>
          <div className="su-social">
            <button type="button" className="su-oauth" onClick={() => { window.location.href = `${API}/api/auth/google`; }}>
              <GoogleIcon /> Continue with Google
            </button>
            <button type="button" className="su-oauth" onClick={() => { window.location.href = `${API}/api/auth/github`; }}>
              <GitHubIcon /> Continue with GitHub
            </button>
          </div>
          <p className="su-foot">
            Already have an account? <Link to="/signin">SIGN IN</Link>
          </p>
          <p className="su-legal">By continuing, you agree to the Terms of Service and Privacy Policy.</p>
        </form>

        <div className="su-crystal">
          <div className="su-stars">
            {stars.map((star) => (
              <span
                key={star.left}
                className="su-star"
                style={{
                  left: star.left,
                  animationDelay: star.delay,
                  animationDuration: star.duration,
                  background: star.color,
                  width: star.size,
                  height: star.size,
                }}
              />
            ))}
          </div>
          <img src={crystal} alt="" />
        </div>
      </div>
    </div>
  );
}