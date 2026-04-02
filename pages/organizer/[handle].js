import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function OrganizerPublicProfile() {
  const router = useRouter();
  const { handle } = router.query;

  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user || null);

      if (!handle) return;

      // 🔥 FIX: make sure handle is used correctly
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("handle", handle)
        .maybeSingle();

      if (error) {
        console.log("ERROR LOADING PROFILE:", error);
      }

      setOrganizer(data);
      setLoading(false);
    };

    loadData();
  }, [handle]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!organizer) return <div style={{ padding: 20 }}>Profile not found</div>;

  const isOwner = user && user.id === organizer.id;

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h1>{organizer.organizer_name || "Organizer"}</h1>
          <p style={{ color: "#777" }}>@{organizer.handle}</p>
        </div>

        {/* ✅ FIXED BUTTON (NOT SQUARE) */}
        {isOwner && (
          <button
            onClick={() => router.push("/organizer-profile")}
            style={{
              padding: "10px 18px",
              minWidth: "150px",
              textAlign: "center",
              whiteSpace: "nowrap",
              backgroundColor: "#701890",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "bold",
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
            borderRadius: 12,
            marginBottom: 20,
            cursor: "pointer",
          }}
        />
      )}

      {/* INFO */}
      <p><strong>Category:</strong> {organizer.category}</p>
      <p><strong>Location:</strong> {organizer.city}, {organizer.state}</p>

      <p style={{ marginTop: 20 }}>{organizer.description}</p>

      {/* LINKS */}
      <div style={{ marginTop: 25 }}>
        <h3>Links</h3>

        {organizer.website && <p><a href={organizer.website}>Website</a></p>}
        {organizer.instagram && <p><a href={organizer.instagram}>Instagram</a></p>}
        {organizer.facebook && <p><a href={organizer.facebook}>Facebook</a></p>}
      </div>

      {/* PORTFOLIO */}
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
