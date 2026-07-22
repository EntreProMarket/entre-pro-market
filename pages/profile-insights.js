// pages/profile-insights.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import DashboardLayout from "../components/DashboardLayout";

export default function ProfileInsights() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState("views");
  const [viewsSubTab, setViewsSubTab] = useState("loggedin");
  const [allViews, setAllViews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) { router.replace("/"); return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p) { router.replace("/"); return; }
      const isEligible = (p.role === "vendor" && p.account_type === "featured") || (p.role === "organizer" && p.account_type === "elite");
      if (!isEligible) { router.replace(p.role === "vendor" ? "/vendor-dashboard" : "/organizer-dashboard"); return; }
      setProfile(p);
      setLoading(false);
      await loadViews(user.id);
    };
    load();
  }, [router]);

  const loadViews = async (userId) => {
    setLoadingData(true);
    const { data } = await supabase
      .from("profile_views")
      .select("id, created_at, viewer_id, viewer:viewer_id(business_name, organizer_name, handle, role, account_type, logo_url)")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);
    setAllViews(data || []);
    setLoadingData(false);
  };

  const loadMessages = async () => {
    if (messages.length > 0) return;
    setLoadingData(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { data } = await supabase
      .from("messages")
      .select("id, content, created_at, read, sender_id, sender:sender_id(business_name, organizer_name, handle, role, account_type, logo_url)")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    setMessages(data || []);
    setLoadingData(false);
  };

  const handleMainTab = async (tab) => {
    setMainTab(tab);
    if (tab === "messages") await loadMessages();
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const getName = (p) => p?.business_name || p?.organizer_name || "Unknown";

  const tierBadge = (tier) => {
    if (tier === "featured") return <span style={{ fontSize: 10, backgroundColor: "#f9ffe8", color: "#AABB23", padding: "1px 6px", borderRadius: 8, fontWeight: "bold" }}>🔥</span>;
    if (tier === "premium")  return <span style={{ fontSize: 10, backgroundColor: "#f3e8ff", color: "#701890", padding: "1px 6px", borderRadius: 8, fontWeight: "bold" }}>💜</span>;
    if (tier === "elite")    return <span style={{ fontSize: 10, backgroundColor: "#f9ffe8", color: "#AABB23", padding: "1px 6px", borderRadius: 8, fontWeight: "bold" }}>👑</span>;
    if (tier === "pro")      return <span style={{ fontSize: 10, backgroundColor: "#f3e8ff", color: "#701890", padding: "1px 6px", borderRadius: 8, fontWeight: "bold" }}>🚀</span>;
    return null;
  };

  if (loading) return <DashboardLayout><div style={{ padding: 20 }}>Loading...</div></DashboardLayout>;

  // A view only counts as "Logged In" if the viewer has an actual business/organizer name to show.
  // Logged-in accounts with no vendor/organizer profile (or no viewer_id at all) are Anonymous.
  const loggedInViews = allViews.filter(v => v.viewer_id !== null && (v.viewer?.business_name || v.viewer?.organizer_name));
  const anonymousViews = allViews.filter(v => v.viewer_id === null || !(v.viewer?.business_name || v.viewer?.organizer_name));
  const tierLabel = profile?.role === "vendor" ? "🔥 Featured Vendor" : "👑 Elite Organizer";
  const dashPath = profile?.role === "vendor" ? "/vendor-dashboard" : "/organizer-dashboard";
  const currentViewList = viewsSubTab === "loggedin" ? loggedInViews : anonymousViews;

  const subTabBtn = (key, label, count) => (
    <button onClick={() => setViewsSubTab(key)}
      style={{ flex: 1, padding: "12px 8px", border: "none", borderBottom: viewsSubTab === key ? "3px solid #701890" : "3px solid transparent", backgroundColor: "transparent", color: viewsSubTab === key ? "#701890" : "#666", fontWeight: viewsSubTab === key ? "bold" : "normal", cursor: "pointer", fontSize: 12, textAlign: "center", lineHeight: 1.4 }}>
      {label}<br />
      <span style={{ fontSize: 22, fontWeight: "bold", color: viewsSubTab === key ? "#701890" : "#aaa" }}>({count})</span>
    </button>
  );

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 700, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <button onClick={() => router.push(dashPath)} style={{ padding: "8px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>← Back</button>
          <h1 style={{ margin: 0, fontSize: 22 }}>📈 Profile Insights</h1>
        </div>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>{tierLabel} · Exclusive feature</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          <div style={{ backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 32, fontWeight: "bold", color: "#701890", margin: 0 }}>{allViews.length}</p>
            <p style={{ fontSize: 13, color: "#701890", margin: "4px 0 0", fontWeight: "bold" }}>Total Profile Views</p>
          </div>
          <div style={{ backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 32, fontWeight: "bold", color: "#AABB23", margin: 0 }}>{messages.length || "—"}</p>
            <p style={{ fontSize: 13, color: "#888B00", margin: "4px 0 0", fontWeight: "bold" }}>Messages Received</p>
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: "2px solid #eee", marginBottom: 20 }}>
          <button onClick={() => handleMainTab("views")} style={{ flex: 1, padding: 12, border: "none", borderBottom: mainTab === "views" ? "3px solid #701890" : "3px solid transparent", backgroundColor: "transparent", color: mainTab === "views" ? "#701890" : "#666", fontWeight: mainTab === "views" ? "bold" : "normal", cursor: "pointer", fontSize: 14 }}>👁️ Profile Views</button>
          <button onClick={() => handleMainTab("messages")} style={{ flex: 1, padding: 12, border: "none", borderBottom: mainTab === "messages" ? "3px solid #701890" : "3px solid transparent", backgroundColor: "transparent", color: mainTab === "messages" ? "#701890" : "#666", fontWeight: mainTab === "messages" ? "bold" : "normal", cursor: "pointer", fontSize: 14 }}>✉️ Messages</button>
        </div>

        {mainTab === "views" && (
          <div>
            {loadingData ? <p style={{ color: "#888", textAlign: "center" }}>Loading...</p> : (
              <>
                <div style={{ display: "flex", backgroundColor: "#f9f9f9", borderRadius: 10, border: "1px solid #eee", marginBottom: 20, overflow: "hidden" }}>
                  {subTabBtn("loggedin", "Logged In Visitors", loggedInViews.length)}
                  <div style={{ width: 1, backgroundColor: "#eee" }} />
                  {subTabBtn("anonymous", "Anonymous Visitors", anonymousViews.length)}
                </div>

                {currentViewList.length === 0 ? (
                  <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 32, textAlign: "center", color: "#aaa" }}>
                    <p style={{ fontSize: 36, margin: 0 }}>{viewsSubTab === "loggedin" ? "👤" : "👁️"}</p>
                    <p style={{ fontSize: 14, marginTop: 12 }}>{viewsSubTab === "loggedin" ? "No logged-in visitors yet." : "No anonymous visitors yet."}</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {currentViewList.map((v, i) => (
                      <div key={v.id || i} style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0 }}>
                          {v.viewer?.logo_url ? <img src={v.viewer.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>}
                        </div>
                        <div style={{ flex: 1 }}>
                          {viewsSubTab === "loggedin" ? (
                            <>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontWeight: "bold", fontSize: 14 }}>{getName(v.viewer)}</span>
                                {v.viewer?.account_type && tierBadge(v.viewer.account_type)}
                                {v.viewer?.role && <span style={{ fontSize: 11, color: "#888", textTransform: "capitalize" }}>{v.viewer.role}</span>}
                              </div>
                              {v.viewer?.handle && <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>@{v.viewer.handle}</p>}
                            </>
                          ) : (
                            <span style={{ fontWeight: "bold", fontSize: 14, color: "#888" }}>Anonymous Visitor</span>
                          )}
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#bbb" }}>{formatDate(v.created_at)}</p>
                        </div>
                        {viewsSubTab === "loggedin" && v.viewer?.handle && (
                          <button onClick={() => router.push(`/${v.viewer.role}/${v.viewer.handle}?from=insights`)}
                            style={{ padding: "6px 12px", backgroundColor: "#f5f5f5", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold", flexShrink: 0 }}>
                            View
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {mainTab === "messages" && (
          <div>
            {loadingData ? <p style={{ color: "#888", textAlign: "center" }}>Loading...</p> :
              messages.length === 0 ? (
                <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 32, textAlign: "center", color: "#aaa" }}>
                  <p style={{ fontSize: 36, margin: 0 }}>✉️</p>
                  <p style={{ fontSize: 14, marginTop: 12 }}>No messages received yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {messages.map((msg, i) => (
                    <div key={msg.id || i} onClick={() => router.push(`/messages?to=${msg.sender_id}`)}
                      style={{ backgroundColor: msg.read ? "white" : "#faf5ff", border: `1px solid ${msg.read ? "#eee" : "#701890"}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0 }}>
                        {msg.sender?.logo_url ? <img src={msg.sender.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👤</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: msg.read ? "bold" : "900", fontSize: 14, color: msg.read ? "#222" : "#701890" }}>{msg.sender ? getName(msg.sender) : "Unknown"}</span>
                          {!msg.read && <span style={{ fontSize: 10, backgroundColor: "#701890", color: "white", padding: "1px 6px", borderRadius: 8, fontWeight: "bold" }}>NEW</span>}
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{msg.content}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#bbb" }}>{formatDate(msg.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
