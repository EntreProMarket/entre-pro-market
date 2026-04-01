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
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user || null);

      if (!handle) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("handle", handle)
        .single();

      if (!error) setOrganizer(data);
      setLoading(false);
    };

    init();
  }, [handle]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!organizer) return <div style={{ padding: 20 }}>Organizer not found</div>;

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

        {/* ✅ EDIT BUTTON (OWNER ONLY) */}
        {isOwner && (
          <button
            onClick={() => router.push("/organizer-profile")}
            style={{
              padding: "10px 18px",
              minWidth: 140,
              textAlign: "center",
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
        )}
      </div>

      {/* LOGO */}
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
            marginBottom: 20,
            cursor: "pointer",
          }}
        />
      )}

      {/* INFO */}
      <div>
        <p><strong>Category:</strong> {organizer.category || "N/A"}</p>
        <p><strong>Location:</strong> {organizer.city}, {organizer.state}</p>
      </div>

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
            <a href={
