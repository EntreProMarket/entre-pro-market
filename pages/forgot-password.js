// pages/forgot-password.js

import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://app.entrepromarket.com/reset-password",
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 20px", fontFamily: "sans-serif",
      backgroundColor: "#fafafa",
    }}>
      <img src="/logo-transparent.png" alt="Entre PRO Market" style={{ width: 150, marginBottom: 24 }} />

      {!sent ? (
        <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
          <h2 style={{ margin: "0 0 8px", color: "#333", fontSize: 22 }}>Forgot Your Password?</h2>
          <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>
            Enter your email and we'll send you a link to reset it.
          </p>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleReset()}
            style={{
              display: "block", width: "100%", padding: "12px 14px",
              marginBottom: 12, borderRadius: 6, border: "1px solid #ddd",
              fontSize: 15, boxSizing: "border-box",
            }}
          />

          {error && (
            <p style={{ color: "#991b1b", backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>
              {error}
            </p>
          )}

          <button
            onClick={handleReset}
            disabled={loading}
            style={{
              width: "100%", padding: "13px", backgroundColor: "#701890",
              color: "white", border: "none", borderRadius: 8,
              fontWeight: "bold", fontSize: 15, cursor: "pointer",
              marginBottom: 16, opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <button
            onClick={() => router.push("/")}
            style={{ background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
          >
            ← Back to Login
          </button>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
          <h2 style={{ margin: "0 0 10px", color: "#333", fontSize: 22 }}>Check Your Email</h2>
          <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            We sent a password reset link to <strong>{email}</strong>. Check your inbox and tap the link to set a new password.
          </p>
          <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#166534" }}>
            ✅ If you don't see it within a few minutes, check your spam folder.
          </div>
          <button
            onClick={() => router.push("/")}
            style={{ width: "100%", padding: "13px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
}
