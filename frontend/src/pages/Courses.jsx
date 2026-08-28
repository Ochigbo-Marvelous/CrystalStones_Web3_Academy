import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import crystal from "../assets/brand/crystal-hero.png";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function Courses() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/signin", { replace: true });
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/api/auth/me`, { headers }).then((res) => res.json()),
      fetch(`${API}/api/courses`, { headers }).then((res) => res.json()),
    ])
      .then(([me, list]) => {
        if (!me.success) throw new Error(me.message || "Auth failed");
        setUser(me.data.user);
        setCourses(list.data || []);
      })
      .catch((err) => setError(err.message));
  }, [navigate]);

  return (
    <div className="db">
      <Navbar user={user} />
      <section className="db-finder">
        <h2>Courses</h2>
        {error ? <p className="db-empty">{error}</p> : null}
        <div className="db-course-grid">
          {courses.map((course) => (
            <article
              className="db-course"
              key={course.id}
              onClick={() =>
                navigate(course.is_paid ? `/checkout/${course.id}` : `/courses/${course.slug || course.id}`)
              }
              style={{ cursor: "pointer" }}
            >
              <img src={crystal} alt="" />
              <h3>{course.title}</h3>
              <small>{course.level === "beginner" ? "Basic" : course.level}</small>
              <p>{course.is_paid ? `$${course.price_usd}` : "Free"}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}