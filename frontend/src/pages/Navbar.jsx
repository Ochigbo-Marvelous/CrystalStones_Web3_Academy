import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/brand/crystal-hero-hex.png";
import { rankImage } from "../lib/rankAssets";
import { avatarSrc } from "../lib/avatarUrl";
import { clearAllMentorThreads } from "../lib/mentorStorage";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
const SUPPORT_GMAIL =
  "https://mail.google.com/mail/?view=cm&fs=1&to=info@crystalweb3academy.org&su=Crystal%20Web3%20Academy%20support";
const SUPPORT_MAIL =
  "mailto:info@crystalweb3academy.org?subject=Crystal%20Web3%20Academy%20support";

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

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 5 6v6c0 5 3.4 8.4 7 9.5 3.6-1.1 7-4.5 7-9.5V6l-7-3Z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const isPhone = () => {
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return true;
  return window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 900px)").matches;
};

const openSupport = (event) => {
  if (!isPhone()) return;
  event.preventDefault();
  window.location.href = SUPPORT_MAIL;
};

const logout = async () => {
  const token = localStorage.getItem("token");
  try {
    if (token) {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // local session still cleared below
  }
  clearAllMentorThreads();
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/signin";
};

export default function Navbar({ user }) {
  const [open, setOpen] = useState(false);
  const stored = readStoredUser();

  const name =
    user?.full_name ||
    user?.username ||
    stored?.full_name ||
    stored?.username ||
    "";
  const rank = user?.current_rank || stored?.current_rank || "Novice";
  const photo = avatarSrc(user?.avatar || stored?.avatar);
  const initial = (name || "U").slice(0, 1).toUpperCase();
  const isAdmin = String(user?.role || stored?.role || "").toLowerCase() === "admin";

  return (
    <header className={`db-nav${open ? " is-open" : ""}`}>
      <Link className="db-brand" to="/" style={{ color: "inherit", textDecoration: "none" }}>
        <img src={logo} alt="" />
        <div>
          <strong>Crystal Web3 Academy</strong>
          <span>Forge Knowledge. Achieve Mastery.</span>
        </div>
      </Link>

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
        <a href={SUPPORT_GMAIL} target="_blank" rel="noopener noreferrer" onClick={openSupport}>
          <IconMail /> Support
        </a>
        {isAdmin ? (
          <NavLink to="/admin">
            <IconShield /> Admin
          </NavLink>
        ) : null}
      </nav>

      <div className="db-user">
        <div className="db-avatar">
          {photo ? <img src={photo} alt="" /> : initial}
        </div>
        {name ? <b className="db-username">{name}</b> : null}
        <div className="db-rank">
          <img src={rankImage(rank)} alt="" />
          <span>{rank}</span>
        </div>
        <button type="button" className="db-logout" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}