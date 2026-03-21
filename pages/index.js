import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // SIGN UP
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

    setMessage("Account created! Check your email to confirm.");
    setLoading(false);
  };

  // LOGIN (FIXED + ROLE-BASED)
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

    // GET ROLE
    let { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

// If profile doesn't exist → create one
if (!profile) {
  await supabase.from("profiles").insert([
    {
      id: user.id,
      role: null,
    },
  ]);

  setLoading(false);
  router.replace("/role");
  return;
}

    setLoading(false);

    // REDIRECT BASED ON ROLE
    if (profile?.role === "vendor") {
      router.replace("/vendor-dashboard");
    } else if (profile?.role === "organizer") {
      router.replace("/organizer-dashboard");
    } else {
      router.replace("/role");
    }
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
      <div>
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
      {/* ROLE UPGRADE BUTTONS */}

<button
  onClick={async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

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
  }}
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
  onClick={async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

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
  }}
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
</button></div>

      {/* MESSAGE */}
      {message && (
        <p style={{ marginTop: 20, color: "#701890", fontWeight: "bold" }}>
          {message}
        </p>
      )}
    </div>
  );
}
