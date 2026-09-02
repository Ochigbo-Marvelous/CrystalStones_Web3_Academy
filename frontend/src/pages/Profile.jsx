import { useEffect, useState } from "react";
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
      <header className="sk-nav-row">
        <span className="sk sk-brand" />
        <span className="sk sk-pills" />
        <span className="sk sk-user" />
      </header>

      <section className="pf-page">
        <span className="sk pf-sk-title" />
        <div className="pf-board">
          <div className="pf-card pf-sk-card">
            <span className="sk pf-sk-h" />
            <div className="pf-ident">
              <span className="sk pf-sk-face" />
              <div>
                <span className="sk pf-sk-line" />
                <span className="sk pf-sk-line is-short" />
              </div>
            </div>
            <span className="sk pf-sk-input" />
            <span className="sk pf-sk-input" />
            <span className="sk pf-sk-btn" />
          </div>
          <div className="pf-card pf-sk-card">
            <span className="sk pf-sk-h" />
            <span className="sk pf-sk-input" />
            <span className="sk pf-sk-input" />
            <span className="sk pf-sk-btn" />
          </div>
          <div className="pf-card pf-sk-card">
            <span className="sk pf-sk-h" />
            <span className="sk pf-sk-input" />
            <span className="sk pf-sk-input" />
            <span className="sk pf-sk-input" />
            <span className="sk pf-sk-btn" />
          </div>
          <div className="pf-card pf-sk-card">
            <span className="sk pf-sk-h" />
            <span className="sk pf-sk-line" />
            <span className="sk pf-sk-input" />
            <span className="sk pf-sk-input" />
            <span className="sk pf-sk-btn is-danger" />
          </div>
        </div>
      </section>
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
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState("");

  const token = () => localStorage.getItem("token");

  const authHeaders = (json = true) => {
    const headers = { Authorization: `Bearer ${token()}` };
    if (json) headers["Content-Type"] = "application/json";
    return headers;
  };

  const showToast = (text, type = "ok") => {
    setToast({ text, type });
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
        showToast(err.message || "Could not load profile", "err");
      })
      .finally(() => {
        const wait = Math.max(0, 1000 - (Date.now() - started));
        setTimeout(() => setReady(true), wait);
      });
  }, [navigate]);

  const passwordOk =
    newPassword.length >= 8 &&
    /[a-z]/.test(newPassword) &&
    /[A-Z]/.test(newPassword) &&
    /\d/.test(newPassword) &&
    /[^A-Za-z0-9]/.test(newPassword) &&
    newPassword === confirm;

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
    try {
      await fn();
    } catch (err) {
      showToast(err.message || "Request failed", "err");
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
      showToast("Avatar updated");
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
      showToast("Profile updated");
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
      showToast(data.message || "Code sent");
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
      showToast("Email updated");
    });
  };

  const savePassword = (e) => {
    e.preventDefault();
    if (!passwordOk) {
      showToast("Password does not meet the required pattern", "err");
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
      showToast("Password updated");
    });
  };

  const deleteAccount = (e) => {
    e.preventDefault();
    run("delete", async () => {
      const res = await fetch(`${API}/api/profile`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({
          password: deletePassword,
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
  const initial = (crystalId || "U").slice(0, 1).toUpperCase();

  return (
    <div className="db">
      <Navbar user={user} />

      {toast ? <div className={`pf-toast ${toast.type}`}>{toast.text}</div> : null}

      <section className="pf-page">
        <h1>Profile</h1>

        <div className="pf-board">
          <form className="pf-card" onSubmit={saveProfile}>
            <h2>Identity</h2>
            <div className="pf-ident">
              <div className="pf-face">{photo ? <img src={photo} alt="" /> : initial}</div>
              <div>
                <b>{fullName || crystalId}</b>
                <small>@{crystalId}</small>
                <label className="pf-photo">
                  {busy === "avatar" ? "Uploading..." : "Change photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onAvatar} />
                </label>
              </div>
            </div>
            <label>
              Full name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
            </label>
            <label>
              Crystal ID
              <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={24} />
            </label>
            <button className="pf-btn" type="submit" disabled={busy === "profile"}>
              {busy === "profile" ? "Saving..." : "Save profile"}
            </button>
          </form>

          <form className="pf-card" onSubmit={saveEmail}>
            <h2>Email</h2>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Code
              <span className="pf-code">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  type="button"
                  className="pf-btn ghost"
                  onClick={sendEmailCode}
                  disabled={busy === "email-code" || cooldown > 0}
                >
                  {cooldown > 0 ? `${cooldown}s` : "Get code"}
                </button>
              </span>
            </label>
            <button className="pf-btn" type="submit" disabled={busy === "email"}>
              {busy === "email" ? "Saving..." : "Update email"}
            </button>
          </form>

          {hasPassword ? (
            <form className="pf-card" onSubmit={savePassword}>
              <h2>Password</h2>
              <label>
                Current password
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </label>
              <label>
                New password
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </label>
              <label>
                Confirm password
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </label>
              <button className="pf-btn" type="submit" disabled={busy === "password"}>
                {busy === "password" ? "Saving..." : "Update password"}
              </button>
            </form>
          ) : (
            <div className="pf-card">
              <h2>Password</h2>
              <p>This account uses GitHub sign-in, so there is no password to change.</p>
            </div>
          )}

          <form className="pf-card pf-danger" onSubmit={deleteAccount}>
            <h2>Delete account</h2>
            <p>This removes your progress permanently. Type DELETE to confirm.</p>
            {hasPassword ? (
              <label>
                Current password
                <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
              </label>
            ) : null}
            <label>
              Confirmation
              <input
                placeholder="Type DELETE"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
            </label>
            <button className="pf-btn danger" type="submit" disabled={busy === "delete" || deleteConfirm !== "DELETE"}>
              {busy === "delete" ? "Deleting..." : "Delete account"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}