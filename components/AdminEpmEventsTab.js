// components/AdminEpmEventsTab.js
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const EVENT_CATEGORIES = ["Music Event","Pop Up Shop","Business Expo","Fashion Show","Spoken Word","Meet & Greet","Art Show","Dance Event","Party","Classes","Paint & Sip","Festival","Corporate Event","Wedding","Birthday","Fundraiser","Community Event","Sports Event","Recording Studio","Venue","Other"];
const FLYER_PLACEHOLDERS = ["/default-logos/EPM-PH1.png", "/default-logos/EPM-PH2.png", "/default-logos/EPM-PH3.png"];
const BLANK_EPM_EVENT = { event_name: "", event_date: "", event_end_date: "", event_start_time: "", event_end_time: "", venue: "", venue_address: "", event_type: "", category: "", description: "", info_url: "", flyer_url: "", price: "" };
const inputStyle = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };

function parsePos(url) {
  if (!url) return { src: url, position: { x: 50, y: 50 }, zoom: 1 };
  const [base, frag] = url.split("#pos=");
  if (!frag) return { src: base, position: { x: 50, y: 50 }, zoom: 1 };
  const [x, y, z] = frag.split(",").map(Number);
  return { src: base, position: { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y }, zoom: isNaN(z) || z < 1 ? 1 : z };
}
function withPos(url, pos, zoom = 1) {
  if (!url) return url;
  const base = url.split("#")[0];
  if (!pos) return base;
  return `${base}#pos=${pos.x.toFixed(1)},${pos.y.toFixed(1)},${zoom.toFixed(2)}`;
}
function formatEpmUrl(v) { if (!v || !v.trim()) return ""; const s = v.trim(); return s.startsWith("https://") || s.startsWith("http://") ? s : `https://${s}`; }
function formatEventTime(t) { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; }

