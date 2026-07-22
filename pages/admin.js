// pages/admin.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

const TABS = ["Overview", "Plans & Pricing", "Users", "Featured Vendors", "Premium Vendors", "Pro Organizers", "Elite Organizers", "Ads", "Reports", "Exports", "Settings"];

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [stats, setStats] = useState({});
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [ads, setAds] = useState([]);
  const [reports, setReports] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [adminId, setAdminId] = useState(null);
  const [downgradeModal, setDowngradeModal] = useState(null);
  const [downgradeReason, setDowngradeReason] = useState("");
  const [downgrading, setDowngrading] = useState(false);
  const [userInfoModal, setUserInfoModal] = useState(null);
  const [exportLoading, setExportLoading] = useState(null);
  const [limits, setLimits] = useState({
    vendor_free_photos: "5", vendor_premium_photos: "20", vendor_featured_photos: "40",
    vendor_free_videos: "0", vendor_premium_videos: "5", vendor_featured_videos: "10",
    organizer_basic_photos: "10", organizer_pro_photos: "20", organizer_elite_photos: "40",
  });

  useEffect(() => {
    checkAdmin();
    const freezeBack = () => { window.history.pushState(null, document.title, window.location.href); };
    freezeBack();
    window.addEventListener("popstate", freezeBack);
    return () => window.removeEventListener("popstate", freezeBack);
  }, []);

  useEffect(() => {
    if (router.query.tab && TABS.includes(router.query.tab)) setActiveTab(router.query.tab);
  }, [router.query.tab]);

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) { router.replace("/"); return; }
    setAdminId(user.id);
    const { data: profile } = await supabase.from("profiles").select("is_admin, role").eq("id", user.id).single();
    if (profile && profile.is_admin !== true) {
      if (profile.role === "organizer") router.replace("/organizer-dashboard");
      else if (profile.role === "vendor") router.replace("/vendor-dashboard");
      else router.replace("/");
      return;
    }
    await loadAllData();
    setLoading(false);
  };

  const loadAllData = async () => {
    const { count: totalVendors } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "vendor");
    const { count: totalOrganizers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "organizer");
    const { count: premiumVendors } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "vendor").eq("account_type", "premium");
    const { count: featuredVendors } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "vendor").eq("account_type", "featured");
    const { count: proOrganizers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "organizer").eq("account_type", "pro");
    const { count: eliteOrganizers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "organizer").eq("account_type", "elite");
    setStats({ totalVendors: totalVendors || 0, totalOrganizers: totalOrganizers || 0, premiumVendors: premiumVendors || 0, featuredVendors: featuredVendors || 0, proOrganizers: proOrganizers || 0, eliteOrganizers: eliteOrganizers || 0 });
    const { data: plansData } = await supabase.from("plans").select("*").order("role", { ascending: true }).order("sort_order", { ascending: true });
    setPlans(plansData || []);
    const { data: usersData } = await supabase.rpc("get_all_profiles");
    setUsers(usersData || []);
    const { data: adsData } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
    setAds(adsData || []);
    const { data: reportsData } = await supabase.from("reports").select("*, reporter:reporter_id(business_name, organizer_name, handle), message:message_id(content, sender_id, recipient_id)").order("created_at", { ascending: false });
    setReports(reportsData || []);
    const { data: settingsData } = await supabase.from("app_settings").select("*");
    if (settingsData?.length) { const m = {}; settingsData.forEach(s => { m[s.key] = s.value; }); setLimits(prev => ({ ...prev, ...m })); }
  };

  const PAID_TIERS = ["premium", "featured", "pro", "elite"];
  const handleTierChange = (user, newTier) => {
    if (user.account_type === newTier) return;
    const isDowngrade = PAID_TIERS.includes(user.account_type) && !PAID_TIERS.includes(newTier);
    if (isDowngrade) { setDowngradeModal({ userId: user.id, userName: user.business_name || user.organizer_name || user.handle, fromTier: user.account_type, toTier: newTier }); setDowngradeReason(""); }
    else updateUserTier(user.id, newTier);
  };

  const confirmDowngrade = async () => {
    if (!downgradeModal) return;
    setDowngrading(true);
    try {
      const res = await fetch("/api/admin-downgrade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: downgradeModal.userId, newTier: downgradeModal.toTier, reason: downgradeReason, adminId }) });
      const data = await res.json();
      if (data.success) { setUsers(users.map(u => u.id === downgradeModal.userId ? { ...u, account_type: downgradeModal.toTier } : u)); setMessage(`✅ ${downgradeModal.userName} downgraded → ${downgradeModal.toTier}${data.stripeCancelled ? " · Stripe cancelled" : ""}`); }
      else setMessage("❌ Error: " + data.error);
    } catch (err) { setMessage("❌ Error: " + err.message); }
    setDowngrading(false); setDowngradeModal(null); setDowngradeReason("");
  };

  const updateUserTier = async (userId, newAccountType) => {
    try {
      const res = await fetch("/api/admin-update-tier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, newTier: newAccountType }) });
      const data = await res.json();
      if (data.success) { setUsers(users.map(u => u.id === userId ? { ...u, account_type: newAccountType } : u)); setMessage("✅ Tier updated!"); }
      else setMessage("❌ Error: " + data.error);
    } catch (err) { setMessage("❌ Error: " + err.message); }
  };

  const suspendUser = async (userId, suspended) => {
    try {
      const res = await fetch("/api/admin-suspend-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, suspended }) });
      const data = await res.json();
      if (data.success) { setUsers(users.map(u => u.id === userId ? { ...u, suspended } : u)); setMessage(suspended ? "✅ User suspended" : "✅ User reinstated"); }
      else setMessage("❌ Error: " + data.error);
    } catch (err) { setMessage("❌ Error: " + err.message); }
  };

  const viewUserInfo = async (userId) => {
    setUserInfoModal({ loading: true });
    try {
      const res = await fetch("/api/admin-get-user-info", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      const data = await res.json();
      setUserInfoModal(data.success ? data : { error: data.error });
    } catch (err) { setUserInfoModal({ error: err.message }); }
  };

  // ── CSV EXPORT ──
  const downloadCSV = async (type, filename) => {
    setExportLoading(type);
    try {
      const res = await fetch("/api/admin-export-users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) });
      const data = await res.json();
      if (!data.success) { setMessage("❌ Export failed: " + data.error); return; }
      const rows = data.rows;
      if (rows.length === 0) { setMessage("⚠️ No data to export."); return; }
      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(","),
        ...rows.map(row => headers.map(h => `"${(row[h] || "").toString().replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      setMessage(`✅ Downloaded ${rows.length} records as ${filename}`);
    } catch (err) { setMessage("❌ Export error: " + err.message); }
    setExportLoading(null);
  };

  const saveLimits = async () => {
    setSaving(true); setMessage("");
    let hasError = false;
    for (const [key, value] of Object.entries(limits)) {
      const { error } = await supabase.from("app_settings").update({ value: String(value) }).eq("key", key);
      if (error) hasError = true;
    }
    setMessage(hasError ? "❌ Some limits failed." : "✅ Limits saved!"); setSaving(false);
  };

  const savePlan = async (plan) => {
    setSaving(true); setMessage("");
    const { error } = await supabase.from("plans").update({ name: plan.name, price: plan.price, description: plan.description, features: plan.features }).eq("id", plan.id);
    setMessage(error ? "❌ " + error.message : "✅ Plan saved!"); setSaving(false);
  };

  const saveAd = async (ad) => {
    setSaving(true);
    const { error } = await supabase.from("ads").update({ title: ad.title, body: ad.body, link: ad.link, active: ad.active }).eq("id", ad.id);
    setMessage(!error ? "✅ Ad saved!" : "❌ " + error.message); setSaving(false);
  };

  const logout = async () => { await supabase.auth.signOut(); router.replace("/"); };
  const tierColor = (t) => ({ premium: "#701890", featured: "#AABB23", pro: "#701890", elite: "#AABB23", basic: "#888", free: "#aaa" }[t] || "#aaa");

  const OrganizerTierCard = ({ user, targetTier, color, label, icon }) => {
    const isTier = user.account_type === targetTier;
    return (
      <div style={{ backgroundColor: "white", border: `1px solid ${isTier ? color : "#eee"}`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user.logo_url && <div style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb" }}><img src={user.logo_url} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
          <div>
            <strong>{user.organizer_name || user.business_name || "—"}</strong>
            <p style={{ margin: 0, fontSize: 12, color: "#888" }}>@{user.handle} · {user.category} · {user.city}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#aaa" }}>Current: {user.account_type || "basic"}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => viewUserInfo(user.id)} style={{ padding: "6px 12px", backgroundColor: "#f3e8ff", color: "#701890", border: "1px solid #701890", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 11 }}>ℹ️</button>
          <button onClick={() => handleTierChange(user, isTier ? "basic" : targetTier)} style={{ padding: "8px 14px", backgroundColor: isTier ? "#cc0000" : color, color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>
            {isTier ? "⬇️ Downgrade" : `${icon} Make ${label}`}
          </button>
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading Admin Panel...</div>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", fontFamily: "sans-serif" }}>

      {/* USER INFO MODAL */}
      {userInfoModal && (
        <div onClick={() => setUserInfoModal(null)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: 16, padding: 28, maxWidth: 440, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>👤 User Info</h3>
              <button onClick={() => setUserInfoModal(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>✕</button>
            </div>
            {userInfoModal.loading ? <p style={{ color: "#888" }}>Loading...</p> : userInfoModal.error ? <p style={{ color: "#cc0000" }}>❌ {userInfoModal.error}</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {userInfoModal.profile?.logo_url && <div style={{ width: 70, height: 70, borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb", marginBottom: 10 }}><img src={userInfoModal.profile.logo_url} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
                {[
                  ["Name", userInfoModal.profile?.business_name || userInfoModal.profile?.organizer_name || "—"],
                  ["Handle", "@" + (userInfoModal.profile?.handle || "—")],
                  ["Email", userInfoModal.email || "—"],
                  ["Role", userInfoModal.profile?.role || "—"],
                  ["Tier", userInfoModal.profile?.account_type || "—"],
                  ["City", userInfoModal.profile?.city || "—"],
                  ["State", userInfoModal.profile?.state || "—"],
                  ["Category", userInfoModal.profile?.category || "—"],
                  ["Suspended", userInfoModal.profile?.suspended ? "Yes" : "No"],
                  ["Email Verified", userInfoModal.emailConfirmed ? "Yes ✅" : "Not verified ❌"],
                  ["Signed Up", userInfoModal.createdAt ? new Date(userInfoModal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"],
                  ["Last Login", userInfoModal.lastSignIn ? new Date(userInfoModal.lastSignIn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"],
                  ["Stripe Customer", userInfoModal.profile?.stripe_customer_id || "—"],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "grid", gridTemplateColumns: "120px minmax(0, 1fr)", alignItems: "start", padding: "8px 0", borderBottom: "1px solid #f0f0f0", gap: 12 }}>
                    <span style={{ fontSize: 13, color: "#888", fontWeight: "bold" }}>{label}</span>
                    <span style={{ fontSize: 13, color: "#333", textAlign: "left", wordBreak: "break-all" }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOWNGRADE MODAL */}
      {downgradeModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ backgroundColor: "white", borderRadius: 16, padding: 28, maxWidth: 420, width: "100%" }}>
            <h3 style={{ margin: "0 0 8px", color: "#cc0000" }}>⚠️ Confirm Downgrade</h3>
            <p style={{ color: "#555", fontSize: 14, margin: "0 0 16px" }}>Downgrading <strong>{downgradeModal.userName}</strong> from <strong style={{ color: tierColor(downgradeModal.fromTier) }}>{downgradeModal.fromTier}</strong> to <strong style={{ color: tierColor(downgradeModal.toTier) }}>{downgradeModal.toTier}</strong>.</p>
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#991b1b" }}>🔴 This will <strong>cancel their Stripe subscription</strong> and send them a notification email.</div>
            <label style={{ display: "block", fontWeight: "bold", fontSize: 13, marginBottom: 6 }}>Reason <span style={{ color: "#888", fontWeight: "normal" }}>(optional)</span></label>
            <textarea value={downgradeReason} onChange={e => setDowngradeReason(e.target.value)} placeholder="e.g. Chargeback, terms violation..." rows={3} style={{ display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box", resize: "vertical", marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setDowngradeModal(null); setDowngradeReason(""); }} style={{ padding: "10px 20px", backgroundColor: "#ccc", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
              <button onClick={confirmDowngrade} disabled={downgrading} style={{ padding: "10px 20px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", opacity: downgrading ? 0.7 : 1 }}>{downgrading ? "Processing..." : "⬇️ Confirm Downgrade"}</button>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{ backgroundColor: "#111", color: "white", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => window.location.replace('/home')} style={{ background: "none", border: "1px solid #555", color: "white", padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12 }}>← Home</button>
          <span style={{ fontWeight: "bold", fontSize: 16 }}>Entre PRO Market</span>
          <span style={{ backgroundColor: "#701890", color: "white", fontSize: 10, padding: "3px 8px", borderRadius: 10, fontWeight: "bold" }}>ADMIN</span>
        </div>
        <button onClick={logout} style={{ padding: "6px 14px", backgroundColor: "#ff6b6b", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Log Out</button>
      </div>

      {/* TABS */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #eee", display: "flex", overflowX: "auto", padding: "0 24px" }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "14px 16px", border: "none", borderBottom: activeTab === tab ? "3px solid #701890" : "3px solid transparent", backgroundColor: "transparent", color: activeTab === tab ? "#701890" : "#666", fontWeight: activeTab === tab ? "bold" : "normal", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
            {tab}
          </button>
        ))}
      </div>

      {message && (
        <div style={{ margin: "16px 24px 0", padding: "12px 16px", backgroundColor: message.startsWith("✅") ? "#f0fdf4" : message.startsWith("⚠️") ? "#fffbeb" : "#fef2f2", border: `1px solid ${message.startsWith("✅") ? "#86efac" : message.startsWith("⚠️") ? "#fcd34d" : "#fca5a5"}`, borderRadius: 8, color: message.startsWith("✅") ? "#166534" : message.startsWith("⚠️") ? "#92400e" : "#991b1b", fontWeight: "bold" }}>
          {message}
        </div>
      )}

      <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>

        {activeTab === "Overview" && (
          <div>
            <h2 style={{ marginBottom: 20 }}>📊 Overview</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
              {[{ label: "Total Vendors", value: stats.totalVendors, color: "#701890" }, { label: "Total Organizers", value: stats.totalOrganizers, color: "#AABB23" }, { label: "Premium Vendors", value: stats.premiumVendors, color: "#701890" }, { label: "Featured Vendors", value: stats.featuredVendors, color: "#AABB23" }, { label: "Pro Organizers", value: stats.proOrganizers, color: "#701890" }, { label: "Elite Organizers", value: stats.eliteOrganizers, color: "#AABB23" }].map(stat => (
                <div key={stat.label} style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: "20px 16px", textAlign: "center" }}>
                  <p style={{ fontSize: 32, fontWeight: "bold", color: stat.color, margin: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Plans & Pricing" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>💰 Plans & Pricing</h2>
            {plans.length === 0 ? <p style={{ color: "#888" }}>No plans found.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {plans.map((plan, i) => (
                  <div key={plan.id} style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 20 }}>
                    <div style={{ marginBottom: 14 }}>
                      <span style={{ fontSize: 11, backgroundColor: plan.role === "vendor" ? "#f3e8ff" : "#f9ffe8", color: plan.role === "vendor" ? "#701890" : "#888B00", padding: "3px 8px", borderRadius: 10, fontWeight: "bold", marginRight: 8 }}>{plan.role?.toUpperCase()}</span>
                      <strong style={{ fontSize: 16 }}>{plan.name}</strong>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div><label style={labelStyle}>Plan Name</label><input value={plan.name || ""} onChange={e => setPlans(plans.map((p, idx) => idx === i ? { ...p, name: e.target.value } : p))} style={inputStyle} /></div>
                      <div><label style={labelStyle}>Price ($/month)</label><input type="number" value={plan.price || ""} onChange={e => setPlans(plans.map((p, idx) => idx === i ? { ...p, price: e.target.value } : p))} style={inputStyle} /></div>
                    </div>
                    <label style={labelStyle}>Description</label>
                    <input value={plan.description || ""} onChange={e => setPlans(plans.map((p, idx) => idx === i ? { ...p, description: e.target.value } : p))} style={inputStyle} />
                    <label style={labelStyle}>Features (one per line)</label>
                    <textarea value={Array.isArray(plan.features) ? plan.features.join("\n") : plan.features || ""} onChange={e => setPlans(plans.map((p, idx) => idx === i ? { ...p, features: e.target.value.split("\n") } : p))} rows={6} style={{ ...inputStyle, resize: "vertical" }} />
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button onClick={() => savePlan(plan)} disabled={saving} style={{ padding: "10px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>{saving ? "Saving..." : "Save Plan"}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Users" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>👥 Users</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>Tap ℹ️ Info to view full signup details including email.</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: "#111", color: "white" }}>
                    <th style={thStyle}>Name</th><th style={thStyle}>Role</th><th style={thStyle}>Tier</th><th style={thStyle}>Change Tier</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === "vendor" || u.role === "organizer").map((user, i) => (
                    <tr key={user.id} style={{ backgroundColor: i % 2 === 0 ? "#f9f9f9" : "white" }}>
                      <td style={tdStyle}><strong>{user.business_name || user.organizer_name || "—"}</strong><br /><span style={{ fontSize: 11, color: "#888" }}>@{user.handle}</span></td>
                      <td style={tdStyle}><span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: "bold", backgroundColor: user.role === "vendor" ? "#f3e8ff" : "#f9ffe8", color: user.role === "vendor" ? "#701890" : "#888B00" }}>{user.role}</span></td>
                      <td style={tdStyle}><span style={{ fontWeight: "bold", color: tierColor(user.account_type) }}>{user.account_type || "free"}</span></td>
                      <td style={tdStyle}>
                        <select value={user.account_type || "free"} onChange={e => handleTierChange(user, e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, cursor: "pointer" }}>
                          {user.role === "vendor" ? (<><option value="free">Free</option><option value="premium">Premium</option><option value="featured">Featured</option></>) : (<><option value="basic">Basic</option><option value="pro">Pro</option><option value="elite">Elite</option></>)}
                        </select>
                      </td>
                      <td style={tdStyle}><span style={{ color: user.suspended ? "#cc0000" : "#16a34a", fontWeight: "bold", fontSize: 12 }}>{user.suspended ? "Suspended" : "Active"}</span></td>
                      <td style={tdStyle}>
                        <button onClick={() => viewUserInfo(user.id)} style={{ ...smallBtnStyle, backgroundColor: "#f3e8ff", color: "#701890", border: "1px solid #701890" }}>ℹ️ Info</button>
                        <button onClick={() => window.open(`/${user.role}/${user.handle}?from=admin`, "_blank")} style={{ ...smallBtnStyle, marginLeft: 4 }}>View</button>
                        <button onClick={() => suspendUser(user.id, !user.suspended)} style={{ ...smallBtnStyle, backgroundColor: user.suspended ? "#16a34a" : "#cc0000", marginLeft: 4 }}>{user.suspended ? "Reinstate" : "Suspend"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Featured Vendors" && (
          <div>
            <h2 style={{ marginBottom: 16 }}>🔥 Featured Vendors</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {users.filter(u => u.role === "vendor").map(user => (
                <div key={user.id} style={{ backgroundColor: "white", border: `1px solid ${user.account_type === "featured" ? "#AABB23" : "#eee"}`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {user.logo_url && <div style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb" }}><img src={user.logo_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
                    <div><strong>{user.business_name}</strong><p style={{ margin: 0, fontSize: 12, color: "#888" }}>{user.category} · {user.city}</p><span style={{ fontSize: 11, fontWeight: "bold", color: tierColor(user.account_type) }}>{user.account_type}</span></div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => viewUserInfo(user.id)} style={{ ...smallBtnStyle, backgroundColor: "#f3e8ff", color: "#701890", border: "1px solid #701890" }}>ℹ️</button>
                    {user.account_type !== "featured" && <button onClick={() => handleTierChange(user, "featured")} style={{ padding: "8px 14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>🔥 Make Featured</button>}
                    {user.account_type === "featured" && <button onClick={() => handleTierChange(user, "free")} style={{ padding: "8px 14px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>⬇️ Downgrade</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Premium Vendors" && (
          <div>
            <h2 style={{ marginBottom: 16 }}>💜 Premium Vendors</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {users.filter(u => u.role === "vendor").map(user => (
                <div key={user.id} style={{ backgroundColor: "white", border: `1px solid ${user.account_type === "premium" ? "#701890" : "#eee"}`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {user.logo_url && <div style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb" }}><img src={user.logo_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
                    <div><strong>{user.business_name || "—"}</strong><p style={{ margin: 0, fontSize: 12, color: "#888" }}>{user.category} · {user.city}</p><span style={{ fontSize: 11, fontWeight: "bold", color: tierColor(user.account_type) }}>{user.account_type}</span></div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => viewUserInfo(user.id)} style={{ ...smallBtnStyle, backgroundColor: "#f3e8ff", color: "#701890", border: "1px solid #701890" }}>ℹ️</button>
                    {user.account_type !== "premium" && <button onClick={() => handleTierChange(user, "premium")} style={{ padding: "8px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>💜 Make Premium</button>}
                    {user.account_type === "premium" && <button onClick={() => handleTierChange(user, "free")} style={{ padding: "8px 14px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>⬇️ Downgrade</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Pro Organizers" && (
          <div>
            <h2 style={{ marginBottom: 16 }}>🚀 Pro Organizers</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {users.filter(u => u.role === "organizer").map(user => <OrganizerTierCard key={user.id} user={user} targetTier="pro" color="#701890" label="Pro" icon="🚀" />)}
            </div>
          </div>
        )}

        {activeTab === "Elite Organizers" && (
          <div>
            <h2 style={{ marginBottom: 16 }}>👑 Elite Organizers</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {users.filter(u => u.role === "organizer").map(user => <OrganizerTierCard key={user.id} user={user} targetTier="elite" color="#AABB23" label="Elite" icon="👑" />)}
            </div>
          </div>
        )}

        {activeTab === "Ads" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>📢 Ad Management</h2>
            {ads.length === 0 ? <p style={{ color: "#888" }}>No ads found.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {ads.map((ad, i) => (
                  <div key={ad.id} style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                      <strong>Ad Slot: {ad.slot || `#${i + 1}`}</strong>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><input type="checkbox" checked={ad.active || false} onChange={e => setAds(ads.map((a, idx) => idx === i ? { ...a, active: e.target.checked } : a))} />Active</label>
                    </div>
                    <label style={labelStyle}>Headline</label><input value={ad.title || ""} onChange={e => setAds(ads.map((a, idx) => idx === i ? { ...a, title: e.target.value } : a))} style={inputStyle} />
                    <label style={labelStyle}>Body Text</label><input value={ad.body || ""} onChange={e => setAds(ads.map((a, idx) => idx === i ? { ...a, body: e.target.value } : a))} style={inputStyle} />
                    <label style={labelStyle}>Link URL</label><input value={ad.link || ""} onChange={e => setAds(ads.map((a, idx) => idx === i ? { ...a, link: e.target.value } : a))} style={inputStyle} />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                      <button onClick={() => saveAd(ad)} disabled={saving} style={{ padding: "10px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>{saving ? "Saving..." : "Save Ad"}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Reports" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>🚩 Reports</h2>
            {reports.length === 0 ? <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 30, textAlign: "center", color: "#888" }}><p>No reports yet. 🎉</p></div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reports.map(report => (
                  <div key={report.id} style={{ backgroundColor: "white", border: `1px solid ${report.status === "pending" ? "#fca5a5" : "#eee"}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <div><strong style={{ fontSize: 14 }}>{report.reporter?.business_name || report.reporter?.organizer_name || "Unknown"} reported a message</strong><p style={{ margin: 0, fontSize: 12, color: "#888" }}>{new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p></div>
                      <span style={{ padding: "4px 10px", borderRadius: 10, fontSize: 11, fontWeight: "bold", backgroundColor: report.status === "pending" ? "#fef2f2" : report.status === "resolved" ? "#f0fdf4" : "#f9ffe8", color: report.status === "pending" ? "#991b1b" : report.status === "resolved" ? "#166534" : "#888B00" }}>{report.status?.toUpperCase()}</span>
                    </div>
                    <div style={{ backgroundColor: "#f9f9f9", borderRadius: 6, padding: "10px 14px", marginBottom: 12 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#666" }}><strong>Reason:</strong> {report.reason}</p>
                      {report.message?.content && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#444", fontStyle: "italic" }}>"{report.message.content}"</p>}
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={async () => { await supabase.from("reports").update({ status: "reviewed" }).eq("id", report.id); setReports(reports.map(r => r.id === report.id ? { ...r, status: "reviewed" } : r)); setMessage("✅ Marked as reviewed"); }} style={{ padding: "7px 14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Mark Reviewed</button>
                      <button onClick={async () => { await supabase.from("reports").update({ status: "resolved" }).eq("id", report.id); setReports(reports.map(r => r.id === report.id ? { ...r, status: "resolved" } : r)); setMessage("✅ Resolved"); }} style={{ padding: "7px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Resolve</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EXPORTS TAB ── */}
        {activeTab === "Exports" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>📥 Export User Data</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 28 }}>Download spreadsheets (.csv) directly to your phone or computer. Opens in Excel, Google Sheets, or any spreadsheet app.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {[
                { type: "vendors", label: "Vendors", icon: "🛒", color: "#701890", bg: "#f3e8ff", desc: "All vendors — name, handle, email, tier, city, state, category, signup date" },
                { type: "organizers", label: "Organizers", icon: "🎪", color: "#AABB23", bg: "#f9ffe8", desc: "All organizers — name, handle, email, tier, city, state, category, signup date" },
                { type: "public", label: "Public Users", icon: "👤", color: "#555", bg: "#f5f5f5", desc: "Public accounts with no role — email and signup date" },
              ].map(({ type, label, icon, color, bg, desc }) => (
                <div key={type} style={{ backgroundColor: "white", border: `1px solid ${color}30`, borderRadius: 12, padding: 24 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: bg, borderRadius: 20, padding: "5px 14px", marginBottom: 14 }}>
                    <span>{icon}</span>
                    <span style={{ color, fontWeight: "bold", fontSize: 14 }}>{label}</span>
                  </div>
                  <p style={{ color: "#666", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>{desc}</p>
                  <button
                    onClick={() => downloadCSV(type, `entrepromarket-${type}-${new Date().toISOString().split("T")[0]}.csv`)}
                    disabled={exportLoading === type}
                    style={{ width: "100%", padding: "12px", backgroundColor: color, color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 14, opacity: exportLoading === type ? 0.7 : 1 }}
                  >
                    {exportLoading === type ? "Preparing..." : `⬇️ Download ${label} CSV`}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "14px 20px", marginTop: 24 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#166534" }}>
                ✅ Files download directly to your device. On mobile they save to your Downloads folder. On desktop they save to your Downloads folder automatically.
              </p>
            </div>
          </div>
        )}

        {activeTab === "Settings" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>⚙️ Settings</h2>
            <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 24, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0, marginBottom: 4 }}>📸 Photo & Video Upload Limits</h3>
              <h4 style={{ color: "#701890", marginBottom: 12, marginTop: 16 }}>💜 Vendor Limits</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
                {[{ key: "vendor_free_photos", label: "Free Photos" }, { key: "vendor_premium_photos", label: "Premium Photos" }, { key: "vendor_featured_photos", label: "Featured Photos" }, { key: "vendor_free_videos", label: "Free Videos" }, { key: "vendor_premium_videos", label: "Premium Videos" }, { key: "vendor_featured_videos", label: "Featured Videos" }].map(({ key, label }) => (
                  <div key={key}><label style={labelStyle}>{label}</label><input type="number" min="0" value={limits[key]} onChange={e => setLimits(prev => ({ ...prev, [key]: e.target.value }))} style={inputStyle} /></div>
                ))}
              </div>
              <h4 style={{ color: "#AABB23", marginBottom: 12, marginTop: 0 }}>🏆 Organizer Limits</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
                {[{ key: "organizer_basic_photos", label: "Basic Photos" }, { key: "organizer_pro_photos", label: "Pro Photos" }, { key: "organizer_elite_photos", label: "Elite Photos" }].map(({ key, label }) => (
                  <div key={key}><label style={labelStyle}>{label}</label><input type="number" min="0" value={limits[key]} onChange={e => setLimits(prev => ({ ...prev, [key]: e.target.value }))} style={inputStyle} /></div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={saveLimits} disabled={saving} style={{ padding: "12px 28px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 15 }}>{saving ? "Saving..." : "💾 Save All Limits"}</button>
              </div>
            </div>
            <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>App Links</h3>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Opens in a new tab so the Admin panel stays open.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => window.open('/home', '_blank')} style={smallBtnStyle}>Homepage</button>
                <button onClick={() => window.open('/marketplace', '_blank')} style={smallBtnStyle}>Marketplace</button>
                <button onClick={() => window.open('/vendor-info', '_blank')} style={smallBtnStyle}>Vendor Info</button>
                <button onClick={() => window.open('/organizer-info', '_blank')} style={smallBtnStyle}>Organizer Info</button>
              </div>
            </div>
            <div style={{ backgroundColor: "#fff8e1", border: "1px solid #f0c040", borderRadius: 10, padding: 20 }}>
              <h3 style={{ marginTop: 0, color: "#856404" }}>⚠️ Danger Zone</h3>
              <button onClick={async () => { if (confirm("Delete all NULL profiles? Cannot be undone.")) { await supabase.from("profiles").delete().is("business_name", null).eq("role", "vendor"); setMessage("✅ Null profiles deleted"); await loadAllData(); } }} style={{ padding: "10px 18px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>🗑️ Delete Incomplete Profiles</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const inputStyle = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };
const labelStyle = { display: "block", fontWeight: "bold", marginBottom: 5, fontSize: 13, color: "#333" };
const thStyle = { padding: "12px 14px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" };
const tdStyle = { padding: "12px 14px", borderBottom: "1px solid #eee", verticalAlign: "middle" };
const smallBtnStyle = { padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 };
