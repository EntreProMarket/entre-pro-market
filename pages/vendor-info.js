// pages/vendor-info.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function VendorInfo() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const load = async () => {
      // Check if user is logged in and has a role
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

      // Load vendor plans from database
      const { data: plansData } = await supabase
        .from("plans")
        .select("*")
        .eq("role", "vendor")
        .order("sort_order", { ascending: true });

      setPlans(plansData || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleChoosePlan = (tier) => {
    if (userRole === "organizer") {
      alert("You are already registered as an Organizer and cannot become a Vendor.");
      return;
    }
    if (userRole === "vendor") {
      router.push("/vendor-dashboard");
      return;
    }
    // Store selected tier and redirect to signup
    router.push(`/?plan=vendor&tier=${tier}`);
  };

  const tierStyles = {
    free:     { border: "#ddd",    badge: "#888",    badgeBg: "#f5f5f5",  icon: "🆓" },
    premium:  { border: "#701890", badge: "#701890", badgeBg: "#f3e8ff",  icon: "💜" },
    featured: { border: "#AABB23", badge: "#AABB23", badgeBg: "#f9ffe8",  icon: "🔥" },
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>

      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <img src="/logo.png.jpg" alt="EntreProMarket" style={{ width: 100, marginBottom: 16 }} />
        <h1 style={{ marginBottom: 8 }}>Become a Vendor</h1>
        <p style={{ color: "#666", fontSize: 15, maxWidth: 600, margin: "0 auto" }}>
          Join EntreProMarket and get discovered by event organizers and shoppers. 
          Choose the plan that works best for your business.
        </p>
      </div>

      {/* AD BANNER */}
      <div style={{
        backgroundColor: "#f3e8ff",
        border: "1px solid #701890",
        borderRadius: 10,
        padding: "14px 20px",
        marginBottom: 32,
        textAlign: "center",
      }}>
        <p style={{ margin: 0, color: "#701890", fontWeight: "bold" }}>
          🎉 Launch Special — First month free on any paid plan!
        </p>
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
            const style = tierStyles[plan.tier] || tierStyles.free;
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
                  {plan.price === 0 ? (
                    <span style={{ fontSize: 32, fontWeight: "bold", color: "#333" }}>Free</span>
                  ) : (
                    <div>
                      <span style={{ fontSize: 32, fontWeight: "bold", color: style.badge }}>
                        ${plan.price}
                      </span>
                      <span style={{ color: "#888", fontSize: 14 }}>/month</span>
                    </div>
                  )}
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
                    backgroundColor: plan.price === 0 ? "#333" : style.badge,
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: 14,
                    width: "100%",
                  }}
                >
                  {plan.price === 0 ? "Get Started Free" : `Choose ${plan.name}`}
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