function PositionableImage({ src, position, onChange, height }) {
  const ref = useRef(null);
  const dragState = useRef(null);
  const handlePointerDown = (e) => { dragState.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y }; e.target.setPointerCapture?.(e.pointerId); };
  const handlePointerMove = (e) => {
    if (!dragState.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - dragState.current.x, dy = e.clientY - dragState.current.y;
    onChange({ x: Math.min(100, Math.max(0, dragState.current.posX - (dx / rect.width) * 100)), y: Math.min(100, Math.max(0, dragState.current.posY - (dy / rect.height) * 100)) });
  };
  const handlePointerUp = () => { dragState.current = null; };
  return (
    <div ref={ref} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
      style={{ width: "100%", height, borderRadius: 8, overflow: "hidden", border: "2px solid #701890", cursor: "grab", touchAction: "none", position: "relative", backgroundColor: "#eee" }}>
      <img src={src} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${position.x}% ${position.y}%`, display: "block", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 6, right: 8, backgroundColor: "rgba(0,0,0,0.55)", color: "white", fontSize: 10, padding: "3px 8px", borderRadius: 10 }}>✋ Drag to reposition</div>
    </div>
  );
}

export default function AdminEpmEventsTab() {
  const [epmEvents, setEpmEvents] = useState([]);
  const [editingEpmEvent, setEditingEpmEvent] = useState(null);
  const [epmEventForm, setEpmEventForm] = useState(BLANK_EPM_EVENT);
  const [savingEpmEvent, setSavingEpmEvent] = useState(false);
  const [epmFlyerFile, setEpmFlyerFile] = useState(null);
  const [showEpmFlyerPicker, setShowEpmFlyerPicker] = useState(false);
  const [epmFlyerFullscreen, setEpmFlyerFullscreen] = useState(false);
  const [epmFlyerPosition, setEpmFlyerPosition] = useState({ x: 50, y: 50 });
  const [message, setMessage] = useState("");

  useEffect(() => { loadEpmEvents(); }, []);

  const loadEpmEvents = async () => {
    const { data } = await supabase.from("epm_events").select("*").order("event_date", { ascending: true });
    setEpmEvents(data || []);
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
    if (!epmEventForm.flyer_url && !epmFlyerFile) { setMessage("⚠️ A flyer image is required."); return; }
    setSavingEpmEvent(true); setMessage("");
    let flyerUrl = epmEventForm.flyer_url || "";
    if (epmFlyerFile) {
      const up = await uploadFile(epmFlyerFile, "organizer-portfolio");
      if (!up) { setSavingEpmEvent(false); return; }
      flyerUrl = withPos(up, epmFlyerPosition);
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
      setEditingEpmEvent(null); setEpmEventForm(BLANK_EPM_EVENT); setEpmFlyerFile(null); setEpmFlyerPosition({ x: 50, y: 50 }); setShowEpmFlyerPicker(false);
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
        <input placeholder="Event Name *" value={epmEventForm.event_name} onChange={e => setEpmEventForm({ ...epmEventForm, event_name: e.target.value })} style={inputStyle} />
        <label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Event Category</label>
        <select value={epmEventForm.category} onChange={e => setEpmEventForm({ ...epmEventForm, category: e.target.value })} style={inputStyle}>
          <option value="">Select a Category...</option>
          {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Start Date</label><input type="date" value={epmEventForm.event_date} onChange={e => setEpmEventForm({ ...epmEventForm, event_date: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }} /></div>
          <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>End Date</label><input type="date" value={epmEventForm.event_end_date} onChange={e => setEpmEventForm({ ...epmEventForm, event_end_date: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Start Time</label><input type="time" value={epmEventForm.event_start_time} onChange={e => setEpmEventForm({ ...epmEventForm, event_start_time: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }} /></div>
          <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>End Time</label><input type="time" value={epmEventForm.event_end_time} onChange={e => setEpmEventForm({ ...epmEventForm, event_end_time: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }} /></div>
        </div>
        <input placeholder="Venue Name" value={epmEventForm.venue} onChange={e => setEpmEventForm({ ...epmEventForm, venue: e.target.value })} style={inputStyle} />
        <textarea placeholder="Address (street, city, state)" value={epmEventForm.venue_address || ""} onChange={e => setEpmEventForm({ ...epmEventForm, venue_address: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
        <input placeholder="Event Type" value={epmEventForm.event_type} onChange={e => setEpmEventForm({ ...epmEventForm, event_type: e.target.value })} style={inputStyle} />
        <textarea placeholder="Event Description" value={epmEventForm.description} onChange={e => setEpmEventForm({ ...epmEventForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>💵 Ticket Price</label>
        <textarea placeholder={"One price per line, e.g.:\nGeneral: $25\nVIP: $50\nKids: Free"} value={epmEventForm.price || ""} onChange={e => setEpmEventForm({ ...epmEventForm, price: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        <div style={{ backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 6, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#701890" }}>💳 Add an Eventbrite, CashApp, Venmo, Google Pay, or any payment link here to collect ticket payments — not limited to Eventbrite.</div>
        <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>🎟️ Tickets / Info URL</label>
        <input placeholder="e.g. eventbrite.com/your-event, cash.app/$you, venmo.com/you" value={epmEventForm.info_url} onChange={e => setEpmEventForm({ ...epmEventForm, info_url: e.target.value })} style={inputStyle} />
        <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>📸 Event Flyer <span style={{ color: "#cc0000" }}>*</span></label>
        {(epmFlyerFile || epmEventForm.flyer_url) ? (
          <div style={{ marginBottom: 10, maxWidth: 300 }}>
            <PositionableImage
              src={epmFlyerFile ? URL.createObjectURL(epmFlyerFile) : parsePos(epmEventForm.flyer_url).src}
              position={epmFlyerFile ? epmFlyerPosition : parsePos(epmEventForm.flyer_url).position}
              onChange={pos => { setEpmFlyerPosition(pos); if (!epmFlyerFile) setEpmEventForm(prev => ({ ...prev, flyer_url: withPos(parsePos(prev.flyer_url).src, pos) })); }}
              height={200}
            />
            <button onClick={() => { setEpmFlyerFile(null); setEpmEventForm({ ...epmEventForm, flyer_url: "" }); setEpmFlyerPosition({ x: 50, y: 50 }); }} style={{ fontSize: 12, color: "#cc0000", background: "none", border: "none", cursor: "pointer", marginTop: 6 }}>✕ Remove flyer</button>
          </div>
        ) : (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#991b1b", fontWeight: "bold" }}>⚠️ A flyer image is required.</p>
          </div>
        )}
        <input type="file" accept="image/*" onChange={e => { setEpmFlyerFile(e.target.files[0]); setEpmFlyerPosition({ x: 50, y: 50 }); setShowEpmFlyerPicker(false); }} style={{ display: "block", marginBottom: 10 }} />
        <button onClick={() => setShowEpmFlyerPicker(!showEpmFlyerPicker)} style={{ padding: "4px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, marginBottom: 8 }}>{showEpmFlyerPicker ? "Hide" : "Browse Placeholders"}</button>
        {showEpmFlyerPicker && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10, marginBottom: 14, padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8 }}>
            {FLYER_PLACEHOLDERS.map((src, i) => (
              <div key={i} onClick={() => { setEpmEventForm({ ...epmEventForm, flyer_url: src }); setEpmFlyerFile(null); setEpmFlyerPosition({ x: 50, y: 50 }); setShowEpmFlyerPicker(false); }}
                style={{ height: 80, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: epmEventForm.flyer_url === src ? "3px solid #701890" : "2px solid transparent" }}>
                <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {editingEpmEvent && <button onClick={() => { setEditingEpmEvent(null); setEpmEventForm(BLANK_EPM_EVENT); setEpmFlyerFile(null); setShowEpmFlyerPicker(false); }} style={{ padding: "8px 16px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>Cancel</button>}
          <button onClick={saveEpmEvent} disabled={savingEpmEvent} style={{ padding: "8px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>{savingEpmEvent ? "Saving..." : editingEpmEvent ? "Update Event" : "Add Event"}</button>
        </div>
      </div>

      {epmEvents.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {epmEvents.map(ev => (
            <div key={ev.id} style={{ backgroundColor: "white", borderRadius: 8, padding: "12px 16px", border: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {ev.flyer_url && (() => { const p = parsePos(ev.flyer_url); return <div style={{ width: 56, height: 56, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0 }}><img src={p.src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${p.position.x}% ${p.position.y}%`, display: "block" }} /></div>; })()}
                <div>
                  <p style={{ margin: 0, fontWeight: "bold", fontSize: 14 }}>{ev.event_name}</p>
                  {ev.category && <p style={{ margin: "1px 0 0", fontSize: 11, color: "#701890", fontWeight: "bold" }}>{ev.category}</p>}
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{ev.event_date ? new Date(ev.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date TBD"}{ev.event_start_time && ` · ${formatEventTime(ev.event_start_time)}`}</p>
                  {ev.venue && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#aaa" }}>{ev.venue}</p>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => { setEditingEpmEvent(ev.id); setEpmEventForm({ event_name: ev.event_name, event_date: ev.event_date || "", event_end_date: ev.event_end_date || "", event_start_time: ev.event_start_time || "", event_end_time: ev.event_end_time || "", venue: ev.venue || "", venue_address: ev.venue_address || "", event_type: ev.event_type || "", category: ev.category || "", description: ev.description || "", info_url: ev.info_url || "", flyer_url: ev.flyer_url || "", price: ev.price || "" }); setEpmFlyerFile(null); setEpmFlyerPosition({ x: 50, y: 50 }); }} style={{ padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Edit</button>
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
