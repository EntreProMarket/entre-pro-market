import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // SIGN UP
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

    if (user) {
      await supabase.from("profiles").insert([
        {
          id: user.id,
          role: null,
        },
      ]);
    }

    setLoading(false);
    router.replace("/role");
  };

  // LOGIN
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
      setLoading(false);
      setMessage("Login failed.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setLoading(false);

    if (profile?.role === "vendor") {
      router.replace("/vendor-dashboard");
    } else if (profile?.role === "organizer") {
      router.replace("/organizer-dashboard");
    } else {
      setMessage("Welcome! You can browse or choose a role below.");
    }
  };

  // ROLE UPGRADE: VENDOR
  const becomeVendor = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      router.push("/login");
      return;
    }

    await supabase
      .from("profiles")
      .update({
        role: "vendor",
        account_type: "free",
      })
      .eq("id", user.id);

    router.push("/vendor-dashboard");
  };

  // ROLE UPGRADE: ORGANIZER
  const becomeOrganizer = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      router.push("/login");
      return;
    }

    await supabase
      .from("profiles")
      .update({
        role: "organizer",
        account_type: "pro",
      })
      .eq("id", user.id);

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
          height: "auto",
          marginBottom: 20,
          objectFit: "contain",
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

      {/* AUTH BUTTONS */}
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
