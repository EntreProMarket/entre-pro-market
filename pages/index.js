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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const user = data?.user;

    if (!user) {
      setMessage("Check your email to confirm signup.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: user.id,
        email: user.email,
        role: null,
      },
    ]);

    if (profileError) {
      setMessage("Profile error: " + profileError.message);
      setLoading(false);
      return;
    }

    setMessage("Account created! Redirecting...");
    setLoading(false);

    setTimeout(() => {
      router.push("/role");
    }, 1000);
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

    const user = data?.user;

    if (!user) {
      setMessage("Login failed.");
      setLoading(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/role");
        return;
      }

      if (profile.role === "vendor") {
        router.push("/vendor-dashboard");
      } else if (profile.role === "organizer") {
        router.push("/organizer-dashboard");
      } else {
        router.push("/role");
      }
    } catch {
      router.push("/");
    }

    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", padding: 30 }}>
      <img
        src="/logo.png.jpg"
        alt="Entre PRO Market"
        style={{ width: 180, marginBottom: 20 }}
      />

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
          border: "none",
          borderRadius: 5,
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
          border: "none",
          borderRadius: 5,
        }}
      >
        Log In
      </button>

      {message && (
        <p style={{ marginTop: 20, color: "#701890" }}>{message}</p>
      )}
    </div>
  );
}
