import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");

const readCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const error = params.get("error") || params.get("google") || hash.get("error") || "";
  const token = hash.get("token") || params.get("token") || "";
  return { error, token };
};

const homeFor = (user) =>
  String(user?.role || "").trim().toLowerCase() === "admin" ? "/admin" : "/dashboard";

const readUser = (json) => json?.data?.user || json?.data || null;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { error: oauthError, token } = readCallback();
  const [bootError, setBootError] = useState("");
  const error =
    bootError ||
    oauthError ||
    (!token ? "Sign-in did not return a session. Try again." : "");

  useEffect(() => {
    if (oauthError || !token) return undefined;

    localStorage.setItem("token", token);
    const ac = new AbortController();
    const hdr = { Authorization: `Bearer ${token}` };

    fetch(`${API}/api/dashboard`, { headers: hdr, signal: ac.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || `Profile failed (${res.status})`);
        const user = readUser(json);
        if (!user?.id) throw new Error("Profile did not return a user");
        localStorage.setItem("user", JSON.stringify(user));
        return user;
      })
      .then((user) => {
        if (ac.signal.aborted) return;
        window.history.replaceState(null, "", "/auth/callback");
        navigate(homeFor(user), { replace: true });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setBootError(err.message || "Failed to fetch profile");
      });

    return () => ac.abort();
  }, [oauthError, token, navigate]);

  if (error) {
    return (
      <div className="su">
        <div className="su-card">
          <h1>Sign-in</h1>
          <p className="su-error">{error}</p>
          <p className="su-foot">
            <Link to="/admin">Try admin</Link>
            {" · "}
            <Link to="/dashboard">Student dashboard</Link>
            {" · "}
            <Link to="/signin">Sign in again</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="su">
      <div className="su-card">
        <h1>Signing you in…</h1>
        <p className="su-note">Please wait.</p>
      </div>
    </div>
  );
}