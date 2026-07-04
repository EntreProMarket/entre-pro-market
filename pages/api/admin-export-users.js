// pages/api/admin-export-users.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { type } = req.body; // "vendors" | "organizers" | "public"

  try {
    // Get all auth users (emails)
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = {};
    (authList?.users || []).forEach(u => { emailMap[u.id] = { email: u.email, created_at: u.created_at, last_sign_in: u.last_sign_in_at }; });

    let query = supabaseAdmin.from("profiles").select("id, business_name, organizer_name, handle, role, account_type, city, state, category, created_at");

    if (type === "vendors") query = query.eq("role", "vendor");
    else if (type === "organizers") query = query.eq("role", "organizer");
    else if (type === "public") query = query.is("role", null);

    const { data: profiles, error } = await query;
    if (error) throw error;

    const rows = (profiles || []).map(p => ({
      name: p.business_name || p.organizer_name || "",
      handle: p.handle || "",
      email: emailMap[p.id]?.email || "",
      role: p.role || "public",
      tier: p.account_type || "",
      city: p.city || "",
      state: p.state || "",
      category: p.category || "",
      signed_up: emailMap[p.id]?.created_at ? new Date(emailMap[p.id].created_at).toLocaleDateString("en-US") : "",
      last_login: emailMap[p.id]?.last_sign_in ? new Date(emailMap[p.id].last_sign_in).toLocaleDateString("en-US") : "",
    }));

    return res.status(200).json({ success: true, rows });
  } catch (err) {
    console.error("admin-export-users error:", err);
    return res.status(500).json({ error: err.message });
  }
}
