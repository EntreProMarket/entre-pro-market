// pages/organizer-profile.js
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import useInactivityLogout from "../hooks/useInactivityLogout";
import ImageEditor from "../components/ImageEditor";
import useDragReorder from "../components/useDragReorder";
import OrganizerShopTab from "../components/OrganizerShopTab";

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

// ── DRAFT SAVING — every text field below auto-saves to this device's
// localStorage as the user types, and restores automatically if they leave
// without saving. Cleared the moment Save Profile (or Add/Update Event)
// succeeds. ──
const DRAFT_PREFIX = "draft_organizer_profile_";
function loadDraft(key, fallback) {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(DRAFT_PREFIX + key);
  return v !== null ? v : fallback;
}
function saveDraft(key, value) {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(DRAFT_PREFIX + key, value);
  else window.localStorage.removeItem(DRAFT_PREFIX + key);
}
const PROFILE_DRAFT_KEYS = ["organizerName", "handle", "category", "city", "stateVal", "description", "website", "instagram", "facebook", "tiktok", "youtube", "xTwitter", "tags"];
const EVENT_DRAFT_KEYS = ["event_name", "event_date", "event_end_date", "event_start_time", "event_end_time", "venue", "venue_address", "event_type", "category", "description", "info_url", "price"];
function clearDrafts(keys) { keys.forEach(k => saveDraft(k, "")); }

// ── VIDEO/GIF HELPERS ──
const VIDEO_EXT = [".mp4", ".mov", ".webm", ".ogg", ".m4v"];
const GIF_EXT = [".gif"];
function isUploadedVideoUrl(url) { if (!url) return false; const clean = url.split("?")[0].toLowerCase(); return VIDEO_EXT.some(ext => clean.endsWith(ext)); }
function isUploadedGifUrl(url) { if (!url) return false; const clean = url.split("?")[0].toLowerCase(); return GIF_EXT.some(ext => clean.endsWith(ext)); }
const MAX_VIDEO_MB = 50;
const MAX_GIF_MB = 15;

const DEFAULT_LOGOS = ["/default-logos/EPM-PH1.png", "/default-logos/EPM-PH2.png", "/default-logos/EPM-PH3.png"];
const FLYER_PLACEHOLDERS = ["/default-logos/EPM-PH1.png", "/default-logos/EPM-PH2.png", "/default-logos/EPM-PH3.png"];
const EVENT_CATEGORIES = ["Music Event","Pop Up Shop","Business Expo","Fashion Show","Spoken Word","Meet & Greet","Art Show","Dance Event","Party","Classes","Paint & Sip","Festival","Corporate Event","Wedding","Birthday","Fundraiser","Community Event","Sports Event","Recording Studio","Venue","Other"];
const BLANK_EVENT = { event_name: "", event_date: "", event_end_date: "", event_start_time: "", event_end_time: "", venue: "", venue_address: "", event_type: "", category: "", description: "", info_url: "", flyer_url: "", price: "" };
const FEATURED_COUNT = 4; // first 4 photos in the saved order are the featured/top ones

