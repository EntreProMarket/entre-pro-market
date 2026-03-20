import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function DashboardLayout({ children }) {
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

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

        <p style={{ cursor: "pointer", marginBottom: 15 }}>
          Profile
        </p>

        <p style={{ cursor: "pointer", marginBottom: 15 }}>
          Messages
        </p>

        <p style={{ cursor: "pointer", marginBottom: 15 }}>
          Settings
        </p>
      </div>

      {/* MAIN CONTENT */}
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

        {/* PAGE CONTENT */}
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
