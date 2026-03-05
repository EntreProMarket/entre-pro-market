// /pages/index.js
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

    const { user, session, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // Check if profile already exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      // New user: redirect to role selection
      router.push("/role");
    } else {
      // Existing profile: redirect based on role
      if (profile.role === "vendor") {
        router.push("/vendor-profile");
      } else if (profile.role === "organizer") {
        router.push("/organizer-dashboard");
      } else {
        router.push("/role");
      }
    }

    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    const { user, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // Fetch profile and redirect based on role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      router.push("/role"); // no profile? select role
    } else {
      if (profile.role === "vendor") {
        router.push("/vendor-profile");
      } else if (profile.role === "organizer") {
        router.push("/organizer-dashboard");
      } else {
        router.push("/role");
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h1>Entre PRO Market</h1>
      {message && <p>{message}</p>}

      <label>Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

      <label>Password</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      <div style={{ marginTop: 20 }}>
        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <button onClick={handleSignUp} disabled={loading} style={{ marginLeft: 10 }}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </div>
    </div>
  );
}
