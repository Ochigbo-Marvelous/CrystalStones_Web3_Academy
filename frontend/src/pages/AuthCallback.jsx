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
    "";

  useEffect(() => {
    if (oauthError) return undefined;
    const ac = new AbortController();

    const boot = async () => {
      if (token) {
        const adopt = await fetch(`${API}/api/auth/session`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: ac.signal,
        });
        const adopted = await adopt.json().catch(() => ({}));
        if (adopt.ok && adopted?.data?.user) {
          localStorage.setItem("user", JSON.stringify(adopted.data.user));
          localStorage.setItem("token", token);
          window.history.replaceState(null, "", "/auth/callback");
          navigate(homeFor(adopted.data.user), { replace: true });
          return;
        }
        localStorage.setItem("token", token);
      }

      const res = await fetch(`${API}/api/auth/me`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: ac.signal,
      });
      const json = await res.json().catch(() => ({}));
      const user = readUser(json);
      if (!res.ok || !user?.id) {
        throw new Error(json.message || "Could not start session");
      }
      localStorage.setItem("user", JSON.stringify(user));
      const nextToken = json?.data?.token || token;
      if (nextToken) localStorage.setItem("token", nextToken);
      window.history.replaceState(null, "", "/auth/callback");
      navigate(homeFor(user), { replace: true });
    };

    boot().catch((err) => {
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