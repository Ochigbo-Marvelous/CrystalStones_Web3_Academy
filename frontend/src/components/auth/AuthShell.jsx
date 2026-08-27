import { Link } from "react-router-dom";
import logo from "../../assets/brand/logo-hex.png";
import StarField from "./StarField";
import CrystalScene from "./CrystalScene";
import "../../styles/auth.css";

export default function AuthShell({ children, side = "right" }) {
  return (
    <div className="auth-page">
      <StarField />

      <header className="auth-brand">
        <Link to="/" className="auth-brand-link">
          <img src={logo} alt="Crystal Stones" className="auth-logo" />
          <div>
            <h1>Crystal Stones Academy</h1>
            <p>Forge Knowledge. Achieve Mastery.</p>
          </div>
        </Link>
      </header>

      <main className={`auth-main ${side === "left" ? "side-left" : "side-right"}`}>
        <section className="auth-card neo-card">{children}</section>
        <section className="auth-visual">
          <CrystalScene />
        </section>
      </main>
    </div>
  );
}