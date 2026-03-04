import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    setMessage("");
    const { user, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    setMessage("Check your email for confirmation.");
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");
    const { user, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    setMessage("Logged in successfully!");
    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", padding: 30, fontFamily: "sans-serif" }}>
      {/* Logo */}
      <img
        src="/logo.png.jpg" // Replace with your uploaded filename
        alt="Entre PRO Market"
        style={{ width: 180, marginBottom: 20 }}
      />

      {/* Branded title */}
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>
        <span style={{ color: "#701890" }}>ENTRE </span>
        <span style={{ color: "#AABB23" }}>PRO </span>
        <span style={{ color: "black", fontWeight: "bold" }}>MARKET</span>
      </h1>

      <div style={{ marginTop: 20 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, width: 250, marginBottom: 10 }}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, width: 250, marginBottom: 10 }}
        />
        <br />
        <button
          onClick={handleSignUp}
          disabled={loading}
          style={{ padding: "10px 20px", marginRight: 10 }}
        >
          Sign Up
        </button>
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ padding: "10px 20px" }}
        >
          Log In
        </button>
      </div>

      {message && (
        <p style={{ marginTop: 20, color: "#701890", fontWeight: "bold" }}>{message}</p>
      )}
    </div>
  );
}
