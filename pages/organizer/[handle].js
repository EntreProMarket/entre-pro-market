// pages/organizer/[handle].js

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function cleanHandle(value) { return value.trim().replace(/^@/, "").replace(/\s+/g, ""); }
function formatSocialLink(platform, value) {
  if (!value || !value.trim()) return "";
  const v = value.trim();
  if (v.startsWith("https://")) return v;
  if (v.startsWith("http://")) return v.replace("http://", "https://");
  if (v.startsWith("www.")) return `https://${v}`;
  const domains = { instagram: "instagram.com", facebook: "facebook.com", tiktok: "tiktok.com", youtube: "youtube.com" };
  if (domains[platform] && v.toLowerCase().includes(domains[platform])) return `https://${v}`;
  const handle = cleanHandle(v);
  switch (platform) {
    case "instagram": return `https://instagram.com/${handle}`;
    case "facebook":  return `https://facebook.com/${handle}`;
    case "tiktok":    return `https://tiktok.com/@${handle}`;
    case "youtube":   return `https://youtube.com/@${handle}`;
    case "x_twitter": return `https://x.com/${handle}`;
    case "website":   return `https://${handle}`;
    default:          return `https://${handle}`;
  }
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const IC = "#AABB23";
const IS = 32;
function WebsiteIcon() { return <svg width={IS} height={IS} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
function InstagramIcon() { return <svg width={IS} height={IS} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>; }
function MetaIcon() { return <svg width={IS} height={IS} viewBox="0 0 24 24" fill={IC}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>; }
function TikTokIcon() { return <svg width={IS} height={IS} viewBox="0 0 24 24" fill={IC}><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>; }
function YouTubeIcon() { return <svg width={IS} height={IS} viewBox="0 0 24 24" fill={IC}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>; }
function XIcon() { return <svg width={IS} height={IS} viewBox="0 0 24 24" fill={IC}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }

export default function OrganizerPublicProfile() {
  const router = useRouter();
  const { handle } = router.query;
  const [organizer, setOrganizer] = useState(null);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [flyerFullscreen, setFlyerFullscreen] = useState(false);
  const [viewerProfile, setViewerProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!handle) return;
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user || null;
      setUser(currentUser);
      const { data, error } = await supabase.from("profiles").select("*").eq("handle", handle).single();
      if (currentUser) {
        const { data: vp } = await supabase.from("profiles").select("role, account_type, id").eq("id", currentUser.id).single();
        setViewerProfile(vp);
      }
      if (error) { setLoading(false); return; }
      setOrganizer(data);
      if (data.account_type === "elite") {
        const { data: evData } = await supabase.from("organizer_events").select("*").eq("organizer_id", data.id).order("event_date", { ascending: true });
        setEvents(evData || []);
      }
      const ownerViewing = currentUser && data.id === currentUser.id;
      if (!ownerViewing) {
        await supabase.from("profile_views").insert([{ profile_id: data.id, viewer_id: currentUser?.id || null }]);
      }
      setLoading(false);
    };
    load();
  }, [handle]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!organizer) return <div style={{ padding: 20 }}>Organizer not found</div>;

  const isOwner = user && user.id === organizer.id;
  const iL = { display: "flex", opacity: 1, transition: "opacity 0.2s" };

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20, position: "relative" }}>

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

      <h1 style={{ marginBottom: 5 }}>{organizer.organizer_name || "Organizer"}</h1>
      <p style={{ color: "#777", marginBottom: 16 }}>@{organizer.handle}</p>
      {organizer.logo_url && <img src={organizer.logo_url} onClick={() => setSelectedImage(organizer.logo_url)} style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 12, marginBottom: 20, cursor: "pointer" }} />}
      <p><strong>Category:</strong> {organizer.category || "N/A"}</p>
      <p><strong>Location:</strong> {organizer.city}{organizer.state ? `, ${organizer.state}` : ""}</p>
      <p style={{ marginTop: 20 }}>{organizer.description}</p>
      <div style={{ marginTop: 15 }}>
        {organizer.tags?.map(tag => <span key={tag} style={{ display: "inline-block", marginRight: 8, marginBottom: 8, padding: "4px 10px", background: "#eee", borderRadius: 20, fontSize: 12 }}>{tag}</span>)}
      </div>

      <div style={{ marginTop: 25 }}>
        <h3 style={{ marginBottom: 12 }}>Links</h3>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
          {organizer.website   && <a href={formatSocialLink("website",   organizer.website)}   target="_blank" rel="noreferrer" style={iL} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><WebsiteIcon /></a>}
          {organizer.instagram && <a href={formatSocialLink("instagram", organizer.instagram)} target="_blank" rel="noreferrer" style={iL} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><InstagramIcon /></a>}
          {organizer.facebook  && <a href={formatSocialLink("facebook",  organizer.facebook)}  target="_blank" rel="noreferrer" style={iL} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><MetaIcon /></a>}
          {organizer.tiktok    && <a href={formatSocialLink("tiktok",    organizer.tiktok)}    target="_blank" rel="noreferrer" style={iL} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><TikTokIcon /></a>}
          {organizer.youtube   && <a href={formatSocialLink("youtube",   organizer.youtube)}   target="_blank" rel="noreferrer" style={iL} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><YouTubeIcon /></a>}
          {organizer.x_twitter && <a href={formatSocialLink("x_twitter",organizer.x_twitter)} target="_blank" rel="noreferrer" style={iL} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><XIcon /></a>}
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <h3>Portfolio</h3>
        {organizer.portfolio_images && organizer.portfolio_images.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {organizer.portfolio_images.map((img, i) => <img key={i} src={img} alt="portfolio" onClick={() => setSelectedImage(img)} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, cursor: "pointer" }} />)}
          </div>
        ) : <p style={{ color: "#888" }}>No portfolio images yet.</p>}
      </div>

      {organizer.account_type === "elite" && organizer.video_urls && organizer.video_urls.filter(v => v).length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3 style={{ marginBottom: 12 }}>🎬 Videos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {organizer.video_urls.filter(v => v).map((url, i) => {
              let embedUrl = url;
              if (url.includes("youtube.com/watch")) { const id = new URL(url).searchParams.get("v"); embedUrl = `https://www.youtube.com/embed/${id}`; }
              else if (url.includes("youtu.be/")) { const id = url.split("youtu.be/")[1].split("?")[0]; embedUrl = `https://www.youtube.com/embed/${id}`; }
              else if (url.includes("instagram.com")) return <button key={i} onClick={() => window.location.href = url} style={{ padding: "12px 16px", backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 10, color: "#701890", fontWeight: "bold", cursor: "pointer", width: "100%", textAlign: "left", fontSize: 14 }}>📸 Watch on Instagram</button>;
              else if (url.includes("tiktok.com")) return <button key={i} onClick={() => window.location.href = url} style={{ padding: "12px 16px", backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 10, color: "#888B00", fontWeight: "bold", cursor: "pointer", width: "100%", textAlign: "left", fontSize: 14 }}>🎵 Watch on TikTok</button>;
              return <iframe key={i} src={embedUrl} style={{ width: "100%", height: 200, borderRadius: 8, border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
            })}
          </div>
        </div>
      )}

      {/* ELITE EVENTS — cards open popup */}
      {organizer.account_type === "elite" && (
        <div style={{ marginTop: 30 }}>
          <h3>📅 Upcoming Events</h3>
          {events.length === 0 ? <p style={{ color: "#888" }}>No upcoming events posted yet.</p> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {events.map(event => (
                <div key={event.id} onClick={() => { setSelectedEvent(event); setFlyerFullscreen(false); }}
                  style={{ border: "2px solid #AABB23", borderRadius: 12, overflow: "hidden", cursor: "pointer", backgroundColor: "white" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(170,187,35,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <div style={{ height: 130, backgroundColor: "#f4f4f4" }}>
                    {event.flyer_url ? <img src={event.flyer_url} alt={event.event_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 13 }}>No Flyer</div>}
                  </div>
                  <div style={{ padding: 12 }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: 14 }}>{event.event_name}</h4>
                    {event.category && <p style={{ margin: "0 0 2px", fontSize: 11, color: "#AABB23", fontWeight: "bold" }}>{event.category}</p>}
                    <p style={{ margin: "0 0 2px", fontSize: 12, color: "#701890", fontWeight: "bold" }}>
                      📅 {event.event_date ? new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}
                    </p>
                    {event.venue && <p style={{ margin: 0, color: "#888", fontSize: 12 }}>📍 {event.venue}</p>}
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#AABB23" }}>Tap for details →</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isOwner && (() => {
        const vt = viewerProfile?.account_type;
        const vr = viewerProfile?.role;
        const canMessage = vr === "featured" || vt === "featured" || vr === "organizer";
        return canMessage ? (
          <div style={{ marginTop: 20 }}>
            <button onClick={() => router.push(`/messages?to=${organizer.id}&from=organizer/${organizer.handle}`)} style={{ padding: "12px 24px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 15, width: "100%" }}>✉️ Send Message</button>
          </div>
        ) : viewerProfile?.role === "vendor" ? (
          <div style={{ marginTop: 20, padding: "12px 16px", backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 8, textAlign: "center" }}>
            <p style={{ margin: 0, color: "#701890", fontWeight: "bold", fontSize: 13 }}>Want to work with organizers like this?</p>
            <p style={{ margin: "4px 0 8px", color: "#888", fontSize: 12 }}>Upgrade to Featured Vendor to contact organizers directly.</p>
            <button onClick={() => router.push("/vendor-info")} style={{ padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Upgrade to Featured</button>
          </div>
        ) : null;
      })()}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40 }}>
        <button onClick={() => router.back()} style={{ padding: "10px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>← Back</button>
      </div>

      {/* FULLSCREEN PORTFOLIO IMAGE */}
      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <img src={selectedImage} alt="enlarged" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 10 }} />
        </div>
      )}

      {/* EVENT POPUP MODAL */}
      {selectedEvent && (
        <div onClick={() => { if (flyerFullscreen) { setFlyerFullscreen(false); } else { setSelectedEvent(null); } }}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: flyerFullscreen ? "rgba(0,0,0,0.92)" : "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: flyerFullscreen ? 0 : 16 }}>
          {flyerFullscreen ? (
            <img src={selectedEvent.flyer_url} alt="flyer" style={{ maxWidth: "95%", maxHeight: "95vh", borderRadius: 8, objectFit: "contain" }} />
          ) : (
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: 16, maxWidth: 480, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
              {selectedEvent.flyer_url && (
                <div style={{ position: "relative" }}>
                  <img src={selectedEvent.flyer_url} alt={selectedEvent.event_name}
                    onClick={e => { e.stopPropagation(); setFlyerFullscreen(true); }}
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
                <p style={{ margin: "0 0 6px", fontSize: 14, color: "#701890", fontWeight: "bold" }}>
                  📅 {selectedEvent.event_date ? new Date(selectedEvent.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "Date TBD"}
                  {selectedEvent.event_end_date && selectedEvent.event_end_date !== selectedEvent.event_date && <span> – {new Date(selectedEvent.event_end_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>}
                </p>
                {(selectedEvent.event_start_time || selectedEvent.event_end_time) && (
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: "#555" }}>🕐 {formatTime(selectedEvent.event_start_time)}{selectedEvent.event_end_time && ` – ${formatTime(selectedEvent.event_end_time)}`}</p>
                )}
                {selectedEvent.venue && <p style={{ margin: "0 0 8px", fontSize: 14, color: "#444" }}>📍 {selectedEvent.venue}</p>}
                {selectedEvent.event_type && <p style={{ margin: "0 0 12px", fontSize: 13, color: "#888" }}>🎭 {selectedEvent.event_type}</p>}
                {selectedEvent.description && <p style={{ margin: "0 0 20px", fontSize: 14, color: "#444", lineHeight: 1.6 }}>{selectedEvent.description}</p>}
                {selectedEvent.info_url && (
                  <a href={selectedEvent.info_url.startsWith("http") ? selectedEvent.info_url : `https://${selectedEvent.info_url}`} target="_blank" rel="noreferrer"
                    style={{ display: "block", padding: "13px 20px", backgroundColor: "#AABB23", color: "white", borderRadius: 30, fontWeight: "bold", fontSize: 15, textDecoration: "none", textAlign: "center", marginBottom: 16 }}>
                    🎟️ Get Tickets / More Info
                  </a>
                )}
                <p style={{ margin: 0, fontSize: 13, color: "#888", textAlign: "center" }}>
                  Event by <span style={{ color: "#701890", fontWeight: "bold" }}>@{organizer.handle}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
