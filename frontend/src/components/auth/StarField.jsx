import { useMemo } from "react";
import "../../styles/auth.css";

function unit(i, salt) {
  const n = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

export default function StarField({ count = 40 }) {
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const isRed = i % 3 === 0;
      return {
        id: i,
        left: `${unit(i, 1) * 100}%`,
        top: `${unit(i, 2) * 100}%`,
        size: unit(i, 3) * 3 + 1,
        duration: `${6 + unit(i, 4) * 10}s`,
        delay: `${unit(i, 5) * 5}s`,
        color: isRed ? "rgba(255, 60, 60, 0.9)" : "rgba(80, 180, 255, 0.9)",
      };
    });
  }, [count]);

  return (
    <div className="star-field" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            background: star.color,
            animationDuration: star.duration,
            animationDelay: star.delay,
            boxShadow: `0 0 6px ${star.color}`,
          }}
        />
      ))}
    </div>
  );
}