// components/FooterBar.js
import { useEffect, useState, useRef } from "react";

export default function FooterBar() {
  const [visible, setVisible] = useState(false);
  const lastYRef = useRef(0);
  const touchingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (!touchingRef.current) {
        setVisible(currentY > lastYRef.current && currentY > 100);
      }
      lastYRef.current = currentY;
    };

    const handleTouchStart = () => {
      touchingRef.current = true;
      setVisible(false);
    };
    const handleTouchEnd = () => {
      touchingRef.current = false;
      lastYRef.current = window.scrollY;
    };

    const handleReset = () => {
      setVisible(false);
      lastYRef.current = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleReset, { passive: true });
    window.addEventListener("orientationchange", handleReset, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleReset);
      window.removeEventListener("orientationchange", handleReset);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <div style={{
      position: "fixed", left: 0, width: "100%", zIndex: 50,
      height: 28,
      bottom: "env(safe-area-inset-bottom, 0px)",
      backgroundImage: "url('/green-brick.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      transform: visible ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.3s ease",
      boxShadow: "0 -2px 8px rgba(0,0,0,0.2)",
    }} />
  );
}

