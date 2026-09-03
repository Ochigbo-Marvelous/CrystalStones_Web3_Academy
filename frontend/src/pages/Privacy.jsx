import { Link } from "react-router-dom";
import "../styles/landing.css";

export default function Privacy() {
  return (
    <div className="lp">
      <article className="lp-legal">
        <p className="lp-kicker">Crystal Web3 Academy</p>
        <h1>Privacy</h1>
        <p>
          Crystal Web3 Academy is education software powered by Crystal Stones. This page says
          what we store and why. It is not legal advice.
        </p>
        <h2>Account</h2>
        <p>
          We store the name, username, email, avatar, and authentication method you provide
          (password hash, Google, or GitHub). Google and GitHub only send the profile fields
          needed to create or link a Crystal ID.
        </p>
        <h2>Learning data</h2>
        <p>
          Progress, quiz results, XP, rank, achievements, and certificates are stored so the
          dashboard and leaderboard work. Mentor questions may be logged in short form for
          abuse and quality.
        </p>
        <h2>Payments</h2>
        <p>
          Intermediate checkout records order id, amount, asset (USDT on BNB Smart Chain),
          status, and the deposit address assigned to that order. We do not ask for seed
          phrases or card PANs on this site.
        </p>
        <h2>Mail</h2>
        <p>
          Newsletter and complaints currently go to info@crystalstones.org until a dedicated
          address is published. Do not send seeds or private keys to any academy mailbox.
        </p>
        <h2>Cookies and local storage</h2>
        <p>
          A session token is stored in your browser so you stay signed in. Clearing it signs
          you out on that device.
        </p>
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </article>
    </div>
  );
}