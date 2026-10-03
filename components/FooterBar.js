// components/FooterBar.js
import { useEffect, useState, useRef } from "react";

// iOS/iPadOS portrait never renders the bar at all — that's the one orientation
// where it's been detaching. Everything else (Android in any orientation, and
// Apple devices in landscape) behaves exactly as before, unchanged.
function isAppleTouchDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIPhoneOrIPod = /iPhone|iPod/.test(ua);
  const isIPad = /iPad/.test(ua) || (ua.includes("Macintosh") && typeof document !== "undefined" && "ontouchend" in document);
  return isIPhoneOrIPod || isIPad;
}

export default function FooterBar() {
  const [visible, setVisible] = useState(false);
  const [suppressed, setSuppressed] = useState(false); // true = Apple device currently in portrait
  const lastYRef = useRef(0);
  const touchingRef = useRef(false);

  useEffect(() => {
    const isApple = isAppleTouchDevice();

    const checkOrientation = () => {
      if (!isApple) { setSuppressed(false); return; }
      const portrait = window.matchMedia
        ? window.matchMedia("(orientation: portrait)").matches
        : window.innerHeight >= window.innerWidth;
      setSuppressed(portrait);
    };
    checkOrientation();

    const handleScroll = () => {
      const currentY = window.scrollY;
      if (!touchingRef.current) {
        setVisible(currentY > lastYRef.current && currentY > 100);
      }
      lastYRef.current = currentY;
    };

    const handleTouchStart = () => {
      touchingRef.current = true;
    };
    const handleTouchEnd = () => {
      touchingRef.current = false;
      lastYRef.current = window.scrollY;
    };

    const handleReset = () => {
      checkOrientation();
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

  if (suppressed) return null;

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
