import "cropperjs/dist/cropper.css";
// pages/_app.js
// Global 30-minute auto-logout for ALL pages and account types.
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import InstallSteps from "../components/InstallSteps";

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

// ── "Get the app" invitation ──
// First visit in a regular browser: a clear card that explains the benefits and shows exactly how to install on
// this person's device. Once they pick "Maybe later" it comes back after 7 days; "Don't show again" and a finished
// install silence it for good. It never shows inside the installed app.
const INSTALL_KEY = "epm_install_invite";

function detectInstallEnv() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return { standalone: false, platform: "desktop", inApp: false };
  const ua = window.navigator.userAgent || "";
  const standalone = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document);
  const isAndroid = /Android/i.test(ua);
  const inApp = /FBAN|FBAV|Instagram|Line\/|Snapchat|; wv\)|DuckDuckGo|GSA\//i.test(ua);
  return { standalone, platform: isIOS ? "ios" : isAndroid ? "android" : "desktop", inApp };
}

function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [env, setEnv] = useState({ standalone: false, platform: "desktop", inApp: false });

  const saveChoice = (state) => {
    try { localStorage.setItem(INSTALL_KEY, JSON.stringify({ state, t: Date.now() })); } catch (e) {}
  };

  useEffect(() => {
    const e0 = detectInstallEnv();
    setEnv(e0);
    if (e0.standalone) return undefined; // already installed — nothing to show

    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(INSTALL_KEY) || "null"); } catch (e) {}
    const muted = !!saved && (saved.state === "never" || saved.state === "installed");

    const handler = (e) => {
      if (muted) return;
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
      // Let the welcome screen after email confirmation use the same browser install window
      window.__epmInstallPrompt = e;
      window.dispatchEvent(new Event("epm-install-ready"));
    };
    const onInstalled = () => {
      saveChoice("installed");
      setInviteOpen(false);
      setVisible(false);
      setDeferredPrompt(null);
      window.__epmInstallPrompt = null;
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onInstalled);

    if (!muted && isIosSafari()) {
      const dismissedThisSession = sessionStorage.getItem("epm_ios_install_dismissed");
      if (!dismissedThisSession) {
        setShowIosInstructions(true);
      }
    }

    let timer = null;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const due = !saved || (saved.state === "later" && saved.t < weekAgo);
    // Not on the admin pages, and not while the email-confirmation welcome screen is handling the install invitation
    const skipPage = window.location.pathname.indexOf("/admin") === 0 || window.location.pathname.indexOf("/auth/") === 0 || /[?&]welcome=1/.test(window.location.search);
    if (due && !skipPage) timer = setTimeout(() => setInviteOpen(true), 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    if (choice && choice.outcome === "accepted") {
      saveChoice("installed");
      setInviteOpen(false);
    }
  };

  const handleDismiss = () => setVisible(false);

  const handleIosDismiss = () => {
    setShowIosInstructions(false);
    sessionStorage.setItem("epm_ios_install_dismissed", "true");
  };

  const inviteLater = () => { saveChoice("later"); setInviteOpen(false); };
  const inviteInstalled = () => { saveChoice("installed"); setInviteOpen(false); setVisible(false); setShowIosInstructions(false); };
  const inviteNever = () => { saveChoice("never"); setInviteOpen(false); setVisible(false); setShowIosInstructions(false); };

  if (inviteOpen) {
    return (
      <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 100000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "sans-serif" }}>
        <div style={{ position: "relative", backgroundColor: "white", borderRadius: 18, padding: "26px 22px 18px", maxWidth: 380, width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 10px 40px rgba(0,0,0,0.35)", textAlign: "center" }}>
          <button onClick={inviteLater} aria-label="Close" style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", fontSize: 22, color: "#999", cursor: "pointer", lineHeight: 1 }}>✕</button>
          <img src="/logo-circle.png" alt="Entre PRO Market" style={{ width: 84, height: 84, objectFit: "contain", borderRadius: "50%", marginBottom: 10 }} />
          <h2 style={{ margin: "0 0 6px", fontSize: 21, color: "#111" }}>📲 Get the Entre PRO Market app</h2>
          <p style={{ margin: "0 0 16px", color: "#666", fontSize: 14 }}>Put us on your home screen in about 10 seconds. It's free — no app store needed.</p>

          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px", textAlign: "left" }}>
            {[
              "Opens in one tap, like any other app",
              "Full screen — no browser bars in the way",
              "Always up to date automatically",
              "100% free",
            ].map((t) => (
              <li key={t} style={{ padding: "6px 0", fontSize: 14, color: "#333", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: "#AABB23", fontWeight: "bold" }}>✓</span>{t}
              </li>
            ))}
          </ul>

          {deferredPrompt ? (
            <button onClick={handleInstall} style={{ display: "block", width: "100%", padding: "14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 12, fontWeight: "bold", fontSize: 16, cursor: "pointer", marginBottom: 12 }}>
              📲 Add to Home Screen
            </button>
          ) : (
            <>
              <InstallSteps />
              <button onClick={inviteInstalled} style={{ display: "block", width: "100%", padding: "13px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 12, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 12 }}>
                ✅ I've added it — close
              </button>
            </>
          )}

          <button onClick={inviteLater} style={{ display: "block", width: "100%", padding: "11px", backgroundColor: "transparent", color: "#701890", border: "1px solid #701890", borderRadius: 12, fontWeight: "bold", fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
            Maybe later
          </button>
          <span onClick={inviteNever} style={{ color: "#999", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Don't show this again</span>
        </div>
      </div>
    );
  }

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
