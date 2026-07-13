// components/FooterBar.js
import { useEffect, useState } from "react";

export default function FooterBar() {
  const [visible, setVisible] = useState(false);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setVisible(currentY > lastY && currentY > 100);
      setLastY(currentY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastY]);

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 50,
      height: 28,
      backgroundImage: "url('/green-brick.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      transform: visible ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.3s ease",
      boxShadow: "0 -2px 8px rgba(0,0,0,0.2)",
    }} />
  );
}
