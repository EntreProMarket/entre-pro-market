// pages/home.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import AnnouncementBanner from "../components/AnnouncementBanner";
import FooterBar from "../components/FooterBar";
import PageFooter from "../components/PageFooter";

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function parsePos(url) {
  if (!url) return { src: url, position: { x: 50, y: 50 } };
  const [base, frag] = url.split("#pos=");
  if (!frag) return { src: base, position: { x: 50, y: 50 } };
  const [x, y] = frag.split(",").map(Number);
  return { src: base, position: { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y } };
}

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [featuredVendors, setFeaturedVendors] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
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

      // ── Elite Organizer events ──
      const { data: eliteData } = await supabase.from("organizer_events").select("*, organizer:organizer_id(organizer_name, handle, logo_url, account_type)").gte("event_date", todayStr).order("event_date", { ascending: true }).limit(20);
      const eliteOnly = (eliteData || []).filter(e => e.organizer?.account_type === "elite").map(e => ({ ...e, _source: "elite" }));

      // ── Admin-created EPM events ──
      const { data: epmData } = await supabase.from("epm_events").select("*").gte("event_date", todayStr).order("event_date", { ascending: true }).limit(20);
      const epmOnly = (epmData || []).map(e => ({ ...e, _source: "epm" }));

      // ── Merge & sort together by date so they mix, not two separate lists ──
      const combined = [...eliteOnly, ...epmOnly].sort((a, b) => {
        if (!a.event_date) return 1;
        if (!b.event_date) return -1;
        return new Date(a.event_date) - new Date(b.event_date);
      });
      setUpcomingEvents(combined);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

  const visibleEvents = upcomingEvents.slice(0, 6);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif" }}>
      <style>{`html, body { overflow-x: hidden; }`}</style>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #eee", backgroundColor: "white", position: "sticky", top: 0, zIndex: 10 }}>
        <img src="/logo-circle.png" alt="EntreProMarket" style={{ width: 110, height: 110, objectFit: "contain", borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ display: "flex", flex: 1, marginLeft: 24, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => router.push("/marketplace")} style={{ padding: "8px 16px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>🛒 Marketplace</button>
            {profile?.role === "vendor" && <button onClick={() => router.push("/vendor-dashboard")} style={{ padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>📊 Dashboard</button>}
            {profile?.role === "organizer" && <button onClick={() => router.push("/organizer-dashboard")} style={{ padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>📊 Dashboard</button>}
            {profile?.is_admin && <button onClick={() => router.push("/admin")} style={{ padding: "8px 16px", backgroundColor: "#111", color: "white", border: "1px solid #701890", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>🛠️ Admin Panel</button>}
          </div>
          <div style={{ alignSelf: "flex-start" }}>
            <button onClick={async () => { await supabase.auth.signOut(); router.replace("/"); }} style={{ padding: "8px 16px", backgroundColor: "white", color: "#666", border: "1px solid #ddd", borderRadius: 20, cursor: "pointer", fontSize: 13 }}>Log Out</button>
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <AnnouncementBanner />

        {profile && !profile.role && !profile.is_admin && (
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

        {/* a. FEATURED VENDORS */}
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

        {/* b. UPCOMING EVENTS — Elite Organizer + Admin EPM Events, mixed together by date */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>👑 Upcoming Events</h2>
            {upcomingEvents.length > 6 && <button onClick={() => router.push("/events")} style={{ background: "none", border: "none", color: "#701890", cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>See all →</button>}
          </div>
          {visibleEvents.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {visibleEvents.map(event => (
                <div key={`${event._source}-${event.id}`} onClick={() => { setSelectedEvent(event); setFlyerFullscreen(false); }} style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", cursor: "pointer", backgroundColor: "white", position: "relative" }}>
                  {event._source === "epm" && <div style={{ position: "absolute", top: 8, left: 8, backgroundColor: "#111", color: "white", fontSize: 10, fontWeight: "bold", padding: "3px 8px", borderRadius: 10, zIndex: 1 }}>🏢 EPM</div>}
                  <div style={{ height: 150, overflow: "hidden" }}>
                    {event.flyer_url ? (() => { const p = parsePos(event.flyer_url); return <img src={p.src} alt={event.event_name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${p.position.x}% ${p.position.y}%`, display: "block" }} />; })() : <div style={{ width: "100%", height: "100%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 13 }}>No Flyer</div>}
                  </div>
                  <div style={{ padding: 12 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>{event.event_name}</h3>
                    {event.category && <p style={{ margin: "0 0 2px", fontSize: 11, color: "#AABB23", fontWeight: "bold" }}>{event.category}</p>}
                    <p style={{ margin: "0 0 2px", fontSize: 12, color: "#701890", fontWeight: "bold" }}>📅 {event.event_date ? new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}</p>
                    {event.venue && <p style={{ margin: 0, color: "#888", fontSize: 12, whiteSpace: "pre-line" }}>📍 {event.venue}{event.venue_address ? `\n${event.venue_address}` : ""}</p>}
                    {event.price && <p style={{ margin: "2px 0 0", color: "#AABB23", fontSize: 12, fontWeight: "bold", whiteSpace: "pre-line" }}>💵 {event.price}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 24, textAlign: "center", color: "#aaa" }}>
              <p style={{ fontSize: 14, margin: 0 }}>Elite Organizer and Entre PRO Market events will appear here. 🎪 Coming soon!</p>
            </div>
          )}
        </div>

        {/* c. COMMUNITY & NEWS */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>📰 Community & News</h2>
          <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 24, textAlign: "center", color: "#aaa" }}>
            <p style={{ fontSize: 14, margin: 0 }}>Community news and event highlights coming soon! 🎉</p>
          </div>
        </div>
      </div>

      <PageFooter />
      <FooterBar />

      {selectedEvent && (
        <div onClick={() => { if (flyerFullscreen) setFlyerFullscreen(false); else setSelectedEvent(null); }}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: flyerFullscreen ? "rgba(0,0,0,0.92)" : "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: flyerFullscreen ? 0 : 16 }}>
          {flyerFullscreen ? (
            <img src={parsePos(selectedEvent.flyer_url).src} alt="flyer" style={{ maxWidth: "95%", maxHeight: "95vh", borderRadius: 8, objectFit: "contain" }} />
          ) : (
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: 16, maxWidth: 480, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
              {selectedEvent.flyer_url && (() => { const p = parsePos(selectedEvent.flyer_url); return (
                <div style={{ position: "relative" }}>
                  <img src={p.src} alt={selectedEvent.event_name} onClick={e => { e.stopPropagation(); setFlyerFullscreen(true); }} style={{ width: "100%", maxHeight: 260, objectFit: "cover", objectPosition: `${p.position.x}% ${p.position.y}%`, borderRadius: "16px 16px 0 0", cursor: "zoom-in", display: "block" }} />
                  <div style={{ position: "absolute", bottom: 8, right: 10, backgroundColor: "rgba(0,0,0,0.5)", color: "white", fontSize: 11, padding: "3px 8px", borderRadius: 10 }}>Tap to enlarge</div>
                </div>
              ); })()}
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                  <button onClick={() => setSelectedEvent(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>✕</button>
                </div>
                <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>{selectedEvent.event_name}</h2>
                {selectedEvent.category && <p style={{ margin: "0 0 10px", fontSize: 12, color: "#AABB23", fontWeight: "bold" }}>{selectedEvent.category}</p>}
                <p style={{ margin: "0 0 6px", fontSize: 14, color: "#701890", fontWeight: "bold" }}>📅 {selectedEvent.event_date ? new Date(selectedEvent.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "TBD"}</p>
                {selectedEvent.venue && <p style={{ margin: "0 0 8px", fontSize: 14, color: "#444", whiteSpace: "pre-line" }}>📍 {selectedEvent.venue}{selectedEvent.venue_address ? `\n${selectedEvent.venue_address}` : ""}</p>}
                {selectedEvent.price && <p style={{ margin: "0 0 8px", fontSize: 14, color: "#701890", fontWeight: "bold", whiteSpace: "pre-line" }}>💵 {selectedEvent.price}</p>}
                {selectedEvent.description && <p style={{ margin: "0 0 20px", fontSize: 14, color: "#444", lineHeight: 1.6 }}>{selectedEvent.description}</p>}
                {selectedEvent.info_url && <a href={selectedEvent.info_url.startsWith("http") ? selectedEvent.info_url : `https://${selectedEvent.info_url}`} target="_blank" rel="noreferrer" style={{ display: "block", padding: "13px 20px", backgroundColor: "#AABB23", color: "white", borderRadius: 30, fontWeight: "bold", fontSize: 15, textDecoration: "none", textAlign: "center", marginBottom: 16 }}>🎟️ Get Tickets / More Info</a>}
                {selectedEvent._source === "epm" ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#888", textAlign: "center" }}>Hosted by <span style={{ color: "#701890", fontWeight: "bold" }}>Entre PRO Market</span></p>
                ) : selectedEvent.organizer?.handle ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#888", textAlign: "center" }}>Event by <span onClick={() => { setSelectedEvent(null); router.push(`/organizer/${selectedEvent.organizer.handle}`); }} style={{ color: "#701890", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}>@{selectedEvent.organizer.handle}</span></p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
