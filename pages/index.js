import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Signup - safe, does NOT touch profiles
  const handleSignUp = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Signup successful! Check your email to confirm your account before logging in."
    );
    setLoading(false);
  };

  // Login
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

    // Role-based redirect (safe, optional)
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "vendor") {
        router.push("/vendor-dashboard");
      } else if (profile?.role === "organizer") {
        router.push("/organizer-dashboard");
      } else {
        router.push("/role");
      }
    } catch {
      router.push("/dashboard"); // fallback
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        padding: 30,
        fontFamily: "sans-serif",
        backgroundColor: "#ffffff", // matches homepage background
      }}
    >
      {/* Logo */}
      <img
        src="/logo.png.jpg"
        alt="Entre PRO Market Logo"
        style={{
          width: 180,
          margin
