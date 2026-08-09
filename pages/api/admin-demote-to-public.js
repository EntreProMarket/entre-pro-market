// pages/api/admin-demote-to-public.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ role: null, account_type: null })
      .eq("id", userId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("admin-demote-to-public error:", err);
    return res.status(500).json({ error: err.message });
  }
}
