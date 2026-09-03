import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");

const readCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const error = params.get("error") || params.get("google") || hash.get("error") || "";
  const token = hash.get("token") || params.get("token") || "";
  return { error, token };
};

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { error: googleError, token } = readCallback();
  const error =
    googleError ||
    (!token ? "Google sign-in did not return a session. Try again." : "");

  useEffect(() => {
    if (error || !token) return undefined;

    localStorage.setItem("token", token);
    const ac = new AbortController();

    fetch(`${API}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ac.signal,
    })
      .then((res) => res.json())
      .then((json) => {
        const user = json?.data?.user;
        if (user) localStorage.setItem("user", JSON.stringify(user));
      })
      .catch(() => {})
      .finally(() => {
        if (ac.signal.aborted) return;
        window.history.replaceState(null, "", "/oauth/callback");
        navigate("/dashboard", { replace: true });
      });

    return () => ac.abort();
  }, [error, token, navigate]);

  if (error) {
    return (
      <div className="su">
        <div className="su-card">
          <h1>Google sign-in</h1>
          <p className="su-error">{error}</p>
          <p className="su-foot">
            <Link to="/signin">Back to sign in</Link>
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