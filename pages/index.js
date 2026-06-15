// pages/index.js — LOGIN / SIGNUP PAGE

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

const VENDOR_PRICE_IDS = {
  premium: "price_1TORKAIofgLPwGzFG8dd6YQg",
  featured: "price_1TORKAIofgLPwGzFRhbQup5T",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [mode, setMode] = useState("login");

  // Read plan/tier from URL if coming from vendor-info or organizer-info
  const { plan, tier } = router.query;

  useEffect(() => {
    // If signup mode passed in URL, switch to signup tab
    if (router.query.mode === "signup") setMode("signup");
  }, [router.query]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user) {
        await redirectUser(user.id);
        return;
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  const redirectUser = async (userId) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", userId)
      .single();

    if (profile?.is_admin) router.replace("/admin");
    else if (profile?.role === "vendor") router.replace("/vendor-dashboard");
    else if (profile?.role === "organizer") router.replace("/organizer-dashboard");
    else router.replace("/home");
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      let msg = error.message;
      if (msg.includes("missing email or phone")) msg = "Please enter your email address.";
      if (msg.includes("Invalid login")) msg = "Incorrect email or password. Please try again.";
      if (msg.includes("Email not confirmed")) msg = "Please confirm your email before logging in.";
      setMessage(msg);
      setAuthLoading(false);
      return;
    }

    await redirectUser(data.user.id);
  };

  // Fire-and-forget welcome email — doesn't block navigation
  const sendWelcomeEmail = (userEmail, role) => {
    try {
      fetch("/api/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, name: null, role }),
      }).catch(() => {});
    } catch (_) {}
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }
    setAuthLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      let msg = error.message;
      if (msg.includes("already registered")) msg = "This email is already registered. Please log in instead.";
      setMessage(msg);
      setAuthLoading(false);
      return;
    }

    const user = data?.user;
    if (!user) {
      setMessage("✅ Check your email to confirm your account, then log in.");
      setAuthLoading(false);
      return;
    }

    // ✅ VENDOR SIGNUP
    if (plan === "vendor") {
      const isPaidTier = tier === "premium" || tier === "featured";

      // Always start on the free tier in the database.
      // Paid tiers only get activated after Stripe checkout completes
      // (handled by the webhook / verify-payment).
      await supabase.from("profiles").upsert({
        id: user.id,
        role: "vendor",
        account_type: "free",
      });

      sendWelcomeEmail(user.email, "vendor");

      if (isPaidTier) {
        const priceId = VENDOR_PRICE_IDS[tier];
        try {
          const res = await fetch("/api/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              priceId,
              userId: user.id,
              role: "vendor",
              tier,
              mode: "subscription",
            }),
          });
          const checkoutData = await res.json();
          if (checkoutData.url) {
            window.location.href = checkoutData.url;
            return;
          } else {
            alert("Could not start checkout: " + (checkoutData.error || "unknown error") + ". You've been signed up on the Free plan — you can upgrade anytime from your dashboard.");
          }
        } catch (err) {
          alert("Checkout error: " + err.message + ". You've been signed up on the Free plan — you can upgrade anytime from your dashboard.");
        }
      }

      router.replace("/vendor-profile");
      return;
    }

    // ✅ ORGANIZER SIGNUP
    if (plan === "organizer") {
      await supabase.from("profiles").upsert({
        id: user.id,
        role: "organizer",
        account_type: tier || "basic",
      });

      sendWelcomeEmail(user.email, "organizer");

      router.replace("/organizer-profile");
      return;
    }

    // No plan — create basic profile and go to home
    await supabase.from("profiles").upsert({
      id: user.id,
      role: null,
      account_type: "public",
    });

    sendWelcomeEmail(user.email, "public");

    router.replace("/home");
  };

  const checkRoleAndRedirect = async (target) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) { router.push(target); return; }

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();

    if (profile?.role === "vendor" && target === "/organizer-info") {
      setMessage("You are already registered as a Vendor.");
      return;
    }
    if (profile?.role === "organizer" && target === "/vendor-info") {
      setMessage("You are already registered as an Organizer.");
      return;
    }
    router.push(target);
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
      Loading...
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "24px 20px 40px",
      fontFamily: "sans-serif",
      backgroundColor: "#fafafa",
      overflowY: "auto",
    }}>

      {/* LOGO */}
      <img
        src="/logo-transparent.png"
        alt="Entre PRO Market"
        style={{ width: 180, marginBottom: 12 }}
      />

      <p style={{ color: "#888", fontSize: 13, marginBottom: 16, textAlign: "center" }}>
        The marketplace for vendors and event organizers
      </p>

      {/* SHOW PLAN CONTEXT if coming from info page */}
      {plan && tier && (
        <div style={{
          backgroundColor: plan === "vendor" ? "#f3e8ff" : "#f9ffe8",
          border: `1px solid ${plan === "vendor" ? "#701890" : "#AABB23"}`,
          borderRadius: 8,
          padding: "10px 16px",
          marginBottom: 16,
          fontSize: 13,
          color: plan === "vendor" ? "#701890" : "#888B00",
          fontWeight: "bold",
          textAlign: "center",
          maxWidth: 400,
          width: "100%",
        }}>
          {plan === "vendor" ? "🛒" : "🎪"} Signing up as {tier} {plan} — create your account below
          {plan === "vendor" && (tier === "premium" || tier === "featured") && (
            <p style={{ margin: "6px 0 0", fontWeight: "normal", fontSize: 12 }}>
              You'll be taken to secure checkout after creating your account.
            </p>
          )}
        </div>
      )}

      {/* AUTH TABS */}
      <div style={{
        display: "flex", marginBottom: 14,
        borderRadius: 8, overflow: "hidden",
        border: "1px solid #ddd", maxWidth: 400, width: "100%",
      }}>
        <button onClick={() => setMode("login")} style={{
          flex: 1, padding: "10px", border: "none", cursor: "pointer",
          fontWeight: "bold", fontSize: 14,
          backgroundColor: mode === "login" ? "#701890" : "white",
          color: mode === "login" ? "white" : "#666",
        }}>Log In</button>
        <button onClick={() => setMode("signup")} style={{
          flex: 1, padding: "10px", border: "none", cursor: "pointer",
          fontWeight: "bold", fontSize: 14,
          backgroundColor: mode === "signup" ? "#701890" : "white",
          color: mode === "signup" ? "white" : "#666",
        }}>Sign Up</button>
      </div>

      {/* FORM */}
      <div style={{ width: "100%", maxWidth: 400 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignUp())}
          style={{
            display: "block", width: "100%", padding: "12px 14px",
            marginBottom: 10, borderRadius: 6, border: "1px solid #ddd",
            fontSize: 15, boxSizing: "border-box",
          }}
        />

        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignUp())}
            style={{
              display: "block", width: "100%", padding: "12px 14px",
              borderRadius: 6, border: "1px solid #ddd",
              fontSize: 15, boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute", right: 12, top: 10,
              background: "none", border: "none", color: "#701890",
              fontWeight: "bold", cursor: "pointer", fontSize: 13,
            }}
          >
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        </div>

        <button
          onClick={mode === "login" ? handleLogin : handleSignUp}
          disabled={authLoading}
          style={{
            width: "100%", padding: "13px",
            backgroundColor: "#701890", color: "white",
            border: "none", borderRadius: 8,
            fontWeight: "bold", fontSize: 15,
            cursor: "pointer", marginBottom: 12,
            opacity: authLoading ? 0.7 : 1,
          }}
        >
          {authLoading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
        </button>

        {message && (
          <p style={{
            padding: "10px 14px", borderRadius: 6, fontSize: 13,
            textAlign: "center", marginBottom: 12,
            backgroundColor: message.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
            color: message.startsWith("✅") ? "#166534" : "#991b1b",
            border: `1px solid ${message.startsWith("✅") ? "#86efac" : "#fca5a5"}`,
          }}>
            {message}
          </p>
        )}
      </div>

      {/* DIVIDER */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        margin: "16px 0", width: "100%", maxWidth: 400,
      }}>
        <div style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
        <span style={{ color: "#aaa", fontSize: 12 }}>or</span>
        <div style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
      </div>

      {/* ROLE BUTTONS */}
      <div style={{
        width: "100%", maxWidth: 400,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <button
          onClick={() => checkRoleAndRedirect("/vendor-info")}
          style={{
            padding: "12px 20px", backgroundColor: "#AABB23",
            color: "white", border: "none", borderRadius: 8,
            fontWeight: "bold", fontSize: 14, cursor: "pointer",
          }}
        >
          🛒 Become a Vendor
        </button>
        <button
          onClick={() => checkRoleAndRedirect("/organizer-info")}
          style={{
            padding: "12px 20px", backgroundColor: "#333",
            color: "white", border: "none", borderRadius: 8,
            fontWeight: "bold", fontSize: 14, cursor: "pointer",
          }}
        >
          🎪 Become an Organizer
        </button>
        <button
          onClick={() => router.push("/marketplace")}
          style={{
            padding: "12px 20px", backgroundColor: "white",
            color: "#701890", border: "2px solid #701890",
            borderRadius: 8, fontWeight: "bold", fontSize: 14, cursor: "pointer",
          }}
        >
          🔍 Browse Marketplace
        </button>
      </div>
    </div>
  );
}
