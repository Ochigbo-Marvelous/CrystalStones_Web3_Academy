import { Link } from "react-router-dom";
import logo from "../assets/brand/crystal-hero-hex.png";
import "../styles/not-found.css";

export default function NotFound() {
  const signedIn = Boolean(localStorage.getItem("token"));

  return (
    <div className="nf">
      <div className="nf-shell">
        <Link className="nf-brand" to="/">
          <img src={logo} alt="" />
          <span>
            <strong>Crystal Web3 Academy</strong>
            <small>powered by Crystal Stones</small>
          </span>
        </Link>

        <p className="nf-kicker">Error 404</p>
        <h1>
          Page not in
          <em> the academy.</em>
        </h1>
        <p className="nf-lead">
          This URL is not a lesson, a track, or a dashboard.
          Nothing was charged. This is not a buy signal.
        </p>

        <div className="nf-actions">
          <Link className="nf-btn" to="/">Back to home</Link>
          {signedIn ? (
            <Link className="nf-btn ghost" to="/dashboard">Go to dashboard</Link>
          ) : (
            <Link className="nf-btn ghost" to="/signin">Sign in</Link>
          )}
        </div>
      </div>
    </div>
  );
}