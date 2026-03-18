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

    const { data: userData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setMessage(signUpError.message);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert([
      { id: userData.user.id, email: userData.user.email, role: null },
    ]);

    if (profileError) {
      setMessage("Profile creation error: " + profileError.message);
      setLoading(false);
      return;
    }

    setMessage("Account created! Check your email to confirm before logging in.");
    setLoading(false);
    setTimeout(() => router.push("/role"), 1500);
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

    setMessage("Logged in successfully!");
    setLoading(false);

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        router.push("/dashboard");
        return;
      }

      if (profile.role === "vendor") router.push("/vendor-dashboard");
      else if (profile.role === "organizer") router.push("/organizer-dashboard");
      else router.push("/role");
    } catch {
      router.push("/dashboard");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: 30, fontFamily: "sans-serif" }}>
      <img
        src="/logo.png.jpg"
        alt="Entre PRO Market Logo"
        style={{ width: 180, marginBottom: 20 }}
      />

      <div style={{ marginTop: 20 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, width: "90%", maxWidth: 300, marginBottom: 10 }}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, width: "90%", maxWidth: 300, marginBottom: 10 }}
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
