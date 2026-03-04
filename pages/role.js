import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function RoleSelection() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Get the current Supabase user
    const sessionUser = supabase.auth.user();
    if (!sessionUser) {
      setMessage("You must be logged in to select a role.");
      setLoading(false);
      return;
    }
    setUser(sessionUser);
    setLoading(false);
  }, []);

  const handleRoleSelection = async (selectedRole) => {
    setLoading(true);
    setMessage("");

    // Check if user already has a role
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      setMessage(fetchError.message);
      setLoading(false);
      return;
    }

    if (existingProfile) {
      setMessage("You have already selected a role!");
      setLoading(false);
      return;
    }

    // Insert new profile with role
    const { error: insertError } = await supabase.from("profiles").insert([
      {
        id: user.id,
        email: user.email,
        role: selectedRole,
      },
    ]);

    if (insertError) {
      setMessage(insertError.message);
      setLoading(false);
      return;
    }

    setMessage("Role saved! Redirecting to dashboard...");
    setLoading(false);

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push("/dashboard");
    }, 1200);
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;

  if (!user)
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        <img
          src="/logo.png.jpg"
          alt="Entre PRO Market"
          style={{ width: 180, marginBottom: 20 }}
        />
        <p>{message || "Please log in first."}</p>
      </div>
    );

  return (
    <div style={{ textAlign: "center", padding: 30, fontFamily: "sans-serif" }}>
      {/* Logo */}
      <img
        src="/logo.png.jpg"
        alt="Entre PRO Market"
        style={{ width: 180, marginBottom: 30 }}
      />

      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        <span style={{ color: "#701890" }}>ENTRE </span>
        <span style={{ color: "#AABB23" }}>PRO </span>
        <span style={{ color: "black", fontWeight: "bold" }}>MARKET</span>
      </h1>

      <h2 style={{ marginBottom: 20, color: "#701890" }}>
        Please select your role:
      </h2>

      <div>
        <button
          onClick={() => handleRoleSelection("Vendor")}
          disabled={loading}
          style={{
            padding: "15px 25px",
            marginRight: 15,
            backgroundColor: "#AABB23",
            color: "white",
            fontWeight: "bold",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
          }}
        >
          Vendor
        </button>

        <button
          onClick={() => handleRoleSelection("Event Organizer")}
          disabled={loading}
          style={{
            padding: "15px 25px",
            backgroundColor: "#701890",
            color: "white",
            fontWeight: "bold",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
          }}
        >
          Event Organizer
        </button>
      </div>

      {message && (
        <p style={{ marginTop: 25, color: "#701890", fontWeight: "bold" }}>
          {message}
        </p>
      )}
    </div>
  );
}
