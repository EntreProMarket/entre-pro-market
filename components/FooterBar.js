// components/FooterBar.js
import { useEffect, useState, useRef } from "react";

// STICKY instead of FIXED. Render it as the LAST thing on the page, right after <PageFooter />.
// While you scroll, it hugs the bottom edge of the screen. When you reach the end of the
// page it rests directly UNDER the purple footer. The browser positions it itself, so it
// adapts to iPad/iPhone toolbars, windowed apps, rotation and any screen size automatically
// (no pixel measurements or viewport math to get wrong).
export default function FooterBar() {
  const [visible, setVisible] = useState(false);
  const lastYRef = useRef(0);
  const touchingRef = useRef(false);

  useEffect(() => {
    const atBottomOrShort = () => {
      const doc = document.documentElement;
      const y = window.scrollY || doc.scrollTop || 0;
      return window.innerHeight + y >= doc.scrollHeight - 4;
    };

    const handleScroll = () => {
      const y = window.scrollY || 0;
      if (atBottomOrShort()) setVisible(true);
      else if (!touchingRef.current) setVisible(y > lastYRef.current && y > 100);
      lastYRef.current = y;
    };
    const handleTouchStart = () => {
      touchingRef.current = true;
      if (!atBottomOrShort()) setVisible(false);
    };
    const handleTouchEnd = () => {
      touchingRef.current = false;
      lastYRef.current = window.scrollY || 0;
      setTimeout(() => { if (atBottomOrShort()) setVisible(true); }, 150);
    };
    const handleReset = () => {
      lastYRef.current = window.scrollY || 0;
      setVisible(atBottomOrShort());
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleReset, { passive: true });
    window.addEventListener("orientationchange", handleReset, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Page height changes as images load — keep the bar showing if we end up at the bottom.
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { if (atBottomOrShort()) setVisible(true); }) : null;
    if (ro) ro.observe(document.body);
    const t = setTimeout(handleReset, 300);

    return () => {
      clearTimeout(t);
      if (ro) ro.disconnect();
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
      }} />
    </div>
  );
}
