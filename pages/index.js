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
  // SIGN UP (PUBLIC USER)
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
      if (error.message.includes("already")) {
        setMessage("Email already registered");
      } else {
        setMessage(error.message);
      }
      setLoading(false);
      return;
    }

    const user = data.user;

    // create PUBLIC profile
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

    // PUBLIC → VENDOR
    const confirmUpgrade = confirm("Become a Vendor?");

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

    // PUBLIC → ORGANIZER
    const confirmUpgrade = confirm("Become an Organizer?");

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
    <div style={{ textAlign: "center", padding: 20, maxWidth: 500, margin: "auto" }}>
      
      <img src="/logo.png.jpg" style={{ width: 150, marginBottom: 20 }} />

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
        style={{ width: "100%", padding: 10, marginBottom: 15 }}
      />

      <button onClick={handleSignUp} disabled={loading}>
        Sign Up
      </button>

      <button onClick={handleLogin} disabled={loading} style={{ marginLeft: 10 }}>
        Log In
      </button>

      <div style={{ marginTop: 20 }}>
        <button onClick={becomeVendor}>Become a Vendor</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={becomeOrganizer}>Become an Organizer</button>
      </div>

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </div>
  );
}
