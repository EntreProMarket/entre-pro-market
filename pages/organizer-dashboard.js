import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function OrganizerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.push("/");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        router.push("/");
        return;
      }

      setProfile(profileData);
    };

    loadProfile();
  }, [router]);

  const goToProfile = () => {
    router.push(`/organizer/${profile.handle}`);
  };

  const goToEdit = () => {
    router.push("/organizer-profile");
  };

  if (!profile) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Organizer Dashboard</h1>

      <p>Welcome, {profile.organizer_name || "Organizer"}</p>

      <div style={{ marginTop: 20 }}>
        <button onClick={goToProfile} style={{ marginRight: 10 }}>
          View Profile
        </button>

        <button onClick={goToEdit}>
          Edit Profile
        </button>
      </div>
    </div>
  );
}
