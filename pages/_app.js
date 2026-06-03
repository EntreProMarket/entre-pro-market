// pages/_app.js

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function MyApp({ Component, pageProps }) {
  const [session, setSession] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

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

    // ── PWA: Capture install prompt ──
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!window.matchMedia("(display-mode: standalone)").matches) {
        setShowBanner(true);
      }
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
    if (outcome === "accepted") setShowBanner(false);
    setInstallPrompt(null);
  };

  return (
    <>
      <Component {...pageProps} session={session} />

      {/* PWA INSTALL BANNER */}
      {showBanner && (
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
            <button onClick={() => setShowBanner(false)}
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
    </>
  );
}
