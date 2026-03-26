// /pages/organizer-dashboard.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import DashboardLayout from "../components/DashboardLayout";

export default function OrganizerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const protectRoute = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        router.replace("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // 🔒 BLOCK NON-ORGANIZERS
      if (profile?.role !== "organizer") {
        router.replace("/marketplace");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    protectRoute();
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return (
    <DashboardLayout>
      <h1>Organizer Dashboard</h1>
      <p>Logged in as: {user.email}</p>
    </DashboardLayout>
  );
}
