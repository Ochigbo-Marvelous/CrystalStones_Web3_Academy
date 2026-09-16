import { useState } from "react";
import { Link } from "react-router-dom";
import crystal from "../assets/brand/crystal-hero-hex.png";
import logo from "../assets/brand/crystal-hero-hex.png";
import "../styles/signup.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");

const homeFor = (user) =>
  String(user?.role || "").trim().toLowerCase() === "admin" ? "/admin" : "/dashboard";

const oauthUrl = (path) => {
  const fallback = "http://localhost:5001";
  try {
    const env = API || fallback;
    const u = new URL(env, window.location.origin);
    const origin = u.origin === window.location.origin || u.port === "5173" ? fallback : u.origin;
    return `${origin}${path}`;
  } catch {
    return `${fallback}${path}`;
  }
};

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
  { left: "12%", delay: "0s", duration: "7s", color: "#4da3ff", size: 3 },
  { left: "28%", delay: "1.4s", duration: "9s", color: "#ff3b3b", size: 2 },
  { left: "46%", delay: "2.2s", duration: "6s", color: "#7ec8ff", size: 4 },
  { left: "63%", delay: "0.7s", duration: "8s", color: "#ff5d5d", size: 3 },
  { left: "81%", delay: "1.8s", duration: "7.4s", color: "#2f7bff", size: 2 },
];

export default function SignIn() {
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ready = form.login.trim() && form.password && !loading;
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: form.login.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      window.location.href = homeFor(data.data.user);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="su">
      <div className="su-grid su-grid-login">
        <div className="su-card">
          <div className="su-brand su-brand-login">
            <img src={logo} alt="" />
            <div className="su-brand-text">
              <strong>CRYSTAL WEB3</strong>
              <span>— ACADEMY —</span>
            </div>
          </div>

          <h1>Welcome back</h1>
          <p className="lead">Sign in with your username or email. Or continue with Google.</p>

          <form onSubmit={onSubmit}>
            <label className="su-label">USERNAME OR EMAIL</label>
            <input
              className="su-input"
              placeholder="Enter username or email"
              value={form.login}
              onChange={set("login")}
            />

            <label className="su-label">PASSWORD</label>
            <input
              className="su-input"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={set("password")}
            />

            <p className="su-note">
              <Link to="/forgot-password">Forgot password?</Link>
            </p>

            {error ? <p className="su-error">{error}</p> : null}

            <button className="su-primary" type="submit" disabled={!ready}>
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          <div className="su-or">or</div>

          <div className="su-social">
            <a
              className="su-oauth"
              href="http://localhost:5001/api/auth/google"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = oauthUrl("/api/auth/google");
              }}
            >
              <GoogleIcon /> Continue with Google
            </a>
            <a
              className="su-oauth"
              href="http://localhost:5001/api/auth/github"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = oauthUrl("/api/auth/github");
              }}
            >
              <GitHubIcon /> Continue with GitHub
            </a>
          </div>

          <p className="su-foot">
            Don't have an account? <Link to="/signup">SIGN UP</Link>
          </p>
        </div>

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