// ── Portfolio: non-destructive drag-to-reposition (same as Vendor), box
// sized to each photo's own natural aspect so the collage look is kept.
// Position/zoom stored as a #pos=x,y,zoom tag on the image's own URL. ──
function parsePortfolioPos(url) {
  if (!url) return { src: url, position: { x: 50, y: 50 }, zoom: 1 };
  const [base, frag] = url.split("#pos=");
  if (!frag) return { src: base, position: { x: 50, y: 50 }, zoom: 1 };
  const [x, y, z] = frag.split(",").map(Number);
  return { src: base, position: { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y }, zoom: isNaN(z) || z < 1 ? 1 : z };
}
function withPortfolioPos(url, pos, zoom = 1) {
  if (!url) return url;
  const base = url.split("#")[0];
  if (!pos) return base;
  return `${base}#pos=${pos.x.toFixed(1)},${pos.y.toFixed(1)},${zoom.toFixed(2)}`;
}
function PositionablePortfolioImage({ src, position, zoom, onChange, onZoomChange }) {
  const [aspect, setAspect] = useState(1);
  const ref = useRef(null);
  const dragState = useRef(null);
  const pinchState = useRef(null);
  const handleImgLoad = (e) => { const el = e.target; if (el.naturalWidth && el.naturalHeight) setAspect(el.naturalWidth / el.naturalHeight); };
  const handlePointerDown = (e) => { dragState.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y }; e.target.setPointerCapture?.(e.pointerId); };
  const handlePointerMove = (e) => {
    if (!dragState.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - dragState.current.x, dy = e.clientY - dragState.current.y;
    onChange({ x: Math.min(100, Math.max(0, dragState.current.posX - (dx / rect.width) * 100)), y: Math.min(100, Math.max(0, dragState.current.posY - (dy / rect.height) * 100)) });
  };
  const handlePointerUp = () => { dragState.current = null; };
  const handleWheel = (e) => { e.preventDefault(); onZoomChange(Math.min(3, Math.max(1, zoom + (e.deltaY < 0 ? 0.1 : -0.1)))); };
  const handleTouchStart = (e) => { if (e.touches.length === 2) { const [t0, t1] = e.touches; pinchState.current = { dist: Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY), startZoom: zoom }; } };
  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchState.current) {
      e.preventDefault();
      const [t0, t1] = e.touches;
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      onZoomChange(Math.min(3, Math.max(1, pinchState.current.startZoom * (dist / pinchState.current.dist))));
    }
  };
  const handleTouchEnd = () => { pinchState.current = null; };
  return (
    <div ref={ref} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
      onWheel={handleWheel} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
      style={{ width: "100%", aspectRatio: aspect, borderRadius: 8, overflow: "hidden", border: "2px solid #AABB23", cursor: "grab", touchAction: "none", position: "relative", backgroundColor: "#eee" }}>
      <img src={src} onLoad={handleImgLoad} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${position.x}% ${position.y}%`, transform: `scale(${zoom})`, transformOrigin: "center", display: "block", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 4, right: 6, backgroundColor: "rgba(0,0,0,0.55)", color: "white", fontSize: 9, padding: "2px 6px", borderRadius: 8 }}>✋ Drag{zoom > 1 ? ` · 🔍${zoom.toFixed(1)}x` : ""} · pinch to zoom</div>
    </div>
  );
}

export default function OrganizerProfile() {
  useInactivityLogout();
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
  const [logoFilePreview, setLogoFilePreview] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [portfolioFiles, setPortfolioFiles] = useState([]); // [{file, position, zoom}]
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [portfolioPositions, setPortfolioPositions] = useState([]); // [{position, zoom}] parallel to portfolioImages
  const portfolioDrag = useDragReorder((from, to) => movePortfolioImage(from, to));
  const [activeTab, setActiveTab] = useState("profile");
  const [imageLimits, setImageLimits] = useState({ basic: 10, pro: 20, elite: 40 });
  const [videoUrls, setVideoUrls] = useState(["","","","",""]);
  const [videoFiles, setVideoFiles] = useState([null, null, null, null, null]);
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState(BLANK_EVENT);
  const [savingEvent, setSavingEvent] = useState(false);
  const [flyerFile, setFlyerFile] = useState(null);
  const [flyerFilePreview, setFlyerFilePreview] = useState(null);
  const [flyerEditSrc, setFlyerEditSrc] = useState(null);
  const [showFlyerPicker, setShowFlyerPicker] = useState(false);
  const [flyerFullscreen, setFlyerFullscreen] = useState(false);
  const [editingLogo, setEditingLogo] = useState(false);
  const [logoEditSrc, setLogoEditSrc] = useState(null);
  const [logoOriginalSrc, setLogoOriginalSrc] = useState(null);
  const [repoUploading, setRepoUploading] = useState(false);

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
        // ── Restore any unsaved draft first, falling back to the saved DB value. ──
        setOrganizerName(loadDraft("organizerName", p.organizer_name || ""));
        setHandle(loadDraft("handle", p.handle || ""));
        setCategory(loadDraft("category", p.category || ""));
        setCity(loadDraft("city", p.city || ""));
        setStateVal(loadDraft("stateVal", p.state || ""));
        setDescription(loadDraft("description", p.description || ""));
        setWebsite(loadDraft("website", p.website || ""));
        setInstagram(loadDraft("instagram", p.instagram || ""));
        setFacebook(loadDraft("facebook", p.facebook || ""));
        setTiktok(loadDraft("tiktok", p.tiktok || ""));
        setYoutube(loadDraft("youtube", p.youtube || ""));
        setXTwitter(loadDraft("xTwitter", p.x_twitter || ""));
        setTags(loadDraft("tags", p.tags ? p.tags.join(", ") : ""));
        setLogoUrl(p.logo_url ? p.logo_url.split("#")[0] : "");
        const pImgs = p.portfolio_images || [];
        setPortfolioImages(pImgs.map(url => parsePortfolioPos(url).src));
        setPortfolioPositions(pImgs.map(url => { const parsed = parsePortfolioPos(url); return { position: parsed.position, zoom: parsed.zoom }; }));
        setAccountType(p.account_type || "basic");
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

  const uploadFile = async (file, bucket, attempt = 1) => {
    const fileName = `${Date.now()}-${file.name}`;
    try {
      const { error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) {
        if (attempt < 3 && /fetch|network|timeout/i.test(error.message || "")) {
          await new Promise(r => setTimeout(r, 1500 * attempt));
          return uploadFile(file, bucket, attempt + 1);
        }
        setMessage("❌ Upload error: " + error.message);
        return null;
      }
      return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
    } catch (err) {
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 1500 * attempt));
        return uploadFile(file, bucket, attempt + 1);
      }
      setMessage("❌ Upload error: " + err.message + " — your connection may have dropped mid-upload. Please try again on a stronger connection.");
      return null;
    }
  };

  // ── field helper: updates state + saves draft in one call ──
  const setField = (setter, draftKey) => (value) => { setter(value); saveDraft(draftKey, value); };
  const fOrganizerName = setField(setOrganizerName, "organizerName");
  const fHandle = (v) => { const clean = sanitizeHandle(v); setHandle(clean); saveDraft("handle", clean); };
  const fCategory = setField(setCategory, "category");
  const fCity = setField(setCity, "city");
  const fStateVal = setField(setStateVal, "stateVal");
  const fDescription = setField(setDescription, "description");
  const fWebsite = setField(setWebsite, "website");
  const fInstagram = setField(setInstagram, "instagram");
  const fFacebook = setField(setFacebook, "facebook");
  const fTiktok = setField(setTiktok, "tiktok");
  const fYoutube = setField(setYoutube, "youtube");
  const fXTwitter = setField(setXTwitter, "xTwitter");
  const fTags = setField(setTags, "tags");

  // ── VIDEO/GIF FILE PICK ──
  const handleVideoFilePick = (i, file) => {
    if (!file) return;
    const isGif = file.type === "image/gif";
    const isVideo = file.type.startsWith("video/");
    if (!isGif && !isVideo) { setMessage("❌ Please choose a video file (MP4, MOV, WebM) or a GIF."); return; }
    const maxBytes = (isGif ? MAX_GIF_MB : MAX_VIDEO_MB) * 1024 * 1024;
    if (file.size > maxBytes) { setMessage(`❌ File too large. Max ${isGif ? MAX_GIF_MB : MAX_VIDEO_MB}MB for ${isGif ? "GIFs" : "videos"}.`); return; }
    setMessage("");
    const vf = [...videoFiles]; vf[i] = file; setVideoFiles(vf);
    const vu = [...videoUrls]; vu[i] = URL.createObjectURL(file); setVideoUrls(vu);
  };

  const removeVideoSlot = (i) => {
    const vf = [...videoFiles]; vf[i] = null; setVideoFiles(vf);
    const vu = [...videoUrls]; vu[i] = ""; setVideoUrls(vu);
  };

  // ── Drag to reorder: moves the photo from one slot to another in BOTH
  // arrays together so each photo keeps its own position/zoom. The saved
  // order IS the display order — the first 4 are the featured ones. ──
  const movePortfolioImage = (from, to) => {
    if (from === to || from < 0 || to < 0) return;
    const reorder = (arr) => { const a = [...arr]; const [item] = a.splice(from, 1); a.splice(to, 0, item); return a; };
    setPortfolioImages(prev => reorder(prev));
    setPortfolioPositions(prev => reorder(prev));
  };

  const handleSave = async () => {
    if (accountType === "elite" && (eventForm.event_name.trim() !== "" || flyerFile)) {
      setMessage(`⚠️ You have an unsaved event in progress ("${eventForm.event_name || "untitled"}"). Please tap "${editingEvent ? "Update Event" : "Add Event"}" first, or clear the event fields, before saving your profile — otherwise it will be lost.`);
      return;
    }
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.email) { setMessage("❌ Your account doesn't have an email address. Please update your email in Settings before saving."); return; }
    if (!logoUrl && !logoFile) { setMessage("⚠️ Please upload a logo or choose a placeholder before saving."); return; }
    if (!handle) { setMessage("❌ Please enter a handle for your profile."); return; }
    if (!isValidHandle(handle)) { setMessage("❌ Handle can only contain letters, numbers, hyphens (-) and underscores (_). No spaces."); return; }
    if (!user) return;
    setSaving(true); setMessage("");
    try {
      let uploadedLogoUrl = logoUrl;
      if (logoFile) { const up = await uploadFile(logoFile, "organizer-logos"); if (up) uploadedLogoUrl = up; }

      let updatedPortfolio = portfolioImages.map((url, i) => withPortfolioPos(url, portfolioPositions[i]?.position, portfolioPositions[i]?.zoom));
      if (portfolioFiles.length > 0) {
        const remaining = (imageLimits[accountType] ?? 10) - updatedPortfolio.length;
        for (const item of portfolioFiles.slice(0, remaining)) {
          const url = await uploadFile(item.file, "organizer-portfolio");
          if (url) updatedPortfolio.push(withPortfolioPos(url, item.position, item.zoom));
        }
      }
      let finalVideoUrls = [...videoUrls];
      for (let i = 0; i < videoFiles.length; i++) {
        if (videoFiles[i]) {
          const up = await uploadFile(videoFiles[i], "organizer-videos");
          if (up) finalVideoUrls[i] = up;
          else { setSaving(false); return; }
        }
      }
      const { error } = await supabase.from("profiles").upsert({
        id: user.id, organizer_name: organizerName, handle, category, city, state: stateVal, description,
        website: formatSocialLink("website", website), instagram: formatSocialLink("instagram", instagram),
        facebook: formatSocialLink("facebook", facebook), tiktok: formatSocialLink("tiktok", tiktok),
        youtube: formatSocialLink("youtube", youtube), x_twitter: formatSocialLink("x_twitter", xTwitter),
        tags: tags.split(",").map(t => t.trim()).filter(Boolean), logo_url: uploadedLogoUrl,
        portfolio_images: updatedPortfolio, pinned_portfolio: [],
        video_urls: accountType === "elite" ? finalVideoUrls.filter(v => v.trim()) : [],
        role: "organizer",
      });
      if (error) throw error;
      setPortfolioImages(updatedPortfolio.map(u => parsePortfolioPos(u).src));
      setPortfolioPositions(updatedPortfolio.map(u => { const parsed = parsePortfolioPos(u); return { position: parsed.position, zoom: parsed.zoom }; }));
      setPortfolioFiles([]); setLogoUrl(uploadedLogoUrl); setLogoFile(null); setLogoFilePreview(null);
      setVideoUrls(finalVideoUrls); setVideoFiles([null, null, null, null, null]);
      clearDrafts(PROFILE_DRAFT_KEYS);
      setMessage("✅ Profile saved!");
      setTimeout(() => router.replace(`/organizer/${handle}`), 1200);
    } catch (err) { setMessage("❌ Error: " + err.message); }
    setSaving(false);
  };

  const fEvent = (field) => (value) => { setEventForm(prev => { const next = { ...prev, [field]: value }; saveDraft(`event_${field}`, value); return next; }); };

  const saveEvent = async () => {
    if (!eventForm.event_name.trim()) { setMessage("⚠️ Event name is required."); return; }
    if (!eventForm.flyer_url && !flyerFile) { setMessage("⚠️ A flyer image is required."); return; }
    setSavingEvent(true); setMessage("");
    let flyerUrl = eventForm.flyer_url || "";
    if (flyerFile) {
      const up = await uploadFile(flyerFile, "organizer-portfolio");
      if (!up) { setSavingEvent(false); return; }
      flyerUrl = up;
    }
    const eventData = {
      event_name: eventForm.event_name, event_date: eventForm.event_date || null,
      event_end_date: eventForm.event_end_date || null, event_start_time: eventForm.event_start_time || null,
      event_end_time: eventForm.event_end_time || null, venue: eventForm.venue, venue_address: eventForm.venue_address || "",
      event_type: eventForm.event_type, category: eventForm.category, price: eventForm.price || "",
      description: eventForm.description, info_url: formatUrl(eventForm.info_url), flyer_url: flyerUrl,
    };
    try {
      if (editingEvent) {
        const { error } = await supabase.from("organizer_events").update(eventData).eq("id", editingEvent);
        if (error) throw error;
        setEvents(events.map(e => e.id === editingEvent ? { ...e, ...eventData } : e));
      } else {
        const { data, error } = await supabase.from("organizer_events").insert([{ ...eventData, organizer_id: user.id }]).select().single();
        if (error) throw error;
        if (data) setEvents([...events, data]);
      }
      setEditingEvent(null); setEventForm(BLANK_EVENT); setFlyerFile(null); setFlyerFilePreview(null); setFlyerEditSrc(null); setShowFlyerPicker(false);
      clearDrafts(EVENT_DRAFT_KEYS.map(k => `event_${k}`));
      setMessage("✅ Event saved!");
    } catch (err) {
      setMessage("❌ Error saving event: " + err.message);
    }
    setSavingEvent(false);
  };

  const deleteEvent = async (id) => {
    if (!confirm("Delete this event?")) return;
    await supabase.from("organizer_events").delete().eq("id", id);
    setEvents(events.filter(e => e.id !== id));
  };

  const removePortfolioImage = async (idx) => {
    const url = portfolioImages[idx];
    await supabase.storage.from("organizer-portfolio").remove([url.split("/").pop()]);
    const updatedImages = portfolioImages.filter((_, i) => i !== idx);
    const updatedPositions = portfolioPositions.filter((_, i) => i !== idx);
    setPortfolioImages(updatedImages);
    setPortfolioPositions(updatedPositions);
    if (user) await supabase.from("profiles").update({ portfolio_images: updatedImages.map((u, i) => withPortfolioPos(u, updatedPositions[i]?.position, updatedPositions[i]?.zoom)), pinned_portfolio: [] }).eq("id", user.id);
  };

  const imageLimit = imageLimits[accountType] ?? 10;
  const atLimit = portfolioImages.length + portfolioFiles.length >= imageLimit;
  useEffect(() => {
    if (!flyerFile) { setFlyerFilePreview(null); return; }
    const url = URL.createObjectURL(flyerFile);
    setFlyerFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [flyerFile]);
  const flyerPreviewSrc = flyerFilePreview || eventForm.flyer_url;

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, fontFamily: "sans-serif" }}>
      {(saving || savingEvent || repoUploading) && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center" }}>
          <style>{`@keyframes epm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 56, animation: "epm-spin 1.6s linear infinite", marginBottom: 20 }}>⏳</div>
          <p style={{ color: "white", fontWeight: "bold", fontSize: 17, margin: "0 0 8px" }}>Uploading your files...</p>
          <p style={{ color: "#ddd", fontSize: 14, maxWidth: 320, lineHeight: 1.6, margin: 0 }}>Photos and videos can take a moment, especially on mobile data. Please stay on this page and be patient — we'll retry automatically if your connection blips.</p>
        </div>
      )}

      <h1 style={{ marginBottom: 20 }}>Edit Organizer Profile</h1>

      {accountType === "elite" && (
        <div style={{ display: "flex", marginBottom: 24, borderBottom: "2px solid #ddd" }}>
          <button onClick={() => setActiveTab("profile")} style={{ flex: 1, padding: 12, border: "none", background: "none", cursor: "pointer", fontWeight: activeTab === "profile" ? "bold" : "normal", borderBottom: activeTab === "profile" ? "4px solid #701890" : "4px solid transparent" }}>📋 Profile</button>
          <button onClick={() => setActiveTab("shop")} style={{ flex: 1, padding: 12, border: "none", background: "none", cursor: "pointer", fontWeight: activeTab === "shop" ? "bold" : "normal", borderBottom: activeTab === "shop" ? "4px solid #701890" : "4px solid transparent" }}>🛒 Shop / Products</button>
        </div>
      )}

      {accountType === "elite" && activeTab === "shop" && user && <OrganizerShopTab userId={user.id} />}

      {(accountType !== "elite" || activeTab === "profile") && (
      <>

      <input placeholder="Organizer Name" value={organizerName} onChange={e => fOrganizerName(e.target.value)} style={iS} />

      <div style={{ marginBottom: 12 }}>
        <input placeholder="Handle (e.g. MyEvents)" value={handle} onChange={e => fHandle(e.target.value)}
          style={{ ...iS, marginBottom: 4, borderColor: handle && !isValidHandle(handle) ? "#cc0000" : "#d1d5db" }} />
        {handle ? (isValidHandle(handle) ? <p style={{ margin: 0, fontSize: 12, color: "#166534" }}>✅ app.entrepromarket.com/organizer/{handle}</p> : <p style={{ margin: 0, fontSize: 12, color: "#cc0000" }}>❌ Only letters, numbers, hyphens and underscores. No spaces.</p>) : <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Your profile URL: app.entrepromarket.com/organizer/YourHandle</p>}
      </div>

      <select value={category} onChange={e => fCategory(e.target.value)} style={iS}>
        <option value="">Select a Category...</option>
        {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input placeholder="City" value={city} onChange={e => fCity(e.target.value)} style={iS} />
      <input placeholder="State" value={stateVal} onChange={e => fStateVal(e.target.value)} style={iS} />
      <textarea placeholder="Description" value={description} onChange={e => fDescription(e.target.value)} rows={4} style={{ ...iS, resize: "vertical" }} />
      <div style={{ backgroundColor: "#fff0f0", border: "1px solid #f5c6c6", borderRadius: 6, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#cc0000" }}>⚠️ Links must be public or they may not open correctly.</div>
      <input placeholder="Website" value={website} onChange={e => fWebsite(e.target.value)} style={iS} />
      <input placeholder="Instagram" value={instagram} onChange={e => fInstagram(e.target.value)} style={iS} />
      <input placeholder="Facebook" value={facebook} onChange={e => fFacebook(e.target.value)} style={iS} />
      <input placeholder="TikTok" value={tiktok} onChange={e => fTiktok(e.target.value)} style={iS} />
      <input placeholder="YouTube" value={youtube} onChange={e => fYoutube(e.target.value)} style={iS} />
      <input placeholder="X / Twitter" value={xTwitter} onChange={e => fXTwitter(e.target.value)} style={iS} />
      <input placeholder="Tags (comma separated)" value={tags} onChange={e => fTags(e.target.value)} style={iS} />

          {/* LOGO */}
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <label style={lS}>Logo <span style={{ color: "#cc0000" }}>*</span></label>
        {editingLogo ? (
          <ImageEditor
            src={logoEditSrc}
            aspect={null}
            onCancel={() => setEditingLogo(false)}
            onDone={(file, previewUrl) => { setLogoFile(file); setLogoFilePreview(previewUrl); setEditingLogo(false); }}
          />
        ) : (logoFilePreview || logoUrl) ? (
          <div style={{ maxWidth: 220, marginBottom: 8, position: "relative" }}>
            <div style={{ borderRadius: 8, overflow: "hidden", border: "2px solid #701890" }}>
              <img src={logoFilePreview || logoUrl} style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
            <button type="button" onClick={() => { setLogoEditSrc(logoOriginalSrc || logoFilePreview || logoUrl); setEditingLogo(true); }} style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: 10, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>🎯 Reposition</button>
          </div>
        ) : (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#991b1b", fontWeight: "bold" }}>⚠️ Upload a logo or choose a placeholder below.</p>
          </div>
        )}
        {!editingLogo && (
          <>
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (!f) return; const url = URL.createObjectURL(f); setLogoOriginalSrc(url); setLogoEditSrc(url); setEditingLogo(true); e.target.value = ""; }} style={{ display: "block", marginBottom: 10 }} />
            <button onClick={() => setShowLogoPicker(!showLogoPicker)} style={{ padding: "4px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12 }}>{showLogoPicker ? "Hide" : "Browse Placeholders"}</button>
            {showLogoPicker && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 10, marginTop: 10, padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8, border: "1px solid #eee" }}>
                {DEFAULT_LOGOS.map((src, i) => (
                  <div key={i} onClick={() => { setLogoOriginalSrc(src); setLogoEditSrc(src); setShowLogoPicker(false); setEditingLogo(true); }}
                    style={{ height: 80, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: "2px solid transparent" }}>
                    <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* PORTFOLIO */}
      <div style={{ marginTop: 20, marginBottom: 8 }}>
        <label style={lS}>Portfolio</label>
        <p style={{ fontSize: 12, color: atLimit ? "#cc0000" : "#888", marginBottom: 8 }}>{portfolioImages.length}/{imageLimit} images{atLimit && " — Remove some before adding more"}</p>
        <div style={{ backgroundColor: "#fff8e1", border: "1px solid #f0c040", borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#856404" }}>⚠️ JPG, PNG, WebP only. No HEIC. Hold and drag the ⠿ handle on any photo to slide it into the order you want — the first {FEATURED_COUNT} photos are your featured ones at the top.</div>
        {portfolioImages.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 12 }}>
            {portfolioImages.map((img, i) => (
              <div key={img} ref={portfolioDrag.setItemRef(i)} style={{ position: "relative", borderRadius: 8, ...portfolioDrag.itemStyle(i) }}>
                <PositionablePortfolioImage
                  src={img}
                  position={portfolioPositions[i]?.position || { x: 50, y: 50 }}
                  zoom={portfolioPositions[i]?.zoom || 1}
                  onChange={(pos) => setPortfolioPositions(prev => prev.map((p, idx) => idx === i ? { ...p, position: pos } : p))}
                  onZoomChange={(z) => setPortfolioPositions(prev => prev.map((p, idx) => idx === i ? { ...p, zoom: z } : p))}
                />
                <button onClick={() => removePortfolioImage(i)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 12, lineHeight: "22px", textAlign: "center", padding: 0 }}>×</button>
                <div
                  {...portfolioDrag.handleProps(i)}
                  title="Hold and drag to reorder"
                  style={{ position: "absolute", top: 4, left: 4, ...portfolioDrag.handleBaseStyle, background: i < FEATURED_COUNT ? "#AABB23" : "rgba(0,0,0,0.6)", color: "white", borderRadius: 10, padding: "4px 9px", fontSize: 13, fontWeight: "bold" }}
                >⠿ {i + 1}</div>
              </div>
            ))}
          </div>
        )}
        {portfolioFiles.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ backgroundColor: "#fff8e1", border: "1px solid #f0c040", borderRadius: 6, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#856404" }}>
              📥 {portfolioFiles.length} new photo{portfolioFiles.length > 1 ? "s" : ""} ready — drag to position, then click <strong>Save Profile</strong> below.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
              {portfolioFiles.map((item, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <PositionablePortfolioImage
                    src={URL.createObjectURL(item.file)}
                    position={item.position}
                    zoom={item.zoom}
                    onChange={(pos) => setPortfolioFiles(prev => prev.map((it, idx) => idx === i ? { ...it, position: pos } : it))}
                    onZoomChange={(z) => setPortfolioFiles(prev => prev.map((it, idx) => idx === i ? { ...it, zoom: z } : it))}
                  />
                  <button onClick={() => setPortfolioFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 12, lineHeight: "22px", textAlign: "center", padding: 0 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {!atLimit && (
          <input type="file" accept="image/*" multiple onChange={e => {
            const rem = imageLimit - portfolioImages.length - portfolioFiles.length;
            const files = Array.from(e.target.files).slice(0, rem);
            if (Array.from(e.target.files).length > rem) alert(`You can only add ${rem} more image(s).`);
            e.target.value = "";
            if (files.length === 0) return;
            setPortfolioFiles(prev => [...prev, ...files.map(file => ({ file, position: { x: 50, y: 50 }, zoom: 1 }))]);
          }} style={{ display: "block" }} />
        )}
      </div>

      {/* ELITE: VIDEOS & GIFS */}
      {accountType === "elite" && (
        <div style={{ marginTop: 20, marginBottom: 20, backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 10, padding: 16 }}>
          <label style={{ ...lS, color: "#888B00" }}>👑 Videos & GIFs (up to 5)</label>
          <p style={{ fontSize: 12, color: "#666", marginTop: -4, marginBottom: 12 }}>Paste a YouTube, Instagram, or TikTok link — or upload your own MP4/MOV/WebM video or GIF directly (max {MAX_VIDEO_MB}MB for video, {MAX_GIF_MB}MB for GIF).</p>
          {Array.from({ length: 5 }).map((_, i) => {
            const current = videoUrls[i] || "";
            const isFilePreview = !!videoFiles[i];
            const isVideoLike = isFilePreview ? videoFiles[i].type.startsWith("video/") : isUploadedVideoUrl(current);
            const isGifLike = isFilePreview ? videoFiles[i].type === "image/gif" : isUploadedGifUrl(current);
            return (
              <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < 4 ? "1px solid #e5efc0" : "none" }}>
                {current && (isVideoLike || isGifLike) ? (
                  <div style={{ marginBottom: 8, position: "relative" }}>
                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #AABB23", maxWidth: 260 }}>
                      {isGifLike
                        ? <img src={current} alt={`gif ${i + 1}`} style={{ width: "100%", display: "block" }} />
                        : <video src={current} controls style={{ width: "100%", display: "block", maxHeight: 180 }} />}
                    </div>
                    <button onClick={() => removeVideoSlot(i)} style={{ marginTop: 6, fontSize: 12, color: "#cc0000", background: "none", border: "none", cursor: "pointer", padding: 0 }}>✕ Remove</button>
                  </div>
                ) : (
                  <input
                    value={current}
                    onChange={e => { const u = [...videoUrls]; u[i] = e.target.value; setVideoUrls(u); }}
                    placeholder={`Video link ${i + 1} (YouTube, Instagram, TikTok...)`}
                    style={{ ...iS, marginBottom: 8 }}
                  />
                )}
                {!current && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ display: "inline-block", fontSize: 12, color: "#701890", cursor: "pointer" }}>
                      📤 Or upload a video file
                      <input
                        type="file"
                        accept="video/*"
                        onChange={e => { handleVideoFilePick(i, e.target.files[0]); e.target.value = ""; }}
                        style={{ display: "block", marginTop: 4 }}
                      />
                    </label>
                    <label style={{ display: "inline-block", fontSize: 12, color: "#701890", cursor: "pointer" }}>
                      📤 Or upload a GIF
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => { handleVideoFilePick(i, e.target.files[0]); e.target.value = ""; }}
                        style={{ display: "block", marginTop: 4 }}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ELITE: EVENTS */}
      {accountType === "elite" && (
        <div style={{ marginTop: 20, marginBottom: 20, backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 10, padding: 16 }}>
          <label style={{ ...lS, color: "#888B00" }}>👑 Events (Elite — Create & Manage)</label>
          <div style={{ backgroundColor: "white", borderRadius: 8, padding: 16, marginBottom: 16, border: "1px solid #eee" }}>
            <p style={{ fontWeight: "bold", marginBottom: 10, fontSize: 14 }}>{editingEvent ? "✏️ Edit Event" : "➕ Add New Event"}</p>
            <input placeholder="Event Name *" value={eventForm.event_name} onChange={e => fEvent("event_name")(e.target.value)} style={iS} />
            <label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Event Category</label>
            <select value={eventForm.category} onChange={e => fEvent("category")(e.target.value)} style={iS}>
              <option value="">Select a Category...</option>
              {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Start Date</label><input type="date" value={eventForm.event_date} onChange={e => fEvent("event_date")(e.target.value)} style={{ ...iS, marginBottom: 0 }} /></div>
              <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>End Date</label><input type="date" value={eventForm.event_end_date} onChange={e => fEvent("event_end_date")(e.target.value)} style={{ ...iS, marginBottom: 0 }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Start Time</label><input type="time" value={eventForm.event_start_time} onChange={e => fEvent("event_start_time")(e.target.value)} style={{ ...iS, marginBottom: 0 }} /></div>
              <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>End Time</label><input type="time" value={eventForm.event_end_time} onChange={e => fEvent("event_end_time")(e.target.value)} style={{ ...iS, marginBottom: 0 }} /></div>
            </div>
            <input placeholder="Venue Name" value={eventForm.venue} onChange={e => fEvent("venue")(e.target.value)} style={iS} />
            <textarea placeholder="Address (street, city, state)" value={eventForm.venue_address || ""} onChange={e => fEvent("venue_address")(e.target.value)} rows={2} style={{ ...iS, resize: "vertical" }} />
            <input placeholder="Event Type" value={eventForm.event_type} onChange={e => fEvent("event_type")(e.target.value)} style={iS} />
            <textarea placeholder="Event Description" value={eventForm.description} onChange={e => fEvent("description")(e.target.value)} rows={3} style={{ ...iS, resize: "vertical" }} />
            <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>💵 Ticket Price</label>
            <textarea placeholder={"One price per line, e.g.:\nGeneral: $25\nVIP: $50\nKids: Free"} value={eventForm.price || ""} onChange={e => fEvent("price")(e.target.value)} rows={3} style={{ ...iS, resize: "vertical" }} />
            <div style={{ backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 6, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#701890" }}>💳 Add your Eventbrite, CashApp, Venmo, Google Pay, or any payment link here to collect ticket payments — you're not limited to Eventbrite. Use this to promote and sell tickets straight through the app.</div>
            <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>🎟️ Tickets / Info URL</label>
            <input placeholder="e.g. eventbrite.com/your-event, cash.app/$you, venmo.com/you" value={eventForm.info_url} onChange={e => fEvent("info_url")(e.target.value)} style={iS} />
            <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>📸 Event Flyer <span style={{ color: "#cc0000" }}>*</span></label>
            {flyerEditSrc ? (
              <div style={{ marginBottom: 10 }}>
                <ImageEditor
                  src={flyerEditSrc}
                  aspect={null}
                  onCancel={() => setFlyerEditSrc(null)}
                  onDone={(file, previewUrl) => { setFlyerFile(file); setFlyerFilePreview(previewUrl); setFlyerEditSrc(null); }}
                />
              </div>
            ) : flyerPreviewSrc ? (
              <div style={{ marginBottom: 10, maxWidth: 300 }}>
                <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #eee", position: "relative" }}>
                  <img src={flyerPreviewSrc} style={{ width: "100%", display: "block", cursor: "zoom-in" }} onClick={() => setFlyerFullscreen(true)} />
                  <button type="button" onClick={() => setFlyerEditSrc(flyerPreviewSrc)} style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: 10, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>🎯 Re-crop</button>
                </div>
                <button onClick={() => { setFlyerFile(null); setFlyerFilePreview(null); setEventForm({ ...eventForm, flyer_url: "" }); }} style={{ fontSize: 12, color: "#cc0000", background: "none", border: "none", cursor: "pointer", marginTop: 6 }}>✕ Remove flyer</button>
              </div>
            ) : (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#991b1b", fontWeight: "bold" }}>⚠️ A flyer image is required.</p>
              </div>
            )}
            {!flyerEditSrc && (
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (!f) return; setFlyerEditSrc(URL.createObjectURL(f)); setShowFlyerPicker(false); e.target.value = ""; }} style={{ display: "block", marginBottom: 10 }} />
            )}
            <button onClick={() => setShowFlyerPicker(!showFlyerPicker)} style={{ padding: "4px 12px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, marginBottom: 8 }}>{showFlyerPicker ? "Hide" : "Browse Placeholders"}</button>
            {showFlyerPicker && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10, marginBottom: 14, padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8 }}>
                {FLYER_PLACEHOLDERS.map((src, i) => (
                  <div key={i} onClick={() => { setEventForm({ ...eventForm, flyer_url: src }); setFlyerFile(null); setFlyerFilePreview(null); setFlyerEditSrc(null); setShowFlyerPicker(false); }}
                    style={{ height: 80, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: eventForm.flyer_url === src ? "3px solid #AABB23" : "2px solid transparent" }}>
                    <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              {editingEvent && <button onClick={() => { setEditingEvent(null); setEventForm(BLANK_EVENT); setFlyerFile(null); setFlyerFilePreview(null); setFlyerEditSrc(null); clearDrafts(EVENT_DRAFT_KEYS.map(k => `event_${k}`)); }} style={{ padding: "8px 16px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>Cancel</button>}
              <button onClick={saveEvent} disabled={savingEvent} style={{ padding: "8px 20px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>{savingEvent ? "Saving..." : editingEvent ? "Update Event" : "Add Event"}</button>
            </div>
          </div>

{events.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {events.map(ev => (
                <div key={ev.id} style={{ backgroundColor: "white", borderRadius: 8, padding: "12px 16px", border: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    {ev.flyer_url && <div style={{ width: 56, height: 56, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0 }}><img src={ev.flyer_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
                    <div>
                      <p style={{ margin: 0, fontWeight: "bold", fontSize: 14 }}>{ev.event_name}</p>
                      {ev.category && <p style={{ margin: "1px 0 0", fontSize: 11, color: "#AABB23", fontWeight: "bold" }}>{ev.category}</p>}
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{ev.event_date ? new Date(ev.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date TBD"}{ev.event_start_time && ` · ${formatTime(ev.event_start_time)}`}</p>
                      {ev.venue && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#aaa" }}>{ev.venue}</p>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => { setEditingEvent(ev.id); setEventForm({ event_name: ev.event_name, event_date: ev.event_date || "", event_end_date: ev.event_end_date || "", event_start_time: ev.event_start_time || "", event_end_time: ev.event_end_time || "", venue: ev.venue || "", venue_address: ev.venue_address || "", event_type: ev.event_type || "", category: ev.category || "", description: ev.description || "", info_url: ev.info_url || "", flyer_url: ev.flyer_url || "", price: ev.price || "" }); setFlyerFile(null); setFlyerFilePreview(null); setFlyerEditSrc(null); }} style={{ padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Edit</button>
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

      </>
      )}

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
