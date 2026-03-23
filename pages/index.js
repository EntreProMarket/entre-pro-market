import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // SIGN UP (PUBLIC ONLY)
  const signUp = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage("Already registered or invalid credentials");
      setLoading(false);
      return;
    }

    const user = data?.user;

    if (user) {
      await supabase.from("profiles").insert([
        {
          id: user.id,
          role: "public",
        },
      ]);
    }

    setLoading(false);
    setMessage("Account created. You can now log in.");
  };

  // LOGIN (ROUTE BY ROLE)
  const login = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Invalid login");
      setLoading(false);
      return;
    }

    const user = data.user;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setLoading(false);

    if (profile.role === "vendor") {
      router.push("/vendor-dashboard");
    } else if (profile.role === "organizer") {
      router.push("/organizer-dashboard");
    } else {
      router.push("/vendors");
    }
  };

  // UPGRADE TO VENDOR
  const becomeVendor = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile.role === "organizer") {
      setMessage("Already registered as Organizer");
      return;
    }

    await supabase
      .from("profiles")
      .update({ role: "vendor" })
      .eq("id", user.id);

    router.push("/vendor-dashboard");
  };

  // UPGRADE TO ORGANIZER
  const becomeOrganizer = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile.role === "vendor") {
      setMessage("Already registered as Vendor");
      return;
    }

    await supabase
      .from("profiles")
      .update({ role: "organizer" })
      .eq("id", user.id);

    router.push("/organizer-dashboard");
  };

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <h2>Marketplace</h2>

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

      <div>
        <button onClick={signUp} disabled={loading}>
          Sign Up
        </button>

        <button onClick={login} disabled={loading}>
          Login
        </button>
      </div>

      <hr />

      <button onClick={becomeVendor}>Become a Vendor</button>
      <button onClick={becomeOrganizer}>Become an Organizer</button>

      {message && <p>{message}</p>}
    </div>
  );
}
