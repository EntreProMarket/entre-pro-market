// components/FooterBar.js
import { useEffect, useState, useRef } from "react";

// STICKY, not fixed. position: fixed is what was causing the iPad detachment —
// iOS Safari does not reliably anchor "fixed" elements to the true screen edge.
// "sticky" is positioned by the browser's own layout engine relative to the
// page content instead, so it can't detach the way fixed did. Rendered as the
// last element on the page (right after PageFooter) so it naturally docks
// under the purple footer at the end of the page and hugs the bottom edge
// while scrolling through content above it.
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
      // No forced hide here — that was the cause of the bobbing on short taps.
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
    <div style={{ position: "sticky", bottom: 0, height: 28, overflow: "hidden", zIndex: 50, pointerEvents: "none" }}>
      <div style={{
        height: 28,
        backgroundImage: "url('/green-brick.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}
