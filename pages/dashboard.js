import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Dashboard() {
  const [profiles, setProfiles] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Get current session (Supabase v2 compatible)
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();
  }, []);

  // Fetch vendor profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role, subscription")
        .eq("role", "vendor");

      if (error) {
        setMessage(error.message);
      } else {
        setProfiles(data || []);
      }

      setLoading(false);
    };

    fetchProfiles();
  }, []);

  const isPremium =
    user &&
    profiles.find((p) => p.id === user.id)?.subscription === "premium";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMessage("Logged out.");
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 30 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <img
          src="/logo.png"
          alt="Entre PRO Market"
          style={{ width: 180, marginBottom: 20 }}
        />

        <h1 style={{ color: "#701890", fontWeight: "bold", fontSize: "3rem" }}>
          ENTRE
        </h1>
        <h1 style={{ color: "#AABB23", fontWeight: "bold", fontSize: "3rem" }}>
          PRO
        </h1>
        <h1 style={{ color: "#000000", fontWeight: 900, fontSize: "3rem" }}>
          MARKET
        </h1>

        <button
          onClick={handleLogout}
          style={{
            marginTop: 15,
            backgroundColor: "#DF9AF1",
            color: "#000",
            padding: "10px 20px",
            borderRadius: 8,
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* Status */}
      {message && (
        <p style={{ fontWeight: "bold", marginBottom: 20 }}>{message}</p>
      )}

      {/* Vendor Grid */}
      {loading ? (
        <p>Loading Vendors...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {profiles.map((vendor) => {
            const showContact =
              vendor.subscription === "premium" || isPremium;

            return (
              <div
                key={vendor.id}
                style={{
                  backgroundColor: "#A3BFBE",
                  padding: 20,
                  borderRadius: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <h2 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>
                  {vendor.email}
                </h2>

                <p>
                  Subscription: {vendor.subscription || "free"}
                </p>

                {showContact ? (
                  <p>Email: {vendor.email}</p>
                ) : (
                  <p style={{ fontStyle: "italic" }}>
                    Contact info hidden (Free Vendor)
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
