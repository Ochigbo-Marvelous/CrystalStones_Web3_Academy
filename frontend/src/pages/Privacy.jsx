import { Link } from "react-router-dom";
import logo from "../assets/brand/crystal-hero-hex.png";
import "../styles/landing.css";
import "../styles/legal.css";

const TOC = [
  ["who", "Who we are"],
  ["collect", "What we collect"],
  ["use", "How we use it"],
  ["oauth", "Accounts and sign-in"],
  ["pay", "Payments"],
  ["share", "Sharing"],
  ["keep", "Retention"],
  ["rights", "Your rights"],
  ["contact", "Contact"],
];

export default function Privacy() {
  return (
    <div className="lp lp-legal">
      <header className="lp-nav">
        <Link className="lp-brand" to="/">
          <img src={logo} alt="" />
          <span>
            <strong>Crystal Web3 Academy</strong>
            <small>powered by Crystal Stones</small>
          </span>
        </Link>
        <div className="lp-nav-right">
          <Link className="lp-signin" to="/terms">Terms of Use</Link>
          <Link className="lp-btn ghost" to="/">Back to academy</Link>
        </div>
      </header>

      <div className="lg-wrap">
        <nav className="lg-toc" aria-label="On this page">
          <small>On this page</small>
          {TOC.map(([id, label]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </nav>

        <article className="lg-article">
          <header className="lg-head">
            <p className="lg-kicker">Legal</p>
            <h1>Privacy Policy</h1>
            <p>
              How Crystal Web3 Academy handles the data needed to run your account,
              progress, and checkout. Short version: we do not sell it, and we never
              ask for a seed phrase.
            </p>
            <div className="lg-meta">
              <span>Effective September 2026</span>
              <span>Crystal Web3 Academy</span>
            </div>
          </header>

          <section id="who">
            <h2>1. Who we are</h2>
            <p>
              Crystal Web3 Academy is an education product powered by Crystal Stones.
              This policy covers the academy site, dashboard, Mentor, and checkout.
              The project site at crystalstones.org is separate.
            </p>
          </section>

          <section id="collect">
            <h2>2. What we collect</h2>
            <ul>
              <li>Account: name, username, email, avatar you upload.</li>
              <li>Progress: enrollments, lesson completion, quizzes, XP, rank, certificates.</li>
              <li>Support: questions you send to Mentor, and security logs needed to run the product.</li>
              <li>Checkout: order id, amount, network, and payment status for paid tracks. We do not store seed phrases or private keys.</li>
            </ul>
          </section>

          <section id="use">
            <h2>3. How we use it</h2>
            <p>
              To create your account, unlock tracks you paid for, show progress and
              ranks, issue certificates, answer Mentor questions, and keep the
              platform secure. We do not use academy data to send buy signals.
            </p>
          </section>

          <section id="oauth">
            <h2>4. Accounts and sign-in</h2>
            <p>
              You can create an account with email or continue with Google or GitHub.
              Those providers only share the profile you already allowed (name, email,
              avatar). Linking an existing email logs you into that same academy account.
            </p>
          </section>

          <section id="pay">
            <h2>5. Payments</h2>
            <p>
              Intermediate checkout is USDT on BNB Smart Chain (BEP-20) through the
              academy payment processor. We record whether an order is pending, paid,
              or expired so the track can unlock. We never ask for a seed, private key,
              2FA code, or remote screen control.
            </p>
          </section>

          <section id="share">
            <h2>6. Sharing</h2>
            <p>
              We do not sell your data. We share what a processor needs to complete
              sign-in or a payment, and what the law requires. Staff cannot see your
              wallet seed because we never collect it.
            </p>
          </section>

          <section id="keep">
            <h2>7. Retention</h2>
            <p>
              Account and progress stay while the account is active. You can ask us to
              close an account from the email on file. Payment records may be kept as
              long as needed to prove a paid unlock.
            </p>
          </section>

          <section id="rights">
            <h2>8. Your rights</h2>
            <p>
              You can view and update profile fields in the dashboard. For a copy of
              your data or a deletion request, write from the email on the account.
              Some records (paid unlocks, security logs) may be kept where the product
              or the law still needs them.
            </p>
          </section>

          <section id="contact">
            <h2>9. Contact</h2>
            <p>
              Use the email on your academy account, or the handles listed in the
              academy footer. Project questions that are not about this classroom
              belong on{" "}
              <a href="https://crystalstones.org/" target="_blank" rel="noopener noreferrer">
                crystalstones.org
              </a>
              .
            </p>
          </section>
        </article>
      </div>

      <div className="lg-end">
        <span>Crystal Web3 Academy is education. Not a buy signal.</span>
        <span>
          <Link to="/terms">Terms of Use</Link>
          {" · "}
          <Link to="/">Home</Link>
        </span>
      </div>
    </div>
  );
}