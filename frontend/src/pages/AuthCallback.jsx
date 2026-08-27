import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function AuthCallback() {
  const token = useMemo(
    () => new URLSearchParams(window.location.search).get("token"),
    []
  );
  const [message, setMessage] = useState(
    token ? "Signing you in..." : "Login failed. No token received."
  );

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;
    localStorage.setItem("token", token);

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.data?.user) {
          localStorage.setItem("user", JSON.stringify(data.data.user));
          setMessage(
            `Welcome ${data.data.user.full_name || data.data.user.username}. Redirecting...`
          );
        }
        window.setTimeout(() => {
          window.location.replace("/signin");
        }, 800);
      })
      .catch(() => {
        if (!cancelled) {
          setMessage("Signed in, but profile could not load.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="su" style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <p style={{ color: "#f4f7ff" }}>{message}</p>
    </div>
  );
}