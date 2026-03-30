import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import DashboardLayout from "../components/DashboardLayout";

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
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return (
    <DashboardLayout>
      <h1>Organizer Dashboard</h1>
      <p>Welcome, {profile.organizer_name || "Organizer"}</p>
    </DashboardLayout>
  );
}
