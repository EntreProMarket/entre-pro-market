import "cropperjs/dist/cropper.css";
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

// ── Detects iOS/iPadOS Safari — these browsers NEVER fire the
// `beforeinstallprompt` event (Apple has never implemented it), so the
// Android-style InstallBanner below silently never appears there. This
// detects that environment specifically so we can show manual instructions
// instead. Also excludes an already-installed PWA (running in standalone
// mode) so the banner doesn't show to someone who already installed it. ──
function isIosSafari() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  const isStandalone = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  return isIOS && isSafari && !isStandalone;
}

// ── Custom purple "Install App" banner — captures Chrome's install prompt
// and shows our own UI instead of relying on Chrome's default top-right icon.
// On iOS/iPadOS Safari, shows manual "Add to Home Screen" instructions instead,
// since the native install prompt event never fires there. ──
function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS/iPadOS Safari: no beforeinstallprompt event ever fires, so check
    // directly and show instructions instead, once per session.
    if (isIosSafari()) {
      const dismissedThisSession = sessionStorage.getItem("epm_ios_install_dismissed");
      if (!dismissedThisSession) {
        setShowIosInstructions(true);
      }
    }

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

  const handleIosDismiss = () => {
    setShowIosInstructions(false);
    sessionStorage.setItem("epm_ios_install_dismissed", "true");
  };

  if (showIosInstructions) {
    return (
      <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", backgroundColor: "#701890", color: "white", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, zIndex: 99999, boxShadow: "0 -2px 12px rgba(0,0,0,0.2)", fontFamily: "sans-serif", boxSizing: "border-box" }}>
        <span style={{ fontSize: 13, fontWeight: "bold", lineHeight: 1.4 }}>
          📲 Install this app: tap <strong>Share</strong> <span style={{ fontSize: 15 }}>⬆️</span>, then <strong>"Add to Home Screen"</strong>
        </span>
        <button onClick={handleIosDismiss} style={{ padding: "8px 14px", backgroundColor: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 20, cursor: "pointer", fontSize: 13, flexShrink: 0 }}>Got it</button>
      </div>
    );
  }

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

function BfcacheGuard() {
  useEffect(() => {
    const handler = (event) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);
  return null;
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
