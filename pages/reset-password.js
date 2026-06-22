// pages/reset-password.js
// Users land here after clicking the reset link in their email.
// Supabase automatically handles the token in the URL.

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses the token from the URL hash automatically.
    // We just need to wait for the session to be established.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (!password || !confirm) { setMessage("Please fill in both fields."); return; }
    if (password.length < 6) { setMessage("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setMessage("Passwords don't match. Please try again."); return; }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.replace("/"), 3000);
    }
  };

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "sans-serif", backgroundColor: "#fafafa", textAlign: "center" }}>
      <img src="/logo-transparent.png" alt="Entre PRO Market" style={{ width: 150, marginBottom: 24 }} />
      <p style={{ color: "#888", fontSize: 15 }}>Verifying your reset link...</p>
    </div>
  );

  if (success) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "sans-serif", backgroundColor: "#fafafa", textAlign: "center" }}>
      <img src="/logo-transparent.png" alt="Entre PRO Market" style={{ width: 150, marginBottom: 24 }} />
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h2 style={{ color: "#333", margin: "0 0 10px" }}>Password Updated!</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Your password has been reset. Redirecting you to login...</p>
      <button onClick={() => router.replace("/")} style={{ padding: "13px 28px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}>
        Go to Login
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", fontFamily: "sans-serif", backgroundColor: "#fafafa" }}>
      <img src="/logo-transparent.png" alt="Entre PRO Market" style={{ width: 150, marginBottom: 24 }} />

      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <h2 style={{ margin: "0 0 8px", color: "#333", fontSize: 22 }}>Set New Password</h2>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Choose a strong password for your account.</p>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", padding: "12px 14px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            style={{ position: "absolute", right: 12, top: 10, background: "none", border: "none", color: "#701890", fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        </div>

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm new password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleReset()}
          style={{ display: "block", width: "100%", padding: "12px 14px", marginBottom: 16, borderRadius: 6, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }}
        />

        {message && (
          <p style={{ padding: "10px 14px", borderRadius: 6, fontSize: 13, textAlign: "center", marginBottom: 12, backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5" }}>
            {message}
          </p>
        )}

        <button
          onClick={handleReset}
          disabled={loading}
          style={{ width: "100%", padding: "13px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Saving..." : "Save New Password"}
        </button>
      </div>
    </div>
  );
}
