// components/DashboardLayout.js

import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.replace("/");
        return;
      }

      setUser(data.user);

      // Get role so Dashboard link goes to correct dashboard
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      setRole(profile?.role || null);
    };

    checkUser();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const goToDashboard = () => {
    if (role === "vendor") {
      router.push("/vendor-dashboard");
    } else if (role === "organizer") {
      router.push("/organizer-dashboard");
    }
  };

  const goToProfile = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("handle, role")
      .eq("id", user.id)
      .single();

    if (!profile?.handle) return;

    if (profile.role === "vendor") {
      router.push(`/vendor/${profile.handle}`);
    } else if (profile.role === "organizer") {
      router.push(`/organizer/${profile.handle}`);
    }
  };

  if (!user) {
    return <div style={{ padding: 30 }}>Loading...</div>;
  }

  const navItem = (label, onClick) => (
    <p
      onClick={onClick}
      style={{
        cursor: "pointer",
        marginBottom: 15,
        padding: "8px 10px",
        borderRadius: 6,
        transition: "background 0.15s",
        fontSize: 13,
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
    >
      {label}
    </p>
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{
        width: 170,
        backgroundColor: "#111",
        color: "white",
        padding: 20,
        display: "flex",
        flexDirection: "column",
      }}>
        <h2 style={{ marginBottom: 30, fontSize: 16 }}>Entre PRO</h2>

        {/* HOME — back to homepage */}
        {navItem("🏡 Home", () => router.push("/"))}

        {/* ✅ DASHBOARD — now routes correctly by role */}
        {navItem("🏠 Dashboard", goToDashboard)}

        {/* ✅ PROFILE — goes to public profile */}
        {navItem("👤 Profile", goToProfile)}

        {/* ✅ MARKETPLACE — public browse page */}
        {navItem("🛒 Marketplace", () => router.push("/marketplace"))}

        {/* MESSAGES */}
        {navItem("✉️ Messages", () => router.push("/messages"))}


        {/* SETTINGS */}
        {navItem("⚙️ Settings", () => router.push("/settings"))}

        {/* LOGOUT at bottom */}
        <div style={{ marginTop: "auto" }}>
          <p
            onClick={logout}
            style={{
              cursor: "pointer",
              color: "#ff6b6b",
              padding: "8px 10px",
              borderRadius: 6,
              fontSize: 15,
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,107,107,0.1)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            🚪 Log Out
          </p>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>

        {/* TOP BAR */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "15px 20px",
          borderBottom: "1px solid #eee",
        }}>
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
