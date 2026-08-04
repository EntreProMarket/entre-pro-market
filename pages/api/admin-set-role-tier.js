// pages/api/admin-set-role-tier.js

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId, role, tier } = req.body;
  if (!userId || !role || !tier) return res.status(400).json({ error: "Missing userId, role, or tier" });

  try {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ role, account_type: tier })
      .eq("id", userId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("admin-set-role-tier error:", err);
    return res.status(500).json({ error: err.message });
  }
}
