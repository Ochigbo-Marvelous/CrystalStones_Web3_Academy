import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import "../styles/dashboard.css";
import "../styles/checkout.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const copyText = async (value) => {
  const text = String(value || "");
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const toTokenUnits = (raw) => {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  const [wholePart, fracPart = ""] = text.split(".");
  const whole = (wholePart || "0").replace(/\D/g, "") || "0";
  const frac = `${fracPart}000000000000000000`.replace(/\D/g, "").slice(0, 18);
  try {
    return BigInt(whole + frac).toString();
  } catch {
    return "";
  }
};

const qrImage = (value) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&ecc=M&data=${encodeURIComponent(value)}`;

const trustPayUrl = (address, amount) => {
  const url = new URL("https://link.trustwallet.com/send");
  url.searchParams.set("coin", "20000714");
  url.searchParams.set("address", address);
  url.searchParams.set("token_id", USDT_BSC);
  if (amount) url.searchParams.set("amount", String(amount));
  return url.toString();
};

const metaMaskPayUrl = (address, amount) => {
  const units = toTokenUnits(amount);
  const url = new URL(`https://metamask.app.link/send/${USDT_BSC}@56/transfer`);
  url.searchParams.set("address", address);
  if (units) url.searchParams.set("uint256", units);
  return url.toString();
};

const createInvoice = (token, courseId, signal) => {
  const headers = authHeaders(token);
  const path =
    !courseId || courseId === "intermediate" || Number.isNaN(Number(courseId))
      ? "/api/payments/track/intermediate"
      : `/api/payments/create/${Number(courseId)}`;

  return fetch(`${API}/api/payments/access`, { headers, signal })
    .then((res) => res.json())
    .then((accessJson) => {
      if (signal?.aborted) return { kind: "aborted" };
      if (accessJson?.data?.intermediate) return { kind: "owned" };
      return fetch(`${API}${path}`, { method: "POST", headers, signal }).then(async (res) => {
        const json = await res.json().catch(() => ({}));
        return { kind: "order", res, json };
      });
    });
};

