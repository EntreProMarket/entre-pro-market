// pages/organizer-dashboard.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import DashboardLayout from "../components/DashboardLayout";
import AnnouncementBanner from "../components/AnnouncementBanner";

export default function OrganizerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [profileViews, setProfileViews] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) { router.replace("/"); return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p || p.role !== "organizer") {
        if (p?.role === "vendor") router.replace("/vendor-dashboard");
        else if (p?.is_admin) router.replace("/admin");
        else router.replace("/marketplace");
        return;
      }
      setProfile(p);
      const { count: msgCount } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("recipient_id", user.id);
      setMessageCount(msgCount || 0);
      const { count: viewCount } = await supabase.from("profile_views").select("*", { count: "exact", head: true }).eq("profile_id", user.id);
      setProfileViews(viewCount || 0);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  const tier = profile?.account_type || "basic";
  const tierConfig = {
    basic:   { label: "Basic Organizer",  color: "#555",    bg: "#f5f5f5", icon: "💼" },
    pro:     { label: "Pro Organizer",    color: "#701890", bg: "#f3e8ff", icon: "🚀" },
    elite:   { label: "Elite Organizer",  color: "#AABB23", bg: "#f9ffe8", icon: "👑" },
    premium: { label: "Pro Organizer",    color: "#701890", bg: "#f3e8ff", icon: "🚀" },
  };
  const { label, color, bg, icon } = tierConfig[tier] || tierConfig.basic;
  const vendorLimit = tier === "basic" ? 5 : (tier === "pro" || tier === "premium") ? 20 : null;
  const contactsUsed = profile?.contacts_used_this_month || 0;
  const fields = [profile?.organizer_name, profile?.city, profile?.description, profile?.logo_url, profile?.website || profile?.instagram];
  const percent = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 700, fontFamily: "sans-serif" }}>
        <AnnouncementBanner />
        <h1 style={{ marginBottom: 4 }}>Organizer Dashboard</h1>
        <p style={{ color: "#666", marginBottom: 24 }}>Welcome back, <strong>{profile?.organizer_name || "Organizer"}</strong></p>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: bg, border: `1px solid ${color}`, borderRadius: 20, padding: "6px 16px", marginBottom: 24 }}>
          <span>{icon}</span><span style={{ color, fontWeight: "bold", fontSize: 14 }}>{label}</span>
        </div>

        {tier === "basic" && (
          <div style={{ backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
            <p style={{ margin: 0, fontWeight: "bold", color: "#701890", marginBottom: 8 }}>⬆️ Upgrade to Pro</p>
            <p style={{ margin: 0, fontSize: 13, color: "#555", marginBottom: 12 }}>Contact up to 20 vendors per month and unlock more features.</p>
            <button onClick={() => router.push("/organizer-info")} style={{ padding: "10px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>View Upgrade Options</button>
          </div>
        )}

        {(tier === "pro" || tier === "premium") && (
          <div style={{ backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
            <p style={{ margin: 0, fontWeight: "bold", color: "#888B00", marginBottom: 8 }}>👑 Upgrade to Elite</p>
            <p style={{ margin: 0, fontSize: 13, color: "#555", marginBottom: 12 }}>Get unlimited vendor contacts and unlock all premium features.</p>
            <button onClick={() => router.push("/organizer-info")} style={{ padding: "10px 20px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>Upgrade to Elite</button>
          </div>
        )}

        {vendorLimit && (
          <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
            <p style={{ margin: "0 0 8px", fontWeight: "bold" }}>📊 Vendor Contacts This Month</p>
            <div style={{ backgroundColor: "#eee", borderRadius: 20, height: 10, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ width: `${Math.min((contactsUsed / vendorLimit) * 100, 100)}%`, height: "100%", backgroundColor: contactsUsed >= vendorLimit ? "#cc0000" : "#701890", borderRadius: 20 }} />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: contactsUsed >= vendorLimit ? "#cc0000" : "#666" }}>
              {contactsUsed} / {vendorLimit} contacts used{contactsUsed >= vendorLimit && " — Upgrade to contact more vendors"}
            </p>
          </div>
        )}

        <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
          <p style={{ margin: 0, fontWeight: "bold", marginBottom: 10 }}>📋 Profile Completion — {percent}%</p>
          <div style={{ backgroundColor: "#eee", borderRadius: 20, height: 10, overflow: "hidden" }}>
            <div style={{ width: `${percent}%`, height: "100%", backgroundColor: percent === 100 ? "#AABB23" : "#701890", borderRadius: 20 }} />
          </div>
          {percent < 100
            ? <p style={{ fontSize: 12, color: "#888", marginTop: 8, marginBottom: 0 }}>Complete your profile to attract more vendors.{" "}<span onClick={() => router.push("/organizer-profile")} style={{ color: "#701890", cursor: "pointer", textDecoration: "underline" }}>Edit Profile</span></p>
            : <p style={{ fontSize: 12, color: "#AABB23", marginTop: 8, marginBottom: 0, fontWeight: "bold" }}>✅ Profile is fully complete!</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: "bold", color: "#701890", margin: 0 }}>{profileViews}</p>
            <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>Profile Views</p>
          </div>
          <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: "bold", color: "#701890", margin: 0 }}>{messageCount}</p>
            <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>Messages Received</p>
          </div>
        </div>

        {/* ── Profile Insights — Elite Organizers only ── */}
        {tier === "elite" && (
          <button onClick={() => router.push("/profile-insights")}
            style={{ width: "100%", padding: "14px", backgroundColor: "#111", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", cursor: "pointer", fontSize: 15, marginTop: 4 }}>
            📈 View Profile Insights
          </button>
        )}
      </div>
    </DashboardLayout>
  );
}
