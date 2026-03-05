import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    setLoading(true);
    setMessage("");

    const { user, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // Redirect new users to /role
    setMessage("Account created! Redirecting to role selection...");
    setLoading(false);

    setTimeout(() => {
      router.push("/role");
    }, 1000);
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

    // Redirect to dashboard after login
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div style={{ textAlign: "center", padding: 30, fontFamily: "sans-serif" }}>
      {/* Logo */}
      <img
        src="/logo.png.jpg" // Replace with your uploaded filename
        alt="Entre PRO Market"
        style={{ width: 180, marginBottom: 20 }}
      />

      {/* You said no business name under logo for now */}

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
          style={{
            padding: "10px 20px",
            marginRight: 10,
            backgroundColor: "#AABB23",
            color: "white",
            fontWeight: "bold",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
          }}
        >
          Sign Up
        </button>
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#701890",
            color: "white",
            fontWeight: "bold",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
          }}
        >
          Log In
        </button>
      </div>

      {message && (
        <p style={{ marginTop: 20, color: "#701890", fontWeight: "bold" }}>
          {message}
        </p>
      )}
    </div>
  );
}
