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

    // Get logged in user
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }

    // 🚨 THIS IS THE FIX — role is now saved
    const { error } = await supabase
      .from("profiles")
      .update({
        role: "vendor",
        account_type: tier, // free, pro, premium (whatever you name them)
      })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // Redirect to dashboard
    router.replace("/vendor-dashboard");
  };

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>Become a Vendor</h1>

      <p>Select a plan that fits your business.</p>

      {/* FREE TIER */}
      <button
        onClick={() => becomeVendor("free")}
        disabled={loading}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          backgroundColor: "#333",
          color: "white",
          border: "none",
          borderRadius: 6,
          width: "100%",
        }}
      >
        Free Vendor
      </button>

      {/* PRO TIER */}
      <button
        onClick={() => becomeVendor("pro")}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: "12px 20px",
          backgroundColor: "#AABB23",
          color: "white",
          border: "none",
          borderRadius: 6,
          width: "100%",
        }}
      >
        Pro Vendor
      </button>

      {/* PREMIUM TIER */}
      <button
        onClick={() => becomeVendor("premium")}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: "12px 20px",
          backgroundColor: "#701890",
          color: "white",
          border: "none",
          borderRadius: 6,
          width: "100%",
        }}
      >
        Premium Vendor
      </button>

      {/* BACK BUTTON */}
      <button
        onClick={() => router.push("/")}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          backgroundColor: "#ccc",
          border: "none",
          borderRadius: 6,
          width: "100%",
        }}
      >
        Back
      </button>

      {/* MESSAGE */}
      {message && (
        <p style={{ marginTop: 20, color: "red", fontWeight: "bold" }}>
          {message}
        </p>
      )}
    </div>
  );
}
