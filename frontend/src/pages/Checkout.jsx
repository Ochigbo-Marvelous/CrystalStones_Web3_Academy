import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../styles/signup.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function Checkout() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/signin");
      return undefined;
    }

    let timer;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const create = async () => {
      try {
        const res = await fetch(`${API}/api/payments/create/${courseId}`, {
          method: "POST",
          headers,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Could not create payment");
        setOrder(data.data);
      } catch (err) {
        setError(err.message);
      }
    };

    create();

    timer = window.setInterval(async () => {
      setOrder((current) => {
        if (!current?.id || current.status === "paid") return current;
        fetch(`${API}/api/payments/${current.id}/sync`, {
          method: "POST",
          headers,
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.data) {
              setOrder(data.data);
              if (data.data.status === "paid") navigate("/dashboard");
            }
          })
          .catch(() => {});
        return current;
      });
    }, 15000);

    return () => window.clearInterval(timer);
  }, [courseId, navigate, token]);

  const copy = async () => {
    if (!order?.payment_address) return;
    await navigator.clipboard.writeText(order.payment_address);
    setCopied(true);
  };

  return (
    <div className="su" style={{ display: "grid", placeItems: "center", padding: 24 }}>
      <div className="su-card" style={{ width: "min(100%, 480px)" }}>
        <h1>Pay with USDT</h1>
        <p className="lead">BNB Smart Chain (BEP-20) only.</p>
        {error ? <p className="su-error">{error}</p> : null}
        {!order && !error ? <p className="su-note">Creating payment...</p> : null}
        {order ? (
          <>
            <p className="su-label">AMOUNT</p>
            <p>
              ${order.amount_usd} ≈ {order.amount_usdt || order.amount_crystal} USDT
            </p>
            <p className="su-label">NETWORK</p>
            <p>{order.network}</p>
            <p className="su-label">SEND TO</p>
            <p style={{ wordBreak: "break-all" }}>{order.payment_address}</p>
            <button type="button" className="su-primary" onClick={copy}>
              {copied ? "COPIED" : "COPY ADDRESS"}
            </button>
            <p className="su-error">{order.warning}</p>
            <p className="su-note">
              Status: {order.status}. This page checks payment every 15 seconds.
            </p>
          </>
        ) : null}
        <p className="su-foot">
          <Link to="/dashboard">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}