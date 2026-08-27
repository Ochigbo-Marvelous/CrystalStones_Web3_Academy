import crystal from "../../assets/brand/crystal-hero.png";
import "../../styles/auth.css";

export default function CrystalScene() {
  return (
    <div className="crystal-scene">
      <div className="crystal-glow crystal-glow-blue" />
      <div className="crystal-glow crystal-glow-red" />
      <div className="crystal-rotator">
        <img src={crystal} alt="" className="crystal-image" />
      </div>
      <div className="crystal-base-shadow" />
    </div>
  );
}