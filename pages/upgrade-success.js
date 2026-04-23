// pages/upgrade-success.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function UpgradeSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [tierLabel, setTierLabel] = useState("");
  const [tierIcon, setTierIcon] = useState("🎉");
  const [tierColor, setTierColor] = useState("#701890");

  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) return;

    const { role, tier } = router.query;

    const labels = {
      premium:  { label: "Premium Vendor",   icon: "💜", color: "#701890" },
      featured: { label: "Featured Vendor",  icon: "🔥", color: "#AABB23" },
      basic:    { label: "Basic Organizer",  icon: "💼", color: "#555"    },
      pro:      { label: "Pro Organizer",    icon: "🚀", color: "#701890" },
      elite:    { label: "Elite Organizer",  icon: "👑", color: "#AABB23" },
    };

    const config = labels[tier] || { label: tier, icon: "✅", color: "#701890" };
    setTierLabel(config.label);
    setTierIcon(config.icon);
    setTierColor(config.color);
    setStatus("success");

    // Auto redirect after 4 seconds
    const timer = setTimeout(async () => {
      await goToDashboard(role || new URLSearchParams(window.location.search).get("role"));
    }, 10000);

    return () => clearTimeout(timer);
  }, [router.isReady, router.query]);

  const goToDashboard = async (roleParam) => {
    const currentRole = roleParam || new URLSearchParams(window.location.search).get("role");
    if (currentRole === "organizer") {
      window.location.href = "/organizer-dashboard";
    } else {
      window.location.href = "/vendor-dashboard";
    }
  };

  if (status === "loading") {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        Loading...
      </div>
    );
  }

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
        border: `2px solid ${tierColor}`,
        borderRadius: 16,
        padding: "32px 24px",
        maxWidth: 400,
        width: "100%",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        <p style={{ fontSize: 60, margin: "0 0 12px" }}>🎉</p>
        <h1 style={{ margin: "0 0 8px", color: tierColor, fontSize: 22 }}>
          Payment Successful!
        </h1>
        <p style={{ margin: "0 0 20px", color: "#666", fontSize: 15 }}>
          Welcome to {tierIcon} {tierLabel}
        </p>

        <div style={{
          backgroundColor: tierColor + "15",
          border: `1px solid ${tierColor}`,
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 24,
          fontSize: 13,
          color: tierColor,
          fontWeight: "bold",
        }}>
          Your account is now active! Let's set up your profile.
        </div>

        <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
          Redirecting you in a moment...
        </p>

        <button
          onClick={() => goToDashboard(router.query.role || new URLSearchParams(window.location.search).get('role'))}
          style={{
            width: "100%",
            padding: "13px",
            backgroundColor: tierColor,
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Set Up My Profile →
        </button>
      </div>
    </div>
  );
}
