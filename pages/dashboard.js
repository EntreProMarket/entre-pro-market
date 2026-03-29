import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.push("/");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        router.push("/");
        return;
      }

      // 🔥 ROLE-BASED REDIRECT
      if (profile.account_type === "vendor") {
        router.push("/marketplace");
      } else if (profile.account_type === "organizer") {
        router.push("/organizer-dashboard");
      } else {
        router.push("/");
      }
    };

    checkUser();
  }, [router]);

  return <div style={{ padding: 20 }}>Loading dashboard...</div>;
}
