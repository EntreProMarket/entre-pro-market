import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function DashboardLayout({ user, children }) {
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      {/* TOP BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "15px 20px",
          borderBottom: "1px solid #eee",
        }}
      >
        <div style={{ fontWeight: "bold" }}>Entre PRO Market</div>

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

      {/* BODY */}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}
