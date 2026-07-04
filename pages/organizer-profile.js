// pages/organizer-profile.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

function cleanHandle(v) { return v.trim().replace(/^@/, "").replace(/\s+/g, ""); }
function sanitizeHandle(value) { return value.trim().replace(/^@/, "").replace(/[^a-zA-Z0-9_-]/g, ""); }
function isValidHandle(value) { return value.length > 0 && /^[a-zA-Z0-9_-]+$/.test(value); }

function formatSocialLink(platform, value) {
  if (!value || !value.trim()) return "";
  const v = value.trim();
  if (v.startsWith("https://")) return v;
  if (v.startsWith("http://")) return v.replace("http://", "https://");
  if (v.startsWith("www.")) return `https://${v}`;
  const domains = { instagram: "instagram.com", facebook: "facebook.com", tiktok: "tiktok.com", youtube: "youtube.com" };
  if (domains[platform] && v.toLowerCase().includes(domains[platform])) return `https://${v}`;
  const h = cleanHandle(v);
  switch (platform) {
    case "instagram": return `https://instagram.com/${h}`;
    case "facebook": return `https://facebook.com/${h}`;
    case "tiktok": return `https://tiktok.com/@${h}`;
    case "youtube": return `https://youtube.com/@${h}`;
    case "x_twitter": return `https://x.com/${h}`;
    case "website": return `https://${h}`;
    default: return `https://${h}`;
  }
}
function formatUrl(v) {
  if (!v || !v.trim()) return "";
  const s = v.trim();
  if (s.startsWith("https://") || s.startsWith("http://")) return s;
  return `https://${s}`;
}
function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const DEFAULT_LOGOS = ["/default-logos/EPM-PH1.png", "/default-logos/EPM-PH2.png", "/default-logos/EPM-PH3.png"];
const FLYER_PLACEHOLDERS = ["/default-logos/EPM-PH1.png", "/default-logos/EPM-PH2.png", "/default-logos/EPM-PH3.png"];
const EVENT_CATEGORIES = ["Music Event","Pop Up Shop","Business Expo","Fashion Show","Spoken Word","Meet & Greet","Art Show","Dance Event","Party","Classes","Paint & Sip","Festival","Corporate Event","Wedding","Birthday","Fundraiser","Community Event","Sports Event","Venue","Other"];
const BLANK_EVENT = { event_name: "", event_date: "", event_end_date: "", event_start_time: "", event_end_time: "", venue: "", event_type: "", category: "", description: "", info_url: "", flyer_url: "" };

