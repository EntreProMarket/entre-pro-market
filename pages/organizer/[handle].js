import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function OrganizerPublicProfile() {
  const router = useRouter();
  const { handle } = router.query;

  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIX URLS
  const fixUrl = (url, type) => {
    if (!url) return null;

    url = url.trim();

    if (url.startsWith("http")) return url;

    if (type === "instagram") {
      return `https://instagram.com/${url.replace("@", "")}`;
    }

    if (type === "facebook") {
      return `https://facebook.com/${url}`;
    }

    if (type === "website") {
      if (url.startsWith("www.")) return `https://${url}`;
      if (url.includes(".")) return `https://www.${url}`;
      return `https://www.${url}.com`;
    }

    return url;
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
          <h1 style={{ marginBottom: 5 }}>
            {organizer.organizer_name || "Organizer"}
          </h1>
          <p style={{ color: "#777" }}>@{organizer.handle}</p>
        </div>

        {/* ✅ FINAL FIXED BUTTON (MATCHES VENDOR EXACTLY) */}
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
          }}
        >
          Edit Profile
        </button>
      </div>

      {/* LOGO */}
      {organizer.logo_url && (
        <img
          src={organizer.logo_url}
          alt="logo"
          style={{
            width: 160,
            height: 160,
            objectFit: "cover",
            borderRadius: 12,
            marginBottom: 20,
          }}
        />
      )}

      {/* INFO */}
      <div>
        <p>
          <strong>Category:</strong> {organizer.category || "N/A"}
        </p>
        <p>
          <strong>Location:</strong> {organizer.city}, {organizer.state}
        </p>
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
            <a href={fixUrl(organizer.website, "website")} target="_blank">
              Website
            </a>
          </p>
        )}

        {organizer.instagram && (
          <p>
            <a href={fixUrl(organizer.instagram, "instagram")} target="_blank">
              Instagram
            </a>
          </p>
        )}

        {organizer.facebook && (
          <p>
            <a href={fixUrl(organizer.facebook, "facebook")} target="_blank">
              Facebook
            </a>
          </p>
        )}
      </div>

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
