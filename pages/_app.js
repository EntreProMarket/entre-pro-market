// pages/_app.js
// Global 30-minute auto-logout for ALL pages and account types
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

const INACTIVITY_MS = 30 * 60 * 1000;

function AutoLogout() {
  const router = useRouter();
  const timerRef = useRef(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          await supabase.auth.signOut();
          router.replace("/");
        }
      }, INACTIVITY_MS);
    };

    const events = ["mousemove", "keydown", "touchstart", "click", "scroll"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}

// ── Registers public/sw.js so Chrome/Android will recognize the app as
// installable. Without this, the service worker file exists but never
// runs, and Chrome has no basis to offer the "Add to Home Screen" prompt. ──
function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    }
  }, []);

  return null;
}

// ── Custom purple "Install App" banner — captures Chrome's install prompt
// and shows our own UI instead of relying on Chrome's default top-right icon ──
function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => setVisible(false);

  if (!visible) return null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", backgroundColor: "#701890", color: "white", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, zIndex: 99999, boxShadow: "0 -2px 12px rgba(0,0,0,0.2)", fontFamily: "sans-serif", boxSizing: "border-box" }}>
      <span style={{ fontSize: 14, fontWeight: "bold" }}>Install Entre PRO Market for quick access</span>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button onClick={handleDismiss} style={{ padding: "8px 14px", backgroundColor: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 20, cursor: "pointer", fontSize: 13 }}>Not Now</button>
        <button onClick={handleInstall} style={{ padding: "8px 16px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>Install</button>
      </div>
    </div>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <ServiceWorkerRegister />
      <AutoLogout />
      <Component {...pageProps} />
      <InstallBanner />
    </>
  );
}
