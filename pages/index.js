import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 30 }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <img
          src="/logo.png"
          alt="Entre PRO Market"
          style={{ width: 200, marginBottom: 20 }}
        />

        <h1 style={{ color: "#701890", fontWeight: "bold", fontSize: "3rem" }}>
          ENTRE
        </h1>
        <h1 style={{ color: "#AABB23", fontWeight: "bold", fontSize: "3rem" }}>
          PRO
        </h1>
        <h1 style={{ color: "#000000", fontWeight: 900, fontSize: "3rem" }}>
          MARKET
        </h1>
      </div>

      <form
        onSubmit={handleLogin}
        style={{
          maxWidth: 400,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 15,
        }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 10 }}
        />

        <button
          type="submit"
          style={{
            backgroundColor: "#DF9AF1",
            color: "#000",
            padding: 10,
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
          }}
        >
          Login
        </button>

        {message && (
          <p style={{ fontWeight: "bold", color: "red" }}>{message}</p>
        )}
      </form>
    </div>
  );
}
