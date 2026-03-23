import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ SIGN UP (creates PUBLIC user + profile)
  const handleSignUp = async () => {
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

    // Always fetch user after signup
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setMessage("Signup succeeded but user not found");
      setLoading(false);
      return;
    }

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        role: null,
        account_type: "public",
      });

    if (profileError) {
      console.error(profileError);
      setMessage("Profile creation failed");
      setLoading(false);
      return;
    }

    setMessage("Account created! You can now log in.");
    setLoading(false);
  };

  // ✅ LOGIN (routes based on role)
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

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setMessage("Error loading user profile");
      setLoading(false);
      return;
    }

    setLoading(false);

    // Route logic
    if (profile?.role === "vendor") {
      router.replace("/vendor-dashboard");
    } else if (profile?.role === "organizer") {
      router.replace("/organizer-dashboard");
    } else {
      setMessage("Welcome! Browse or upgrade your account.");
    }
  };

  // ✅ BECOME VENDOR
  const becomeVendor = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      router.push("/login");
      return;
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      role: "vendor",
      account_type: "free",
    });

    router.push("/vendor-dashboard");
  };

  // ✅ BECOME ORGANIZER
  const becomeOrganizer = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      router.push("/login");
      return;
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      role: "organizer",
      account_type: "pro",
    });

    router.push("/organizer-dashboard");
  };

  return (
    <div
      style={{
        textAlign: "center",
        padding: 20,
        fontFamily: "sans-serif",
        maxWidth: 500,
        margin: "0 auto",
      }}
    >
      {/* LOGO */}
      <img
        src="/logo.png.jpg"
        alt="Entre PRO Market Logo"
        style={{
          width: 160,
          marginBottom: 20,
        }}
      />

      {/* INPUTS */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          padding: 12,
          width: "100%",
          marginBottom: 10,
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
          padding: 12,
          width: "100%",
          marginBottom: 15,
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />

      {/* BUTTONS */}
      <button
        onClick={handleSignUp}
        disabled={loading}
        style={{
          padding: "12px 20px",
          marginRight: 10,
          backgroundColor: "#AABB23",
          color: "white",
          border: "none",
          borderRadius: 6,
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Sign Up
      </button>

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          padding: "12px 20px",
          backgroundColor: "#701890",
          color: "white",
          border: "none",
          borderRadius: 6,
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Log In
      </button>

      {/* ROLE BUTTONS */}
      <button
        onClick={becomeVendor}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          backgroundColor: "#333",
          color: "white",
          border: "none",
          borderRadius: 6,
          display: "block",
          width: "100%",
        }}
      >
        Become a Vendor
      </button>

      <button
        onClick={becomeOrganizer}
        style={{
          marginTop: 10,
          padding: "10px 20px",
          backgroundColor: "#701890",
          color: "white",
          border: "none",
          borderRadius: 6,
          display: "block",
          width: "100%",
        }}
      >
        Become an Organizer
      </button>

      {/* MESSAGE */}
      {message && (
        <p style={{ marginTop: 20, color: "#701890", fontWeight: "bold" }}>
          {message}
        </p>
      )}
    </div>
  );
}
