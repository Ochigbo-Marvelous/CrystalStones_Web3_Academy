import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function Achievements() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/signin", { replace: true });
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/auth/me`, { headers }).then((res) => res.json()),
      fetch(`${API}/api/achievements`, { headers }).then((res) => res.json()),
    ]).then(([me, list]) => {
      setUser(me.data?.user || null);
      setItems(list.data || []);
    });
  }, [navigate]);

  return (
    <div className="db">
      <Navbar user={user} />
      <section className="db-finder">
        <h2>Achievements</h2>
        <div className="db-course-grid">
          {items.map((item) => (
            <article className="db-course" key={item.id}>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <small>{item.earned ? `Earned ${item.earned_at || ""}` : "Locked"}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}