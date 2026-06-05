// pages/_app.js

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function MyApp({ Component, pageProps }) {
  const [session, setSession] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  useEffect(() => {
    // ── Existing session logic ──
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // ── PWA: Register service worker ──
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("SW registered:", reg.scope))
          .catch((err) => console.log("SW failed:", err));
      });
    }

    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;

    // ── Detect iOS ──
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);

    if (isIOS && isSafari && !isStandalone) {
      // Show iOS instructions after 3 seconds
      const timer = setTimeout(() => setShowIOSBanner(true), 3000);
      return () => {
        clearTimeout(timer);
        listener.subscription.unsubscribe();
      };
    }

    // ── Android: Capture install prompt ──
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!isStandalone) setShowAndroidBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowAndroidBanner(false);
    setInstallPrompt(null);
  };

  return (
    <>
      <Component {...pageProps} session={session} />

      {/* ANDROID INSTALL BANNER */}
      {showAndroidBanner && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          backgroundColor: "#701890", color: "white",
          padding: "14px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-between", zIndex: 99999,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.2)", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/icons/icon-192x192.png" alt="EPM" style={{ width: 40, height: 40, borderRadius: 8 }} />
            <div>
              <p style={{ margin: 0, fontWeight: "bold", fontSize: 14 }}>Add to Home Screen</p>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>Install Entre PRO Market as an app</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={() => setShowAndroidBanner(false)}
              style={{ padding: "8px 14px", backgroundColor: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>
              Not now
            </button>
            <button onClick={handleInstall}
              style={{ padding: "8px 16px", backgroundColor: "white", color: "#701890", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>
              Install
            </button>
          </div>
        </div>
      )}

      {/* iOS INSTALL INSTRUCTIONS BANNER */}
      {showIOSBanner && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          backgroundColor: "#111", color: "white",
          padding: "16px 20px", zIndex: 99999,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
          borderRadius: "16px 16px 0 0",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/icons/icon-192x192.png" alt="EPM" style={{ width: 36, height: 36, borderRadius: 8 }} />
              <p style={{ margin: 0, fontWeight: "bold", fontSize: 15 }}>Install Entre PRO Market</p>
            </div>
            <button onClick={() => setShowIOSBanner(false)}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "50%", width: 28, height: 28, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ×
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ fontSize: 22 }}>1️⃣</span>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>Tap the <strong>Share button</strong> <span style={{ fontSize: 16 }}>⬆️</span> at the bottom of your Safari browser</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ fontSize: 22 }}>2️⃣</span>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ fontSize: 22 }}>3️⃣</span>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>Tap <strong>Add</strong> in the top right corner</p>
            </div>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
            Must be using Safari browser on iPhone or iPad
          </p>
        </div>
      )}
    </>
  );
}
