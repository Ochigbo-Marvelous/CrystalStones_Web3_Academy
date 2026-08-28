import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/signin", { replace: true });
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        const next = data.data?.user;
        setUser(next || null);
        setFullName(next?.full_name || "");
      });
  }, [navigate]);

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const saveName = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/profile`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ full_name: fullName }),
    });
    const data = await res.json();
    setMessage(data.message || (res.ok ? "Profile updated" : "Update failed"));
    if (data.data) setUser(data.data);
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/profile/password`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirm,
      }),
    });
    const data = await res.json();
    setMessage(data.message || (res.ok ? "Password updated" : "Password update failed"));
  };

  const logout = async () => {
    const token = localStorage.getItem("token");
    await fetch(`${API}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  return (
    <div className="db">
      <Navbar user={user} />
      <section className="db-finder">
        <h2>Profile</h2>
        <form className="db-card" onSubmit={saveName} style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          <label>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <button className="db-btn" type="submit">Save name</button>
        </form>
        <form className="db-card" onSubmit={savePassword} style={{ display: "grid", gap: 12 }}>
          <label>Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <label>New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <label>Confirm password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button className="db-btn" type="submit">Update password</button>
        </form>
        {message ? <p className="db-empty">{message}</p> : null}
        <button className="db-btn ghost" onClick={logout} style={{ marginTop: 16 }}>
          Log out
        </button>
      </section>
    </div>
  );
}