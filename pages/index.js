// pages/index.js — LOGIN / SIGNUP PAGE

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

const VENDOR_PRICE_IDS = {
  premium: "price_1Tip3LIofgLPwGzFexWb2FId",
  featured: "price_1Tip97IofgLPwGzFE3Dl0bjX",
};

const ORGANIZER_PRICE_IDS = {
  basic: "price_1TipJ9IofgLPwGzFtIXDEV5c",
  pro:   "price_1TipLiIofgLPwGzFrg7I5pap",
  elite: "price_1TipMfIofgLPwGzF432mjiJB",
};

const ORGANIZER_PRICE_MODES = {
  basic: "payment",
  pro:   "subscription",
  elite: "subscription",
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

  const { plan, tier } = router.query;
  const isPlanFlow = Boolean(plan && (plan === "vendor" || plan === "organizer"));
  const selectedTier = tier || (plan === "organizer" ? "basic" : "free");

  useEffect(() => {
    if (router.query.mode === "signup") setMode("signup");
  }, [router.query]);

  // ── Restore email/password if the person typed them in before choosing
  // a plan, so they don't have to re-type on the dedicated signup screen.
  // Cleared immediately after reading — never persists beyond this handoff.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedEmail = sessionStorage.getItem("epm_temp_email");
    const savedPassword = sessionStorage.getItem("epm_temp_password");
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
    sessionStorage.removeItem("epm_temp_email");
    sessionStorage.removeItem("epm_temp_password");
  }, []);

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

  const sendWelcomeEmail = (userEmail, role) => {
    try {
      fetch("/api/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, name: null, role }),
      }).catch(() => {});
    } catch (_) {}
  };

  const startCheckout = async (priceId, userId, role, tierVal, checkoutMode) => {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, userId, role, tier: tierVal, mode: checkoutMode }),
    });
    return res.json();
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

      // Free tier is granted immediately — paid tiers stay "free" in the
      // database until Stripe checkout actually completes (via webhook).
      await supabase.from("profiles").upsert({
        id: user.id,
        role: "vendor",
        account_type: "free",
      });

      sendWelcomeEmail(user.email, "vendor");

      if (isPaidTier) {
        const priceId = VENDOR_PRICE_IDS[tier];
        try {
          const checkoutData = await startCheckout(priceId, user.id, "vendor", tier, "subscription");
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

    // ✅ ORGANIZER SIGNUP — every organizer tier is paid.
    // SECURITY: do NOT grant the "organizer" role here. Role + tier are only
    // set after Stripe confirms payment (via webhook or verify-payment).
    if (plan === "organizer") {
      const chosenTier = tier || "basic";

      await supabase.from("profiles").upsert({
        id: user.id,
        role: null,
        account_type: null,
      });

      sendWelcomeEmail(user.email, "organizer");

      const priceId = ORGANIZER_PRICE_IDS[chosenTier];
      const checkoutMode = ORGANIZER_PRICE_MODES[chosenTier] || "subscription";

      if (!priceId) {
        alert("Payment not configured for this plan. Please contact support.");
        router.replace("/home");
        return;
      }

      try {
        const checkoutData = await startCheckout(priceId, user.id, "organizer", chosenTier, checkoutMode);
        if (checkoutData.url) {
          window.location.href = checkoutData.url;
          return;
        } else {
          alert("Could not start checkout: " + (checkoutData.error || "unknown error") + ". Your account was created — choose a plan from the homepage to finish setup.");
        }
      } catch (err) {
        alert("Checkout error: " + err.message + ". Your account was created — choose a plan from the homepage to finish setup.");
      }

      router.replace("/home");
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
    // Preserve whatever email/password the person already typed on this
    // screen so it can be restored on the dedicated plan signup screen.
    if (typeof window !== "undefined") {
      if (email) sessionStorage.setItem("epm_temp_email", email);
      if (password) sessionStorage.setItem("epm_temp_password", password);
    }

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

  // ── DEDICATED SIGNUP SCREEN when a plan was already chosen ──
  if (isPlanFlow) {
    const planLabel = plan === "vendor" ? "Vendor" : "Organizer";
    const tierLabel = selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1);
    const accentColor = plan === "vendor" ? "#701890" : "#AABB23";
    const isPaid = plan === "organizer" || selectedTier === "premium" || selectedTier === "featured";
    const backLink = plan === "vendor" ? "/vendor-info" : "/organizer-info";

    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 20px 40px", fontFamily: "sans-serif",
        backgroundColor: "#fafafa",
      }}>
        <img src="/logo-transparent.png" alt="Entre PRO Market" style={{ width: 150, marginBottom: 16 }} />

        <div style={{
          backgroundColor: plan === "vendor" ? "#f3e8ff" : "#f9ffe8",
          border: `1px solid ${accentColor}`,
          borderRadius: 10, padding: "14px 18px", marginBottom: 20,
          maxWidth: 380, width: "100%", textAlign: "center",
        }}>
          <p style={{ margin: 0, color: accentColor, fontWeight: "bold", fontSize: 15 }}>
            {plan === "vendor" ? "🛒" : "🎪"} {tierLabel} {planLabel} Plan
          </p>
          {isPaid && (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#666" }}>
              Create your account below, then you'll be taken to secure checkout to complete signup.
            </p>
          )}
        </div>

        <h2 style={{ margin: "0 0 18px", fontSize: 18, color: "#333" }}>Create Your Account</h2>

        <div style={{ width: "100%", maxWidth: 380 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSignUp()}
            style={{ display: "block", width: "100%", padding: "12px 14px", marginBottom: 10, borderRadius: 6, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }}
          />
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSignUp()}
              style={{ display: "block", width: "100%", padding: "12px 14px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: 12, top: 10, background: "none", border: "none", color: accentColor, fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>

          <button onClick={handleSignUp} disabled={authLoading}
            style={{ width: "100%", padding: "13px", backgroundColor: accentColor, color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 12, opacity: authLoading ? 0.7 : 1 }}>
            {authLoading ? "Please wait..." : isPaid ? "Create Account & Continue to Payment" : "Create Account"}
          </button>

          {message && (
            <p style={{ padding: "10px 14px", borderRadius: 6, fontSize: 13, textAlign: "center", marginBottom: 12, backgroundColor: message.startsWith("✅") ? "#f0fdf4" : "#fef2f2", color: message.startsWith("✅") ? "#166534" : "#991b1b", border: `1px solid ${message.startsWith("✅") ? "#86efac" : "#fca5a5"}` }}>
              {message}
            </p>
          )}

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={() => router.push(backLink)}
              style={{ background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
              ← Choose a different plan
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#888" }}>
            Already have an account?{" "}
            <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: accentColor, fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>
              Log in here
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DEFAULT LOGIN / SIGNUP / ROLE SELECTION SCREEN ──
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

      <img
        src="/logo-transparent.png"
        alt="Entre PRO Market"
        style={{ width: 180, marginBottom: 12 }}
      />

      <p style={{ color: "#888", fontSize: 13, marginBottom: 16, textAlign: "center" }}>
        The marketplace for vendors and event organizers
      </p>

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

      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        margin: "16px 0", width: "100%", maxWidth: 400,
      }}>
        <div style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
        <span style={{ color: "#aaa", fontSize: 12 }}>or</span>
        <div style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
      </div>

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
