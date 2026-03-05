import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/role");
    setLoading(false);
  };

  const handleLogin = async () => {
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
    } else if (profile.role === "vendor") {
      router.push("/vendor-profile");
    } else if (profile.role === "organizer") {
      router.push("/organizer-dashboard");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "auto",
        paddingTop: 80,
        textAlign: "center",
        fontFamily: "Arial",
      }}
    >
      <img
        src="/logo.png"
        alt="Entre PRO Market"
        style={{ width: 220, marginBottom: 40 }}
      />

      <h2 style={{ marginBottom: 20 }}>Login or Sign Up</h2>

      {message && (
        <p style={{ color: "red", marginBottom: 20 }}>{message}</p>
      )}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 12,
          borderRadius: 6,
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
          padding: 12,
          marginBottom: 20,
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          backgroundColor: "#701890",
          color: "white",
          border: "none",
          borderRadius: 6,
          fontWeight: "bold",
          marginBottom: 10,
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
          padding: 14,
          backgroundColor: "#AABB23",
          color: "black",
          border: "none",
          borderRadius: 6,
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Sign Up
      </button>
    </div>
  );
}
