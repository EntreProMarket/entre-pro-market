// lib/getOfflineSafeUser.js
// getSession() reads from local storage but can still hang indefinitely if
// it tries to silently refresh an expired token with no/flaky connectivity —
// a known Supabase client issue. A hard timeout guarantees this NEVER blocks
// page load again: if it doesn't resolve fast, treat as logged out for this
// render rather than freezing the whole app.
import { supabase } from "./supabaseClient";

export async function getOfflineSafeUser(timeoutMs = 4000) {
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), timeoutMs)),
    ]);
    if (result?.timedOut) return null;
    return result?.data?.session?.user || null;
  } catch (err) {
    return null;
  }
}
