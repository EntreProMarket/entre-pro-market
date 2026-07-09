// pages/vendor-info.js — LIVE VERSION ($75 Premium, $125 Featured)

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function VendorInfo() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userTier, setUserTier] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role, account_type").eq("id", user.id).single();
        setUserRole(profile?.role || null);
        setUserTier(profile?.account_type || null);
      }
      const { data: plansData } = await supabase.from("plans").select("*").eq("role", "vendor").order("sort_order", { ascending: true });
      setPlans(plansData || []);
      setLoading(false);
    };
    load();
  }, []);

  // ── LIVE PRICE IDs ──
  const PRICE_IDS = {
    premium:  "price_1Tip3LIofgLPwGzFexWb2FId",   // $75/mo
    featured: "price_1Tip97IofgLPwGzFE3Dl0bjX",   // $125/mo
  };

  const TIER_RANK = { free: 0, premium: 1, featured: 2 };

  const handleChoosePlan = async (tier) => {
    if (userRole === "organizer") { alert("You are already registered as an Organizer and cannot become a Vendor."); return; }
    if (userRole === "vendor" && userTier === tier) { alert(`You are already on the ${tier} plan.`); router.push("/vendor-dashboard"); return; }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) { router.push(`/?mode=signup&plan=vendor&tier=${tier}`); return; }
    if (tier === "free") {
      await supabase.from("profiles").update({ role: "vendor", account_type: "free" }).eq("id", user.id);
      router.push("/vendor-profile"); return;
    }
    const priceId = PRICE_IDS[tier];
    if (!priceId) { alert("Payment not configured yet."); return; }
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId: user.id, role: "vendor", tier, mode: "subscription" }),
      });
      const data = await response.json();
      if (data.url) { window.location.href = data.url; }
      else { alert("Error starting checkout: " + data.error); }
    } catch (err) { alert("Checkout error: " + err.message); }
  };

  const tierStyles = {
    free:     { border: "#ddd",    badge: "#888",    badgeBg: "#f5f5f5", icon: "🆓" },
    premium:  { border: "#701890", badge: "#701890", badgeBg: "#f3e8ff", icon: "💜" },
    featured: { border: "#AABB23", badge: "#AABB23", badgeBg: "#f9ffe8", icon: "🔥" },
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <img src="/logo-circle.png" alt="EntreProMarket" style={{ width: 110, height: 110, objectFit: "contain", borderRadius: "50%", marginBottom: 16 }} />
        <h1 style={{ marginBottom: 8 }}>{userRole === "vendor" ? "Upgrade Your Plan" : "Become a Vendor"}</h1>
        <p style={{ color: "#666", fontSize: 15, maxWidth: 600, margin: "0 auto" }}>
          {userRole === "vendor" ? "Upgrade your plan to unlock more features and get more visibility." : "Join EntreProMarket and get discovered by event organizers and shoppers."}
        </p>
      </div>

      {userRole === "vendor" && userTier && (
        <div style={{ backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 10, padding: "12px 20px", marginBottom: 24, textAlign: "center", fontSize: 14, color: "#701890", fontWeight: "bold" }}>
          Your current plan: {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Vendor
        </div>
      )}

      <div style={{ backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 10, padding: "14px 20px", marginBottom: 32, textAlign: "center" }}>
        <p style={{ margin: 0, color: "#701890", fontWeight: "bold" }}>🎉 Launch Special — First month free on any paid plan!</p>
      </div>

      {loading ? <p style={{ textAlign: "center", color: "#888" }}>Loading plans...</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20, marginBottom: 40 }}>
          {plans.map((plan) => {
            const style = tierStyles[plan.tier] || tierStyles.free;
            const isCurrentPlan = userRole === "vendor" && userTier === plan.tier;
            const isUpgrade = userRole === "vendor" && (TIER_RANK[plan.tier] || 0) > (TIER_RANK[userTier] || 0);
            return (
              <div key={plan.id} style={{ border: `2px solid ${isCurrentPlan ? "#AABB23" : style.border}`, borderRadius: 12, padding: 24, backgroundColor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", position: "relative" }}>
                {isCurrentPlan && <div style={{ position: "absolute", top: -1, right: 16, backgroundColor: "#AABB23", color: "white", fontSize: 10, fontWeight: "bold", padding: "3px 10px", borderRadius: "0 0 8px 8px" }}>CURRENT PLAN</div>}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: style.badgeBg, border: `1px solid ${style.border}`, borderRadius: 20, padding: "4px 12px", marginBottom: 16, alignSelf: "flex-start" }}>
                  <span>{style.icon}</span>
                  <span style={{ color: style.badge, fontWeight: "bold", fontSize: 13 }}>{plan.name}</span>
                </div>
                <div style={{ marginBottom: 16 }}>
                  {plan.price === 0 ? <span style={{ fontSize: 32, fontWeight: "bold", color: "#333" }}>Free</span> : (
                    <div><span style={{ fontSize: 32, fontWeight: "bold", color: style.badge }}>${plan.price}</span><span style={{ color: "#888", fontSize: 14 }}>/month</span></div>
                  )}
                  <p style={{ color: "#888", fontSize: 13, margin: "6px 0 0" }}>{plan.description}</p>
                </div>
                <ul style={{ padding: 0, margin: "0 0 24px", listStyle: "none", flex: 1 }}>
                  {(Array.isArray(plan.features) ? plan.features : []).map((feature, i) => (
                    <li key={i} style={{ padding: "6px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13, color: "#444", display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: style.badge, fontWeight: "bold", marginTop: 1 }}>✓</span>{feature}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleChoosePlan(plan.tier)} disabled={isCurrentPlan}
                  style={{ padding: "12px 20px", backgroundColor: isCurrentPlan ? "#ccc" : plan.price === 0 ? "#333" : style.badge, color: "white", border: "none", borderRadius: 8, cursor: isCurrentPlan ? "default" : "pointer", fontWeight: "bold", fontSize: 14, width: "100%" }}>
                  {isCurrentPlan ? "Current Plan" : isUpgrade ? `Upgrade to ${plan.name}` : plan.price === 0 ? "Get Started Free" : `Choose ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 40 }}>
        <button onClick={() => router.back()} style={{ padding: "10px 20px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>← Back</button>
      </div>
    </div>
  );
}
