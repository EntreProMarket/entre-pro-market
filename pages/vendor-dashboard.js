import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import DashboardLayout from "../components/DashboardLayout";

export default function VendorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;

    // ❌ Not logged in
    if (!currentUser) {
      router.replace("/");
      return;
    }

    // ✅ Check role
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (error) {
      router.replace("/");
      return;
    }

    // ❌ Not a vendor → block access
    if (profile?.role !== "vendor") {
      router.replace("/");
      return;
    }

    // ✅ Authorized
    setUser(currentUser);
    setLoading(false);
  };

  // ⏳ Loading state while checking access
  if (loading) return <div>Loading...</div>;

  return (
    <DashboardLayout>
      <h1>Vendor Dashboard</h1>
      <p>Logged in as: {user.email}</p>
    </DashboardLayout>
  );
}
