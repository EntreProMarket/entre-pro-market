// components/AdminEpmEventsTab.js
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import useDragReorder from "./useDragReorder";
import HelpTip from "./HelpTip";
import CropModal from "./CropModal";
import { getOrigUrl, baseUrl, tagOrig } from "./cropTags";
import { adjustOvernight } from "./eventDates";
import RichTextArea from "./RichTextArea";

const EVENT_CATEGORIES = ["Music Event","Pop Up Shop","Business Expo","Fashion Show","Spoken Word","Meet & Greet","Art Show","Dance Event","Party","Classes","Paint & Sip","Festival","Corporate Event","Wedding","Birthday","Fundraiser","Community Event","Sports Event","Recording Studio","Venue","Other"];
const FLYER_PLACEHOLDERS = ["/default-logos/EPM-PH1.png", "/default-logos/EPM-PH2.png", "/default-logos/EPM-PH3.png"];
const BLANK_EPM_EVENT = { event_name: "", event_date: "", event_end_date: "", event_start_time: "", event_end_time: "", venue: "", venue_address: "", event_type: "", category: "", description: "", info_url: "", flyer_url: "", price: "" };
const inputStyle = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };

// One stable preview URL per file (a new one every render made photos reload while dragging).
const previewUrlCache = new WeakMap();
function previewUrl(file) {
  let u = previewUrlCache.get(file);
  if (!u) { u = URL.createObjectURL(file); previewUrlCache.set(file, u); }
  return u;
}

function parsePos(url) {
  if (!url) return { src: url, position: { x: 50, y: 50 }, zoom: 1 };
  const [base, frag] = url.split("#pos=");
  if (!frag) return { src: base, position: { x: 50, y: 50 }, zoom: 1 };
  const [x, y, z] = frag.split(",").map(Number);
  return { src: base, position: { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y }, zoom: isNaN(z) || z < 1 ? 1 : z };
}
function withPos(url, pos, zoom = 1) {
  if (!url) return url;
  const base = url.split("#pos=")[0];
  if (!pos) return base;
  return `${base}#pos=${pos.x.toFixed(1)},${pos.y.toFixed(1)},${zoom.toFixed(2)}`;
}
function formatEpmUrl(v) { if (!v || !v.trim()) return ""; const s = v.trim(); return s.startsWith("https://") || s.startsWith("http://") ? s : `https://${s}`; }
function formatEventTime(t) { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; }

