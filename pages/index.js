import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("vendor");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    setMessage("");

    // 1️⃣ Sign up the user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setMessage(signUpError.message);
      setLoading(false);
      return;
    }

    if (!user) {
      setMessage("Signup failed, no user returned.");
      setLoading(false);
      return;
    }

    // 2️⃣ Insert profile AFTER signup
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: user.id,
        email: user.email,
        role: selectedRole,
      },
    ]);

    if (profileError) {
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    setMessage("Sign up successful! Role saved.");
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    const { data: { session }, error } = await supabase.auth.signInWithPassword({
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
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 40 }}>
      <h1>ENTRE PRO MARKET</h1>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
      >
        <option value="vendor">Vendor</option>
        <option value="organizer">Event Organizer</option>
      </select>
      <button onClick={handleSignUp} disabled={loading}>Sign Up</button>
      <button onClick={handleLogin} disabled={loading}>Log In</button>
      <p>{message}</p>
    </div>
  );
}
