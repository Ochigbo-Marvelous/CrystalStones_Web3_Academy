import { NavLink } from "react-router-dom";
import logo from "../assets/brand/logo-hex.png";
import "../styles/dashboard.css";

export default function Navbar({ user }) {
  return (
    <header className="db-nav">
      <div className="db-brand">
        <img src={logo} alt="" />
        <div>
          <strong>Crystal Stones Academy</strong>
          <span>Forge Knowledge. Achieve Mastery.</span>
        </div>
      </div>

      <nav className="db-pills">
        <NavLink to="/dashboard" end>Dashboard</NavLink>
        <NavLink to="/courses">Courses</NavLink>
        <NavLink to="/mentor">Crystal Mentor</NavLink>
        <NavLink to="/achievements">Achievements</NavLink>
        <NavLink to="/profile">Profile</NavLink>
      </nav>

      <div className="db-user">
        <div className="db-user-meta">
          <b>{user?.full_name || user?.username || "Learner"}</b>
          <small>{user?.current_rank || "Novice"}</small>
        </div>
        <div className="db-avatar">
          {user?.avatar ? <img src={user.avatar} alt="" /> : (user?.username || "U").slice(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  );
}