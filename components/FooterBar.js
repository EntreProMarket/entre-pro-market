// components/FooterBar.js
import { useEffect, useState, useRef } from "react";

// Below this, a visualViewport height delta is almost certainly the iOS
// Safari toolbar animating (typically 40-50px), not a keyboard (200px+).
// We ignore small deltas so the footer doesn't float above the bottom
// edge as the toolbar shows/hides during scroll.
const KEYBOARD_GAP_THRESHOLD = 100;

export default function FooterBar() {
  const [visible, setVisible] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(0);
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

    const syncToVisualViewport = () => {
      const vv = window.visualViewport;
      if (!vv) { setBottomOffset(0); return; }
      const gap = window.innerHeight - (vv.height + vv.offsetTop);
      const clamped = gap < KEYBOARD_GAP_THRESHOLD ? 0 : gap;
      setBottomOffset(Math.max(0, clamped));
    };

    const handleTouchStart = () => {
      touchingRef.current = true;
      setVisible(false);
    };
    const handleTouchEnd = () => {
      touchingRef.current = false;
      lastYRef.current = window.scrollY;
      syncToVisualViewport();
      setTimeout(syncToVisualViewport, 300);
    };

    const handleReset = () => {
      setVisible(false);
      lastYRef.current = window.scrollY;
      syncToVisualViewport();
      setTimeout(syncToVisualViewport, 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleReset, { passive: true });
    window.addEventListener("orientationchange", handleReset, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", syncToVisualViewport);
      window.visualViewport.addEventListener("scroll", syncToVisualViewport);
    }
    syncToVisualViewport();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleReset);
      window.removeEventListener("orientationchange", handleReset);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", syncToVisualViewport);
        window.visualViewport.removeEventListener("scroll", syncToVisualViewport);
      }
    };
  }, []);

  return (
    <div style={{
      position: "fixed", left: 0, width: "100%", zIndex: 50,
      height: 28,
      bottom: bottomOffset,
      backgroundImage: "url('/green-brick.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      transform: visible ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.3s ease, bottom 0.1s linear",
      boxShadow: "0 -2px 8px rgba(0,0,0,0.2)",
    }} />
  );
}
