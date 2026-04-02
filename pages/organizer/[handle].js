import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function OrganizerPublicProfile() {
  const router = useRouter();

  const [organizer, setOrganizer] = useState(null);
  const [user, setUser] = useState(null);
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
          <p>@{organizer.handle}</p>
        </div>

<pre>{JSON.stringify(organizer, null, 2)}</pre>

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

      {/* LINKS */}
      <div style={{ marginTop: 20 }}>
        <h3>Links</h3>

        {organizer.website && <p><a href={organizer.website} target="_blank">Website</a></p>}
        {organizer.instagram && <p><a href={organizer.instagram} target="_blank">Instagram</a></p>}
        {organizer.facebook && <p><a href={organizer.facebook} target="_blank">Facebook</a></p>}
      </div>

      {/* PORTFOLIO */}
      {organizer.portfolio_images?.length > 0 && (
        <div style={{ marginTop: 20 }}>
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

    </div>
  );
}
