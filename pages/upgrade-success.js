// pages/upgrade-success.js
// Landing page after successful Stripe payment

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function UpgradeSuccess() {
  const router = useRouter();
  const { role, tier } = router.query;
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!role) return;

    const checkProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) { router.replace("/"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name, organizer_name, account_type")
        .eq("id", user.id)
        .single();

      // Determine where to send user after countdown
      let dest;
      if (role === "vendor") {
        // New vendor with no profile yet → go to profile setup
        dest = profile?.business_name ? "/vendor-dashboard" : "/vendor-profile";
      } else {
        dest = profile?.organizer_name ? "/organizer-dashboard" : "/organizer-profile";
      }

      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timer);
            router.replace(dest);
          }
          return c - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    };

    checkProfile();
  }, [role]);

  const tierLabels = {
    premium: { label: "Premium Vendor", icon: "💜", color: "#701890" },
    featured: { label: "Featured Vendor", icon: "🔥", color: "#AABB23" },
    basic: { label: "Basic Organizer", icon: "💼", color: "#555" },
    pro: { label: "Pro Organizer", icon: "🚀", color: "#701890" },
    elite: { label: "Elite Organizer", icon: "👑", color: "#AABB23" },
  };

  const config = tierLabels[tier] || { label: tier, icon: "✅", color: "#701890" };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "sans-serif",
      backgroundColor: "#fafafa",
      textAlign: "center",
    }}>
      <img
        src="/logo-transparent.png"
        alt="EntreProMarket"
        style={{ width: 120, marginBottom: 24 }}
      />

      <div style={{
        backgroundColor: "white",
        border: `2px solid ${config.color}`,
        borderRadius: 16,
        padding: "32px 24px",
        maxWidth: 400,
        width: "100%",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        <p style={{ fontSize: 60, margin: "0 0 12px" }}>🎉</p>
        <h1 style={{ margin: "0 0 8px", color: config.color, fontSize: 22 }}>
          Payment Successful!
        </h1>
        <p style={{ margin: "0 0 20px", color: "#666", fontSize: 15 }}>
          Welcome to {config.icon} {config.label}
        </p>

        <div style={{
          backgroundColor: config.color + "15",
          border: `1px solid ${config.color}`,
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 24,
          fontSize: 13,
          color: config.color,
          fontWeight: "bold",
        }}>
          Your account has been upgraded successfully.
          All features are now active!
        </div>

        <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
          Redirecting to your dashboard in {countdown} seconds...
        </p>

        <button
          onClick={async () => {
            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;
            if (!user) { router.replace("/"); return; }
            const { data: profile } = await supabase.from("profiles").select("business_name, organizer_name").eq("id", user.id).single();
            if (role === "vendor") {
              router.replace(profile?.business_name ? "/vendor-dashboard" : "/vendor-profile");
            } else {
              router.replace(profile?.organizer_name ? "/organizer-dashboard" : "/organizer-profile");
            }
          }}
          style={{
            width: "100%",
            padding: "13px",
            backgroundColor: config.color,
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Go to Dashboard Now →
        </button>
      </div>
    </div>
  );
}
