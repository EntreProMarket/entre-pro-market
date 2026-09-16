// lib/getOfflineSafeUser.js
// getUser() hits the network every call and fails offline, logging people
// out of pages that never should have needed a live check. getSession()
// reads the saved login from local storage with no network call.
import { supabase } from "./supabaseClient";

export async function getOfflineSafeUser() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
}
