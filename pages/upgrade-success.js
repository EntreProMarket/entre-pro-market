// pages/upgrade-success.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function UpgradeSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [tierLabel, setTierLabel] = useState("");
  const [tierIcon, setTierIcon] = useState("🎉");
  const [tierColor, setTierColor] = useState("#701890");
  const [countdown, setCountdown] = useState(5);
  const [role, setRole] = useState(null);
  const [tier, setTier] = useState(null);

  const labels = {
    premium:  { label: "Premium Vendor",  icon: "💜", color: "#701890" },
    featured: { label: "Featured Vendor", icon: "🔥", color: "#AABB23" },
    basic:    { label: "Basic Organizer", icon: "💼", color: "#555"    },
    pro:      { label: "Pro Organizer",   icon: "🚀", color: "#701890" },
    elite:    { label: "Elite Organizer", icon: "👑", color: "#AABB23" },
  };

  useEffect(() => {
    if (!router.isReady) return;

    const { session_id, role: roleParam, tier: tierParam } = router.query;

    const config = labels[tierParam] || { label: tierParam || "Member", icon: "✅", color: "#701890" };
    setTierLabel(config.label);
    setTierIcon(config.icon);
    setTierColor(config.color);
    setRole(roleParam);
    setTier(tierParam);

    if (!session_id) {
      // No session ID — something went wrong
      setStatus("error");
      return;
    }

    // ── IMMEDIATELY verify payment and update the DB ──
    // Don't wait for the webhook — call our own API to confirm with Stripe right now
    verifyAndUpdate(session_id, roleParam, tierParam);
  }, [router.isReady, router.query]);

  const verifyAndUpdate = async (sessionId, roleParam, tierParam) => {
    try {
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus("success");

        // Start countdown then redirect
        let count = 5;
        const countTimer = setInterval(() => {
          count--;
          setCountdown(count);
          if (count <= 0) {
            clearInterval(countTimer);
            redirect(roleParam, tierParam);
          }
        }, 1000);

      } else {
        console.error("Payment verification failed:", result);
        setStatus("error");
      }
    } catch (err) {
      console.error("verify-payment call failed:", err);
      setStatus("error");
    }
  };

  const redirect = async (roleParam, tierParam) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) { window.location.href = "/"; return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, organizer_name")
      .eq("id", user.id)
      .single();

    if (roleParam === "organizer") {
      // Always go to profile so they can use new features
      window.location.href = "/organizer-profile";
    } else {
      // Always go to profile so they can use new features (more photos, videos etc.)
      window.location.href = "/vendor-profile";
    }
  };

  // ── VERIFYING STATE ──
  if (status === "verifying") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "sans-serif", backgroundColor: "#fafafa", textAlign: "center" }}>
        <img src="/logo-transparent.png" alt="EntreProMarket" style={{ width: 120, marginBottom: 24 }} />
        <div style={{ backgroundColor: "white", border: "2px solid #701890", borderRadius: 16, padding: "32px 24px", maxWidth: 400, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <p style={{ fontSize: 48, margin: "0 0 16px" }}>⏳</p>
          <h2 style={{ color: "#701890", margin: "0 0 8px" }}>Confirming Payment...</h2>
          <p style={{ color: "#888", fontSize: 14, margin: 0 }}>Please wait while we activate your account.</p>
        </div>
      </div>
    );
  }

  // ── ERROR STATE ──
  if (status === "error") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "sans-serif", backgroundColor: "#fafafa", textAlign: "center" }}>
        <img src="/logo-transparent.png" alt="EntreProMarket" style={{ width: 120, marginBottom: 24 }} />
        <div style={{ backgroundColor: "white", border: "2px solid #cc0000", borderRadius: 16, padding: "32px 24px", maxWidth: 400, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <p style={{ fontSize: 48, margin: "0 0 16px" }}>⚠️</p>
          <h2 style={{ color: "#cc0000", margin: "0 0 8px" }}>Something Went Wrong</h2>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
            Your payment may have been processed but we couldn't confirm it automatically. Please contact support and we'll fix it right away.
          </p>
          <button
            onClick={() => window.location.href = role === "organizer" ? "/organizer-dashboard" : "/vendor-dashboard"}
            style={{ width: "100%", padding: "13px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── SUCCESS STATE ──
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
          ✅ Your account has been upgraded! Let's set up your profile.
        </div>

        <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
          {countdown > 0 ? `Redirecting in ${countdown} seconds...` : "Redirecting now..."}
        </p>

        <button
          onClick={() => redirect(role, tier)}
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
          Continue to Profile Setup →
        </button>
      </div>
    </div>
  );
}
