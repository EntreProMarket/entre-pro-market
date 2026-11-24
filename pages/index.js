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
  // What the person is signing up to become: null (just an account), "vendor" or "organizer"
  const [intent, setIntent] = useState(null);
  // Set when a brand-new account has just been confirmed and needs to choose what to do next
  const [welcomeUser, setWelcomeUser] = useState(null);

  // Sends a logged-in person to the right place. Also makes sure their profile row exists.
  const routeUser = async (user) => {
    let { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).maybeSingle();
    if (!profile) {
      await supabase.from("profiles").upsert({ id: user.id });
      const again = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).maybeSingle();
      profile = again.data;
    }
    if (profile?.is_admin) { router.replace("/admin"); return; }
    if (profile?.role === "vendor") { router.replace("/vendor-dashboard"); return; }
    if (profile?.role === "organizer") { router.replace("/organizer-dashboard"); return; }

    // Brand-new account with no role yet — continue what they chose at signup
    const meta = user.user_metadata || {};
    if (meta.signup_intent === "vendor") {
      await supabase.from("profiles").update({ role: "vendor", account_type: "free" }).eq("id", user.id);
      router.replace("/vendor-profile");
      return;
    }
    if (meta.signup_intent === "organizer") {
      router.replace("/organizer-info");
      return;
    }
    // Signed up with the plain Create Account button: show the welcome choices once
    if (!meta.welcome_seen) {
      setWelcomeUser(user);
      setLoading(false);
      return;
    }
    router.replace("/marketplace");
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        await routeUser(data.user);
      } else {
        setLoading(false);
      }
    };
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") { router.replace("/reset-password"); }
    });
    return () => listener?.subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // The email link can open in a different browser (like Gmail's own), where nobody is logged in yet.
  // Tell the person their email is confirmed and to log in, instead of just showing a blank login page.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.location.search + window.location.hash;
    if (/error_code=|error=access_denied/.test(raw)) {
      setMode("login");
      setMessage("ℹ️ That confirmation link was already used or has expired. Try logging in below.");
    } else if (/[?&#](code|access_token|token_hash)=/.test(raw) || /type=(signup|email)/.test(raw)) {
      setMode("login");
      setMessage("✅ Your email is confirmed! Log in below to continue.");
    }
  }, []);

  // Links like /?mode=signup&plan=vendor open the Sign Up tab already set to Vendor or Organizer
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query || {};
    if (q.mode === "signup") setMode("signup");
    if (q.plan === "vendor" || q.plan === "organizer") { setIntent(q.plan); setMode("signup"); }
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async () => {
    if (!email || !password) { setMessage("❌ Please enter your email and password."); return; }
    setSubmitting(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage("❌ " + error.message); setSubmitting(false); return; }
    const { data: userData } = await supabase.auth.getUser();
    await routeUser(userData.user);
    setSubmitting(false);
  };

  // forcedIntent is "vendor" or "organizer" when a green/black button submits the form
  const handleSignup = async (forcedIntent) => {
    const useIntent = typeof forcedIntent === "string" ? forcedIntent : intent;
    if (!email || !password) { setMessage("❌ Please enter your email and password."); return; }
    if (password !== confirmPassword) { setMessage("❌ Passwords don't match."); return; }
    if (password.length < 6) { setMessage("❌ Password must be at least 6 characters."); return; }
    setSubmitting(true); setMessage("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: useIntent ? { signup_intent: useIntent } : {} },
    });
    if (error) { setMessage("❌ " + error.message); setSubmitting(false); return; }

    // An email that already has an account comes back with no identities
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setMessage("❌ That email already has an account. Tap Log In instead.");
      setSubmitting(false);
      return;
    }

    // If email confirmation is switched off, the person is already signed in — carry on right away
    if (data?.session && data?.user) {
      await routeUser(data.user);
      setSubmitting(false);
      return;
    }

    if (data?.user) {
      const next =
        useIntent === "vendor" ? "to set up your vendor profile"
        : useIntent === "organizer" ? "to choose your organizer plan"
        : "into your new account";
      setMessage("✅ Account created! We sent a confirmation link to " + email + ". Tap it and you'll be taken straight " + next + ".");
      setMode("login"); setPassword(""); setConfirmPassword("");
    }
    setSubmitting(false);
  };

  // Green / black buttons: create the account right away if the boxes are filled in,
  // otherwise open the Sign Up tab and ask for the details.
  const startAs = (which) => {
    setIntent(which);
    setMode("signup");
    if (email && password && confirmPassword) { handleSignup(which); return; }
    setMessage("ℹ️ Enter your email, password and confirm password, then tap " + (which === "vendor" ? "Become a Vendor" : "Become an Organizer") + " again.");
  };

  const finishWelcome = async (where) => {
    try { await supabase.auth.updateUser({ data: { welcome_seen: true } }); } catch (e) {}
    if (where === "vendor" && welcomeUser) {
      await supabase.from("profiles").update({ role: "vendor", account_type: "free" }).eq("id", welcomeUser.id);
      router.replace("/vendor-profile");
    } else if (where === "organizer") {
      router.replace("/organizer-info");
    } else {
      router.replace("/marketplace");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "white", padding: "0" }}>
        <img
          src="/ENTRE_PRO.png"
          alt="Entre PRO Market"
          style={{ width: "100%", maxWidth: 1500, height: "auto", objectFit: "contain" }}
        />
      </div>
    );
  }

  if (welcomeUser) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "sans-serif" }}>
        <div style={{ backgroundColor: "white", borderRadius: 16, padding: "36px 28px", maxWidth: 480, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
          <img src="/logo-circle.png" alt="EntreProMarket" style={{ width: 120, height: 120, objectFit: "contain", borderRadius: "50%", marginBottom: 12 }} />
          <h1 style={{ margin: "0 0 8px", fontSize: 22, color: "#111" }}>🎉 Your account is ready!</h1>
          <p style={{ margin: "0 0 24px", color: "#666", fontSize: 14 }}>
            Welcome! Your free account is ready. What would you like to do first?
          </p>
          <button onClick={() => finishWelcome("vendor")}
            style={{ display: "block", width: "100%", padding: "13px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
            🛒 Become a Vendor
          </button>
          <button onClick={() => finishWelcome("organizer")}
            style={{ display: "block", width: "100%", padding: "13px", backgroundColor: "#222", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 22 }}>
            🎪 Become an Organizer
          </button>
          <p style={{ margin: "0 0 10px", color: "#888", fontSize: 13 }}>Just here to shop?</p>
          <button onClick={() => finishWelcome("browse")}
            style={{ display: "block", width: "100%", padding: "13px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}>
            🛍️ Enter Marketplace
          </button>
        </div>
      </div>
    );
  }

  const isOk = message.startsWith("✅");
  const isInfo = message.startsWith("ℹ️");
  const createLabel = intent === "vendor" ? "Create Account & Become a Vendor" : intent === "organizer" ? "Create Account & Become an Organizer" : "Create Account";

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

        {mode === "signup" && intent && (
          <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, backgroundColor: "#f3e8ff", border: "1px solid #d8b4fe", color: "#701890", fontSize: 13, fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span>{intent === "vendor" ? "🛒 Signing up as a Vendor" : "🎪 Signing up as an Organizer"}</span>
            <span onClick={() => setIntent(null)} style={{ cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>Change</span>
          </div>
        )}

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
          <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, backgroundColor: isOk ? "#f0fdf4" : isInfo ? "#f3e8ff" : "#fef2f2", border: `1px solid ${isOk ? "#86efac" : isInfo ? "#d8b4fe" : "#fca5a5"}`, color: isOk ? "#166534" : isInfo ? "#701890" : "#991b1b", fontSize: 13, fontWeight: "bold" }}>{message}</div>
        )}

        <button onClick={mode === "login" ? handleLogin : () => handleSignup()} disabled={submitting}
          style={{ display: "block", width: "100%", padding: "14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 16, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>
          {submitting ? "Please wait..." : mode === "login" ? "Log In" : createLabel}
        </button>

        <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, backgroundColor: "#eee" }} />
          <span style={{ padding: "0 12px", color: "#aaa", fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, backgroundColor: "#eee" }} />
        </div>

        <button onClick={() => startAs("vendor")} disabled={submitting}
          style={{ display: "block", width: "100%", padding: "13px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 10 }}>
          🛒 Become a Vendor
        </button>

        <button onClick={() => startAs("organizer")} disabled={submitting}
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
