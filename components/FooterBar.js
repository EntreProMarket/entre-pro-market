// components/FooterBar.js
import { useEffect, useState, useRef } from "react";

export default function FooterBar() {
  const [visible, setVisible] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(0);
  const lastYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setVisible(currentY > lastYRef.current && currentY > 100);
      lastYRef.current = currentY;
    };

    // ── iOS Safari positions `bottom: 0` incorrectly during the address-bar
    // show/hide + rotation animation, because the layout viewport briefly
    // disagrees with the visual viewport. Reading visualViewport directly
    // and pinning the bar's offset to it (instead of trusting `bottom: 0`)
    // avoids the "torn from the footer" gap this caused. ──
    const syncToVisualViewport = () => {
      const vv = window.visualViewport;
      if (!vv) { setBottomOffset(0); return; }
      const gap = window.innerHeight - (vv.height + vv.offsetTop);
      setBottomOffset(Math.max(0, gap));
    };

    const handleReset = () => {
      setVisible(false);
      lastYRef.current = window.scrollY;
      syncToVisualViewport();
      // iOS reports final viewport size a beat after the event fires —
      // resync shortly after to catch the settled layout.
      setTimeout(syncToVisualViewport, 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleReset, { passive: true });
    window.addEventListener("orientationchange", handleReset, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", syncToVisualViewport);
      window.visualViewport.addEventListener("scroll", syncToVisualViewport);
    }
    syncToVisualViewport();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleReset);
      window.removeEventListener("orientationchange", handleReset);
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
