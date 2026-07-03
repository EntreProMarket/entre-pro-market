// pages/api/admin-get-user-info.js
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
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = authData?.user?.email || null;
    const createdAt = authData?.user?.created_at || null;
    const lastSignIn = authData?.user?.last_sign_in_at || null;
    const emailConfirmed = authData?.user?.email_confirmed_at || null;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    return res.status(200).json({ success: true, email, createdAt, lastSignIn, emailConfirmed, profile });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