function PositionableImage({ src, position, zoom = 1, onChange, onZoomChange, aspectRatio, height, onReplace, onRestore, canRestore, cropSrc, showAdjust = true }) {
  const ref = useRef(null);
  const dragState = useRef(null);
  const pinchState = useRef(null);
  const [adjusting, setAdjusting] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [natAspect, setNatAspect] = useState(null); // the photo's own shape, so the editor shows it exactly like the live page
  const shown = baseUrl(src);
  const origUrl = getOrigUrl(src);
  const cropFrom = cropSrc || origUrl || shown;
  const restorable = !!onRestore && (canRestore !== undefined ? canRestore : !!origUrl);
  const btn = { flex: 1, padding: "10px 4px", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.3)", whiteSpace: "nowrap" };
  const handlePointerDown = (e) => { if (!adjusting) return; dragState.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } };
  const handlePointerMove = (e) => {
    if (!adjusting || !dragState.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - dragState.current.x, dy = e.clientY - dragState.current.y;
    onChange({ x: Math.min(100, Math.max(0, dragState.current.posX - (dx / rect.width) * 100)), y: Math.min(100, Math.max(0, dragState.current.posY - (dy / rect.height) * 100)) });
  };
  const handlePointerUp = () => { dragState.current = null; };
  const handleTouchStart = (e) => { if (adjusting && onZoomChange && e.touches.length === 2) { const [t0, t1] = e.touches; pinchState.current = { dist: Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY), startZoom: zoom }; } };
  const handleTouchMove = (e) => {
    if (adjusting && onZoomChange && e.touches.length === 2 && pinchState.current) {
      const [t0, t1] = e.touches;
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      onZoomChange(Math.min(3, Math.max(1, pinchState.current.startZoom * (dist / pinchState.current.dist))));
    }
  };
  const handleTouchEnd = () => { pinchState.current = null; };
  return (
    <div>
      <div ref={ref} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        style={{ width: "100%", height: height || undefined, aspectRatio: height ? undefined : (aspectRatio || natAspect || undefined), minHeight: (height || aspectRatio || natAspect) ? undefined : 140, borderRadius: 8, overflow: "hidden", border: adjusting ? "3px solid #701890" : "2px solid #701890", cursor: adjusting ? "grab" : "default", touchAction: adjusting ? "none" : "pan-y", position: "relative", backgroundColor: "#eee" }}>
        <img src={shown} onLoad={(e) => { const el = e.target; if (el.naturalWidth && el.naturalHeight) setNatAspect(el.naturalWidth / el.naturalHeight); }} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${position.x}% ${position.y}%`, transform: `scale(${zoom})`, transformOrigin: "center", display: "block", pointerEvents: "none" }} />
        {adjusting && <div style={{ position: "absolute", bottom: 6, left: 6, right: 6, textAlign: "center", backgroundColor: "rgba(112,24,144,0.9)", color: "white", fontSize: 11, fontWeight: "bold", padding: "4px 6px", borderRadius: 8, pointerEvents: "none" }}>{onZoomChange ? "Pinch to zoom, then drag" : "Drag to move"}</div>}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {onReplace && <button type="button" onClick={() => setCropping(true)} style={{ ...btn, backgroundColor: "#701890" }}>✂️ Crop</button>}
        {showAdjust && <button type="button" onClick={() => setAdjusting((a) => !a)} style={{ ...btn, backgroundColor: adjusting ? "#222" : "#8a9a10" }}>{adjusting ? `✓ Done${zoom > 1 ? ` ${zoom.toFixed(1)}x` : ""}` : "✋ Adjust"}</button>}
      </div>
      {restorable && <button type="button" onClick={onRestore} style={{ width: "100%", marginTop: 6, padding: "9px 4px", border: "2px solid #701890", borderRadius: 8, backgroundColor: "white", color: "#701890", fontSize: 12, fontWeight: "bold", cursor: "pointer" }}>↩ Restore original</button>}
      {cropping && <CropModal src={cropFrom} onCancel={() => setCropping(false)} onDone={(file) => { setCropping(false); if (onReplace) onReplace(file); }} />}
    </div>
  );
}

export default function AdminEpmEventsTab() {
  const [epmEvents, setEpmEvents] = useState([]);
  const [eventOrder, setEventOrder] = useState([]);
  const endDateAuto = useRef(false); // true while the End Date was moved to the next day automatically
  const eventDrag = useDragReorder((from, to) => reorderEpmEvents(from, to));
  const [editingEpmEvent, setEditingEpmEvent] = useState(null);
  
// ── DRAFT SAVING — auto-saves this form as one blob and restores it if
// left unsaved. Cleared on successful save or explicit Cancel/Reset. ──
const DRAFT_KEY_EPM = "draft_key_epm_v2";
function loadFormDraft(fallback) {
  if (typeof window === "undefined") return fallback;
  try { const v = window.localStorage.getItem(DRAFT_KEY_EPM); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function clearFormDraft() { if (typeof window !== "undefined") window.localStorage.removeItem(DRAFT_KEY_EPM); }
  const [epmEventForm, setEpmEventForm] = useState(() => loadFormDraft(BLANK_EPM_EVENT));
  const [restoredDraft, setRestoredDraft] = useState(() => {
    const d = loadFormDraft(null);
    return !!d && JSON.stringify(d) !== JSON.stringify(BLANK_EPM_EVENT);
  });
  useEffect(() => {
    if (typeof window === "undefined" || editingEpmEvent) return;
    if (JSON.stringify(epmEventForm) === JSON.stringify(BLANK_EPM_EVENT)) window.localStorage.removeItem(DRAFT_KEY_EPM);
    else window.localStorage.setItem(DRAFT_KEY_EPM, JSON.stringify(epmEventForm));
  }, [epmEventForm, editingEpmEvent]);
  const startFreshEvent = () => {
    setEpmEventForm(BLANK_EPM_EVENT); setEpmFlyerFile(null); setEpmFlyerOrigFile(null); setEpmFlyerOrigUrl(undefined);
    setEpmFlyerPosition({ x: 50, y: 50 }); setShowEpmFlyerPicker(false); clearFormDraft(); endDateAuto.current = false; setRestoredDraft(false); setRestoredDraft(false);
  };
  const [savingEpmEvent, setSavingEpmEvent] = useState(false);
  const [epmFlyerFile, setEpmFlyerFile] = useState(null);
  const [showEpmFlyerPicker, setShowEpmFlyerPicker] = useState(false);
  const [epmFlyerFullscreen, setEpmFlyerFullscreen] = useState(false);
  const [epmFlyerPosition, setEpmFlyerPosition] = useState({ x: 50, y: 50 });
  const [epmFlyerOrigFile, setEpmFlyerOrigFile] = useState(null);
  const [epmFlyerOrigUrl, setEpmFlyerOrigUrl] = useState(undefined);
  const [message, setMessage] = useState("");

  useEffect(() => { loadEpmEvents(); }, []);

  const loadEpmEvents = async () => {
    const { data } = await supabase.from("epm_events").select("*").order("event_date", { ascending: true });
    setEpmEvents(data || []);
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const { data: me } = await supabase.from("profiles").select("event_order").eq("id", authData.user.id).single();
      setEventOrder(me?.event_order || []);
    }
  };

  // ── Order of EPM Events: your dragged order. The first 4 UPCOMING events stay pinned at the
  // top of the homepage's Upcoming Events; everything after them stays in date order. ──
  const orderedEpmEvents = (() => {
    const byId = new Map(epmEvents.map(e => [e.id, e]));
    const inOrder = eventOrder.map(id => byId.get(id)).filter(Boolean);
    const seen = new Set(inOrder.map(e => e.id));
    return [...inOrder, ...epmEvents.filter(e => !seen.has(e.id))];
  })();
  const todayStrForPins = new Date().toISOString().split("T")[0];
  const featuredEventIds = new Set(orderedEpmEvents.filter(e => e.event_date && e.event_date >= todayStrForPins).slice(0, 4).map(e => e.id));
  const reorderEpmEvents = async (from, to) => {
    const ids = orderedEpmEvents.map(e => e.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    setEventOrder(ids);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;
    const { error } = await supabase.from("profiles").update({ event_order: ids }).eq("id", authData.user.id);
    if (error) alert("Couldn't save the event order: " + error.message);
  };

  // Date / time fields: an end time earlier than the start time (10:00 PM -> 2:00 AM) means the event
  // ends the NEXT day, so the End Date moves to the next day for you.
  const onEpmDateTimeChange = (field, value) => {
    const res = adjustOvernight({ ...epmEventForm, [field]: value }, field, endDateAuto.current);
    endDateAuto.current = res.auto;
    setEpmEventForm(res.form);
  };

  // ✂️ Crop the flyer: the original is kept, so ↩ Restore original always brings it back.
  const cropFlyer = async (file) => {
    let origUrl = epmFlyerOrigUrl;
    let origFile = epmFlyerOrigFile;
    if (!origUrl) {
      if (epmFlyerFile) {
        origFile = epmFlyerOrigFile || epmFlyerFile;
        setMessage("⏳ Saving the original flyer...");
        origUrl = (await uploadFile(origFile, "organizer-portfolio")) || undefined;
        setMessage("");
      } else if (epmEventForm.flyer_url) {
        origUrl = getOrigUrl(epmEventForm.flyer_url) || baseUrl(parsePos(epmEventForm.flyer_url).src);
      }
    }
    setEpmFlyerOrigFile(origFile || null);
    setEpmFlyerOrigUrl(origUrl);
    setEpmFlyerFile(file);
    setEpmFlyerPosition({ x: 50, y: 50 });
  };
  const restoreFlyer = () => {
    const tagged = getOrigUrl(epmEventForm.flyer_url);
    if (epmFlyerOrigFile) { setEpmFlyerFile(epmFlyerOrigFile); }
    else if (epmFlyerOrigUrl) { setEpmFlyerFile(null); setEpmEventForm(prev => ({ ...prev, flyer_url: epmFlyerOrigUrl })); }
    else if (!epmFlyerFile && tagged) { setEpmEventForm(prev => ({ ...prev, flyer_url: tagged })); }
    setEpmFlyerOrigFile(null);
    setEpmFlyerOrigUrl(undefined);
    setEpmFlyerPosition({ x: 50, y: 50 });
  };

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
      if (attempt < 3) { await new Promise(r => setTimeout(r, 1500 * attempt)); return uploadFile(file, bucket, attempt + 1); }
      setMessage("❌ Upload error: " + err.message);
      return null;
    }
  };

  const saveEpmEvent = async () => {
    if (!epmEventForm.event_name.trim()) { setMessage("⚠️ Event name is required."); return; }
    if (!epmEventForm.category) { setMessage("⚠️ Please choose an Event Category."); return; }
    if (!epmEventForm.flyer_url && !epmFlyerFile) { setMessage("⚠️ A flyer image is required."); return; }
    setSavingEpmEvent(true); setMessage("");
    let flyerUrl = epmEventForm.flyer_url || "";
    if (epmFlyerFile) {
      const up = await uploadFile(epmFlyerFile, "organizer-portfolio");
      if (!up) { setSavingEpmEvent(false); return; }
      flyerUrl = withPos(tagOrig(up, epmFlyerOrigUrl), epmFlyerPosition);
    }
    const eventData = {
      event_name: epmEventForm.event_name, event_date: epmEventForm.event_date || null,
      event_end_date: epmEventForm.event_end_date || null, event_start_time: epmEventForm.event_start_time || null,
      event_end_time: epmEventForm.event_end_time || null, venue: epmEventForm.venue, venue_address: epmEventForm.venue_address || "",
      event_type: epmEventForm.event_type, category: epmEventForm.category, price: epmEventForm.price || "",
      description: epmEventForm.description, info_url: formatEpmUrl(epmEventForm.info_url), flyer_url: flyerUrl,
    };
    try {
      if (editingEpmEvent) {
        const { error } = await supabase.from("epm_events").update(eventData).eq("id", editingEpmEvent);
        if (error) throw error;
        setEpmEvents(epmEvents.map(e => e.id === editingEpmEvent ? { ...e, ...eventData } : e));
      } else {
        const { data, error } = await supabase.from("epm_events").insert([eventData]).select().single();
        if (error) throw error;
        if (data) setEpmEvents([...epmEvents, data]);
      }
      setEditingEpmEvent(null); setEpmEventForm(BLANK_EPM_EVENT); setEpmFlyerFile(null); setEpmFlyerOrigFile(null); setEpmFlyerOrigUrl(undefined); setEpmFlyerPosition({ x: 50, y: 50 }); setShowEpmFlyerPicker(false); clearFormDraft(); endDateAuto.current = false; setRestoredDraft(false);
      setMessage("✅ EPM Event saved!");
    } catch (err) {
      setMessage("❌ Error saving EPM event: " + err.message);
    }
    setSavingEpmEvent(false);
  };

  const deleteEpmEvent = async (id) => {
    if (!confirm("Delete this EPM event? This cannot be undone.")) return;
    await supabase.from("epm_events").delete().eq("id", id);
    setEpmEvents(epmEvents.filter(e => e.id !== id));
  };

  return (
    <div>
      <h2 style={{ marginBottom: 6 }}>🏢 EPM Events</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Events created here are hosted by Entre PRO Market itself and appear mixed in with Elite Organizer events on the Homepage's Upcoming Events section, sorted by date.</p>

      {message && (
        <div style={{ marginBottom: 16, padding: "12px 16px", backgroundColor: message.startsWith("✅") ? "#f0fdf4" : message.startsWith("⚠️") ? "#fffbeb" : "#fef2f2", border: `1px solid ${message.startsWith("✅") ? "#86efac" : message.startsWith("⚠️") ? "#fcd34d" : "#fca5a5"}`, borderRadius: 8, color: message.startsWith("✅") ? "#166534" : message.startsWith("⚠️") ? "#92400e" : "#991b1b", fontWeight: "bold" }}>
          {message}
        </div>
      )}

      <div style={{ backgroundColor: "white", borderRadius: 10, padding: 20, marginBottom: 20, border: "1px solid #eee" }}>
        <p style={{ fontWeight: "bold", marginBottom: 12, fontSize: 15 }}>{editingEpmEvent ? "✏️ Edit EPM Event" : "➕ Add New EPM Event"}</p>
        {restoredDraft && !editingEpmEvent && (
          <p style={{ margin: "-4px 0 12px", fontSize: 12, color: "#701890" }}>📝 Your unfinished event was restored. <button type="button" onClick={startFreshEvent} style={{ background: "none", border: "none", padding: 0, color: "#701890", fontWeight: "bold", textDecoration: "underline", cursor: "pointer", fontSize: 12 }}>Start fresh</button></p>
        )}
        <input placeholder="Event name * (e.g. Summer Night Market)" value={epmEventForm.event_name} onChange={e => setEpmEventForm({ ...epmEventForm, event_name: e.target.value })} style={inputStyle} />
        <label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Event Category <span style={{ color: "#cc0000" }}>*</span></label>
        <select value={epmEventForm.category} onChange={e => setEpmEventForm({ ...epmEventForm, category: e.target.value })} style={inputStyle}>
          <option value="">Select a Category...</option>
          {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Start Date</label><input type="date" value={epmEventForm.event_date} onChange={e => onEpmDateTimeChange("event_date", e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} /></div>
          <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>End Date</label><input type="date" value={epmEventForm.event_end_date} onChange={e => onEpmDateTimeChange("event_end_date", e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Start Time</label><input type="time" value={epmEventForm.event_start_time} onChange={e => onEpmDateTimeChange("event_start_time", e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} /></div>
          <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>End Time</label><input type="time" value={epmEventForm.event_end_time} onChange={e => onEpmDateTimeChange("event_end_time", e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} /></div>
        </div>
        <input placeholder="Venue name (e.g. Convention Center, Hall B)" value={epmEventForm.venue} onChange={e => setEpmEventForm({ ...epmEventForm, venue: e.target.value })} style={inputStyle} />
        <textarea placeholder="Street address, city, state and ZIP" value={epmEventForm.venue_address || ""} onChange={e => setEpmEventForm({ ...epmEventForm, venue_address: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
        <input placeholder="Event type or theme (e.g. Sports & Christmas Party)" value={epmEventForm.event_type} onChange={e => setEpmEventForm({ ...epmEventForm, event_type: e.target.value })} style={inputStyle} />
        <RichTextArea value={epmEventForm.description} onChange={(v) => setEpmEventForm({ ...epmEventForm, description: v })} canLink placeholder="Describe the event — what to expect, who it is for, parking, rules" style={{ ...inputStyle, resize: "vertical" }} rows={3} />
        <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>💵 Ticket Price</label>
        <textarea placeholder={"One price per line, e.g.:\nGeneral: $25\nVIP: $50\nKids: Free"} value={epmEventForm.price || ""} onChange={e => setEpmEventForm({ ...epmEventForm, price: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        <div style={{ marginBottom: 14 }}>
        <HelpTip title="Ticket payments">
          <p style={{ margin: 0 }}>💳 Add an Eventbrite, CashApp, Venmo, Google Pay, or any payment link here to collect ticket payments — not limited to Eventbrite.</p>
        </HelpTip>
      </div>
        <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>🎟️ Tickets / Info URL</label>
        <input placeholder="e.g. eventbrite.com/your-event, cash.app/$you, venmo.com/you" value={epmEventForm.info_url} onChange={e => setEpmEventForm({ ...epmEventForm, info_url: e.target.value })} style={inputStyle} />
        <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>📸 Event Flyer <span style={{ color: "#cc0000" }}>*</span></label>
        {(epmFlyerFile || epmEventForm.flyer_url) ? (
          <div style={{ marginBottom: 10, maxWidth: 300 }}>
            <PositionableImage
              src={epmFlyerFile ? previewUrl(epmFlyerFile) : parsePos(epmEventForm.flyer_url).src}
              position={epmFlyerFile ? epmFlyerPosition : parsePos(epmEventForm.flyer_url).position}
              onChange={pos => { setEpmFlyerPosition(pos); if (!epmFlyerFile) setEpmEventForm(prev => ({ ...prev, flyer_url: withPos(parsePos(prev.flyer_url).src, pos) })); }}
              showAdjust={false}
              onReplace={cropFlyer}
              onRestore={restoreFlyer}
              canRestore={!!(epmFlyerOrigFile || epmFlyerOrigUrl || getOrigUrl(epmEventForm.flyer_url))}
              cropSrc={epmFlyerOrigFile ? previewUrl(epmFlyerOrigFile) : (epmFlyerOrigUrl || undefined)}
            />
            <button onClick={() => { setEpmFlyerFile(null); setEpmFlyerOrigFile(null); setEpmFlyerOrigUrl(undefined); setEpmEventForm({ ...epmEventForm, flyer_url: "" }); setEpmFlyerPosition({ x: 50, y: 50 }); }} style={{ fontSize: 12, color: "#cc0000", background: "none", border: "none", cursor: "pointer", marginTop: 6 }}>✕ Remove flyer</button>
          </div>
        ) : (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#991b1b", fontWeight: "bold" }}>⚠️ A flyer image is required.</p>
          </div>
        )}
        <input type="file" accept="image/*" onChange={e => { setEpmFlyerFile(e.target.files[0]); setEpmFlyerOrigFile(null); setEpmFlyerOrigUrl(undefined); setEpmFlyerPosition({ x: 50, y: 50 }); setShowEpmFlyerPicker(false); }} style={{ display: "block", marginBottom: 10 }} />
        <button onClick={() => setShowEpmFlyerPicker(!showEpmFlyerPicker)} style={{ padding: "4px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, marginBottom: 8 }}>{showEpmFlyerPicker ? "Hide" : "Browse Placeholders"}</button>
        {showEpmFlyerPicker && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10, marginBottom: 14, padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8 }}>
            {FLYER_PLACEHOLDERS.map((src, i) => (
              <div key={i} onClick={() => { setEpmEventForm({ ...epmEventForm, flyer_url: src }); setEpmFlyerFile(null); setEpmFlyerOrigFile(null); setEpmFlyerOrigUrl(undefined); setEpmFlyerPosition({ x: 50, y: 50 }); setShowEpmFlyerPicker(false); }}
                style={{ height: 80, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: epmEventForm.flyer_url === src ? "3px solid #701890" : "2px solid transparent" }}>
                <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {editingEpmEvent && <button onClick={() => { setEditingEpmEvent(null); setEpmEventForm(BLANK_EPM_EVENT); setEpmFlyerFile(null); setEpmFlyerOrigFile(null); setEpmFlyerOrigUrl(undefined); setShowEpmFlyerPicker(false); clearFormDraft(); endDateAuto.current = false; setRestoredDraft(false); }} style={{ padding: "8px 16px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>Cancel</button>}
          <button onClick={saveEpmEvent} disabled={savingEpmEvent} style={{ padding: "8px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>{savingEpmEvent ? "Saving..." : editingEpmEvent ? "Update Event" : "Add Event"}</button>
        </div>
      </div>

      {epmEvents.length > 0 && <div style={{ margin: "0 0 12px" }}><HelpTip title="Reordering"><p style={{ margin: 0 }}>Hold and drag the ⠿ handle to reorder. The first 4 upcoming events are pinned to the top of the homepage's Upcoming Events; the rest stay in date order.</p></HelpTip></div>}
      {epmEvents.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {orderedEpmEvents.map((ev, eIdx) => (
            <div key={ev.id} ref={eventDrag.setItemRef(eIdx)} style={{ position: "relative", backgroundColor: "white", borderRadius: 8, padding: "12px 16px", border: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, ...eventDrag.itemStyle(eIdx) }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div {...eventDrag.handleProps(eIdx)} title="Hold and drag to reorder" style={{ flexShrink: 0, ...eventDrag.handleBaseStyle, background: featuredEventIds.has(ev.id) ? "#AABB23" : "rgba(0,0,0,0.55)", color: "white", borderRadius: 10, padding: "4px 9px", fontSize: 13, fontWeight: "bold" }}>⠿ {eIdx + 1}</div>
                {ev.flyer_url && (() => { const p = parsePos(ev.flyer_url); return <div style={{ width: 56, height: 56, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0 }}><img src={p.src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${p.position.x}% ${p.position.y}%`, display: "block" }} /></div>; })()}
                <div>
                  <p style={{ margin: 0, fontWeight: "bold", fontSize: 14 }}>{ev.event_name}</p>
                  {ev.category && <p style={{ margin: "1px 0 0", fontSize: 11, color: "#701890", fontWeight: "bold" }}>{ev.category}</p>}
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{ev.event_date ? new Date(ev.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date TBD"}{ev.event_start_time && ` · ${formatEventTime(ev.event_start_time)}`}</p>
                  {ev.venue && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#aaa" }}>{ev.venue}</p>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => { endDateAuto.current = false; setEditingEpmEvent(ev.id); setEpmEventForm({ event_name: ev.event_name, event_date: ev.event_date || "", event_end_date: ev.event_end_date || "", event_start_time: ev.event_start_time || "", event_end_time: ev.event_end_time || "", venue: ev.venue || "", venue_address: ev.venue_address || "", event_type: ev.event_type || "", category: ev.category || "", description: ev.description || "", info_url: ev.info_url || "", flyer_url: ev.flyer_url || "", price: ev.price || "" }); setEpmFlyerFile(null); setEpmFlyerOrigFile(null); setEpmFlyerOrigUrl(undefined); setEpmFlyerPosition({ x: 50, y: 50 }); }} style={{ padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Edit</button>
                <button onClick={() => deleteEpmEvent(ev.id)} style={{ padding: "6px 12px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : <p style={{ fontSize: 13, color: "#888", margin: 0 }}>No EPM events yet. Add your first one above!</p>}

      {epmFlyerFullscreen && (
        <div onClick={() => setEpmFlyerFullscreen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, cursor: "zoom-out" }}>
          <img src={epmFlyerFile ? URL.createObjectURL(epmFlyerFile) : epmEventForm.flyer_url} style={{ maxWidth: "95%", maxHeight: "95vh", borderRadius: 8, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}
