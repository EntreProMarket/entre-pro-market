// pages/organizer-info.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function OrganizerInfo() {
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
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, account_type")
          .eq("id", user.id)
          .single();
        setUserRole(profile?.role || null);
        setUserTier(profile?.account_type || null);
      }

      const { data: plansData } = await supabase
        .from("plans")
        .select("*")
        .eq("role", "organizer")
        .order("sort_order", { ascending: true });

      setPlans(plansData || []);
      setLoading(false);
    };
    load();
  }, []);

  const PRICE_IDS = {
    basic: "price_1TipJ9IofgLPwGzFtIXDEV5c",
    pro:   "price_1TipLiIofgLPwGzFrg7I5pap",
    elite: "price_1TipMfIofgLPwGzF432mjiJB",
  };

  const PRICE_MODES = {
    basic: "payment",
    pro:   "subscription",
    elite: "subscription",
  };

  const TIER_RANK = { basic: 1, pro: 2, elite: 3 };

  const handleChoosePlan = async (tier) => {
    if (userRole === "vendor") {
      alert("You are already registered as a Vendor and cannot become an Organizer.");
      return;
    }

    if (userRole === "organizer" && userTier === tier) {
      alert(`You are already on the ${tier} plan.`);
      router.push("/organizer-dashboard");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      router.push(`/?mode=signup&plan=organizer&tier=${tier}`);
      return;
    }

    const priceId = PRICE_IDS[tier];
    if (!priceId) {
      alert("Payment not configured yet. Please contact support.");
      return;
    }

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          role: "organizer",
          tier,
          mode: PRICE_MODES[tier],
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error starting checkout: " + data.error);
      }
    } catch (err) {
      alert("Checkout error: " + err.message);
    }
  };

  const tierStyles = {
    basic: { border: "#888",    badge: "#555",    badgeBg: "#f5f5f5", icon: "💼" },
    pro:   { border: "#701890", badge: "#701890", badgeBg: "#f3e8ff", icon: "🚀" },
    elite: { border: "#AABB23", badge: "#AABB23", badgeBg: "#f9ffe8", icon: "👑" },
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <img src="/logo-transparent.png" alt="EntreProMarket" style={{ width: 100, marginBottom: 16 }} />
        <h1 style={{ marginBottom: 8 }}>
          {userRole === "organizer" ? "Upgrade Your Plan" : "Become an Organizer"}
        </h1>
        <p style={{ color: "#666", fontSize: 15, maxWidth: 600, margin: "0 auto" }}>
          {userRole === "organizer"
            ? "Upgrade your plan to contact more vendors and unlock more features."
            : "Find and connect with the best vendors for your events. Choose a plan based on how many vendors you need to reach."}
        </p>
      </div>

      {userRole === "organizer" && userTier && (
        <div style={{
          backgroundColor: "#f3e8ff",
          border: "1px solid #701890",
          borderRadius: 10,
          padding: "12px 20px",
          marginBottom: 24,
          textAlign: "center",
          fontSize: 14,
          color: "#701890",
          fontWeight: "bold",
        }}>
          Your current plan: {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Organizer
        </div>
      )}

      <div style={{ backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 10, padding: "14px 20px", marginBottom: 32, textAlign: "center" }}>
        <p style={{ margin: 0, color: "#888B00", fontWeight: "bold" }}>
          🎉 Launch Special — First month free on any plan!
        </p>
      </div>

      <div style={{ backgroundColor: "#f8f9fa", border: "1px solid #eee", borderRadius: 10, padding: "14px 20px", marginBottom: 24, fontSize: 13, color: "#666", textAlign: "center" }}>
        💡 All plans include access to the vendor marketplace. Your plan determines how many vendors you can contact per month.
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#888" }}>Loading plans...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20, marginBottom: 40 }}>
          {plans.map((plan) => {
            const style = tierStyles[plan.tier] || tierStyles.basic;
            const isCurrentPlan = userRole === "organizer" && userTier === plan.tier;
            const isUpgrade = userRole === "organizer" && (TIER_RANK[plan.tier] || 0) > (TIER_RANK[userTier] || 0);

            return (
              <div key={plan.id} style={{
                border: `2px solid ${isCurrentPlan ? "#AABB23" : style.border}`,
                borderRadius: 12,
                padding: 24,
                backgroundColor: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}>
                {isCurrentPlan && (
                  <div style={{ position: "absolute", top: -1, right: 16, backgroundColor: "#AABB23", color: "white", fontSize: 10, fontWeight: "bold", padding: "3px 10px", borderRadius: "0 0 8px 8px" }}>
                    CURRENT PLAN
                  </div>
                )}

                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: style.badgeBg, border: `1px solid ${style.border}`, borderRadius: 20, padding: "4px 12px", marginBottom: 16, alignSelf: "flex-start" }}>
                  <span>{style.icon}</span>
                  <span style={{ color: style.badge, fontWeight: "bold", fontSize: 13 }}>{plan.name}</span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 32, fontWeight: "bold", color: style.badge }}>${plan.price}</span>
                  <span style={{ color: "#888", fontSize: 14 }}>/month</span>
                  <p style={{ color: "#888", fontSize: 13, margin: "6px 0 0" }}>{plan.description}</p>
                </div>

                <ul style={{ padding: 0, margin: "0 0 24px", listStyle: "none", flex: 1 }}>
                  {(Array.isArray(plan.features) ? plan.features : []).map((feature, i) => (
                    <li key={i} style={{ padding: "6px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13, color: "#444", display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: style.badge, fontWeight: "bold", marginTop: 1 }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleChoosePlan(plan.tier)}
                  disabled={isCurrentPlan}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: isCurrentPlan ? "#ccc" : style.badge,
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: isCurrentPlan ? "default" : "pointer",
                    fontWeight: "bold",
                    fontSize: 14,
                    width: "100%",
                  }}
                >
                  {isCurrentPlan ? "Current Plan" : isUpgrade ? `⬆️ Upgrade to ${plan.name}` : `Choose ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 40 }}>
        <button onClick={() => router.back()} style={{ padding: "10px 20px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>
          ← Back
        </button>
      </div>

    </div>
  );
}
