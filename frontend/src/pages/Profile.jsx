import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { avatarSrc } from "../lib/avatarUrl";
import "../styles/dashboard.css";
import "../styles/profile.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

const persistUser = (next) => {
  localStorage.setItem("user", JSON.stringify(next));
};

function Skeleton() {
  return (
    <div className="db sk-screen">
      <div className="sk sk-nav" />
      <div className="sk sk-hero" />
      <div className="sk-main">
        <span className="sk" />
        <span className="sk" />
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const token = () => localStorage.getItem("token");

  const authHeaders = (json = true) => {
    const headers = { Authorization: `Bearer ${token()}` };
    if (json) headers["Content-Type"] = "application/json";
    return headers;
  };

  const applyUser = (next) => {
    if (!next) return;
    setUser(next);
    setFullName(next.full_name || "");
    setUsername(next.username || "");
    setEmail(next.email || "");
    persistUser(next);
  };

  useEffect(() => {
    const access = localStorage.getItem("token");
    if (!access) {
      navigate("/signin", { replace: true });
      return;
    }

    const started = Date.now();
    fetch(`${API}/api/profile`, {
      headers: { Authorization: `Bearer ${access}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Could not load profile");
        applyUser(data.data);
      })
      .catch((err) => {
        if (String(err.message).toLowerCase().includes("not authorized")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/signin", { replace: true });
          return;
        }
        setError(err.message || "Could not load profile");
      })
      .finally(() => {
        const wait = Math.max(0, 700 - (Date.now() - started));
        setTimeout(() => setReady(true), wait);
      });
  }, [navigate]);

  const passwordRules = useMemo(() => {
    const p = newPassword;
    return [
      { id: "len", label: "8+ characters", ok: p.length >= 8 },
      { id: "case", label: "Upper and lowercase", ok: /[a-z]/.test(p) && /[A-Z]/.test(p) },
      { id: "num", label: "At least one number", ok: /\d/.test(p) },
      { id: "sym", label: "At least one symbol", ok: /[^A-Za-z0-9]/.test(p) },
      { id: "match", label: "Passwords match", ok: p.length > 0 && p === confirm },
    ];
  }, [newPassword, confirm]);

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

  const run = async (key, fn) => {
    setBusy(key);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setBusy("");
    }
  };

  const onAvatar = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    run("avatar", async () => {
      const body = new FormData();
      body.append("avatar", file);
      const res = await fetch(`${API}/api/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Avatar upload failed");
      applyUser({ ...user, avatar: data.data.avatar });
      setMessage("Avatar updated");
    });
  };

  const saveProfile = (e) => {
    e.preventDefault();
    run("profile", async () => {
      const res = await fetch(`${API}/api/profile`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          full_name: fullName.trim(),
          username: username.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      applyUser(data.data);
      setMessage("Profile updated");
    });
  };

  const sendEmailCode = () => {
    run("email-code", async () => {
      const res = await fetch(`${API}/api/profile/email/send-code`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not send code");
      setMessage(data.message || "Code sent");
      startCooldown();
    });
  };

  const saveEmail = (e) => {
    e.preventDefault();
    run("email", async () => {
      const res = await fetch(`${API}/api/profile/email/confirm`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not change email");
      applyUser(data.data);
      setCode("");
      setMessage("Email updated");
    });
  };

  const savePassword = (e) => {
    e.preventDefault();
    if (!passwordRules.every((rule) => rule.ok)) {
      setError("Password does not meet the required pattern");
      return;
    }
    run("password", async () => {
      const res = await fetch(`${API}/api/profile/password`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password update failed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setMessage("Password updated");
    });
  };

  const logout = async () => {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
      });
    } catch {
      // still clear local session
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin", { replace: true });
  };

  const deleteAccount = (e) => {
    e.preventDefault();
    run("delete", async () => {
      const res = await fetch(`${API}/api/profile`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({
          password: currentPassword,
          confirm: deleteConfirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not delete account");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/signup", { replace: true });
    });
  };

  if (!ready) return <Skeleton />;

  const photo = avatarSrc(user?.avatar);
  const hasPassword = Boolean(user?.has_password);
  const crystalId = user?.username || "Learner";

  return (
    <div className="db">
      <Navbar user={user} />

      <section className="pf-hero">
        <div>
          <h1>Profile</h1>
          <p>Manage your Crystal ID, photo, and account security.</p>
        </div>
        <div className="pf-id">
          <small>Crystal ID</small>
          <b>@{crystalId}</b>
        </div>
      </section>

      {error ? <p className="pf-banner is-error">{error}</p> : null}
      {message ? <p className="pf-banner">{message}</p> : null}

      <section className="pf-grid">
        <form className="db-card pf-card" onSubmit={saveProfile}>
          <div className="pf-avatar">
            <div className="db-avatar pf-avatar-img">
              {photo ? <img src={photo} alt="" /> : (crystalId || "U").slice(0, 1).toUpperCase()}
            </div>
            <label className="db-btn ghost slim">
              {busy === "avatar" ? "Uploading..." : "Change photo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onAvatar} />
            </label>
          </div>

          <label>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />

          <label>Crystal ID / username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={24} />
          <small>This is the name shown on your dashboard.</small>

          <button className="db-btn" type="submit" disabled={busy === "profile"}>
            {busy === "profile" ? "Saving..." : "Save profile"}
          </button>
        </form>

        <form className="db-card pf-card" onSubmit={saveEmail}>
          <h2>Email</h2>
          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="pf-row">
            <input
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              type="button"
              className="db-btn ghost slim"
              onClick={sendEmailCode}
              disabled={busy === "email-code" || cooldown > 0}
            >
              {cooldown > 0 ? `${cooldown}s` : busy === "email-code" ? "Sending" : "Get code"}
            </button>
          </div>
          <button className="db-btn" type="submit" disabled={busy === "email"}>
            {busy === "email" ? "Saving..." : "Update email"}
          </button>
        </form>

        {hasPassword ? (
          <form className="db-card pf-card" onSubmit={savePassword}>
            <h2>Password</h2>
            <label>Current password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <label>New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <label>Confirm password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <div className="pf-rules">
              {passwordRules.map((rule) => (
                <span key={rule.id} className={rule.ok ? "ok" : ""}>
                  {rule.ok ? "✓" : "○"} {rule.label}
                </span>
              ))}
            </div>
            <button className="db-btn" type="submit" disabled={busy === "password"}>
              {busy === "password" ? "Saving..." : "Update password"}
            </button>
          </form>
        ) : (
          <div className="db-card pf-card">
            <h2>Password</h2>
            <p>This account uses GitHub sign-in, so there is no password to change.</p>
          </div>
        )}

        <form className="db-card pf-card pf-danger" onSubmit={deleteAccount}>
          <h2>Danger zone</h2>
          <p>Permanently delete your account and learning progress. This cannot be undone.</p>
          {hasPassword ? (
            <>
              <label>Current password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </>
          ) : null}
          <label>Type DELETE to confirm</label>
          <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
          <button className="db-btn" type="submit" disabled={busy === "delete" || deleteConfirm !== "DELETE"}>
            {busy === "delete" ? "Deleting..." : "Delete account"}
          </button>
          <button className="db-btn ghost" type="button" onClick={logout}>
            Log out
          </button>
        </form>
      </section>
    </div>
  );
}