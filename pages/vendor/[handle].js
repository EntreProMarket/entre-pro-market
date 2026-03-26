import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function VendorPage() {
  const router = useRouter();
  const { handle } = router.query;

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (handle) fetchVendor();
  }, [handle]);

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

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (!vendor) return <div style={{ padding: 20 }}>Vendor not found</div>;

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "auto" }}>
      <h1>{vendor.business_name || "Vendor"}</h1>

      {/* LOGO */}
      {vendor.logo_url && (
        <img
          src={vendor.logo_url}
          alt="Logo"
          style={{ width: 150, borderRadius: 8 }}
        />
      )}

      <p><strong>Category:</strong> {vendor.category}</p>
      <p><strong>Location:</strong> {vendor.city}, {vendor.state}</p>

      <p style={{ marginTop: 20 }}>{vendor.description}</p>

      {/* TAGS */}
      <div style={{ marginTop: 10 }}>
        {vendor.tags?.map((tag) => (
          <span
            key={tag}
            style={{
              display: "inline-block",
              marginRight: 5,
              padding: "4px 8px",
              backgroundColor: "#eee",
              borderRadius: 12,
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* SOCIAL LINKS */}
      <div style={{ marginTop: 20 }}>
        {vendor.website && <p><a href={vendor.website} target="_blank">Website</a></p>}
        {vendor.instagram && <p><a href={vendor.instagram} target="_blank">Instagram</a></p>}
        {vendor.facebook && <p><a href={vendor.facebook} target="_blank">Facebook</a></p>}
        {vendor.tiktok && <p><a href={vendor.tiktok} target="_blank">TikTok</a></p>}
        {vendor.youtube && <p><a href={vendor.youtube} target="_blank">YouTube</a></p>}
      </div>

      {/* PORTFOLIO */}
      <div style={{ marginTop: 20 }}>
        <h3>Portfolio</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {vendor.portfolio_images?.map((img, index) => (
            <img
              key={index}
              src={img}
              alt="Portfolio"
              style={{ width: "100%", borderRadius: 8 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
