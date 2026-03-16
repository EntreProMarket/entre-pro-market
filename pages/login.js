// pages/login.js

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Redirect to Vendor Dashboard after successful login
    router.push("/vendor-dashboard");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      backgroundColor: "#f9fafb",
    }}>
      {/* Logo */}
      <img
        src="/logo.png.jpg"
        alt="Entre PRO Market Logo"
        style={{ width: 160, marginBottom: 40 }}
      />

      <h1 style={{ marginBottom: 20, color: "#111827" }}>Vendor Login</h1>

      {errorMsg && (
        <p style={{ color: "red", marginBottom: 20 }}>{errorMsg}</p>
      )}

      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: 15,
            padding: 12,
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 16,
          }}
          required
        />

        <div style={{ position: "relative", marginBottom: 20 }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: 12,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 16,
            }}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: 12,
              top: 12,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              color: "#2563eb",
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 14,
            width: "100%",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: 16,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 14, color: "#6b7280" }}>
        Don’t have an account?{" "}
        <a href="/vendor-signup" style={{ color: "#2563eb" }}>
          Sign up
        </a>
      </p>
    </div>
  );
}
