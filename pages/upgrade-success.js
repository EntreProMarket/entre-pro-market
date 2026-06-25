// pages/upgrade-success.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function UpgradeSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState("verifying");
  const [tier, setTier] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    const { session_id, role: qRole, tier: qTier } = router.query;
    if (!session_id) { setStatus("error"); return; }
    verifyUpgrade(session_id, qRole, qTier);
  }, [router.isReady, router.query]);

  const verifyUpgrade = async (sessionId, qRole, qTier) => {
    try {
      const res = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();

      if (data.success) {
        const resolvedTier = data.tier || qTier || "";
        const resolvedRole = data.role || qRole || "";
        setTier(resolvedTier);
        setRole(resolvedRole);
        setStatus("success");

        // ── Send upgrade confirmation email ──
        // Fetch email from Supabase Auth (profiles.email column does not exist)
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            const userId = userData.user.id;
            const userEmail = userData.user.email;

            const { data: profile } = await supabase
              .from("profiles")
              .select("business_name")
              .eq("id", userId)
              .single();

            if (userEmail) {
              fetch("/api/send-upgrade-confirmation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: userEmail,
                  name: profile?.business_name || null,
                  role: resolvedRole,
                  tier: resolvedTier,
                }),
              }).catch(() => {});
            }
          }
        } catch (_) {}

      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const dashboardPath = role === "organizer" ? "/organizer-dashboard" : "/vendor-dashboard";
  const tierLabel = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : "";

  if (status === "verifying") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "sans-serif", backgroundColor: "#fafafa", textAlign: "center" }}>
      <div style={{ backgroundColor: "white", border: "2px solid #701890", borderRadius: 16, padding: "32px 24px", maxWidth: 400, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <p style={{ fontSize: 48, margin: "0 0 16px" }}>⏳</p>
        <h2 style={{ color: "#701890", margin: "0 0 8px" }}>Confirming Upgrade...</h2>
        <p style={{ color: "#888", fontSize: 14 }}>Please wait while we activate your plan.</p>
      </div>
    </div>
  );

  if (status === "error") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "sans-serif", backgroundColor: "#fafafa", textAlign: "center" }}>
      <div style={{ backgroundColor: "white", border: "2px solid #cc0000", borderRadius: 16, padding: "32px 24px", maxWidth: 400, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <p style={{ fontSize: 48, margin: "0 0 16px" }}>⚠️</p>
        <h2 style={{ color: "#cc0000", margin: "0 0 8px" }}>Something Went Wrong</h2>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>Your payment may have been processed. Please contact support if your plan didn't update.</p>
        <button onClick={() => router.replace("/vendor-dashboard")} style={{ width: "100%", padding: "13px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}>Go to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "sans-serif", backgroundColor: "#fafafa", textAlign: "center" }}>
      <div style={{ backgroundColor: "white", border: "2px solid #AABB23", borderRadius: 16, padding: "32px 24px", maxWidth: 400, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <p style={{ fontSize: 60, margin: "0 0 12px" }}>🚀</p>
        <h1 style={{ margin: "0 0 8px", color: "#701890", fontSize: 22 }}>You're on {tierLabel}!</h1>
        <p style={{ margin: "0 0 20px", color: "#666", fontSize: 15 }}>Your plan has been upgraded successfully. A confirmation email has been sent to you.</p>
        <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#166534", fontWeight: "bold" }}>✅ Plan activated</div>

        {/* SPAM WARNING */}
        <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", marginBottom: 24, fontSize: 12, color: "#92400e" }}>
          ⚠️ Confirmation emails sometimes land in your <strong>spam or junk folder</strong>. Please check there if you don't see it.
        </div>

        <button onClick={() => router.replace(dashboardPath)} style={{ width: "100%", padding: "13px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}>Go to My Dashboard →</button>
      </div>
    </div>
  );
}
