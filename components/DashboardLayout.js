// components/DashboardLayout.js
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) { router.replace("/"); return; }
      setUser(data.user);
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      setRole(profile?.role || null);
      const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("recipient_id", data.user.id).eq("read", false);
      setUnreadCount(count || 0);
    };
    checkUser();

    const channel = supabase.channel("unread-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const { data: ud } = await supabase.auth.getUser();
        if (payload.new.recipient_id === ud?.user?.id) setUnreadCount(prev => prev + 1);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, async () => {
        const { data: ud } = await supabase.auth.getUser();
        if (!ud?.user) return;
        const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("recipient_id", ud.user.id).eq("read", false);
        setUnreadCount(count || 0);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const logout = async () => { await supabase.auth.signOut(); router.replace("/"); };

  const goToDashboard = () => {
    setMenuOpen(false);
    if (!role) { router.push("/upgrade-required"); return; }
    if (role === "vendor") router.push("/vendor-dashboard");
    else if (role === "organizer") router.push("/organizer-dashboard");
  };

  const goToProfile = async () => {
    setMenuOpen(false);
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("handle, role, account_type").eq("id", user.id).single();
    if (!profile?.role) { router.push("/upgrade-required"); return; }
    if (!profile.handle) { router.push("/complete-profile"); return; }
    if (profile.role === "vendor") router.push(`/vendor/${profile.handle}`);
    else if (profile.role === "organizer") router.push(`/organizer/${profile.handle}`);
  };

  const goToMessages = () => {
    setMenuOpen(false);
    setUnreadCount(0);
    router.push(role ? "/messages" : "/messaging-locked");
  };

  const navigate = (path) => { setMenuOpen(false); router.push(path); };

  if (!user) return <div style={{ padding: 30 }}>Loading...</div>;

  const navItem = (label, onClick, badge) => (
    <div onClick={onClick} style={{ cursor: "pointer", padding: "10px 14px", borderRadius: 6, fontSize: 15, color: "white", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
      <span style={{ fontWeight: badge > 0 ? "bold" : "normal" }}>{label}</span>
      {badge > 0 && (
        <span style={{ backgroundColor: "#AABB23", color: "white", fontSize: 11, fontWeight: "bold", borderRadius: 12, padding: "2px 8px", minWidth: 20, textAlign: "center" }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "sans-serif" }}>
      {/* TOP BAR */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "#111", color: "white", position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", color: "white", fontSize: 24, cursor: "pointer", padding: "0 8px", lineHeight: 1, position: "relative" }}>
          {menuOpen ? "✕" : "☰"}
          {!menuOpen && unreadCount > 0 && (
            <span style={{ position: "absolute", top: -4, right: -2, backgroundColor: "#AABB23", color: "white", fontSize: 10, fontWeight: "bold", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <span style={{ fontWeight: "bold", fontSize: 16 }}>Entre PRO Market</span>
        <button onClick={logout} style={{ padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>Log Out</button>
      </div>

      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200 }} />}

      {/* SIDEBAR */}
      <div style={{
        position: "fixed", top: 0, left: 0, width: 220, height: "100%",
        backgroundColor: "#111", color: "white",
        padding: "20px 20px calc(20px + env(safe-area-inset-bottom, 16px))",
        zIndex: 300,
        transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        display: "flex", flexDirection: "column",
        boxShadow: menuOpen ? "4px 0 20px rgba(0,0,0,0.4)" : "none",
        boxSizing: "border-box", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Entre PRO Market</h2>
          <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", color: "white", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {navItem("🏡 Home", () => { window.location.assign("/home"); })}
        {navItem("🏠 Dashboard", goToDashboard)}
        {navItem("👤 Profile", goToProfile)}
        {navItem("🛒 Marketplace", () => navigate("/marketplace"))}
        {navItem("✉️ Messages", goToMessages, unreadCount)}
        {navItem("💾 Saved Contacts", () => navigate(role ? "/saved-contacts" : "/saved-contacts-locked"))}
        {navItem("⚙️ Settings", () => navigate("/settings"))}

        <div style={{ marginTop: "auto", paddingBottom: 16 }}>
          <div onClick={logout} style={{ cursor: "pointer", color: "#ff6b6b", padding: "12px 14px", borderRadius: 6, fontSize: 15 }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,107,107,0.1)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            🚪 Log Out
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: 20 }}>{children}</div>
    </div>
  );
}
