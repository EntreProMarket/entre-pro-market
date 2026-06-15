// pages/role.js

import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function RolePage() {
  const router = useRouter();

  const setRole = async (role) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/"); return; }

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", user.id);

    if (error) { alert(error.message); return; }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, business_name")
        .eq("id", user.id)
        .single();

      const emailToUse = profile?.email || user.email;

      if (emailToUse) {
        fetch("/api/send-welcome-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailToUse,
            name: profile?.business_name || null,
            role,
          }),
        });
      }
    } catch (_) {}

    if (role === "vendor") {
      router.replace("/vendor-dashboard");
    } else {
      router.replace("/organizer-dashboard");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, fontFamily: "sans-serif", backgroundColor: "#fafafa" }}>
      <img src="/logo-transparent.png" alt="Entre PRO Market" style={{ width: 120, marginBottom: 24 }} />
      <h1 style={{ margin: "0 0 8px", color: "#333", fontSize: 24 }}>Welcome to Entre PRO Market!</h1>
      <p style={{ color: "#888", fontSize: 15, marginBottom: 32 }}>How will you be using the platform?</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 320 }}>
        <button onClick={() => setRole("vendor")}
          style={{ padding: "18px 24px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: "bold", cursor: "pointer", textAlign: "left" }}>
          🛒 I'm a Vendor
          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: "normal", opacity: 0.85 }}>Sell products & showcase your business</p>
        </button>

        <button onClick={() => setRole("organizer")}
          style={{ padding: "18px 24px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: "bold", cursor: "pointer", textAlign: "left" }}>
          🎪 I'm an Organizer
          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: "normal", opacity: 0.85 }}>Host events & connect with vendors</p>
        </button>
      </div>
    </div>
  );
}
