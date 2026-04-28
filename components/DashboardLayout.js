// components/DashboardLayout.js

import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) { router.replace("/"); return; }
      setUser(data.user);

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
    setMenuOpen(false);
    if (!role) { router.push("/upgrade-required"); return; }
    if (role === "vendor") router.push("/vendor-dashboard");
    else if (role === "organizer") router.push("/organizer-dashboard");
  };

  const goToProfile = async () => {
    setMenuOpen(false);
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("handle, role")
      .eq("id", user.id)
      .single();
    if (!profile?.role) { router.push("/upgrade-required"); return; }
    if (profile.role === "vendor") router.push(`/vendor/${profile.handle}`);
    else if (profile.role === "organizer") router.push(`/organizer/${profile.handle}`);
  };

  const navigate = (path) => {
    setMenuOpen(false);
    router.push(path);
  };

  if (!user) return <div style={{ padding: 30 }}>Loading...</div>;

  const navItem = (label, onClick) => (
    <p
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: "10px 14px",
        borderRadius: 6,
        fontSize: 15,
        color: "white",
        margin: 0,
        marginBottom: 4,
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
    >
      {label}
    </p>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "sans-serif" }}>

      {/* TOP BAR */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        backgroundColor: "#111",
        color: "white",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <button onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "none", border: "none", color: "white", fontSize: 24, cursor: "pointer", padding: "0 8px", lineHeight: 1 }}>
          {menuOpen ? "✕" : "☰"}
        </button>
        <span style={{ fontWeight: "bold", fontSize: 16 }}>Entre PRO Market</span>
        <button onClick={logout}
          style={{ padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>
          Log Out
        </button>
      </div>

      {/* OVERLAY */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200 }}
        />
      )}

      {/* SIDEBAR */}
      <div style={{
        position: "fixed", top: 0, left: 0,
        width: 220, height: "100%",
        backgroundColor: "#111", color: "white",
        padding: 20, zIndex: 300,
        transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        display: "flex", flexDirection: "column",
        boxShadow: menuOpen ? "4px 0 20px rgba(0,0,0,0.4)" : "none",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Entre PRO Market</h2>
          <button onClick={() => setMenuOpen(false)}
            style={{ background: "none", border: "none", color: "white", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {navItem("🏡 Home", () => { window.location.assign("/home"); })}
        {navItem("🏠 Dashboard", goToDashboard)}
        {navItem("👤 Profile", goToProfile)}
        {navItem("🛒 Marketplace", () => navigate("/marketplace"))}
        {/* Saved Contacts and Messages: locked for no-role users */}
        {navItem("✉️ Messages", () => navigate(role ? "/messages" : "/messaging-locked"))}
        {navItem("💾 Saved Contacts", () => navigate(role ? "/saved-contacts" : "/saved-contacts-locked"))}
        {navItem("⚙️ Settings", () => navigate("/settings"))}

        <div style={{ marginTop: "auto" }}>
          <p onClick={logout}
            style={{ cursor: "pointer", color: "#ff6b6b", padding: "10px 14px", borderRadius: 6, fontSize: 15, margin: 0 }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,107,107,0.1)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            🚪 Log Out
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: 20 }}>
        {children}
      </div>

    </div>
  );
}
