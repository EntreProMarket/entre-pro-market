// pages/home.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import AnnouncementBanner from "../components/AnnouncementBanner";

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [featuredVendors, setFeaturedVendors] = useState([]);
  const [eliteEvents, setEliteEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [flyerFullscreen, setFlyerFullscreen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) { router.replace("/"); return; }
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData);
      const { data: vendors } = await supabase.from("profiles").select("*").eq("role", "vendor").eq("account_type", "featured").not("business_name", "is", null);
      if (vendors?.length) setFeaturedVendors([...vendors].sort(() => Math.random() - 0.5).slice(0, 6));
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const { data: eventsData } = await supabase.from("organizer_events").select("*, organizer:organizer_id(organizer_name, handle, logo_url, account_type)").gte("event_date", todayStr).order("event_date", { ascending: true }).limit(20);
      const eliteOnly = (eventsData || []).filter(e => e.organizer?.account_type === "elite");
      setEliteEvents(eliteOnly);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

  const visibleEvents = eliteEvents.slice(0, 6);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #eee", backgroundColor: "white", position: "sticky", top: 0, zIndex: 10 }}>
        {/* ── LOGO enlarged to 140px ── */}
        <img src="/logo-circle.png" alt="EntreProMarket" style={{ width: 110, height: 110, objectFit: "contain", borderRadius: "50%" }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {profile?.role === "vendor" && <button onClick={() => router.push("/vendor-dashboard")} style={{ padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>📊 Dashboard</button>}
          {profile?.role === "organizer" && <button onClick={() => router.push("/organizer-dashboard")} style={{ padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>📊 Dashboard</button>}
          <button onClick={() => router.push("/marketplace")} style={{ padding: "8px 16px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>🛒 Marketplace</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.replace("/"); }} style={{ padding: "8px 16px", backgroundColor: "white", color: "#666", border: "1px solid #ddd", borderRadius: 20, cursor: "pointer", fontSize: 13 }}>Log Out</button>
        </div>
      </div>

      <div style={{ padding: 20 }}>

        <AnnouncementBanner />

        {profile && !profile.role && (
          <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "14px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <p style={{ margin: 0, fontWeight: "bold", color: "#166534", fontSize: 14 }}>👋 Welcome to EntreProMarket!</p>
              <p style={{ margin: 0, fontSize: 12, color: "#555" }}>Join as a Vendor or Organizer to unlock all features.</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => router.push("/vendor-info")} style={{ padding: "8px 14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, fontWeight: "bold", fontSize: 12, cursor: "pointer" }}>🛒 Become a Vendor</button>
              <button onClick={() => router.push("/organizer-info")} style={{ padding: "8px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, fontWeight: "bold", fontSize: 12, cursor: "pointer" }}>🎪 Become an Organizer</button>
            </div>
          </div>
        )}

        <div style={{ background: "linear-gradient(135deg, #701890, #9b2fc4)", borderRadius: 16, padding: "32px 24px", marginBottom: 28, textAlign: "center", color: "white" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>Welcome to Entre PRO Market</h1>
          <p style={{ margin: "0 0 20px", opacity: 0.9, fontSize: 15 }}>Connecting vendors with event organizers</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/marketplace")} style={{ padding: "12px 24px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>🔍 Browse Vendors</button>
            <button onClick={() => router.push("/vendor-info")} style={{ padding: "12px 24px", backgroundColor: "white", color: "#701890", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>🛒 Become a Vendor</button>
            <button onClick={() => router.push("/organizer-info")} style={{ padding: "12px 24px", backgroundColor: "rgba(255,255,255,0.2)", color: "white", border: "2px solid rgba(255,255,255,0.5)", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>🎪 Become an Organizer</button>
          </div>
        </div>

        <div style={{ backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 10, padding: "14px 20px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <p style={{ margin: 0, fontWeight: "bold", color: "#888B00", fontSize: 14 }}>📢 Advertise on EntreProMarket</p>
            <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Reach thousands of vendors and event organizers</p>
          </div>
          <button onClick={() => router.push("/contact")} style={{ padding: "8px 16px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>Learn More</button>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>🔥 Featured Vendors</h2>
            <button onClick={() => router.push("/marketplace")} style={{ background: "none", border: "none", color: "#701890", cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>See all →</button>
          </div>
          {featuredVendors.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {featuredVendors.map(vendor => (
                <div key={vendor.id} onClick={() => router.push(`/vendor/${vendor.handle}`)} style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", cursor: "pointer", backgroundColor: "white" }}>
                  <div style={{ height: 120, overflow: "hidden" }}>
                    {vendor.logo_url ? <img src={vendor.logo_url} alt={vendor.business_name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 13 }}>No Image</div>}
                  </div>
                  <div style={{ padding: 12 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>{vendor.business_name}</h3>
                    <p style={{ margin: 0, color: "#888", fontSize: 12 }}>{vendor.category} · {vendor.city}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 24, textAlign: "center", color: "#aaa" }}>
              <p style={{ fontSize: 14, margin: 0 }}>Featured vendors will appear here. 🔥 Coming soon!</p>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>👑 Upcoming Events</h2>
            {eliteEvents.length > 6 && <button onClick={() => router.push("/events")} style={{ background: "none", border: "none", color: "#701890", cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>See all →</button>}
          </div>
          {visibleEvents.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {visibleEvents.map(event => (
                <div key={event.id} onClick={() => { setSelectedEvent(event); setFlyerFullscreen(false); }}
                  style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", cursor: "pointer", backgroundColor: "white" }}>
                  <div style={{ height: 150, overflow: "hidden" }}>
                    {event.flyer_url ? <img src={event.flyer_url} alt={event.event_name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 13 }}>No Flyer</div>}
                  </div>
                  <div style={{ padding: 12 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>{event.event_name}</h3>
                    {event.category && <p style={{ margin: "0 0 2px", fontSize: 11, color: "#AABB23", fontWeight: "bold" }}>{event.category}</p>}
                    <p style={{ margin: "0 0 2px", fontSize: 12, color: "#701890", fontWeight: "bold" }}>📅 {event.event_date ? new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}</p>
                    {event.venue && <p style={{ margin: 0, color: "#888", fontSize: 12 }}>📍 {event.venue}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 24, textAlign: "center", color: "#aaa" }}>
              <p style={{ fontSize: 14, margin: 0 }}>Elite Organizer events will appear here. 🎪 Coming soon!</p>
            </div>
          )}
        </div>
      </div>

      {selectedEvent && (
        <div onClick={() => { if (flyerFullscreen) setFlyerFullscreen(false); else setSelectedEvent(null); }}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: flyerFullscreen ? "rgba(0,0,0,0.92)" : "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: flyerFullscreen ? 0 : 16 }}>
          {flyerFullscreen ? (
            <img src={selectedEvent.flyer_url} alt="flyer" style={{ maxWidth: "95%", maxHeight: "95vh", borderRadius: 8, objectFit: "contain" }} />
          ) : (
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: 16, maxWidth: 480, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
              {selectedEvent.flyer_url && (
                <div style={{ position: "relative" }}>
                  <img src={selectedEvent.flyer_url} alt={selectedEvent.event_name} onClick={e => { e.stopPropagation(); setFlyerFullscreen(true); }}
                    style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: "16px 16px 0 0", cursor: "zoom-in", display: "block" }} />
                  <div style={{ position: "absolute", bottom: 8, right: 10, backgroundColor: "rgba(0,0,0,0.5)", color: "white", fontSize: 11, padding: "3px 8px", borderRadius: 10 }}>Tap to enlarge</div>
                </div>
              )}
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                  <button onClick={() => setSelectedEvent(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>✕</button>
                </div>
                <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>{selectedEvent.event_name}</h2>
                {selectedEvent.category && <p style={{ margin: "0 0 10px", fontSize: 12, color: "#AABB23", fontWeight: "bold" }}>{selectedEvent.category}</p>}
                <p style={{ margin: "0 0 6px", fontSize: 14, color: "#701890", fontWeight: "bold" }}>📅 {selectedEvent.event_date ? new Date(selectedEvent.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "TBD"}</p>
                {selectedEvent.venue && <p style={{ margin: "0 0 8px", fontSize: 14, color: "#444" }}>📍 {selectedEvent.venue}</p>}
                {selectedEvent.description && <p style={{ margin: "0 0 20px", fontSize: 14, color: "#444", lineHeight: 1.6 }}>{selectedEvent.description}</p>}
                {selectedEvent.info_url && (
                  <a href={selectedEvent.info_url.startsWith("http") ? selectedEvent.info_url : `https://${selectedEvent.info_url}`} target="_blank" rel="noreferrer"
                    style={{ display: "block", padding: "13px 20px", backgroundColor: "#AABB23", color: "white", borderRadius: 30, fontWeight: "bold", fontSize: 15, textDecoration: "none", textAlign: "center", marginBottom: 16 }}>
                    🎟️ Get Tickets / More Info
                  </a>
                )}
                {selectedEvent.organizer?.handle && (
                  <p style={{ margin: 0, fontSize: 13, color: "#888", textAlign: "center" }}>
                    Event by{" "}
                    <span onClick={() => { setSelectedEvent(null); router.push(`/organizer/${selectedEvent.organizer.handle}`); }} style={{ color: "#701890", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}>
                      @{selectedEvent.organizer.handle}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
