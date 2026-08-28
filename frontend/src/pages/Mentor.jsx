import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function Mentor() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/signin", { replace: true });
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setUser(data.data?.user || null));
  }, [navigate]);

  const ask = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch(`${API}/api/mentor`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Mentor failed");
      setAnswer(data.data?.answer || data.message || "No answer yet");
    } catch (err) {
      setAnswer(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="db">
      <Navbar user={user} />
      <section className="db-finder">
        <h2>Crystal Mentor</h2>
        <form className="db-card" onSubmit={ask} style={{ display: "grid", gap: 12 }}>
          <textarea
            className="db-finder-controls"
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about Crystal Stones, courses, or Web3"
          />
          <button className="db-btn" type="submit" disabled={loading || !question.trim()}>
            {loading ? "Thinking..." : "Ask Mentor"}
          </button>
          {answer ? <p className="db-mentor">{answer}</p> : null}
        </form>
      </section>
    </div>
  );
}