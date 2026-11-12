import "cropperjs/dist/cropper.css";
// pages/_app.js
// Global 30-minute auto-logout for ALL pages and account types.
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const INACTIVITY_MS = 30 * 60 * 1000;
const LAST_ACTIVITY_KEY = "epm_last_activity";
const CHECK_INTERVAL_MS = 15 * 1000;
const WRITE_THROTTLE_MS = 5 * 1000;

// Logs everyone out after 30 minutes without activity — on Android, iPad, iPhone and desktop.
//
// Why Apple devices slipped through before:
//  1. iPads freeze a page's timers while the app is in the background. When you came back, the
//     very first touch / scroll / mouse event refreshed the "last activity" clock BEFORE anything
//     checked it, so the expired session was silently renewed.
//  2. Every page load re-started the clock without checking whether it had already expired.
//  3. The logout only ran if a network call succeeded, which often fails right after waking up.
// Now the clock is always CHECKED FIRST (on every touch, on load, on resume, every 15 seconds) and
// the device is signed out locally even if the network is down.
function AutoLogout() {
  useEffect(() => {
    let loggingOut = false;
    let lastWrite = 0;

    const readLast = () => parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || "0", 10);
    const isExpired = () => { const last = readLast(); return !!last && Date.now() - last >= INACTIVITY_MS; };
    const stamp = () => { lastWrite = Date.now(); localStorage.setItem(LAST_ACTIVITY_KEY, String(lastWrite)); };

    const forceLogout = async () => {
      if (loggingOut) return;
      loggingOut = true;
      try { await supabase.auth.signOut({ scope: "local" }); } catch (e) { /* still continue */ }
      try { localStorage.removeItem(LAST_ACTIVITY_KEY); } catch (e) { /* ignore */ }
      window.location.replace("/?timeout=1"); // a full reload wipes any account page still on screen
    };

    // Returns true if it logged the user out.
    const checkExpired = async () => {
      if (!isExpired()) return false;
      let loggedIn = false;
      try { const { data } = await supabase.auth.getSession(); loggedIn = !!data?.session; } catch (e) { loggedIn = true; }
      if (loggedIn) { await forceLogout(); return true; }
      stamp(); // nobody is logged in, so just restart the clock
      return false;
    };

    // Real activity: check the clock FIRST, only refresh it if the session is still valid.
    const onActivity = () => {
      if (isExpired()) { checkExpired(); return; }
      if (Date.now() - lastWrite > WRITE_THROTTLE_MS) stamp();
    };

    // On load: check first, then start a fresh clock.
    (async () => {
      if (await checkExpired()) return;
      stamp();
    })();

    const activityEvents = ["pointerdown", "mousemove", "keydown", "touchstart", "click", "scroll"];
    activityEvents.forEach((e) => window.addEventListener(e, onActivity, { passive: true, capture: true }));

    const onResume = () => { if (document.visibilityState === "visible") checkExpired(); };
    const onPageShow = () => { checkExpired(); };
    const onCheckRequest = () => { checkExpired(); };
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("online", onResume);
    window.addEventListener("epm-check-session", onCheckRequest);
    const interval = setInterval(checkExpired, CHECK_INTERVAL_MS);

    return () => {
      activityEvents.forEach((e) => window.removeEventListener(e, onActivity, { capture: true }));
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", onResume);
      window.removeEventListener("epm-check-session", onCheckRequest);
      clearInterval(interval);
    };
  }, []);

  return null;
}

// ── Service worker registration REMOVED. It was causing a reload loop:
// the kill-switch sw.js unregisters itself, but this component was
// re-registering it on every single page load, which re-triggered the
// unregister-and-reload cycle endlessly — that was the freeze. Any
// service worker already installed on a device will still get cleaned
// up next time it runs (browsers check for updates periodically), but
// nothing here will ever re-register one again. ──

function isIosSafari() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  const isStandalone = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  return isIOS && isSafari && !isStandalone;
}

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

// ── Unfinished-text drafts belong to ONE account ──
// Drafts are saved on this device so typing is never lost. They are wiped whenever someone logs out or a
// different account logs in, so one account's text can never show up inside another account's form (and
// can never be saved into it). Because ownership is unknown the very first time, drafts are also cleared once.
function purgeDrafts() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("draft_")) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch (e) { /* ignore */ }
}
function storedSessionUserId() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && /^sb-.*-auth-token$/.test(k)) {
        const parsed = JSON.parse(localStorage.getItem(k) || "null");
        const uid = parsed && (parsed.user?.id || parsed.currentSession?.user?.id);
        if (uid) return uid;
      }
    }
  } catch (e) { /* ignore */ }
  return null;
}
function DraftGuard() {
  useEffect(() => {
    const OWNER_KEY = "epm_draft_owner";
    const apply = (uid) => {
      try {
        const owner = localStorage.getItem(OWNER_KEY);
        if (!uid) { purgeDrafts(); localStorage.removeItem(OWNER_KEY); return; }
        if (owner !== uid) { purgeDrafts(); localStorage.setItem(OWNER_KEY, uid); }
      } catch (e) { /* ignore */ }
    };
    const early = storedSessionUserId();
    if (early) apply(early); // runs immediately, before any page reads a draft
    supabase.auth.getSession().then(({ data }) => apply(data?.session?.user?.id || null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => apply(session?.user?.id || null));
    return () => { if (sub && sub.subscription) sub.subscription.unsubscribe(); };
  }, []);
  return null;
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <DraftGuard />
      <AutoLogout />
      <BfcacheGuard />
      <Component {...pageProps} />
      <InstallBanner />
    </>
  );
}
