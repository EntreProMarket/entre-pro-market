import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(""); // 'vendor' or 'organizer'
  const [step, setStep] = useState("signup"); // 'signup' | 'role' | 'loggedin'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Sign up function
  const handleSignup = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setUser(data.user);
      setStep("role"); // move to role selection
      setMessage("Check your email for confirmation before logging in.");
    }
    setLoading(false);
  };

  // Login function
  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setUser(data.user);
      setStep("role"); // if first login, choose role
      setMessage("Logged in. Please select your role.");
    }
    setLoading(false);
  };

  // Save role to profiles table and subscriptions
  const handleRoleSelection = async (selectedRole) => {
    if (!user) return;
    setLoading(true);
    setRole(selectedRole);

    // Check if profile already exists
    const { data: existing, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (existing) {
      setMessage("Profile already exists. Role locked.");
    } else {
      // Insert into profiles
      const { error: profileError } = // Make sure user info is loaded first
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  setMessage("User not logged in yet.");
  setLoading(false);
  return;
}

// Now insert into profiles safely
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

      // Insert default subscription
      const { error: subError } = await supabase.from("subscriptions").insert([
        {
          user_id: user.id,
          role: selectedRole,
          tier: selectedRole === "vendor" ? "free" : "basic",
          status: "active",
        },
      ]);

      if (subError) {
        setMessage(subError.message);
        setLoading(false);
        return;
      }

      setMessage("Role saved and subscription created!");
      setStep("loggedin");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#ffffff",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {!user && step === "signup" && (
          <>
            <h1 style={{ color: "#701890" }}>ENTRE</h1>
            <h1 style={{ color: "#AABB23" }}>PRO</h1>
            <h2 style={{ color: "#000000" }}>MARKET</h2>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <br />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <br />
            <button onClick={handleSignup} disabled={loading}>
              Sign Up
            </button>
            <button onClick={handleLogin} disabled={loading}>
              Log In
            </button>
            <p>{message}</p>
          </>
        )}

        {step === "role" && user && (
          <>
            <h3>Select your role:</h3>
            <button onClick={() => handleRoleSelection("vendor")}>Vendor</button>
            <button onClick={() => handleRoleSelection("organizer")}>
              Event Organizer
            </button>
            <p>{message}</p>
          </>
        )}

        {step === "loggedin" && user && (
          <>
            <h2>Welcome {role}!</h2>
            <p>{message}</p>
          </>
        )}
      </div>
    </div>
  );
        }
