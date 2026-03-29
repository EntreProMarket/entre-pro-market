import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function VendorPublicProfile() {
  const router = useRouter();
  const { handle } = router.query;

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) return;

    const fetchVendor = async () => {
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

      setVendor(data);
      setLoading(false);
    };

    fetchVendor();
  }, [handle]);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  if (!vendor) {
    return <div style={{ padding: 20 }}>Vendor not found</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>

      {/* LOGO */}
      {vendor.logo_url && (
        <img
          src={vendor.logo_url}
          alt="logo"
          style={{
            width: 120,
            height: 120,
            objectFit: "cover",
            borderRadius: 10,
            marginBottom: 20,
          }}
        />
      )}

      {/* NAME + HANDLE */}
      <h1 style={{ marginBottom: 5 }}>{vendor.business_name}</h1>
      <p style={{ color: "#777" }}>@{vendor.handle}</p>

      {/* ✅ EDIT PROFILE BUTTON (FULLY WORKING) */}
      <button
        onClick={() => router.push("/vendor-profile")}
        style={{
          marginTop: 15,
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

      {/* CATEGORY + LOCATION */}
      <div style={{ marginTop: 15 }}>
        <p><strong>Category:</strong> {vendor.category || "N/A"}</p>
        <p><strong>Location:</strong> {vendor.city}, {vendor.state}</p>
      </div>

      {/* DESCRIPTION */}
      <p style={{ marginTop: 20 }}>{vendor.description}</p>

      {/* TAGS */}
      <div style={{ marginTop: 15 }}>
        {vendor.tags?.map((tag) => (
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

        {vendor.website && (
          <p>
            <a href={vendor.website} target="_blank" rel="noopener noreferrer">
              Website
            </a>
          </p>
        )}

        {vendor.instagram && (
          <p>
            <a href={vendor.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          </p>
        )}

        {vendor.facebook && (
          <p>
            <a href={vendor.facebook} target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
          </p>
        )}

        {vendor.tiktok && (
          <p>
            <a href={vendor.tiktok} target="_blank" rel="noopener noreferrer">
              TikTok
            </a>
          </p>
        )}

        {vendor.youtube && (
          <p>
            <a href={vendor.youtube} target="_blank" rel="noopener noreferrer">
              YouTube
            </a>
          </p>
        )}
      </div>

      {/* PORTFOLIO */}
      <div style={{ marginTop: 30 }}>
        <h3>Portfolio</h3>

        {vendor.portfolio_images && vendor.portfolio_images.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 10,
            }}
          >
            {vendor.portfolio_images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="portfolio"
                style={{
                  width: "100%",
                  height: 150,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
            ))}
          </div>
        ) : (
          <p>No portfolio images yet.</p>
        )}
      </div>
    </div>
  );
}
