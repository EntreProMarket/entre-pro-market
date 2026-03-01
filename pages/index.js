import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) alert(error.message);
    else alert("Check your email to confirm signup!");
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    else alert("Logged in!");
  };

  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#ffffff"
    }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <h1 style={{ color: "#701890" }}>ENTRE</h1>
        <h1 style={{ color: "#AABB23" }}>PRO</h1>
        <h2 style={{ color: "#000000" }}>MARKET</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 20 }}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 10 }}
        />

        <button
          onClick={signUp}
          style={{ width: "100%", padding: 10, marginTop: 20 }}
        >
          Sign Up
        </button>

        <button
          onClick={signIn}
          style={{ width: "100%", padding: 10, marginTop: 10 }}
        >
          Log In
        </button>
      </div>
    </div>
  );
  }
