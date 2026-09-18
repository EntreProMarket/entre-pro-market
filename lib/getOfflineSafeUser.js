// lib/getOfflineSafeUser.js
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
