// components/FooterBar.js
import { useEffect, useState, useRef } from "react";

// STICKY (not fixed): render it as the LAST thing on the page, right after <PageFooter />.
// While you scroll it hugs the bottom edge of the screen; at the end of the page it rests
// directly UNDER the purple footer. Show/hide behavior: appears while scrolling DOWN,
// hides while scrolling UP or while a finger is dragging, always shows at the very bottom.
export default function FooterBar() {
  const [visible, setVisible] = useState(false);
  const lastYRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchingRef = useRef(false);
  const lastTouchTimeRef = useRef(0);

  useEffect(() => {
    const getY = () => window.pageYOffset || window.scrollY || (document.scrollingElement && document.scrollingElement.scrollTop) || 0;
    const atBottomOrShort = () => {
      const el = document.scrollingElement || document.documentElement;
      return window.innerHeight + getY() >= el.scrollHeight - 4;
    };
    // A finger only counts as "down" if we saw touch activity in the last 150ms, so a
    // missed touchend/touchcancel (which iPad can do) can never leave the bar stuck hidden.
    const fingerDown = () => touchingRef.current && Date.now() - lastTouchTimeRef.current < 150;

    const handleScroll = () => {
      const y = getY();
      if (atBottomOrShort()) setVisible(true);
      else if (!fingerDown()) setVisible(y > lastYRef.current && y > 100);
      lastYRef.current = y;
    };
    const handleTouchStart = () => {
      touchingRef.current = true;
      lastTouchTimeRef.current = Date.now();
      touchStartYRef.current = getY();
      if (!atBottomOrShort()) setVisible(false);
    };
    const handleTouchMove = () => { lastTouchTimeRef.current = Date.now(); };
    const handleTouchEnd = () => {
      touchingRef.current = false;
      const y = getY();
      const movedDown = y - touchStartYRef.current > 10 && y > 100;
      lastYRef.current = y;
      setTimeout(() => { if (atBottomOrShort() || movedDown) setVisible(true); }, 100);
    };
    const handleReset = () => {
      lastYRef.current = getY();
      setVisible(atBottomOrShort());
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleReset, { passive: true });
    window.addEventListener("orientationchange", handleReset, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

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
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
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
