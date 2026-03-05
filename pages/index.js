import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      router.push("/role");
      return;
    }

    if (profile.role === "vendor") {
      router.push("/vendor-profile");
      return;
    }

    if (profile.role === "organizer") {
      router.push("/organizer-dashboard");
      return;
    }

    setLoading(false);
  }

  async function handleSignUp() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/role");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f4f4",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          width: "380px",
          borderRadius: "10px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <img
          src="/logo.png"
          alt="Entre PRO Market"
          style={{ width: "220px", marginBottom: "25px" }}
        />

        {message && (
          <p style={{ color: "red", marginBottom: "15px" }}>{message}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: "#701890",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            marginBottom: "10px",
            cursor: "pointer",
          }}
        >
          Login
        </button>

        <button
          onClick={handleSignUp}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: "#AABB23",
            color: "black",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Sign Up
        </button>
      </
