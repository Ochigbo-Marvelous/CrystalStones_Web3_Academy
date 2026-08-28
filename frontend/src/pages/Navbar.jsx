import { useState } from "react";
import { NavLink } from "react-router-dom";
import logo from "../assets/brand/logo-hex.png";
import { rankImage } from "../lib/rankAssets";

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 0-3 3z" />
      <path d="M5 4.5A3 3 0 0 0 8 7.5v15" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2H4.5z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c1.4-3 4-4.5 7-4.5S17.6 16 19 19" />
    </svg>
  );
}

export default function Navbar({ user }) {
  const [open, setOpen] = useState(false);

  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    // ignore invalid localStorage
  }

  const name =
    user?.full_name ||
    user?.username ||
    stored?.full_name ||
    stored?.username ||
    "";
  const rank = user?.current_rank || stored?.current_rank || "Novice";
  const avatar = user?.avatar || stored?.avatar || "";

  return (
    <header className={`db-nav${open ? " is-open" : ""}`}>
      <div className="db-brand">
        <img src={logo} alt="" />
        <div>
          <strong>Crystal Stones Academy</strong>
          <span>Forge Knowledge. Achieve Mastery.</span>
        </div>
      </div>

      <button
        type="button"
        className="db-menu"
        aria-label="Toggle menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className="db-pills" onClick={() => setOpen(false)}>
        <NavLink to="/dashboard" end>
          <IconHome /> Dashboard
        </NavLink>
        <NavLink to="/courses">
          <IconBook /> Courses
        </NavLink>
        <NavLink to="/mentor">
          <IconSpark /> Crystal Mentor
        </NavLink>
        <NavLink to="/achievements">
          <IconBell /> Achievements
        </NavLink>
        <NavLink to="/profile">
          <IconUser /> Profile
        </NavLink>
      </nav>

      <div className="db-user">
        <div className="db-avatar">
          {avatar ? <img src={avatar} alt="" /> : (name || "U").slice(0, 1).toUpperCase()}
        </div>
        {name ? <b className="db-username">{name}</b> : null}
        <div className="db-rank">
          <img src={rankImage(rank)} alt="" />
          <span>{rank}</span>
        </div>
      </div>
    </header>
  );
}