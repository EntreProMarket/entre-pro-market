import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.replace("/");
        return;
      }

      setUser(data.user);
    };

    checkUser();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (!user) {
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

        <p
          style={{ cursor: "pointer", marginBottom: 15 }}
          onClick={() => router.push("/vendor-dashboard")}
        >
          Dashboard
        </p>

        {/* ✅ FIXED PROFILE BUTTON */}
        <p
          style={{ cursor: "pointer", marginBottom: 15 }}
          onClick={() => router.push("/vendor-profile")}
        >
          Profile
        </p>

        <p
          style={{ cursor: "pointer", marginBottom: 15 }}
          onClick={() => router.push("/messages")}
        >
          Messages
        </p>

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
    justifyContent: "flex-end", // ✅ pushes everything right
    padding: "15px 20px",
    borderBottom: "1px solid #eee",
  }}
>
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
