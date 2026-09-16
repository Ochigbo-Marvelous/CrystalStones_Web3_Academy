import { Component } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/brand/crystal-hero-hex.png";
import "../styles/error-boundary.css";

function CrashScreen({ onRetry }) {
  const signedIn = Boolean(localStorage.getItem("token"));

  return (
    <div className="eb">
      <div className="eb-shell">
        <Link className="eb-brand" to="/" onClick={onRetry}>
          <img src={logo} alt="" />
          <span>
            <strong>Crystal Web3 Academy</strong>
            <small>powered by Crystal Stones</small>
          </span>
        </Link>

        <p className="eb-kicker">Something broke</p>
        <h1>
          This screen hit a
          <em> fault.</em>
        </h1>
        <p className="eb-lead">
          The academy is still here. This page crashed while drawing.
          Nothing was charged. This is not a buy signal.
        </p>

        <div className="eb-actions">
          <button type="button" className="eb-btn" onClick={onRetry}>
            Try again
          </button>
          <Link className="eb-btn ghost" to="/" onClick={onRetry}>
            Back to home
          </Link>
          {signedIn ? (
            <Link className="eb-btn ghost" to="/dashboard" onClick={onRetry}>
              Go to dashboard
            </Link>
          ) : (
            <Link className="eb-btn ghost" to="/signin" onClick={onRetry}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

class ErrorBoundaryInner extends Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error, info) {
    console.error("ACADEMY_CRASH", error, info?.componentStack || "");
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.crashed) {
      this.setState({ crashed: false });
    }
  }

  retry = () => {
    this.setState({ crashed: false });
  };

  render() {
    if (this.state.crashed) {
      return <CrashScreen onRetry={this.retry} />;
    }
    return this.props.children;
  }
}

export default function ErrorBoundary({ children }) {
  const location = useLocation();
  return (
    <ErrorBoundaryInner resetKey={location.pathname}>
      {children}
    </ErrorBoundaryInner>
  );
}