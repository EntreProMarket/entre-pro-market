// /pages/vendor-info.js
import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function VendorInfo() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const becomeVendor = async (tier) => {
    setLoading(true);
    setMessage("");

    // ✅ GET USER
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }

    // ✅ GET PROFILE
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setMessage("Error loading profile.");
      setLoading(false);
      return;
    }

    // 🔒 ROLE LOCK (THIS IS WHAT WE ADDED)
    if (profile?.role === "organizer") {
      setMessage("You are already an Organizer.");
      setLoading(false);
      return;
    }

    if (profile?.role === "vendor") {
      router.replace("/vendor-dashboard");
      return;
    }

    // ✅ UPSERT (SAFE CREATE OR UPDATE)
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        role: "vendor",
        account_type: tier,
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // ✅ SUCCESS
    router.replace("/vendor-dashboard");
  };

  return (
    <div style={{ padding: 20, textAlign: "center", maxWidth: 500, margin: "auto" }}>
      <h1>Become a Vendor</h1>

      <button
        onClick={() => becomeVendor("free")}
        style={{
          marginTop: 20,
          padding: "12px",
          width: "100%",
          backgroundColor: "#333",
          color: "white",
          border: "none",
          borderRadius: 6,
        }}
      >
        Free Vendor
      </button>

      <button
        onClick={() => becomeVendor("pro")}
        style={{
          marginTop: 10,
          padding: "12px",
          width: "100%",
          backgroundColor: "#701890",
          color: "white",
          border: "none",
          borderRadius: 6,
        }}
      >
        Pro Vendor
      </button>

      <button
        onClick={() => becomeVendor("premium")}
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
        Premium Vendor
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
