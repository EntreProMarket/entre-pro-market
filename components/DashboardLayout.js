import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.replace("/");
        return;
      }

      const user = data.user;
      setUser(user);

      // 🔥 get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      setLoading(false);
    };

    init();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  // 🔒 LOCK: only vendors can access /vendor-profile
  useEffect(() => {
    if (!loading && profile) {
      const path = router.pathname;

      if (path === "/vendor-profile" && profile.role !== "vendor") {
        router.replace("/"); // or marketplace
      }
    }
  }, [loading, profile, router]);

  if (loading) {
    return <div style={{ padding: 30 }}>Loading...</div>;
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR */}
      <div
        style={{
          width: 220,
          backgroundColor: "#111",
          color: "white",
          padding: 20,
        }}
      >
        <h2 style={{ marginBottom: 30 }}>Entre PRO</h2>

        {/* DASHBOARD */}
        <p
          style={{ cursor: "pointer", marginBottom: 15 }}
          onClick={() => router.push("/vendor-dashboard")}
        >
          Dashboard
        </p>

        {/* ✅ PROFILE (FIXED) */}
        <p
          style={{ cursor: "pointer", marginBottom: 15 }}
          onClick={() => {
            if (profile?.handle) {
              router.push(`/vendor/${profile.handle}`);
            }
          }}
        >
          Profile
        </p>

        {/* MESSAGES */}
        <p
          style={{ cursor: "pointer", marginBottom: 15 }}
          onClick={() => router.push("/messages")}
        >
          Messages
        </p>

        {/* SETTINGS */}
        <p
          style={{ cursor: "pointer", marginBottom: 15 }}
          onClick={() => router.push("/settings")}
        >
          Settings
        </p>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* TOP BAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "15px 20px",
            borderBottom: "1px solid #eee",
          }}
        >
          <div style={{ fontWeight: "bold" }}>Dashboard</div>

          <button
            onClick={logout}
            style={{
              padding: "8px 12px",
              backgroundColor: "#701890",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Log Out
          </button>
        </div>

        {/* CONTENT */}
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
        }
