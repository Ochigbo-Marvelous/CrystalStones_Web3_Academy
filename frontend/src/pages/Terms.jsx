import { Link } from "react-router-dom";
import logo from "../assets/brand/crystal-hero-hex.png";
import "../styles/landing.css";
import "../styles/legal.css";

const TOC = [
  ["product", "The product"],
  ["advice", "Not financial advice"],
  ["account", "Your account"],
  ["tracks", "Tracks and pricing"],
  ["pay", "Payments"],
  ["keys", "Keys and safety"],
  ["certs", "Certificates"],
  ["conduct", "Conduct"],
  ["ip", "Content"],
  ["contact", "Contact"],
];

export default function Terms() {
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
          <Link className="lp-signin" to="/privacy">Privacy Policy</Link>
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
            <h1>Terms of Use</h1>
            <p>
              Rules for using Crystal Web3 Academy. This is a classroom. Completing a
              track does not entitle you to tokens and is not a buy signal.
            </p>
            <div className="lg-meta">
              <span>Effective September 2026</span>
              <span>Crystal Web3 Academy</span>
            </div>
          </header>

          <section id="product">
            <h2>1. The product</h2>
            <p>
              Crystal Web3 Academy is education: lessons, quizzes, Mentor, ranks,
              and certificates. It is powered by Crystal Stones. The project site at
              crystalstones.org is a different product and a different set of terms.
            </p>
          </section>

          <section id="advice">
            <h2>2. Not financial advice</h2>
            <p>
              Nothing in the academy is investment advice, a solicitation, or a
              recommendation to buy, sell, or hold any asset. Mentor answers use
              academy lessons and published project facts. Verify contracts, networks,
              and amounts yourself before you send value.
            </p>
          </section>

          <section id="account">
            <h2>3. Your account</h2>
            <p>
              You must provide a working email. You are responsible for the devices
              and passwords you use. Do not share an account. We may suspend an
              account that is used to attack the product or other learners.
            </p>
          </section>

          <section id="tracks">
            <h2>4. Tracks and pricing</h2>
            <ul>
              <li>Basic is free.</li>
              <li>Intermediate is a paid bundle at the listed price in USDT on BNB Smart Chain (BEP-20). You may buy it without finishing Basic.</li>
              <li>Advanced is not live yet. Do not pay anyone who claims to sell it early.</li>
            </ul>
          </section>

          <section id="pay">
            <h2>5. Payments</h2>
            <p>
              Paid tracks check out on the academy site only. Send the listed asset
              on the listed network to the address shown for that order. A payment
              on the wrong network can be lost. Unlock happens when that order is
              confirmed paid. Staff will never DM you a wallet to pay.
            </p>
          </section>

          <section id="keys">
            <h2>6. Keys and safety</h2>
            <p>
              You keep your own keys. Academy staff will never ask for a seed phrase,
              private key, 2FA code, or remote screen control. If someone does, it is
              not us. Report it and do not send.
            </p>
          </section>

          <section id="certs">
            <h2>7. Certificates</h2>
            <p>
              A diploma is issued when you finish a live track under the rules of
              that track. It records that you completed the classroom work. It is not
              a license, a job offer, or a claim on any token.
            </p>
          </section>

          <section id="conduct">
            <h2>8. Conduct</h2>
            <p>
              Do not scrape the lessons for resale, attack the API, or impersonate
              academy staff. Mentor is for learning questions, not for asking us to
              place a trade.
            </p>
          </section>

          <section id="ip">
            <h2>9. Content</h2>
            <p>
              Lessons, UI, and brand marks belong to the academy / Crystal Stones
              unless a lesson says otherwise. You may use what you learned. You may
              not copy the course files as a competing product.
            </p>
          </section>

          <section id="contact">
            <h2>10. Contact</h2>
            <p>
              Questions about these terms: write from the email on your account, or
              use the community links in the footer. Project site:{" "}
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
          <Link to="/privacy">Privacy Policy</Link>
          {" · "}
          <Link to="/">Home</Link>
        </span>
      </div>
    </div>
  );
}