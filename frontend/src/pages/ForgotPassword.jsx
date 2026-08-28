import { useState } from "react";
import { Link } from "react-router-dom";
import crystal from "../assets/brand/crystal-hero.png";
import logo from "../assets/brand/logo-hex.png";
import "../styles/signup.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const sendCode = async () => {
    if (!email.trim()) {
      setError("Enter your email");
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await fetch(`${API}/api/auth/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not send code");
      setInfo(data.message);
      startCooldown();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          new_password: password,
          confirm_password: confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not reset password");
      window.location.href = "/signin";
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="su">
      <div className="su-grid su-grid-login">
        <form className="su-card" onSubmit={onSubmit}>
          <div className="su-brand su-brand-login">
            <img src={logo} alt="" />
            <div className="su-brand-text">
              <strong>CRYSTAL WEB3</strong>
              <span>— ACADEMY —</span>
            </div>
          </div>

          <h1>Reset password</h1>
          <p className="lead">We will send a 6-digit code to your email.</p>

          <label className="su-label">EMAIL</label>
          <input className="su-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label className="su-label">CODE</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <input className="su-input" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
            <button type="button" className="su-primary" onClick={sendCode} disabled={sending || cooldown > 0} style={{ width: "auto", padding: "0 16px" }}>
              {cooldown > 0 ? `${cooldown}s` : sending ? "SENDING" : "GET CODE"}
            </button>
          </div>

          <label className="su-label">NEW PASSWORD</label>
          <input className="su-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <label className="su-label">CONFIRM PASSWORD</label>
          <input className="su-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

          {info ? <p className="su-note">{info}</p> : null}
          {error ? <p className="su-error">{error}</p> : null}

          <button className="su-primary" type="submit" disabled={saving}>
            {saving ? "SAVING..." : "UPDATE PASSWORD"}
          </button>
          <p className="su-foot">
            <Link to="/signin">Back to sign in</Link>
          </p>
        </form>
        <div className="su-crystal">
          <img src={crystal} alt="" />
        </div>
      </div>
    </div>
  );
}