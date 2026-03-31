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

  // ✅ THIS IS THE FIX
  const goToProfile = () => {
    if (!profile?.handle) return;
    router.push(`/vendor/${profile.handle}`);
  };

  const goToEdit = () => {
    router.push("/vendor-profile");
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <DashboardLayout>
      <h1>Vendor Dashboard</h1>

      <p>Welcome, {profile.business_name || "Vendor"}</p>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={goToProfile}
          style={{
            marginRight: 10,
            padding: "10px 14px",
            backgroundColor: "#ccc",
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
            backgroundColor: "#701890",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Edit Profile
        </button>
      </div>
    </DashboardLayout>
  );
      }
