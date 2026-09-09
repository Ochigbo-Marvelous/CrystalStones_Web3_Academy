import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import logo from "../assets/brand/crystal-hero-hex.png";
import crystalBasic from "../assets/brand/crystal-basic-blue.png";
import crystalIntermediate from "../assets/brand/crystal-intermediate-gold.png";
import "../styles/certificate.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
};

export default function Certificate() {
  const { track, code } = useParams();
  const [cert, setCert] = useState(null);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const run = async () => {
      try {
        const url = code
          ? `${API}/api/certificates/verify/${encodeURIComponent(code)}`
          : `${API}/api/certificates/${encodeURIComponent(track || "")}`;
        const headers = code
          ? {}
          : { Authorization: `Bearer ${token || ""}` };
        const res = await fetch(url, { headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          setError(data.message || "Certificate not found.");
          return;
        }
        setCert(data.data);
      } catch {
        setError("Could not load this diploma.");
      }
    };
    run();
  }, [track, code, token]);

  const gold = cert?.track === "intermediate";
  const crystal = gold ? crystalIntermediate : crystalBasic;
  const qr = useMemo(() => {
    if (!cert?.certificate_code) return "";
    const payload = `${window.location.origin}/c/${cert.certificate_code}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(payload)}`;
  }, [cert]);

  return (
    <div className="cert-page">
      <div className="cert-bar">
        <Link to="/achievements">Back</Link>
        {cert ? (
          <button type="button" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        ) : null}
      </div>

      {error ? <p className="cert-error">{error}</p> : null}

      {cert ? (
        <article className={`cert-sheet${gold ? " is-gold" : ""}`}>
          <div className="cert-art">
            <span className="cert-radar" aria-hidden="true" />
            <img src={crystal} alt="" />
          </div>
          <div className="cert-copy">
            <div className="cert-brand">
              <img src={logo} alt="" />
              Crystal Web3 Academy
            </div>
            <p className="cert-kicker">CERTIFICATE OF COMPLETION</p>
            <h1>{cert.label}</h1>
            <p className="cert-line">THIS IS TO CERTIFY THAT</p>
            <p className="cert-name">{cert.full_name}</p>
            <p className="cert-id">
              Crystal ID <b>{cert.crystal_id}</b>
            </p>
            <p className="cert-done">— {cert.curriculum} —</p>
            <p className="cert-focus">FOCUS: {cert.focus}</p>
            <div className="cert-meta">
              <div>
                <small>DATE</small>
                <b>{formatDate(cert.issued_at)}</b>
              </div>
              <div>
                {qr ? (
                  <div className="cert-qr">
                    <img src={qr} alt="" />
                  </div>
                ) : null}
                <p className="cert-hex">HEX ID {cert.hex_id}</p>
              </div>
            </div>
            <p className="cert-foot">EDUCATION ONLY • NOT FINANCIAL ADVICE • NOT A BUY SIGNAL</p>
          </div>
        </article>
      ) : null}
    </div>
  );
}