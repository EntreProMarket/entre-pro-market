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
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!router.isReady) return;

    const { role, tier } = router.query;

    const labels = {
      premium:  { label: "Premium Vendor",  icon: "💜", color: "#701890" },
      featured: { label: "Featured Vendor", icon: "🔥", color: "#AABB23" },
      basic:    { label: "Basic Organizer", icon: "💼", color: "#555"    },
      pro:      { label: "Pro Organizer",   icon: "🚀", color: "#701890" },
      elite:    { label: "Elite Organizer", icon: "👑", color: "#AABB23" },
    };

    const config = labels[tier] || { label: tier || "Member", icon: "✅", color: "#701890" };
    setTierLabel(config.label);
    setTierIcon(config.icon);
    setTierColor(config.color);
    setStatus("success");

    const countTimer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) clearInterval(countTimer);
        return c - 1;
      });
    }, 1000);

    const timer = setTimeout(() => {
      handleRedirect(role, tier);
    }, 10000);

    return () => { clearTimeout(timer); clearInterval(countTimer); };
  }, [router.isReady, router.query]);

  const handleRedirect = async (roleParam, tierParam) => {
    const currentRole = roleParam || new URLSearchParams(window.location.search).get("role");
    const currentTier = tierParam || new URLSearchParams(window.location.search).get("tier");

    // ── FIX: wait for webhook to update BOTH role AND account_type ──
    let attempts = 0;
    while (attempts < 12) {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) { window.location.href = "/"; return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, account_type, business_name, organizer_name")
        .eq("id", user.id)
        .single();

      // ── FIX: check account_type matches the purchased tier ──
      // This correctly handles upgrades where role was already set
      if (profile?.account_type === currentTier) {
        if (currentRole === "organizer") {
          // New organizer = no name yet → profile setup; existing = dashboard
          window.location.href = profile.organizer_name
            ? "/organizer-dashboard"
            : "/organizer-profile";
        } else {
          // New vendor = no name yet → profile setup; existing = dashboard
          window.location.href = profile.business_name
            ? "/vendor-dashboard"
            : "/vendor-profile";
        }
        return;
      }

      // Webhook hasn't fired yet — wait 1s and retry
      await new Promise(r => setTimeout(r, 1000));
      attempts++;
    }

    // Fallback after 12 seconds — webhook too slow, redirect anyway
    if (currentRole === "organizer") {
      window.location.href = "/organizer-dashboard";
    } else {
      window.location.href = "/vendor-dashboard";
    }
  };

  if (status === "loading") {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>Loading...</div>;
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
      <img src="/logo-transparent.png" alt="EntreProMarket" style={{ width: 120, marginBottom: 24 }} />

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
          Your account is now active! Setting up your profile...
        </div>

        <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
          {countdown > 0 ? `Redirecting in ${countdown} seconds...` : "Redirecting now..."}
        </p>

        <button
          onClick={() => handleRedirect(router.query.role, router.query.tier)}
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
          Continue →
        </button>
      </div>
    </div>
  );
}
