// hooks/useInactivityLogout.js
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useRef } from "react";

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

// ── Same 30-minute auto-logout as DashboardLayout, but with no nav/header UI attached —
// safe to use on pages (edit forms, public profile pages) that already have their own header. ──
export default function useInactivityLogout() {
  const router = useRouter();
  const timerRef = useRef(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await supabase.auth.signOut();
        router.replace("/?timeout=1");
      }, INACTIVITY_MS);
    };

    const events = ["mousemove", "keydown", "touchstart", "click", "scroll"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [router]);
}