export default function OrganizerProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [accountType, setAccountType] = useState("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [handle, setHandle] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [xTwitter, setXTwitter] = useState("");
  const [tags, setTags] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [imageLimits, setImageLimits] = useState({ basic: 10, pro: 20, elite: 40 });
  const [videoUrls, setVideoUrls] = useState(["","","","",""]);
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState(BLANK_EVENT);
  const [savingEvent, setSavingEvent] = useState(false);
  const [flyerFile, setFlyerFile] = useState(null);
  const [showFlyerPicker, setShowFlyerPicker] = useState(false);
  const [flyerFullscreen, setFlyerFullscreen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) { router.push("/"); return; }
      setUser(u);
      const { data: s } = await supabase.from("app_settings").select("*");
      if (s) {
        const m = {};
        s.forEach(r => { m[r.key] = parseInt(r.value, 10); });
        setImageLimits({ basic: m.organizer_basic_photos ?? 10, pro: m.organizer_pro_photos ?? 20, elite: m.organizer_elite_photos ?? 40 });
      }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.id).single();
      if (p) {
        setOrganizerName(p.organizer_name || ""); setHandle(p.handle || "");
        setCategory(p.category || ""); setCity(p.city || ""); setStateVal(p.state || "");
        setDescription(p.description || ""); setWebsite(p.website || "");
        setInstagram(p.instagram || ""); setFacebook(p.facebook || "");
        setTiktok(p.tiktok || ""); setYoutube(p.youtube || ""); setXTwitter(p.x_twitter || "");
        setTags(p.tags ? p.tags.join(", ") : ""); setLogoUrl(p.logo_url || "");
        setPortfolioImages(p.portfolio_images || []); setAccountType(p.account_type || "basic");
        if (p.video_urls) setVideoUrls(p.video_urls.concat(["","","","",""]).slice(0, 5));
        if (p.account_type === "elite") {
          const { data: ev } = await supabase.from("organizer_events").select("*").eq("organizer_id", u.id).order("event_date", { ascending: true });
          setEvents(ev || []);
        }
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const uploadFile = async (file, bucket) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) { setMessage("❌ Upload error: " + error.message); return null; }
    return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
  };

  const handleSave = async () => {
    // ── EMAIL REQUIRED ──
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.email) {
      setMessage("❌ Your account doesn't have an email address. Please update your email in Settings before saving your profile.");
      return;
    }

    // ── LOGO REQUIRED ──
    if (!logoUrl && !logoFile) { setMessage("⚠️ Please upload a logo or choose a placeholder before saving."); return; }

    // ── HANDLE VALIDATION ──
    if (!handle) { setMessage("❌ Please enter a handle for your profile."); return; }
    if (!isValidHandle(handle)) {
      setMessage("❌ Handle can only contain letters, numbers, hyphens (-) and underscores (_). No spaces or special characters.");
      return;
    }

    if (!user) return;
    setSaving(true); setMessage("");
    try {
      const { data: ex } = await supabase.from("profiles").select("logo_url").eq("id", user.id).single();
      let uploadedLogoUrl = ex?.logo_url || logoUrl;
      if (logoFile) { const up = await uploadFile(logoFile, "organizer-logos"); if (up) uploadedLogoUrl = up; }
      let updatedPortfolio = [...portfolioImages];
      if (portfolioFiles.length > 0) {
        const remaining = (imageLimits[accountType] ?? 10) - updatedPortfolio.length;
        for (const file of portfolioFiles.slice(0, remaining)) {
          const url = await uploadFile(file, "organizer-portfolio");
          if (url) updatedPortfolio.push(url);
        }
      }
      const { error } = await supabase.from("profiles").upsert({
        id: user.id, organizer_name: organizerName, handle, category, city, state: stateVal, description,
        website: formatSocialLink("website", website), instagram: formatSocialLink("instagram", instagram),
        facebook: formatSocialLink("facebook", facebook), tiktok: formatSocialLink("tiktok", tiktok),
        youtube: formatSocialLink("youtube", youtube), x_twitter: formatSocialLink("x_twitter", xTwitter),
        tags: tags.split(",").map(t => t.trim()).filter(Boolean), logo_url: uploadedLogoUrl,
        portfolio_images: updatedPortfolio,
        video_urls: accountType === "elite" ? videoUrls.filter(v => v.trim()) : [],
        role: "organizer",
      });
      if (error) throw error;
      setPortfolioImages(updatedPortfolio); setPortfolioFiles([]); setLogoUrl(uploadedLogoUrl);
      setMessage("✅ Profile saved!");
      setTimeout(() => router.replace(`/organizer/${handle}`), 1200);
    } catch (err) { setMessage("❌ Error: " + err.message); }
    setSaving(false);
  };

  const saveEvent = async () => {
    if (!eventForm.event_name.trim()) { setMessage("⚠️ Event name is required."); return; }
    if (!eventForm.flyer_url && !flyerFile) { setMessage("⚠️ A flyer image is required."); return; }
    setSavingEvent(true);
    let flyerUrl = eventForm.flyer_url || "";
    if (flyerFile) { const up = await uploadFile(flyerFile, "organizer-portfolio"); if (up) flyerUrl = up; }
    const eventData = {
      event_name: eventForm.event_name, event_date: eventForm.event_date || null,
      event_end_date: eventForm.event_end_date || null, event_start_time: eventForm.event_start_time || null,
      event_end_time: eventForm.event_end_time || null, venue: eventForm.venue,
      event_type: eventForm.event_type, category: eventForm.category,
      description: eventForm.description, info_url: formatUrl(eventForm.info_url), flyer_url: flyerUrl,
    };
    if (editingEvent) {
      await supabase.from("organizer_events").update(eventData).eq("id", editingEvent);
      setEvents(events.map(e => e.id === editingEvent ? { ...e, ...eventData } : e));
    } else {
      const { data } = await supabase.from("organizer_events").insert([{ ...eventData, organizer_id: user.id }]).select().single();
      if (data) setEvents([...events, data]);
    }
    setEditingEvent(null); setEventForm(BLANK_EVENT); setFlyerFile(null); setShowFlyerPicker(false); setSavingEvent(false);
    setMessage("✅ Event saved!");
  };

  const deleteEvent = async (id) => {
    if (!confirm("Delete this event?")) return;
    await supabase.from("organizer_events").delete().eq("id", id);
    setEvents(events.filter(e => e.id !== id));
  };

  const removePortfolioImage = async (url) => {
    await supabase.storage.from("organizer-portfolio").remove([url.split("/").pop()]);
    const updated = portfolioImages.filter(img => img !== url);
    setPortfolioImages(updated);
    if (user) await supabase.from("profiles").update({ portfolio_images: updated }).eq("id", user.id);
  };

  const imageLimit = imageLimits[accountType] ?? 10;
  const atLimit = portfolioImages.length >= imageLimit;
  const flyerPreviewSrc = flyerFile ? URL.createObjectURL(flyerFile) : eventForm.flyer_url;

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 20 }}>Edit Organizer Profile</h1>

      <input placeholder="Organizer Name" value={organizerName} onChange={e => setOrganizerName(e.target.value)} style={iS} />

      <div style={{ marginBottom: 12 }}>
        <input placeholder="Handle (e.g. MyEvents)" value={handle} onChange={e => setHandle(sanitizeHandle(e.target.value))}
          style={{ ...iS, marginBottom: 4, borderColor: handle && !isValidHandle(handle) ? "#cc0000" : "#d1d5db" }} />
        {handle ? (
          isValidHandle(handle)
            ? <p style={{ margin: 0, fontSize: 12, color: "#166534" }}>✅ app.entrepromarket.com/organizer/{handle}</p>
            : <p style={{ margin: 0, fontSize: 12, color: "#cc0000" }}>❌ Only letters, numbers, hyphens and underscores. No spaces.</p>
        ) : <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Your profile URL: app.entrepromarket.com/organizer/YourHandle</p>}
      </div>

      <select value={category} onChange={e => setCategory(e.target.value)} style={iS}>
        <option value="">Select a Category...</option>
        {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input placeholder="City" value={city} onChange={e => setCity(e.target.value)} style={iS} />
      <input placeholder="State" value={stateVal} onChange={e => setStateVal(e.target.value)} style={iS} />
      <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ ...iS, resize: "vertical" }} />
      <div style={{ backgroundColor: "#fff0f0", border: "1px solid #f5c6c6", borderRadius: 6, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#cc0000" }}>⚠️ Links must be public or they may not open correctly.</div>
      <input placeholder="Website" value={website} onChange={e => setWebsite(e.target.value)} style={iS} />
      <input placeholder="Instagram" value={instagram} onChange={e => setInstagram(e.target.value)} style={iS} />
      <input placeholder="Facebook" value={facebook} onChange={e => setFacebook(e.target.value)} style={iS} />
      <input placeholder="TikTok" value={tiktok} onChange={e => setTiktok(e.target.value)} style={iS} />
      <input placeholder="YouTube" value={youtube} onChange={e => setYoutube(e.target.value)} style={iS} />
      <input placeholder="X / Twitter" value={xTwitter} onChange={e => setXTwitter(e.target.value)} style={iS} />
      <input placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} style={iS} />

      {/* LOGO */}
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <label style={lS}>Logo <span style={{ color: "#cc0000" }}>*</span></label>
        {logoUrl ? (
          <div style={{ width: 90, height: 90, borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb", marginBottom: 8 }}>
            <img src={logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        ) : (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#991b1b", fontWeight: "bold" }}>⚠️ Upload a logo or choose a placeholder below.</p>
          </div>
        )}
        <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={e => { setLogoFile(e.target.files[0]); setLogoUrl(URL.createObjectURL(e.target.files[0])); }} style={{ display: "block", marginBottom: 10 }} />
        <button onClick={() => setShowLogoPicker(!showLogoPicker)} style={{ padding: "4px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12 }}>{showLogoPicker ? "Hide" : "Browse Placeholders"}</button>
        {showLogoPicker && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 10, marginTop: 10, padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8, border: "1px solid #eee" }}>
            {DEFAULT_LOGOS.map((src, i) => (
              <div key={i} onClick={() => { setLogoUrl(src); setLogoFile(null); setShowLogoPicker(false); }}
                style={{ height: 80, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: logoUrl === src ? "3px solid #701890" : "2px solid transparent" }}>
                <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PORTFOLIO */}
      <div style={{ marginTop: 20, marginBottom: 8 }}>
        <label style={lS}>Portfolio</label>
        <p style={{ fontSize: 12, color: atLimit ? "#cc0000" : "#888", marginBottom: 8 }}>{portfolioImages.length}/{imageLimit} images{atLimit && " — Remove some before adding more"}</p>
        <div style={{ backgroundColor: "#fff8e1", border: "1px solid #f0c040", borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#856404" }}>⚠️ JPG, PNG, WebP only. No HEIC.</div>
        {portfolioImages.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 12 }}>
            {portfolioImages.map((img, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div style={{ height: 90, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                  <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <button onClick={() => removePortfolioImage(img)} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 11, cursor: "pointer", lineHeight: "20px", textAlign: "center", padding: 0 }}>×</button>
              </div>
            ))}
          </div>
        )}
        {!atLimit && <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" multiple onChange={e => { const rem = imageLimit - portfolioImages.length; const files = Array.from(e.target.files).slice(0, rem); if (Array.from(e.target.files).length > rem) alert(`You can only add ${rem} more image(s).`); setPortfolioFiles(files); }} style={{ display: "block" }} />}
      </div>

      {/* ELITE: VIDEOS */}
      {accountType === "elite" && (
        <div style={{ marginTop: 20, marginBottom: 20, backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 10, padding: 16 }}>
          <label style={{ ...lS, color: "#888B00" }}>👑 Video Links (up to 5) — YouTube, Instagram or TikTok</label>
          {Array.from({ length: 5 }).map((_, i) => <input key={i} value={videoUrls[i] || ""} onChange={e => { const u = [...videoUrls]; u[i] = e.target.value; setVideoUrls(u); }} placeholder={`Video link ${i + 1}`} style={iS} />)}
        </div>
      )}

      {/* ELITE: EVENTS */}
      {accountType === "elite" && (
        <div style={{ marginTop: 20, marginBottom: 20, backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 10, padding: 16 }}>
          <label style={{ ...lS, color: "#888B00" }}>👑 Events (Elite — Create & Manage)</label>
          <div style={{ backgroundColor: "white", borderRadius: 8, padding: 16, marginBottom: 16, border: "1px solid #eee" }}>
            <p style={{ fontWeight: "bold", marginBottom: 10, fontSize: 14 }}>{editingEvent ? "✏️ Edit Event" : "➕ Add New Event"}</p>
            <input placeholder="Event Name *" value={eventForm.event_name} onChange={e => setEventForm({ ...eventForm, event_name: e.target.value })} style={iS} />
            <label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Event Category</label>
            <select value={eventForm.category} onChange={e => setEventForm({ ...eventForm, category: e.target.value })} style={iS}>
              <option value="">Select a Category...</option>
              {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Start Date</label><input type="date" value={eventForm.event_date} onChange={e => setEventForm({ ...eventForm, event_date: e.target.value })} style={{ ...iS, marginBottom: 0 }} /></div>
              <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>End Date</label><input type="date" value={eventForm.event_end_date} onChange={e => setEventForm({ ...eventForm, event_end_date: e.target.value })} style={{ ...iS, marginBottom: 0 }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Start Time</label><input type="time" value={eventForm.event_start_time} onChange={e => setEventForm({ ...eventForm, event_start_time: e.target.value })} style={{ ...iS, marginBottom: 0 }} /></div>
              <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>End Time</label><input type="time" value={eventForm.event_end_time} onChange={e => setEventForm({ ...eventForm, event_end_time: e.target.value })} style={{ ...iS, marginBottom: 0 }} /></div>
            </div>
            <input placeholder="Venue" value={eventForm.venue} onChange={e => setEventForm({ ...eventForm, venue: e.target.value })} style={iS} />
            <input placeholder="Event Type" value={eventForm.event_type} onChange={e => setEventForm({ ...eventForm, event_type: e.target.value })} style={iS} />
            <textarea placeholder="Event Description" value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} rows={3} style={{ ...iS, resize: "vertical" }} />
            <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>🎟️ Tickets / Info URL</label>
            <input placeholder="e.g. eventbrite.com/your-event" value={eventForm.info_url} onChange={e => setEventForm({ ...eventForm, info_url: e.target.value })} style={iS} />
            <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>📸 Event Flyer <span style={{ color: "#cc0000" }}>*</span></label>
            {flyerPreviewSrc ? (
              <div style={{ marginBottom: 10 }}>
                <div style={{ height: 200, borderRadius: 8, overflow: "hidden", border: "2px solid #AABB23", marginBottom: 6 }}>
                  <img src={flyerPreviewSrc} alt="flyer" onClick={() => setFlyerFullscreen(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "zoom-in" }} />
                </div>
                <button onClick={() => { setFlyerFile(null); setEventForm({ ...eventForm, flyer_url: "" }); }} style={{ fontSize: 12, color: "#cc0000", background: "none", border: "none", cursor: "pointer" }}>✕ Remove flyer</button>
              </div>
            ) : (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#991b1b", fontWeight: "bold" }}>⚠️ A flyer image is required.</p>
              </div>
            )}
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={e => { setFlyerFile(e.target.files[0]); setShowFlyerPicker(false); }} style={{ display: "block", marginBottom: 10 }} />
            <button onClick={() => setShowFlyerPicker(!showFlyerPicker)} style={{ padding: "4px 12px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, marginBottom: 8 }}>{showFlyerPicker ? "Hide" : "Browse Placeholders"}</button>
            {showFlyerPicker && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10, marginBottom: 14, padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8 }}>
                {FLYER_PLACEHOLDERS.map((src, i) => (
                  <div key={i} onClick={() => { setEventForm({ ...eventForm, flyer_url: src }); setFlyerFile(null); setShowFlyerPicker(false); }}
                    style={{ height: 80, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: eventForm.flyer_url === src ? "3px solid #AABB23" : "2px solid transparent" }}>
                    <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              {editingEvent && <button onClick={() => { setEditingEvent(null); setEventForm(BLANK_EVENT); setFlyerFile(null); setShowFlyerPicker(false); }} style={{ padding: "8px 16px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>Cancel</button>}
              <button onClick={saveEvent} disabled={savingEvent} style={{ padding: "8px 20px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>{savingEvent ? "Saving..." : editingEvent ? "Update Event" : "Add Event"}</button>
            </div>
          </div>
          {events.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {events.map(ev => (
                <div key={ev.id} style={{ backgroundColor: "white", borderRadius: 8, padding: "12px 16px", border: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    {ev.flyer_url && (
                      <div style={{ width: 56, height: 56, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0 }}>
                        <img src={ev.flyer_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontWeight: "bold", fontSize: 14 }}>{ev.event_name}</p>
                      {ev.category && <p style={{ margin: "1px 0 0", fontSize: 11, color: "#AABB23", fontWeight: "bold" }}>{ev.category}</p>}
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>
                        {ev.event_date ? new Date(ev.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date TBD"}
                        {ev.event_start_time && ` · ${formatTime(ev.event_start_time)}`}
                      </p>
                      {ev.venue && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#aaa" }}>{ev.venue}</p>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => { setEditingEvent(ev.id); setEventForm({ event_name: ev.event_name, event_date: ev.event_date || "", event_end_date: ev.event_end_date || "", event_start_time: ev.event_start_time || "", event_end_time: ev.event_end_time || "", venue: ev.venue || "", event_type: ev.event_type || "", category: ev.category || "", description: ev.description || "", info_url: ev.info_url || "", flyer_url: ev.flyer_url || "" }); setFlyerFile(null); }} style={{ padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Edit</button>
                    <button onClick={() => deleteEvent(ev.id)} style={{ padding: "6px 12px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {events.length === 0 && <p style={{ fontSize: 13, color: "#888", margin: 0 }}>No events yet. Add your first event above!</p>}
        </div>
      )}

      {message && <p style={{ padding: "12px 16px", backgroundColor: message.startsWith("✅") ? "#f0fdf4" : message.startsWith("⚠️") ? "#fff8e1" : "#fef2f2", border: `1px solid ${message.startsWith("✅") ? "#86efac" : message.startsWith("⚠️") ? "#f0c040" : "#fca5a5"}`, borderRadius: 6, color: message.startsWith("✅") ? "#166534" : message.startsWith("⚠️") ? "#856404" : "#991b1b", fontWeight: "bold", marginTop: 16 }}>{message}</p>}

      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={() => router.replace("/organizer-dashboard")} style={{ padding: "12px 20px", backgroundColor: "#ccc", border: "none", borderRadius: 20, fontWeight: "bold", cursor: "pointer" }}>← Back</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: "12px 24px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, fontWeight: "bold", cursor: "pointer", fontSize: 15 }}>{saving ? "Saving..." : "Save Profile"}</button>
      </div>

      {flyerFullscreen && flyerPreviewSrc && (
        <div onClick={() => setFlyerFullscreen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, cursor: "zoom-out" }}>
          <img src={flyerPreviewSrc} style={{ maxWidth: "95%", maxHeight: "95vh", borderRadius: 8, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}

const iS = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };
const lS = { display: "block", fontWeight: "bold", marginBottom: 6, fontSize: 14, color: "#333" };
