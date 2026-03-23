import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // SIGN UP (PUBLIC)
  // =========================
  const handleSignUp = async () => {
    setLoading(true);
    setMessage("");

    if (!email || !password) {
      setMessage("Enter email and password");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        setMessage("Email already registered");
      } else {
        setMessage(error.message);
      }
      setLoading(false);
      return;
    }

    const user = data.user;

    await supabase.from("profiles").insert({
      id: user.id,
      role: null,
      account_type: "public",
    });

    setMessage("Account created! You can now log in.");
    setLoading(false);
  };

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Invalid login credentials");
      setLoading(false);
      return;
    }

    const user = data.user;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setLoading(false);

    if (profile?.role === "vendor") {
      router.push("/vendor-dashboard");
    } else if (profile?.role === "organizer") {
      router.push("/organizer-dashboard");
    } else {
      setMessage("Welcome! Browse or upgrade your account.");
    }
  };

  // =========================
  // BECOME VENDOR
  // =========================
  const becomeVendor = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setMessage("Please log in first");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "organizer") {
      setMessage("Already registered as Organizer");
      return;
    }

    if (profile?.role === "vendor") {
      router.push("/vendor-dashboard");
      return;
    }

    const confirmUpgrade = window.confirm("Become a Vendor?");
    if (!confirmUpgrade) return;

    await supabase
      .from("profiles")
      .update({
        role: "vendor",
        account_type: "free",
      })
      .eq("id", user.id);

    router.push("/vendor-dashboard");
  };

  // =========================
  // BECOME ORGANIZER
  // =========================
  const becomeOrganizer = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setMessage("Please log in first");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "vendor") {
      setMessage("Already registered as Vendor");
      return;
    }

    if (profile?.role === "organizer") {
      router.push("/organizer-dashboard");
      return;
    }

    const confirmUpgrade = window.confirm("Become an Organizer?");
    if (!confirmUpgrade) return;

    await supabase
      .from("profiles")
      .update({
        role: "organizer",
        account_type: "pro",
      })
      .eq("id", user.id);

    router.push("/organizer-dashboard");
  };

  // =========================
  // UI
  // =========================
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

      {/* MAIN BUTTONS */}
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
          fontWeight: "bold",
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
          fontWeight: "bold",
        }}
      >
        Become an Organizer
      </button>

      {/* MESSAGE */}
      {message && (
        <p
          style={{
            marginTop: 20,
            color: "#701890",
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
