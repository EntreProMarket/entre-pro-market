// pages/_app.js
// Global 30-minute auto-logout for ALL pages and account types
import { useEffect, useRef } from "react";
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

export default function App({ Component, pageProps }) {
  return (
    <>
      <ServiceWorkerRegister />
      <AutoLogout />
      <Component {...pageProps} />
    </>
  );
}
