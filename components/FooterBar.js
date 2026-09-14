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

    // ── Orientation/resize reset — rotating the device (iPad especially)
    // reflows the whole page mid-scroll, which can leave this bar's
    // translateY() stuck between visible/hidden states since nothing else
    // tells it the layout changed. Snapping it back to hidden and
    // resyncing lastY on resize/orientationchange prevents that stuck
    // "torn from the footer" appearance. ──
    const handleResize = () => {
      setVisible(false);
      setLastY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
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
      willChange: "transform",
    }} />
  );
}
