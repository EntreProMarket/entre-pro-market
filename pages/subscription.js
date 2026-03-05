import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionUser = supabase.auth.user();
    if (!sessionUser) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }
    setUser(sessionUser);

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .single();

      if (error) {
        setMessage(error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleUpgrade = async () => {
    setMessage("Upgrading to Premium...");
    // Placeholder: Here you’d call your payment API
    setTimeout(async () => {
      // For now, just update Supabase profile to premium
      const { error } = await supabase
        .from("profiles")
        .update({ subscription: "premium" })
        .eq("id", user.id);

      if (error) {
        setMessage(error.message);
      } else {
        setProfile({ ...profile, subscription: "premium" });
        setMessage("You are now a Premium Vendor! All contact info is visible.");
      }
    }, 1000);
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;

  if (!user) return <p style={{ textAlign: "center" }}>{message || "Please log in."}</p>;

  return (
    <div style={{ textAlign: "center", padding: 30, fontFamily: "sans-serif" }}>
      <img
        src="/logo.png.jpg"
        alt="Entre PRO Market"
        style={{ width: 180, marginBottom: 20 }}
      />

      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        <span style={{ color: "#701890" }}>ENTRE </span>
        <span style={{ color: "#AABB23" }}>PRO </span>
        <span style={{ color: "black", fontWeight: "bold" }}>MARKET</span>
      </h1>

      {profile?.role !== "Vendor" ? (
        <p>Subscription is only for Vendors.</p>
      ) : (
        <div>
          <p>
            Current plan:{" "}
            <strong>
              {profile?.subscription ? profile.subscription : "Free"}
            </strong>
          </p>
          {profile?.subscription === "premium" ? (
            <p style={{ color: "#AABB23", fontWeight: "bold" }}>
              All contact info is visible to everyone.
            </p>
          ) : (
            <button
              onClick={handleUpgrade}
              style={{
                padding: "15px 25px",
                backgroundColor: "#AABB23",
                color: "white",
                fontWeight: "bold",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
                marginTop: 20,
              }}
            >
              Upgrade to Premium ($75/mo)
            </button>
          )}
        </div>
      )}

      {message && (
        <p style={{ marginTop: 25, color: "#701890", fontWeight: "bold" }}>
          {message}
        </p>
      )}
    </div>
  );
}
