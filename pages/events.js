// pages/events.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const EVENT_CATEGORIES = ["All","Music Event","Pop Up Shop","Business Expo","Fashion Show","Spoken Word","Meet & Greet","Art Show","Dance Event","Party","Classes","Paint & Sip","Festival","Corporate Event","Wedding","Birthday","Fundraiser","Community Event","Sports Event","Venue","Other"];

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [flyerFullscreen, setFlyerFullscreen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const { data } = await supabase
        .from("organizer_events")
        .select("*, organizer:organizer_id(organizer_name, handle, logo_url, account_type)")
        .gte("event_date", todayStr)
        .order("event_date", { ascending: true });
      const eliteOnly = (data || []).filter(e => {
        if (e.organizer?.account_type !== "elite") return false;
        const endDate = e.event_end_date || e.event_date;
        if (!endDate) return true;
        if (e.event_end_time && endDate === todayStr) {
          const [h, m] = e.event_end_time.split(":").map(Number);
          const end = new Date(); end.setHours(h, m, 0, 0);
          return now < end;
        }
        return endDate >= todayStr;
      });
      setEvents(eliteOnly);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = selectedCategory === "All" ? events : events.filter(e => e.category === selectedCategory);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push("/home")} style={{ padding: "8px 16px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 22 }}>👑 All Upcoming Events</h1>
      </div>

      {/* CATEGORY FILTER */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {EVENT_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            style={{ padding: "7px 14px", backgroundColor: selectedCategory === cat ? "#701890" : "white", color: selectedCategory === cat ? "white" : "#555", border: "1px solid #ddd", borderRadius: 20, cursor: "pointer", fontWeight: selectedCategory === cat ? "bold" : "normal", fontSize: 13 }}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? <p style={{ textAlign: "center", color: "#888" }}>Loading events...</p> : filtered.length === 0 ? (
        <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 40, textAlign: "center", color: "#aaa" }}>
          <p style={{ fontSize: 15, margin: 0 }}>No events found{selectedCategory !== "All" ? ` in "${selectedCategory}"` : ""}.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {filtered.map(event => (
            <div key={event.id} onClick={() => { setSelectedEvent(event); setFlyerFullscreen(false); }}
              style={{ border: "2px solid #AABB23", borderRadius: 12, overflow: "hidden", cursor: "pointer", backgroundColor: "white" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(170,187,35,0.3)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <div style={{ height: 150, backgroundColor: "#f4f4f4" }}>
                {event.flyer_url ? <img src={event.flyer_url} alt={event.event_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb" }}>No Flyer</div>}
              </div>
              <div style={{ padding: 12 }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>{event.event_name}</h3>
                {event.category && <p style={{ margin: "0 0 2px", fontSize: 11, color: "#AABB23", fontWeight: "bold" }}>{event.category}</p>}
                <p style={{ margin: "0 0 2px", fontSize: 12, color: "#701890", fontWeight: "bold" }}>
                  📅 {event.event_date ? new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}
                </p>
                {event.venue && <p style={{ margin: 0, color: "#888", fontSize: 12 }}>📍 {event.venue}</p>}
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#888" }}>by @{event.organizer?.handle}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EVENT POPUP */}
      {selectedEvent && (
        <div onClick={() => { if (flyerFullscreen) { setFlyerFullscreen(false); } else { setSelectedEvent(null); } }}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: flyerFullscreen ? "rgba(0,0,0,0.92)" : "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: flyerFullscreen ? 0 : 16 }}>
          {flyerFullscreen ? (
            <img src={selectedEvent.flyer_url} alt="flyer" style={{ maxWidth: "95%", maxHeight: "95vh", borderRadius: 8, objectFit: "contain" }} />
          ) : (
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: 16, maxWidth: 480, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
              {selectedEvent.flyer_url && (
                <div style={{ position: "relative" }}>
                  <img src={selectedEvent.flyer_url} onClick={e => { e.stopPropagation(); setFlyerFullscreen(true); }}
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
