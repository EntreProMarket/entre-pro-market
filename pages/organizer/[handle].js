import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function OrganizerPublicProfile() {
  const router = useRouter();
  const { handle } = router.query;

  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ EDIT BUTTON (TOP RIGHT)
  const goToEditProfile = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    router.push("/organizer-profile");
  };

  useEffect(() => {
    if (!handle) return;

    const fetchOrganizer = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("handle", handle)
        .single();

      if (error) {
        console.log(error);
        setLoading(false);
        return;
      }

      setOrganizer(data);
      setLoading(false);
    };

    fetchOrganizer();
  }, [handle]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!organizer) return <div style={{ padding: 20 }}>Organizer not found</div>;

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

        {/* ✅ EDIT BUTTON */}
        <button
          onClick={goToEditProfile}
          style={{
  padding: "10px 16px",
  backgroundColor: "#701890",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold",
}}
        >
          Edit Profile
        </button>
      </div>

      {/* CATEGORY + LOCATION */}
      <div>
        <p><strong>Category:</strong> {organizer.category || "N/A"}</p>
        <p><strong>Location:</strong> {organizer.city}, {organizer.state}</p>
      </div>

      {/* DESCRIPTION */}
      <p style={{ marginTop: 20 }}>{organizer.description}</p>

      {/* TAGS */}
      <div style={{ marginTop: 15 }}>
        {organizer.tags?.map((tag) => (
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

      {/* LINKS */}
      <div style={{ marginTop: 25 }}>
        <h3>Links</h3>

        {organizer.website && (
          <p>
            <a href={organizer.website} target="_blank">
              Website
            </a>
          </p>
        )}

        {organizer.instagram && (
          <p>
            <a href={organizer.instagram} target="_blank">
              Instagram
            </a>
          </p>
        )}

        {organizer.facebook && (
          <p>
            <a href={organizer.facebook} target="_blank">
              Facebook
            </a>
          </p>
        )}
      </div>

      {/* ✅ BACK BUTTON (MATCHED STYLE + RIGHT SIDE) */}
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
