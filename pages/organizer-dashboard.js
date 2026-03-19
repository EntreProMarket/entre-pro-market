import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import DashboardLayout from "../components/DashboardLayout";

export default function OrganizerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.replace("/");
        return;
      }

      setUser(data.user);
    };

    loadUser();
  }, [router]);

  if (!user) return <div>Loading...</div>;

  return (
    <DashboardLayout>
      <h1>Organizer Dashboard</h1>
      <p>Logged in as: {user.email}</p>
    </DashboardLayout>
  );
}
