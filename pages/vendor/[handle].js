import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function VendorPublicProfile() {
  const router = useRouter();
  const { handle } = router.query;

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!handle) return;

    const fetchData = async () => {
      // 🔹 get logged-in user
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      // 🔹 get vendor profile
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

      // 🔥 OWNER CHECK
      if (user && data.id === user.id) {
        setIsOwner(true);
      }

      setLoading(false);
    };

    fetchData();
  }, [handle]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!vendor) return <div style={{ padding: 20 }}>Vendor not found</div>;

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
          <h1 style={{ marginBottom: 5 }}>{vendor.business_name}</h1>
          <p style={{ color: "#777" }}>@{vendor.handle}</p>
        </div>

        {/* ✅ ONLY OWNER SEES THIS */}
        {isOwner && (
          <button
            onClick={() => router.push("/vendor-profile")} // ✅ CORRECT EDIT PAGE
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
        )}
      </div>

      {/* LOGO */}
      {vendor.logo_url && (
        <img
          src={vendor.logo_url}
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
            <a href={vendor.website} target="_blank">Website</a>
          </p>
        )}

        {vendor.instagram && (
          <p>
            <a href={vendor.instagram} target="_blank">Instagram</a>
          </p>
        )}

        {vendor.facebook && (
          <p>
            <a href={vendor.facebook} target="_blank">Facebook</a>
          </p>
        )}

        {vendor.tiktok && (
          <p>
            <a href={vendor.tiktok} target="_blank">TikTok</a>
          </p>
        )}

        {vendor.youtube && (
          <p>
            <a href={vendor.youtube} target="_blank">YouTube</a>
          </p>
        )}
      </div>

      {/* BACK BUTTON (RIGHT SIDE) */}
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
