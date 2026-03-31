import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import DashboardLayout from "../components/DashboardLayout";

export default function VendorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        router.replace("/");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("business_name")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      setLoading(false);
    };

    loadUser();
  }, [router]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <DashboardLayout>
      <h1>Vendor Dashboard</h1>
      <p>Welcome, {profile?.business_name || "Vendor"}</p>
    </DashboardLayout>
  );
}
