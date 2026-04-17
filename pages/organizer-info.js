// pages/organizer-info.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function OrganizerInfo() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setUserRole(profile?.role || null);
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

  const handleChoosePlan = async (tier) => {
    if (userRole === "vendor") {
      alert("You are already registered as a Vendor and cannot become an Organizer.");
      return;
    }
    if (userRole === "organizer") {
      router.push("/organizer-dashboard");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (user) {
      // Already logged in — set role and go to profile
      await supabase.from("profiles").update({
        role: "organizer",
        account_type: tier,
      }).eq("id", user.id);
      router.push("/organizer-profile");
      return;
    }

    // Not logged in — send to signup with plan context in URL
    router.push(`/?mode=signup&plan=organizer&tier=${tier}`);
  };

  const tierStyles = {
    basic: { border: "#888",    badge: "#555",    badgeBg: "#f5f5f5", icon: "💼" },
    pro:   { border: "#701890", badge: "#701890", badgeBg: "#f3e8ff", icon: "🚀" },
    elite: { border: "#AABB23", badge: "#AABB23", badgeBg: "#f9ffe8", icon: "👑" },
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>

      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <img src="/logo-transparent.png" alt="EntreProMarket" style={{ width: 100, marginBottom: 16 }} />
        <h1 style={{ marginBottom: 8 }}>Become an Organizer</h1>
        <p style={{ color: "#666", fontSize: 15, maxWidth: 600, margin: "0 auto" }}>
          Find and connect with the best vendors for your events. 
          Choose a plan based on how many vendors you need to reach.
        </p>
      </div>

      {/* AD BANNER */}
      <div style={{
        backgroundColor: "#f9ffe8",
        border: "1px solid #AABB23",
        borderRadius: 10,
        padding: "14px 20px",
        marginBottom: 32,
        textAlign: "center",
      }}>
        <p style={{ margin: 0, color: "#888B00", fontWeight: "bold" }}>
          🎉 Launch Special — First month free on any plan!
        </p>
      </div>

      {/* PRICING NOTE */}
      <div style={{
        backgroundColor: "#f8f9fa",
        border: "1px solid #eee",
        borderRadius: 10,
        padding: "14px 20px",
        marginBottom: 24,
        fontSize: 13,
        color: "#666",
        textAlign: "center",
      }}>
        💡 All plans include access to the vendor marketplace. 
        Your plan determines how many vendors you can contact per month.
      </div>

      {/* PLAN CARDS */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#888" }}>Loading plans...</p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 20,
          marginBottom: 40,
        }}>
          {plans.map((plan) => {
            const style = tierStyles[plan.tier] || tierStyles.basic;
            return (
              <div key={plan.id} style={{
                border: `2px solid ${style.border}`,
                borderRadius: 12,
                padding: 24,
                backgroundColor: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
              }}>
                {/* TIER BADGE */}
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: style.badgeBg,
                  border: `1px solid ${style.border}`,
                  borderRadius: 20,
                  padding: "4px 12px",
                  marginBottom: 16,
                  alignSelf: "flex-start",
                }}>
                  <span>{style.icon}</span>
                  <span style={{ color: style.badge, fontWeight: "bold", fontSize: 13 }}>
                    {plan.name}
                  </span>
                </div>

                {/* PRICE */}
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 32, fontWeight: "bold", color: style.badge }}>
                    ${plan.price}
                  </span>
                  <span style={{ color: "#888", fontSize: 14 }}>/month</span>
                  <p style={{ color: "#888", fontSize: 13, margin: "6px 0 0" }}>
                    {plan.description}
                  </p>
                </div>

                {/* FEATURES */}
                <ul style={{ padding: 0, margin: "0 0 24px", listStyle: "none", flex: 1 }}>
                  {(Array.isArray(plan.features) ? plan.features : []).map((feature, i) => (
                    <li key={i} style={{
                      padding: "6px 0",
                      borderBottom: "1px solid #f0f0f0",
                      fontSize: 13,
                      color: "#444",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}>
                      <span style={{ color: style.badge, fontWeight: "bold", marginTop: 1 }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA BUTTON */}
                <button
                  onClick={() => handleChoosePlan(plan.tier)}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: style.badge,
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: 14,
                    width: "100%",
                  }}
                >
                  Choose {plan.name}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* BACK BUTTON */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 40 }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ccc",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ← Back
        </button>
      </div>

    </div>
  );
}
