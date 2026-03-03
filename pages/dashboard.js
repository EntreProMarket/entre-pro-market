import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Logo from "../public/logo.png"; // your logo image

export default function Dashboard() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  // Fetch current user session
  useEffect(() => {
    const session = supabase.auth.session() || supabase.auth.getSession();
    setUser(session?.user ?? null);
  }, []);

  // Fetch Vendor profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role, subscription, products") // products as a JSON column or relationship
        .eq("role", "vendor"); // only vendors

      if (error) {
        setMessage(error.message);
      } else {
        setProfiles(data);
      }
      setLoading(false);
    };
    fetchProfiles();
  }, []);

  // Check if current user is a paid Premium Vendor
  const isPremium = user && profiles.find(p => p.id === user.id)?.subscription === "premium";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMessage("Logged out!");
    setUser(null);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 30 }}>
      {/* Logo & Header */}
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <img src={Logo.src} alt="Entre PRO Market" style={{ width: 180, marginBottom: 20 }} />
        <h1 style={{ color: "#701890", fontWeight: "bold", fontSize: "3rem" }}>ENTRE</h1>
        <h1 style={{ color: "#AABB23", fontWeight: "bold", fontSize: "3rem" }}>PRO</h1>
        <h1 style={{ color: "#000000", fontWeight: "900", fontSize: "3rem" }}>MARKET</h1>
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
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      {/* Status message */}
      {message && <p style={{ fontWeight: "bold", marginBottom: 20 }}>{message}</p>}

      {/* Vendor cards grid */}
      {loading ? (
        <p>Loading Vendors...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20
          }}
        >
          {profiles.map((vendor) => {
            // Hide contact info for free vendors if viewer is not premium
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
                  gap: 10
                }}
              >
                <h2 style={{ fontWeight: "bold", fontSize: "1.5rem" }}>{vendor.email}</h2>
                <p>Subscription: {vendor.subscription ?? "free"}</p>
                <p>Products: {vendor.products?.length ?? 0}</p>
                {showContact ? (
                  <div>
                    <p>Email: {vendor.email}</p>
                    {/* Add phone, socials if available */}
                  </div>
                ) : (
                  <p style={{ fontStyle: "italic" }}>Contact info hidden (Free Vendor)</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
        }
