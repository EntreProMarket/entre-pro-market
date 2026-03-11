import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Redirect to vendor page or home
    router.push(`/vendor/${data.user?.user_metadata?.handle || "test-vendor"}`);
    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>

      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

      <div style={{ marginBottom: 20 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10 }}
        />
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          padding: 10,
          width: "100%",
          backgroundColor: "#0066ff",
          color: "#fff",
          border: "none",
          borderRadius: 5,
        }}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
        }
