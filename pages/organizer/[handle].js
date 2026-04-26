// pages/organizer/[handle].js

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

// ── LINK FORMATTER ──
function cleanHandle(value) {
  return value.trim().replace(/^@/, "").replace(/\s+/g, "");
}
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

// ── SOCIAL ICONS (SVG, organizer = green #AABB23) ──
const ICON_COLOR = "#AABB23";
const ICON_SIZE = 32;

function WebsiteIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function MetaIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill={ICON_COLOR}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill={ICON_COLOR}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill={ICON_COLOR}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
    </svg>
  );
}


function XIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill={ICON_COLOR}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export default function OrganizerPublicProfile() {
  const router = useRouter();
  const { handle } = router.query;

  const [organizer, setOrganizer] = useState(null);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewerProfile, setViewerProfile] = useState(null);

  useEffect(() => {
    if (!handle) return;

    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user || null);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("handle", handle)
        .single();

      // Load viewer profile
      if (userData?.user) {
        const { data: vp } = await supabase
          .from("profiles")
          .select("role, account_type, id")
          .eq("id", userData.user.id)
          .single();
        setViewerProfile(vp);
      }

      if (error) { console.log(error); } 
      else {
        setOrganizer(data);
        if (data.account_type === "premium") {
          const { data: eventsData } = await supabase
            .from("organizer_events")
            .select("*")
            .eq("organizer_id", data.id)
            .order("event_date", { ascending: true });
          setEvents(eventsData || []);
        }
      }
      setLoading(false);
    };

    loadProfile();
  }, [handle]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!organizer) return <div style={{ padding: 20 }}>Organizer not found</div>;

  const isOwner = user && user.id === organizer.id;

  const iconLinkStyle = {
    display: "flex",
    opacity: 1,
    transition: "opacity 0.2s",
  };

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ marginBottom: 5 }}>{organizer.organizer_name || "Organizer"}</h1>
          <p style={{ color: "#777" }}>@{organizer.handle}</p>
        </div>
        </div>

      {/* EDIT PROFILE BUTTON — own row */}
      {isOwner && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => router.push("/organizer-profile")}
            style={{ padding: "8px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 14, whiteSpace: "nowrap" }}>
            ✏️ Edit Profile
          </button>
        </div>
      )}

      {/* LOGO */}
      {organizer.logo_url && (
        <img src={organizer.logo_url} onClick={() => setSelectedImage(organizer.logo_url)}
          style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 12, marginBottom: 20, cursor: "pointer" }} />
      )}

      {/* INFO */}
      <p><strong>Category:</strong> {organizer.category || "N/A"}</p>
      <p><strong>Location:</strong> {organizer.city}, {organizer.state}</p>

      {/* DESCRIPTION */}
      <p style={{ marginTop: 20 }}>{organizer.description}</p>

      {/* TAGS */}
      <div style={{ marginTop: 15 }}>
        {organizer.tags?.map((tag) => (
          <span key={tag} style={{ display: "inline-block", marginRight: 8, marginBottom: 8, padding: "4px 10px", background: "#eee", borderRadius: 20, fontSize: 12 }}>
            {tag}
          </span>
        ))}
      </div>

      {/* SOCIAL ICONS — green, no background */}
      <div style={{ marginTop: 25 }}>
        <h3 style={{ marginBottom: 12 }}>Links</h3>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
          {organizer.website && (
            <a href={formatSocialLink("website", organizer.website)} target="_blank" rel="noreferrer" title="Website"
              style={iconLinkStyle} onMouseEnter={e => e.currentTarget.style.opacity="0.7"} onMouseLeave={e => e.currentTarget.style.opacity="1"}>
              <WebsiteIcon />
            </a>
          )}
          {organizer.instagram && (
            <a href={formatSocialLink("instagram", organizer.instagram)} target="_blank" rel="noreferrer" title="Instagram"
              style={iconLinkStyle} onMouseEnter={e => e.currentTarget.style.opacity="0.7"} onMouseLeave={e => e.currentTarget.style.opacity="1"}>
              <InstagramIcon />
            </a>
          )}
          {organizer.facebook && (
            <a href={formatSocialLink("facebook", organizer.facebook)} target="_blank" rel="noreferrer" title="Meta"
              style={iconLinkStyle} onMouseEnter={e => e.currentTarget.style.opacity="0.7"} onMouseLeave={e => e.currentTarget.style.opacity="1"}>
              <MetaIcon />
            </a>
          )}
          {organizer.tiktok && (
            <a href={formatSocialLink("tiktok", organizer.tiktok)} target="_blank" rel="noreferrer" title="TikTok"
              style={iconLinkStyle} onMouseEnter={e => e.currentTarget.style.opacity="0.7"} onMouseLeave={e => e.currentTarget.style.opacity="1"}>
              <TikTokIcon />
            </a>
          )}
          {organizer.youtube && (
            <a href={formatSocialLink("youtube", organizer.youtube)} target="_blank" rel="noreferrer" title="YouTube"
              style={iconLinkStyle} onMouseEnter={e => e.currentTarget.style.opacity="0.7"} onMouseLeave={e => e.currentTarget.style.opacity="1"}>
              <YouTubeIcon />
            </a>
          )}
          {organizer.x_twitter && (
            <a href={formatSocialLink("x_twitter", organizer.x_twitter)} target="_blank" rel="noreferrer" title="X (Twitter)"
              style={iconLinkStyle} onMouseEnter={e => e.currentTarget.style.opacity="0.7"} onMouseLeave={e => e.currentTarget.style.opacity="1"}>
              <XIcon />
            </a>
          )}
        </div>
      </div>

      {/* PORTFOLIO */}
      <div style={{ marginTop: 30 }}>
        <h3>Portfolio</h3>
        {organizer.portfolio_images && organizer.portfolio_images.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {organizer.portfolio_images.map((img, i) => (
              <img key={i} src={img} alt="portfolio" onClick={() => setSelectedImage(img)}
                style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, cursor: "pointer" }} />
            ))}
          </div>
        ) : (
          <p>No portfolio images yet.</p>
        )}
      </div>

      {/* UPCOMING EVENTS — Premium only */}
      {organizer.account_type === "premium" && (
        <div style={{ marginTop: 30 }}>
          <h3>📅 Upcoming Events</h3>
          {events.length === 0 ? (
            <p style={{ color: "#888" }}>No upcoming events posted yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 460 }}>
                <thead>
                  <tr style={{ backgroundColor: "#701890", color: "white" }}>
                    <th style={thStyle}>Event</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Venue</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Info</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, i) => (
                    <tr key={event.id} style={{ backgroundColor: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                      <td style={tdStyle}>{event.event_name}</td>
                      <td style={tdStyle}>{event.event_date ? new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}</td>
                      <td style={tdStyle}>{event.venue || "—"}</td>
                      <td style={tdStyle}>{event.event_type || "—"}</td>
                      <td style={tdStyle}>
                        {event.info_url ? <a href={formatSocialLink("website", event.info_url)} target="_blank" rel="noreferrer" style={{ color: "#701890", fontWeight: "bold" }}>Details →</a> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MESSAGE BUTTON */}
      {!isOwner && (() => {
        const vt = viewerProfile?.account_type;
        const vr = viewerProfile?.role;
        // Only Featured Vendors can initiate contact with organizers
        const canMessage = vr === "featured" || vt === "featured" ||
          (vr === "organizer");
        return canMessage ? (
          <div style={{ marginTop: 20, marginBottom: 10 }}>
            <button
              onClick={() => router.push(`/messages?to=${organizer.id}`)}
              style={{ padding: "12px 24px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 15, width: "100%" }}
            >
              ✉️ Send Message
            </button>
          </div>
        ) : viewerProfile?.role === "vendor" ? (
          // Non-featured vendor viewing organizer
          <div style={{ marginTop: 20, marginBottom: 10, padding: "12px 16px", backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 8, textAlign: "center" }}>
            <p style={{ margin: 0, color: "#701890", fontWeight: "bold", fontSize: 13 }}>
              Want to work with organizers like this?
            </p>
            <p style={{ margin: "4px 0 8px", color: "#888", fontSize: 12 }}>
              Upgrade to Featured Vendor to contact organizers directly.
            </p>
            <button
              onClick={() => router.push("/vendor-info")}
              style={{ padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}
            >
              Upgrade to Featured
            </button>
          </div>
        ) : null;
      })()}

      {/* BACK BUTTON */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40 }}>
        <button onClick={() => router.back()} style={{ padding: "10px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>
          ← Back
        </button>
      </div>

      {/* FULLSCREEN IMAGE */}
      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <img src={selectedImage} alt="enlarged" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 10 }} />
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: "10px 14px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" };
const tdStyle = { padding: "10px 14px", borderBottom: "1px solid #eee", verticalAlign: "top" };
