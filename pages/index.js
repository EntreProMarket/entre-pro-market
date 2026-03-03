import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Logo from "../public/logo.png"; // replace with your actual logo image

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("vendor");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // SIGN UP
  const handleSignUp = async () => {
    setLoading(true);
    setMessage("");
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) { setMessage(signUpError.message); setLoading(false); return; }
    if (!user) { setMessage("Signup failed."); setLoading(false); return; }

    // INSERT into profiles table
    const { error: profileError } = await supabase.from("profiles").insert([
      { id: user.id, email: user.email, role: selectedRole }
    ]);
    if (profileError) { setMessage(profileError.message); setLoading(false); return; }

    setMessage("Sign up successful! Role saved.");
    setLoading(false);
  };

  // LOGIN
  const handleLogin = async () => {
    setLoading(true);
    setMessage("");
    const { data: { session }, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage(error.message); setLoading(false); return; }
    setMessage("Logged in successfully!");
    setLoading(false);
  };

  // LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMessage("Logged out!");
  };

  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
      padding: 40,
      background: "#ffffff",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      {/* Logo */}
      <img src={Logo.src} alt="Entre PRO Market" style={{ width: 200, marginBottom: 20 }} />

      {/* Headings */}
      <h1 style={{ color: "#701890", fontWeight: "bold", fontSize: "3rem" }}>ENTRE</h1>
      <h1 style={{ color: "#AABB23", fontWeight: "bold", fontSize: "3rem" }}>PRO</h1>
      <h1 style={{ color: "#000000", fontWeight: "900", fontSize: "3rem" }}>MARKET</h1>

      {/* Auth Card */}
      <div style={{
        background: "#A3BFBE",
        padding: 30,
        borderRadius: 16,
        marginTop: 30,
        minWidth: 300,
        display: "flex",
        flexDirection: "column",
        gap: 10
      }}>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: "10px", borderRadius: 8, border: "1px solid #ccc" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: "10px", borderRadius: 8, border: "1px solid #ccc" }}
        />

        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          style={{ padding: "10px", borderRadius: 8, border: "1px solid #ccc" }}
        >
          <option value="vendor">Vendor</option>
          <option value="organizer">Event Organizer</option>
        </select>

        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 10 }}>
          <button
            onClick={handleSignUp}
            disabled={loading}
            style={{
              backgroundColor: "#701890",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 8,
              fontWeight: "bold",
              border: "none",
              cursor: "pointer"
            }}
          >
            Sign Up
          </button>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: "#AABB23",
              color: "#000",
              padding: "10px 20px",
              borderRadius: 8,
              fontWeight: "bold",
              border: "none",
              cursor: "pointer"
            }}
          >
            Log In
          </button>

          <button
            onClick={handleLogout}
            disabled={loading}
            style={{
              backgroundColor: "#DF9AF1",
              color: "#000",
              padding: "10px 20px",
              borderRadius: 8,
              fontWeight: "bold",
              border: "none",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Status message */}
      <p style={{ marginTop: 20, fontWeight: "bold" }}>{message}</p>
    </div>
  );
}
