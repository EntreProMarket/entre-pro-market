// /pages/organizer-info.js
import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function OrganizerInfo() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const becomeOrganizer = async (tier) => {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }

    // 🔒 CHECK EXISTING ROLE FIRST
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "vendor") {
      setMessage("You are already registered as a Vendor.");
      setLoading(false);
      return;
    }

    if (profile?.role === "organizer") {
      router.replace("/organizer-dashboard");
      return;
    }

    // ✅ UPSERT (safe)
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        role: "organizer",
        account_type: tier,
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.replace("/organizer-dashboard");
  };

  return (
    <div style={{ padding: 20, textAlign: "center", maxWidth: 500, margin: "auto" }}>
      <h1>Become an Organizer</h1>

      <button
        onClick={() => becomeOrganizer("basic")}
        style={{
          marginTop: 20,
          padding: "12px",
          width: "100%",
          backgroundColor: "#701890",
          color: "white",
          border: "none",
          borderRadius: 6,
        }}
      >
        Basic Organizer
      </button>

      <button
        onClick={() => becomeOrganizer("pro")}
        style={{
          marginTop: 10,
          padding: "12px",
          width: "100%",
          backgroundColor: "#AABB23",
          color: "white",
          border: "none",
          borderRadius: 6,
        }}
      >
        Pro Organizer
      </button>

      <button
        onClick={() => router.push("/")}
        style={{
          marginTop: 20,
          padding: "10px",
          width: "100%",
        }}
      >
        Back
      </button>

      {message && (
        <p style={{ marginTop: 20, color: "red", fontWeight: "bold" }}>
          {message}
        </p>
      )}
    </div>
  );
}
