import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const sessionUser = supabase.auth.user();
    if (!sessionUser) {
      setLoading(false);
      return;
    }

    setUser(sessionUser);

    const loadData = async () => {
      // Get current user's profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .single();

      if (profileError) {
        setMessage(profileError.message);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // If Organizer → fetch all Vendors
      if (profileData.role === "Event Organizer") {
        const { data: vendorData, error: vendorError } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "Vendor");

        if (vendorError) {
          setMessage(vendorError.message);
        } else {
          setVendors(vendorData);
        }
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;

  if (!user)
    return (
      <div style={{ textAlign: "center", padding: 30 }}>
        <p>Please log in first.</p>
      </div>
    );

  return (
    <div style={{ textAlign: "center", padding: 30, fontFamily: "sans-serif" }}>
      {/* Logo */}
      <img
        src="/logo.png.jpg"
        alt="Entre PRO Market"
        style={{ width: 180, marginBottom: 20 }}
      />

      <button
        onClick={handleLogout}
        style={{
          padding: "8px 16px",
          marginBottom: 20,
          backgroundColor: "#701890",
          color: "white",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
        }}
      >
        Log Out
      </button>

      <h2 style={{ color: "#701890" }}>
        Welcome, {profile?.email}
      </h2>

      <p>
        Role: <strong>{profile?.role}</strong>
      </p>

      {profile?.role === "Vendor" && (
        <div style={{ marginTop: 30 }}>
          <h3>Your Subscription</h3>
          <p>
            Current Plan:{" "}
            <strong>
              {profile?.subscription ? profile.subscription : "Free"}
            </strong>
          </p>

          {profile?.subscription !== "premium" && (
            <p style={{ color: "#701890" }}>
              Your contact info is hidden from organizers.
            </p>
          )}

          {profile?.subscription === "premium" && (
            <p style={{ color: "#AABB23", fontWeight: "bold" }}>
              Your contact info is visible to organizers.
            </p>
          )}
        </div>
      )}

      {profile?.role === "Event Organizer" && (
        <div style={{ marginTop: 40 }}>
          <h3 style={{ color: "#701890" }}>Available Vendors</h3>

          {vendors.length === 0 ? (
            <p>No vendors found.</p>
          ) : (
            vendors.map((vendor) => (
              <div
                key={vendor.id}
                style={{
                  border: "1px solid #ddd",
                  padding: 15,
                  marginBottom: 15,
                  borderRadius: 6,
                }}
              >
                <p><strong>{vendor.email}</strong></p>

                {vendor.subscription === "premium" ? (
                  <p style={{ color: "#AABB23", fontWeight: "bold" }}>
                    Contact: {vendor.email}
                  </p>
                ) : (
                  <p style={{ color: "#701890" }}>
                    Contact info hidden (Free Vendor)
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {message && (
        <p style={{ marginTop: 20, color: "#701890" }}>
          {message}
        </p>
      )}
    </div>
  );
}
