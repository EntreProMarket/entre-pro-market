import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function OrganizerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        router.push("/");
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !profileData) {
        router.push("/");
        return;
      }

      setProfile(profileData);
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  // ✅ SAFE PROFILE VIEW
  const goToProfile = () => {
    if (!profile?.handle) {
      alert("Profile not set up yet");
      return;
    }

    router.push(`/organizer/${profile.handle}`);
  };

  // ✅ EDIT PAGE
  const goToEdit = () => {
    router.push("/organizer-profile");
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Organizer Dashboard</h1>

      <p>Welcome, {profile.organizer_name || "Organizer"}</p>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={goToProfile}
          style={{
            padding: "10px 14px",
            marginRight: 10,
            backgroundColor: "#701890",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          View Profile
        </button>

        <button
          onClick={goToEdit}
          style={{
            padding: "10px 14px",
            backgroundColor: "#ccc",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}
