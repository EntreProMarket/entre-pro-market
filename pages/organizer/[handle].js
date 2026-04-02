// pages/organizer/[handle].js

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function OrganizerPublicProfile() {
  const router = useRouter();

  const [organizer, setOrganizer] = useState(null);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user || null);

      const handle = router.query.handle;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("handle", handle)
        .single();

      if (error) {
        console.log(error);
      } else {
        setOrganizer(data);

        // Load events if this is a premium organizer
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
  }, [router.isReady]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!organizer) return <div style={{ padding: 20 }}>Profile not found</div>;

  const isOwner = user && user.id === organizer.id;

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>{organizer.organizer_name || "Organizer"}</h1>
          <p style={{ color: "#777", margin: 0 }}>@{organizer.handle}</p>
        </div>

        {isOwner && (
          <button
            onClick={() => router.push("/organizer-profile")}
            style={{
              padding: "10px 14px",
              backgroundColor: "#701890",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* LOGO */}
      {organizer.logo_url && (
        <img
          src={organizer.logo_url}
          onClick={() => setSelectedImage(organizer.logo_url)}
          style={{
            width: 180,
            height: 180,
            objectFit: "cover",
            borderRadius: 10,
            marginTop: 20,
            cursor: "pointer",
          }}
        />
      )}

      {/* INFO */}
      <p><strong>Category:</strong> {organizer.category}</p>
      <p><strong>Location:</strong> {organizer.city}, {organizer.state}</p>

      <p style={{ marginTop: 20 }}>{organizer.description}</p>

      {/* TAGS */}
      {organizer.tags?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {organizer.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-block",
                marginRight: 8,
                marginBottom: 8,
                padding: "4px 10px",
                background: "#eee",
                borderRadius: 20,
                fontSize: 12,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* LINKS */}
      <div style={{ marginTop: 20 }}>
        <h3>Links</h3>
        {organizer.website && <p><a href={organizer.website} target="_blank" rel="noreferrer">Website</a></p>}
        {organizer.instagram && <p><a href={organizer.instagram} target="_blank" rel="noreferrer">Instagram</a></p>}
        {organizer.facebook && <p><a href={organizer.facebook} target="_blank" rel="noreferrer">Facebook</a></p>}
        {organizer.tiktok && <p><a href={organizer.tiktok} target="_blank" rel="noreferrer">TikTok</a></p>}
        {organizer.youtube && <p><a href={organizer.youtube} target="_blank" rel="noreferrer">YouTube</a></p>}
      </div>

      {/* PORTFOLIO */}
      {organizer.portfolio_images?.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h3>Portfolio</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {organizer.portfolio_images.map((img, i) => (
              <img
                key={i}
                src={img}
                onClick={() => setSelectedImage(img)}
                style={{
                  width: 120,
                  height: 120,
                  objectFit: "cover",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* UPCOMING EVENTS — Premium Organizers only */}
      {organizer.account_type === "premium" && (
        <div style={{ marginTop: 30 }}>
          <h3>📅 Upcoming Events</h3>

          {events.length === 0 ? (
            <p style={{ color: "#888" }}>No upcoming events posted yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
                minWidth: 460,
              }}>
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
                    <tr
                      key={event.id}
                      style={{ backgroundColor: i % 2 === 0 ? "#f9f9f9" : "#fff" }}
                    >
                      <td style={tdStyle}>{event.event_name}</td>
                      <td style={tdStyle}>
                        {event.event_date
                          ? new Date(event.event_date).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })
                          : "TBD"}
                      </td>
                      <td style={tdStyle}>{event.venue || "—"}</td>
                      <td style={tdStyle}>{event.event_type || "—"}</td>
                      <td style={tdStyle}>
                        {event.info_url ? (
                          <a
                            href={event.info_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#701890", fontWeight: "bold" }}
                          >
                            Details →
                          </a>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* BACK BUTTON — matches Vendor profile */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40 }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "10px 14px",
            backgroundColor: "#ccc",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ← Back
        </button>
      </div>

      {/* IMAGE MODAL */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            top: 0, left: 0,
            width: "100%", height: "100%",
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <img
            src={selectedImage}
            style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 10 }}
          />
        </div>
      )}

    </div>
  );
}

const thStyle = {
  padding: "10px 14px",
  textAlign: "left",
  fontWeight: "bold",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "10px 14px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};
