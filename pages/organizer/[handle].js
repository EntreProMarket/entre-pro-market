import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function OrganizerPublicProfile() {
  const router = useRouter();
  const { handle } = router.query;

  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!handle) return;

    const fetchOrganizer = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("handle", handle)
        .single();

      if (!error) setOrganizer(data);
      setLoading(false);
    };

    fetchOrganizer();
  }, [handle]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!organizer) return <div style={{ padding: 20 }}>Organizer not found</div>;

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>

      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <h1>{organizer.organizer_name || "Organizer"}</h1>
        <p style={{ color: "#777" }}>@{organizer.handle}</p>
      </div>

      {/* ✅ LOGO (CLICK TO ENLARGE) */}
      {organizer.logo_url && (
        <img
          src={organizer.logo_url}
          alt="logo"
          onClick={() => setSelectedImage(organizer.logo_url)}
          style={{
            width: 180,
            height: 180,
            objectFit: "cover",
            borderRadius: 12,
            cursor: "pointer",
            marginBottom: 20,
          }}
        />
      )}

      {/* INFO */}
      <p><strong>Category:</strong> {organizer.category || "N/A"}</p>
      <p><strong>Location:</strong> {organizer.city}, {organizer.state}</p>

      <p style={{ marginTop: 20 }}>{organizer.description}</p>

      {/* ✅ PORTFOLIO */}
      {organizer.portfolio_images?.length > 0 && (
        <div style={{ marginTop: 25 }}>
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

      {/* IMAGE MODAL */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img src={selectedImage} style={{ maxWidth: "90%", maxHeight: "90%" }} />
        </div>
      )}

      {/* BACK BUTTON */}
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
    </div>
  );
}
