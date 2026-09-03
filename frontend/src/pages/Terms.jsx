import { Link } from "react-router-dom";
import "../styles/landing.css";

export default function Terms() {
  return (
    <div className="lp">
      <article className="lp-legal">
        <p className="lp-kicker">Crystal Web3 Academy</p>
        <h1>Terms of use</h1>
        <p>
          Crystal Web3 Academy is an education product. Completing a course does not make you
          a financial advisor, a trader, or an employee of Crystal Stones.
        </p>
        <h2>Not financial advice</h2>
        <p>
          Lessons, Mentor answers, and this website will not tell you to buy, sell, or hold
          Crystal Stones or any other asset. The public BEP-20 contract
          0xe252FCb1Aa2E0876E9B5f3eD1e15B9b4d11A0b00 is published so you can verify a token.
          It is not a payment address and not a buy order. RWA backing is the project’s claim
          to verify, not a guarantee.
        </p>
        <h2>Accounts</h2>
        <p>
          You are responsible for the email and authenticators on your Crystal ID. Staff will
          never ask for a seed phrase, private key, 2FA codes, or remote screen control.
        </p>
        <h2>Basic and Intermediate</h2>
        <p>
          Basic is free. Intermediate is a paid track at 10 USD, settled in USDT on BNB Smart
          Chain (BEP-20) through academy checkout. Access unlocks when that invoice is
          confirmed. Advanced is not live.
        </p>
        <h2>Certificates</h2>
        <p>
          A track diploma is issued when that live track is actually finished. It is a record
          of academy progress, not a government licence.
        </p>
        <h2>Acceptable use</h2>
        <p>
          Do not use Mentor or the academy to run scams, impersonate staff, or harvest other
          learners’ keys. We may suspend accounts that do.
        </p>
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </article>
    </div>
  );
}