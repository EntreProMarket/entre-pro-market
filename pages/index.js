// pages/index.js — LOGIN PAGE
// Only shown to logged-out users. Logged-in users go directly to their dashboard.

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" or "signup"

  useEffect(() => {
    // If already logged in, redirect to appropriate page
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, is_admin")
          .eq("id", user.id)
          .single();

        if (profile?.is_admin) router.replace("/admin");
        else if (profile?.role === "vendor") router.replace("/vendor-dashboard");
        else if (profile?.role === "organizer") router.replace("/organizer-dashboard");
        else router.replace("/home");
        return;
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    setAuthLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Fix Supabase's unhelpful error messages
      let msg = error.message;
      if (msg.includes("missing email or phone")) msg = "Please enter your email address.";
      if (msg.includes("Invalid login")) msg = "Incorrect email or password. Please try again.";
      if (msg.includes("Email not confirmed")) msg = "Please confirm your email before logging in.";
      setMessage(msg);
      setAuthLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", data.user.id)
      .single();

    if (profile?.is_admin) router.replace("/admin");
    else if (profile?.role === "vendor") router.replace("/vendor-dashboard");
    else if (profile?.role === "organizer") router.replace("/organizer-dashboard");
    else router.replace("/home");
  };

  const handleSignUp = async () => {
    setAuthLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
      setAuthLoading(false);
      return;
    }

    const user = data?.user;
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        role: null,
        account_type: "public",
      });
    }

    setMessage("✅ Account created! Please check your email to confirm, then log in.");
    setAuthLoading(false);
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

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

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
      <img src="/logo-transparent.png" alt="Entre PRO Market" style={{ width: 180, marginBottom: 12 }} />

<p style={{ color: "#888", fontSize: 13, marginBottom: 16, textAlign: "center" }}>The marketplace for vendors and event organizers</p>

      {/* AUTH TABS */}
      <div style={{ display: "flex", marginBottom: 14, borderRadius: 8, overflow: "hidden", border: "1px solid #ddd" }}>
        <button onClick={() => setMode("login")} style={{
          padding: "10px 28px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 14,
          backgroundColor: mode === "login" ? "#701890" : "white",
          color: mode === "login" ? "white" : "#666",
        }}>Log In</button>
        <button onClick={() => setMode("signup")} style={{
          padding: "10px 28px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 14,
          backgroundColor: mode === "signup" ? "#701890" : "white",
          color: mode === "signup" ? "white" : "#666",
        }}>Sign Up</button>
      </div>

      {/* FORM */}
      <div style={{ width: "100%", maxWidth: 400 }}>
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ display: "block", width: "100%", padding: "12px 14px", marginBottom: 12, borderRadius: 6, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }}
        />

        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", padding: "12px 14px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            style={{ position: "absolute", right: 12, top: 10, background: "none", border: "none", color: "#701890", fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        </div>

        <button
          onClick={mode === "login" ? handleLogin : handleSignUp}
          disabled={authLoading}
          style={{ width: "100%", padding: "13px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 16 }}
        >
          {authLoading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
        </button>

        {message && (
          <p style={{
            padding: "10px 14px", borderRadius: 6, fontSize: 13, textAlign: "center",
            backgroundColor: message.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
            color: message.startsWith("✅") ? "#166534" : "#991b1b",
            border: `1px solid ${message.startsWith("✅") ? "#86efac" : "#fca5a5"}`,
          }}>
            {message}
          </p>
        )}
      </div>

      {/* DIVIDER */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0", width: "100%", maxWidth: 400 }}>
        <div style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
        <span style={{ color: "#aaa", fontSize: 12 }}>or</span>
        <div style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
      </div>

      {/* ROLE BUTTONS */}
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={() => checkRoleAndRedirect("/vendor-info")}
          style={{ padding: "12px 20px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 14, cursor: "pointer" }}>
          🛒 Become a Vendor
        </button>
        <button onClick={() => checkRoleAndRedirect("/organizer-info")}
          style={{ padding: "12px 20px", backgroundColor: "#333", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 14, cursor: "pointer" }}>
          🎪 Become an Organizer
        </button>
        <button onClick={() => router.push("/marketplace")}
          style={{ padding: "12px 20px", backgroundColor: "white", color: "#701890", border: "2px solid #701890", borderRadius: 8, fontWeight: "bold", fontSize: 14, cursor: "pointer" }}>
          🔍 Browse Marketplace
        </button>
      </div>
    </div>
  );
}
