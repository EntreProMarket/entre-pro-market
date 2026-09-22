// hooks/useForceLogoutIfExpired.js
// For pages that don't normally require login (vendor/product/marketplace
// pages) but should still force a logout redirect if the 30-minute
// inactivity window (tracked globally in _app.js) has expired — instead of
// silently doing nothing, which is what happened before.
import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

const INACTIVITY_MS = 30 * 60 * 1000;
const LAST_ACTIVITY_KEY = "epm_last_activity";

export default function useForceLogoutIfExpired() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const last = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || "0", 10);
      const now = Date.now();
      if (last && now - last >= INACTIVITY_MS) {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          await supabase.auth.signOut();
          router.replace("/?timeout=1");
        }
      }
    };
    check();
  }, [router]);
}
