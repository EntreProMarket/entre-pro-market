// pages/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", data.user.id).single();
        if (profile?.is_admin) { router.replace("/admin"); return; }
        if (profile?.role === "vendor") { router.replace("/vendor-dashboard"); return; }
        if (profile?.role === "organizer") { router.replace("/organizer-dashboard"); return; }
        router.replace("/home");
      } else {
        setLoading(false);
      }
    };
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") { router.replace("/reset-password"); }
    });
    return () => listener?.subscription?.unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    if (!email || !password) { setMessage("❌ Please enter your email and password."); return; }
    setSubmitting(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage("❌ " + error.message); setSubmitting(false); return; }
    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", userData.user.id).single();
    if (profile?.is_admin) { router.replace("/admin"); return; }
    if (profile?.role === "vendor") { router.replace("/vendor-dashboard"); return; }
    if (profile?.role === "organizer") { router.replace("/organizer-dashboard"); return; }
    router.replace("/home");
  };

  const handleSignup = async () => {
    if (!email || !password) { setMessage("❌ Please enter your email and password."); return; }
    if (password !== confirmPassword) { setMessage("❌ Passwords don't match."); return; }
    if (password.length < 6) { setMessage("❌ Password must be at least 6 characters."); return; }
    setSubmitting(true); setMessage("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setMessage("❌ " + error.message); setSubmitting(false); return; }
    if (data?.user) {
      await supabase.from("profiles").upsert({ id: data.user.id });
      setMessage("✅ Account created! Check your email to verify, then log in.");
      setMode("login"); setPassword(""); setConfirmPassword("");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "white", padding: "0 12px" }}>
        <img
          src="/ENTRE_PRO.png"
          alt="Entre PRO Market"
          style={{ width: "100%", maxWidth: 900, height: "auto", objectFit: "contain" }}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ backgroundColor: "white", borderRadius: 16, padding: "36px 28px", maxWidth: 480, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/logo-circle.png" alt="EntreProMarket" style={{ width: 150, height: 150, objectFit: "contain", borderRadius: "50%", marginBottom: 12 }} />
          <h1 style={{ margin: 0, fontSize: 22, color: "#111" }}>Entre PRO Market</h1>
          <p style={{ margin: "6px 0 0", color: "#888", fontSize: 14, whiteSpace: "nowrap" }}>The marketplace for vendors and event organizers</p>
        </div>

        <div style={{ display: "flex", marginBottom: 24, backgroundColor: "#f0f0f0", borderRadius: 10, padding: 4 }}>
          <button onClick={() => { setMode("login"); setMessage(""); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", backgroundColor: mode === "login" ? "#701890" : "white", color: mode === "login" ? "white" : "#888", fontWeight: mode === "login" ? "bold" : "normal", cursor: "pointer", fontSize: 14, boxShadow: mode === "login" ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>Log In</button>
          <button onClick={() => { setMode("signup"); setMessage(""); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", backgroundColor: mode === "signup" ? "#701890" : "white", color: mode === "signup" ? "white" : "#888", fontWeight: mode === "signup" ? "bold" : "normal", cursor: "pointer", fontSize: 14, boxShadow: mode === "signup" ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>Sign Up</button>
        </div>

        <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
          style={{ display: "block", width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 15, marginBottom: 12, boxSizing: "border-box" }} />

        <div style={{ position: "relative", marginBottom: 12 }}>
          <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && mode === "login" && handleLogin()}
            style={{ display: "block", width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: 12, background: "none", border: "none", color: "#701890", cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>{showPassword ? "HIDE" : "SHOW"}</button>
        </div>

        {mode === "signup" && (
          <input type={showPassword ? "text" : "password"} placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            style={{ display: "block", width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 15, marginBottom: 12, boxSizing: "border-box" }} />
        )}

        {mode === "login" && (
          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <span onClick={() => router.push("/forgot-password")} style={{ color: "#701890", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>Forgot password?</span>
          </div>
        )}

        {message && (
          <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, backgroundColor: message.startsWith("✅") ? "#f0fdf4" : "#fef2f2", border: `1px solid ${message.startsWith("✅") ? "#86efac" : "#fca5a5"}`, color: message.startsWith("✅") ? "#166534" : "#991b1b", fontSize: 13, fontWeight: "bold" }}>{message}</div>
        )}

        <button onClick={mode === "login" ? handleLogin : handleSignup} disabled={submitting}
          style={{ display: "block", width: "100%", padding: "14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 16, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>
          {submitting ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
        </button>

        <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, backgroundColor: "#eee" }} />
          <span style={{ padding: "0 12px", color: "#aaa", fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, backgroundColor: "#eee" }} />
        </div>

        <button onClick={() => router.push("/vendor-info")}
          style={{ display: "block", width: "100%", padding: "13px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
          🛒 Become a Vendor
        </button>

        <button onClick={() => router.push("/organizer-info")}
          style={{ display: "block", width: "100%", padding: "13px", backgroundColor: "#222", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 20 }}>
          🎪 Become an Organizer
        </button>

        <div style={{ textAlign: "center" }}>
          <span onClick={() => router.push("/marketplace")} style={{ color: "#AABB23", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>Browse Marketplace Without an Account</span>
        </div>
      </div>
    </div>
  );
}
