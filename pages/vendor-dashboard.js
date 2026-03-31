import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import DashboardLayout from "../components/DashboardLayout";

export default function VendorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

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
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        router.replace("/");
        return;
      }

      setProfile(profileData);
      setLoading(false);
    };

    loadUser();
  }, [router]);

  const goToProfile = () => {
    if (!profile?.handle) return;
    router.push(`/vendor/${profile.handle}`);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <DashboardLayout>
      <h1>Vendor Dashboard</h1>

      <p>Welcome, {profile.business_name || "Vendor"}</p>

      {/* ✅ ONLY BUTTON */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={goToProfile}
          style={{
            padding: "10px 14px",
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
      </div>
    </DashboardLayout>
  );
}