export default function Checkout() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [copied, setCopied] = useState("");
  const [note, setNote] = useState("");
  const renewedFor = useRef("");

  const paid = order?.status === "paid";
  const expired = order?.status === "expired" || order?.status === "failed";
  const live = Boolean(order) && !paid && !expired;
  const amount = order?.amount_usdt || order?.amount_crystal || order?.pay_amount;
  const address = order?.payment_address || "";
  const orderId = order?.id;

  useEffect(() => {
    if (!token) {
      navigate("/signin", { replace: true });
      return undefined;
    }

    const ac = new AbortController();
    const headers = authHeaders(token);

    fetch(`${API}/api/auth/me`, { headers, signal: ac.signal })
      .then((res) => res.json())
      .then((me) => {
        if (me?.data?.user) setUser(me.data.user);
      })
      .catch(() => {});

    createInvoice(token, courseId, ac.signal)
      .then((result) => {
        if (!result || result.kind === "aborted") return;
        if (result.kind === "owned") {
          navigate("/courses", { replace: true });
          return;
        }
        if (result.res.status === 409) {
          navigate("/courses", { replace: true });
          return;
        }
        if (!result.res.ok) {
          throw new Error(result.json.message || "Could not start checkout");
        }
        setOrder(result.json.data);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Could not start checkout");
      })
      .finally(() => {
        if (!ac.signal.aborted) setBusy(false);
      });

    return () => ac.abort();
  }, [courseId, navigate, token]);

  useEffect(() => {
    if (!token || !orderId || paid) return undefined;
    const headers = authHeaders(token);
    const timer = window.setInterval(() => {
      fetch(`${API}/api/payments/${orderId}/sync`, {
        method: "POST",
        headers,
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.data) setOrder(json.data);
        })
        .catch(() => {});
    }, 8000);
    return () => window.clearInterval(timer);
  }, [orderId, paid, token]);

  useEffect(() => {
    if (!token || !expired || !orderId) return undefined;
    if (renewedFor.current === String(orderId)) return undefined;
    renewedFor.current = String(orderId);
    setBusy(true);
    setNote("This invoice expired. Creating a new one…");

    createInvoice(token, courseId)
      .then((result) => {
        if (result?.kind === "owned") {
          navigate("/courses", { replace: true });
          return;
        }
        if (result?.kind === "order" && result.res?.ok && result.json?.data) {
          setOrder(result.json.data);
          setNote("New invoice ready. Send USDT BEP-20 to the address below.");
          setError("");
          return;
        }
        throw new Error(result?.json?.message || "Could not create a new invoice");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Could not create a new invoice");
      })
      .finally(() => setBusy(false));
  }, [courseId, expired, navigate, orderId, token]);

  const markCopied = (key) => {
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1600);
  };

  const printReceipt = (current) => {
    if (!current || current.status !== "paid") {
      setNote("Payment is not confirmed yet. Stay on this page until status says Paid.");
      return;
    }
    window.print();
  };

  const onPrintReceipt = () => {
    if (!token || !orderId) return;
    if (paid) {
      printReceipt(order);
      return;
    }
    setNote("Checking NOWPayments…");
    fetch(`${API}/api/payments/${orderId}/sync`, {
      method: "POST",
      headers: authHeaders(token),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setOrder(json.data);
        if (json.data?.status === "paid") {
          window.setTimeout(() => printReceipt(json.data), 50);
        } else {
          setNote("Payment is not confirmed yet. Stay on this page until status says Paid.");
        }
      })
      .catch(() => {
        setNote("Could not check payment yet. Wait a few seconds and try again.");
      });
  };

  const paidAt = order?.paid_at ? new Date(order.paid_at).toLocaleString() : new Date().toLocaleString();

  return (
    <div className="db">
      <Navbar user={user} />
      <section className="ck-page">
        <div className="ck-card">
          <p className="ck-kicker">Crystal Stones Academy</p>
          <h1>Intermediate Track</h1>
          <p className="ck-lead">
            $10 USD unlocks every Intermediate course. Pay once in USDT on BNB Smart Chain
            (BEP-20). Basic is not required.
          </p>

          {error ? <p className="ck-error">{error}</p> : null}
          {note ? <p className="ck-muted">{note}</p> : null}
          {busy && !live && !paid ? <p className="ck-muted">Creating your invoice…</p> : null}

          {paid ? (
            <div className="ck-paid">
              <strong>Payment confirmed. Intermediate is unlocked.</strong>
              <p>Print your receipt, then go back to Courses.</p>
            </div>
          ) : null}

          {order && (live || paid) ? (
            <>
              <div className="ck-facts">
                <div>
                  <span>Amount</span>
                  <b>{amount ? Number(amount).toString() : "—"} USDT</b>
                </div>
                <div>
                  <span>Network</span>
                  <b>BNB Smart Chain · BEP-20</b>
                </div>
                <div>
                  <span>Status</span>
                  <b className={`ck-status${expired ? " is-expired" : ""}${paid ? " is-paid" : ""}`}>
                    {order.status || "pending"}
                  </b>
                </div>
              </div>

              {live ? (
                <div className="ck-paybox">
                  <div className="ck-qr">
                    {address ? (
                      <img src={qrImage(address)} alt="USDT BEP-20 payment QR" />
                    ) : (
                      <div className="ck-qr-wait">Waiting for QR…</div>
                    )}
                    <small>Scan with Trust Wallet or any BEP-20 wallet</small>
                  </div>
                  <div className="ck-pay-actions">
                    <p>Open your wallet with the invoice already filled.</p>
                    <a
                      className="ck-pay"
                      href={address ? trustPayUrl(address, amount) : undefined}
                      aria-disabled={!address}
                      onClick={(e) => {
                        if (!address) e.preventDefault();
                      }}
                    >
                      Pay with Trust Wallet
                    </a>
                    <a
                      className="ck-pay ck-pay-mm"
                      href={address ? metaMaskPayUrl(address, amount) : undefined}
                      aria-disabled={!address}
                      onClick={(e) => {
                        if (!address) e.preventDefault();
                      }}
                    >
                      Pay with MetaMask
                    </a>
                    <small>On a laptop, scan the QR with your phone. After you send, stay on this page.</small>
                  </div>
                </div>
              ) : null}

              {live ? (
                <>
                  <label className="ck-field">
                    <span>Send USDT to this address</span>
                    <code>{address || "Waiting for address…"}</code>
                    <button
                      type="button"
                      disabled={!address}
                      onClick={async () => {
                        if (await copyText(address)) markCopied("address");
                      }}
                    >
                      {copied === "address" ? "Copied" : "Copy address"}
                    </button>
                  </label>

                  <label className="ck-field">
                    <span>Exact amount</span>
                    <code>{amount || "—"}</code>
                    <button
                      type="button"
                      disabled={!amount}
                      onClick={async () => {
                        if (await copyText(String(amount))) markCopied("amount");
                      }}
                    >
                      {copied === "amount" ? "Copied" : "Copy amount"}
                    </button>
                  </label>

                  <p className="ck-warn">{order.warning}</p>
                  <p className="ck-muted">
                    Stay here after you send. Status will change to Paid by itself. Do not send Crystal
                    Stones token, ERC-20 USDT, or TRC-20 USDT.
                  </p>
                </>
              ) : null}

              <button type="button" className="ck-refresh" onClick={onPrintReceipt}>
                Print receipt
              </button>
            </>
          ) : null}

          <button type="button" className="ck-back" onClick={() => navigate("/courses")}>
            Back to courses
          </button>
        </div>
      </section>

      <section className="ck-print" aria-hidden={!paid}>
        <p className="ck-print-brand">Crystal Stones Academy</p>
        <h1>Payment receipt</h1>
        <p>Intermediate Track — $10 USD</p>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>{paid ? "PAID" : "NOT CONFIRMED"}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{paidAt}</dd>
          </div>
          <div>
            <dt>Order</dt>
            <dd>{orderId || "—"}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>{amount ? `${amount} USDT` : "—"}</dd>
          </div>
          <div>
            <dt>Network</dt>
            <dd>BNB Smart Chain (BEP-20)</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{address || "—"}</dd>
          </div>
          <div>
            <dt>Transaction</dt>
            <dd>{order?.tx_hash || "—"}</dd>
          </div>
          <div>
            <dt>Learner</dt>
            <dd>{user?.email || user?.full_name || "Signed-in account"}</dd>
          </div>
        </dl>
        <p className="ck-print-note">
          This receipt confirms NOWPayments settlement for Intermediate track access. It is not a
          token purchase and not investment advice.
        </p>
      </section>
    </div>
  );
}