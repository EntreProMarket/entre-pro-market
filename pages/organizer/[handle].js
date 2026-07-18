// pages/organizer/[handle].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { SocialLinks } from "../../components/SocialIcons";

const thumbStyle = (w, h, radius = 12) => ({ width: w, height: h, borderRadius: radius, border: "1px solid #e5e7eb", overflow: "hidden", cursor: "pointer", flexShrink: 0, display: "block" });
const thumbImg = { width: "100%", height: "100%", objectFit: "cover", display: "block" };

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function OrganizerPublicProfile() {
  const router = useRouter();
  const { handle, from: fromParam } = router.query;
  const [organizer, setOrganizer] = useState(null);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [flyerFullscreen, setFlyerFullscreen] = useState(false);
  const [viewerProfile, setViewerProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notFoundIsOwner, setNotFoundIsOwner] = useState(false);
  const [notFoundIsPaid, setNotFoundIsPaid] = useState(false);

  useEffect(() => {
    if (!handle) return;
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user || null;
      setUser(currentUser);

      if (!handle || handle === "undefined" || handle === "null") {
        if (currentUser) {
          const { data: myProfile } = await supabase.from("profiles").select("role, account_type, handle").eq("id", currentUser.id).single();
          if (myProfile?.role === "organizer") { setNotFoundIsOwner(true); setNotFoundIsPaid(["basic","pro","elite"].includes(myProfile?.account_type)); }
        }
        setLoading(false); return;
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("handle", handle).single();

      let viewerIsAdmin = false;
      if (currentUser) {
        const { data: vp } = await supabase.from("profiles").select("role, account_type, id, is_admin").eq("id", currentUser.id).single();
        setViewerProfile(vp);
        viewerIsAdmin = vp?.is_admin === true;
      }

      if (error || !data) {
        if (currentUser) {
          const { data: myProfile } = await supabase.from("profiles").select("role, account_type, handle").eq("id", currentUser.id).single();
          if (myProfile?.role === "organizer") { setNotFoundIsOwner(true); setNotFoundIsPaid(["basic","pro","elite"].includes(myProfile?.account_type)); }
        }
        setLoading(false); return;
      }

      setOrganizer(data);
      if (data.account_type === "elite") {
        const { data: evData } = await supabase.from("organizer_events").select("*").eq("organizer_id", data.id).order("event_date", { ascending: true });
        setEvents(evData || []);
      }

      const ownerViewing = currentUser && data.id === currentUser.id;
      if (!ownerViewing && !viewerIsAdmin) {
        await supabase.from("profile_views").insert([{ profile_id: data.id, viewer_id: currentUser?.id || null }]);
      }
      setLoading(false);
    };
    load();
  }, [handle]);

  const handleBack = () => {
    if (fromParam === "insights") { router.push("/profile-insights"); return; }
    router.back();
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (!organizer) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, fontFamily: "sans-serif", textAlign: "center" }}>
        <img src="/logo-circle.png" alt="Entre PRO Market" style={{ width: 120, marginBottom: 24 }} />
        <div style={{ fontSize: 64, marginBottom: 16 }}>{notFoundIsOwner && !notFoundIsPaid ? "⚠️" : "🏗️"}</div>
        <h2 style={{ color: "#333", marginBottom: 8 }}>{notFoundIsOwner ? "Your Profile Isn't Set Up Yet" : "Organizer Not Found"}</h2>
        <p style={{ color: "#888", fontSize: 14, maxWidth: 320, lineHeight: 1.6, marginBottom: 28 }}>
          {notFoundIsOwner ? (notFoundIsPaid ? "Complete your organizer profile so vendors can find you." : "Your plan payment wasn't completed.") : "This organizer profile doesn't exist or may have been removed."}
        </p>
        {notFoundIsOwner && <button onClick={() => router.replace(notFoundIsPaid ? "/organizer-profile" : "/organizer-info")} style={{ padding: "13px 28px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 12, width: "100%", maxWidth: 280 }}>{notFoundIsPaid ? "✏️ Set Up My Profile" : "🎪 Complete My Signup"}</button>}
        <button onClick={() => router.replace(notFoundIsOwner ? (notFoundIsPaid ? "/organizer-dashboard" : "/home") : "/marketplace")} style={{ padding: "11px 24px", backgroundColor: "white", color: "#701890", border: "2px solid #701890", borderRadius: 8, fontWeight: "bold", fontSize: 14, cursor: "pointer", width: "100%", maxWidth: 280 }}>
          {notFoundIsOwner ? "← Back to Dashboard" : "← Back to Marketplace"}
        </button>
      </div>
    );
  }

  const isOwner = user && user.id === organizer.id;

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20, position: "relative", fontFamily: "sans-serif" }}>
      {isOwner && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ padding: "8px 14px", backgroundColor: "#111", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>☰ Menu</button>
          <button onClick={() => router.push("/organizer-profile")} style={{ padding: "8px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>✏️ Edit Profile</button>
        </div>
      )}

      {menuOpen && isOwner && (
        <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 0, left: 0, width: 240, height: "100%", backgroundColor: "white", boxShadow: "4px 0 16px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
            <div style={{ backgroundColor: "#111", padding: "16px 20px", color: "white", fontWeight: "bold", fontSize: 16 }}>Entre PRO Market</div>
            {[{ label: "🏡 Home", path: "/home" }, { label: "📊 Dashboard", path: "/organizer-dashboard" }, { label: "✏️ Edit Profile", path: "/organizer-profile" }, { label: "👤 My Profile", path: `/organizer/${organizer?.handle}` }, { label: "🛒 Marketplace", path: "/marketplace" }, { label: "✉️ Messages", path: "/messages" }, { label: "💾 Saved Contacts", path: "/saved-contacts" }].map(item => (
              <button key={item.path} onClick={() => { setMenuOpen(false); router.push(item.path); }} style={{ padding: "14px 20px", backgroundColor: "white", border: "none", borderBottom: "1px solid #f0f0f0", cursor: "pointer", textAlign: "left", fontSize: 15, fontWeight: "bold", color: "#333" }}>{item.label}</button>
            ))}
            <button onClick={async () => { await supabase.auth.signOut(); router.replace("/"); }} style={{ marginTop: "auto", padding: "14px 20px", backgroundColor: "white", border: "none", borderTop: "1px solid #eee", cursor: "pointer", textAlign: "left", fontSize: 15, fontWeight: "bold", color: "#cc0000" }}>🚪 Log Out</button>
          </div>
        </div>
      )}

      <h1 style={{ marginBottom: 4 }}>{organizer.organizer_name || "Organizer"}</h1>
      <p style={{ color: "#777", marginBottom: 16 }}>@{organizer.handle}</p>

      {organizer.logo_url && <div onClick={() => setSelectedImage(organizer.logo_url)} style={thumbStyle(160, 160, 12)}><img src={organizer.logo_url} alt="logo" style={thumbImg} /></div>}

      <div style={{ marginTop: 16 }}>
        <p><strong>Category:</strong> {organizer.category || "N/A"}</p>
        <p><strong>Location:</strong> {organizer.city}{organizer.state ? `, ${organizer.state}` : ""}</p>
        {organizer.description && <p style={{ marginTop: 16, lineHeight: 1.6 }}>{organizer.description}</p>}
        <div style={{ marginTop: 12 }}>
          {organizer.tags?.map(tag => <span key={tag} style={{ display: "inline-block", marginRight: 8, marginBottom: 8, padding: "4px 10px", background: "#eee", borderRadius: 20, fontSize: 12 }}>{tag}</span>)}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Links</h3>
        <SocialLinks profile={organizer} size={32} />
      </div>

      <div style={{ marginTop: 28 }}>
        <h3>Portfolio</h3>
        {organizer.portfolio_images?.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {organizer.portfolio_images.map((img, i) => <div key={i} onClick={() => setSelectedImage(img)} style={{ ...thumbStyle("100%", 150, 8), width: "100%" }}><img src={img} alt="portfolio" style={thumbImg} /></div>)}
          </div>
        ) : <p style={{ color: "#888" }}>No portfolio images yet.</p>}
      </div>

      {organizer.account_type === "elite" && organizer.video_urls?.filter(v => v).length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12 }}>🎬 Videos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {organizer.video_urls.filter(v => v).map((url, i) => {
              let embedUrl = url;
              if (url.includes("youtube.com/watch")) { const id = new URL(url).searchParams.get("v"); embedUrl = `https://www.youtube.com/embed/${id}`; }
              else if (url.includes("youtu.be/")) { const id = url.split("youtu.be/")[1].split("?")[0]; embedUrl = `https://www.youtube.com/embed/${id}`; }
              else if (url.includes("instagram.com")) return <button key={i} onClick={() => window.location.href = url} style={{ padding: "12px 16px", backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 10, color: "#701890", fontWeight: "bold", cursor: "pointer", width: "100%", textAlign: "left" }}>📸 Watch on Instagram</button>;
              else if (url.includes("tiktok.com")) return <button key={i} onClick={() => window.location.href = url} style={{ padding: "12px 16px", backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 10, color: "#888B00", fontWeight: "bold", cursor: "pointer", width: "100%", textAlign: "left" }}>🎵 Watch on TikTok</button>;
              return <iframe key={i} src={embedUrl} style={{ width: "100%", height: 200, borderRadius: 8, border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
            })}
          </div>
        </div>
      )}

      {organizer.account_type === "elite" && events.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3>📅 Upcoming Events</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {events.map(event => (
              <div key={event.id} onClick={() => { setSelectedEvent(event); setFlyerFullscreen(false); }} style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", cursor: "pointer", backgroundColor: "white" }}>
                <div style={{ height: 130, overflow: "hidden" }}>
                  {event.flyer_url ? <img src={event.flyer_url} alt={event.event_name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 13 }}>No Flyer</div>}
                </div>
                <div style={{ padding: 12 }}>
                  <h4 style={{ margin: "0 0 4px", fontSize: 14 }}>{event.event_name}</h4>
                  {event.category && <p style={{ margin: "0 0 2px", fontSize: 11, color: "#AABB23", fontWeight: "bold" }}>{event.category}</p>}
                  <p style={{ margin: "0 0 2px", fontSize: 12, color: "#701890", fontWeight: "bold" }}>📅 {event.event_date ? new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}</p>
                  {event.venue && <p style={{ margin: 0, color: "#888", fontSize: 12 }}>📍 {event.venue}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isOwner && (() => {
        const vt = viewerProfile?.account_type, vr = viewerProfile?.role;
        const canMessage = vt === "featured" || vr === "organizer";
        return canMessage ? (
          <div style={{ marginTop: 20 }}>
            <button onClick={() => router.push(`/messages?to=${organizer.id}&from=organizer/${organizer.handle}`)} style={{ padding: "12px 24px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 15, width: "100%" }}>✉️ Send Message</button>
          </div>
        ) : viewerProfile?.role === "vendor" ? (
          <div style={{ marginTop: 20, padding: "12px 16px", backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 8, textAlign: "center" }}>
            <p style={{ margin: 0, color: "#701890", fontWeight: "bold", fontSize: 13 }}>Upgrade to Featured Vendor to contact organizers.</p>
            <button onClick={() => router.push("/vendor-info")} style={{ marginTop: 8, padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Upgrade to Featured</button>
          </div>
        ) : null;
      })()}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40 }}>
        <button onClick={handleBack} style={{ padding: "10px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>← Back</button>
      </div>

      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <img src={selectedImage} alt="enlarged" style={{ maxWidth: "95%", maxHeight: "90vh", borderRadius: 10, objectFit: "contain" }} />
        </div>
      )}

      {selectedEvent && (
        <div onClick={() => { if (flyerFullscreen) setFlyerFullscreen(false); else setSelectedEvent(null); }}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: flyerFullscreen ? "rgba(0,0,0,0.92)" : "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: flyerFullscreen ? 0 : 16 }}>
          {flyerFullscreen ? (
            <img src={selectedEvent.flyer_url} alt="flyer" style={{ maxWidth: "95%", maxHeight: "95vh", objectFit: "contain", borderRadius: 8 }} />
          ) : (
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: 16, maxWidth: 480, width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
              {selectedEvent.flyer_url && (
                <div style={{ position: "relative" }}>
                  <img src={selectedEvent.flyer_url} alt={selectedEvent.event_name} onClick={e => { e.stopPropagation(); setFlyerFullscreen(true); }} style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: "16px 16px 0 0", cursor: "zoom-in", display: "block" }} />
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
                {(selectedEvent.event_start_time || selectedEvent.event_end_time) && <p style={{ margin: "0 0 8px", fontSize: 13, color: "#555" }}>🕐 {formatTime(selectedEvent.event_start_time)}{selectedEvent.event_end_time && ` – ${formatTime(selectedEvent.event_end_time)}`}</p>}
                {selectedEvent.venue && <p style={{ margin: "0 0 8px", fontSize: 14, color: "#444" }}>📍 {selectedEvent.venue}</p>}
                {selectedEvent.description && <p style={{ margin: "0 0 20px", fontSize: 14, color: "#444", lineHeight: 1.6 }}>{selectedEvent.description}</p>}
                {selectedEvent.info_url && <a href={selectedEvent.info_url.startsWith("http") ? selectedEvent.info_url : `https://${selectedEvent.info_url}`} target="_blank" rel="noreferrer" style={{ display: "block", padding: "13px 20px", backgroundColor: "#AABB23", color: "white", borderRadius: 30, fontWeight: "bold", fontSize: 15, textDecoration: "none", textAlign: "center", marginBottom: 16 }}>🎟️ Get Tickets / More Info</a>}
                <p style={{ margin: 0, fontSize: 13, color: "#888", textAlign: "center" }}>Event by <span style={{ color: "#701890", fontWeight: "bold" }}>@{organizer.handle}</span></p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
