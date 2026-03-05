// /pages/vendor/[handle].js
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";

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
        console.error(error.message);
        setVendor(null);
      } else {
        setVendor(data);
      }
      setLoading(false);
    };

    fetchVendor();
  }, [handle]);

  if (loading) return <p>Loading...</p>;
  if (!vendor) return <p>Vendor not found</p>;

  // Determine contact visibility
  // Example logic: free vendors hide email/phone
  const showContactInfo = vendor.role === "paid_vendor"; // expand as needed

  const socialIcons = [
    { name: "Instagram", url: vendor.instagram, icon: "/icons/instagram.svg" },
    { name: "Facebook", url: vendor.facebook, icon: "/icons/facebook.svg" },
    { name: "TikTok", url: vendor.tiktok, icon: "/icons/tiktok.svg" },
    { name: "YouTube", url: vendor.youtube, icon: "/icons/youtube.svg" },
  ];

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
      {vendor.logo_url && (
        <img
          src={vendor.logo_url}
          alt={vendor.business_name}
          style={{ width: 180, marginBottom: 20 }}
        />
      )}

      <h1>{vendor.business_name}</h1>
      <p>
        <strong>Category:</strong> {vendor.category}
      </p>

      {vendor.tags && vendor.tags.length > 0 && (
        <p>
          {vendor.tags.map((t) => (
            <span
              key={t}
              style={{
                display: "inline-block",
                margin: "2px",
                padding: "2px 6px",
                border: "1px solid #aaa",
                borderRadius: "12px",
              }}
            >
              {t}
            </span>
          ))}
        </p>
      )}

      <p>{vendor.description}</p>

      {vendor.website && (
        <p>
          Website:{" "}
          <a href={vendor.website} target="_blank" rel="noopener noreferrer">
            {vendor.website}
          </a>
        </p>
      )}

      <div style={{ display: "flex", gap: "10px", marginTop: 10 }}>
        {socialIcons.map(
          (s) =>
            s.url && (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer">
                <img src={s.icon} alt={s.name} style={{ width: 30, height: 30 }} />
              </a>
            )
        )}
      </div>

      {showContactInfo && (
        <div style={{ marginTop: 20 }}>
          <h3>Contact Info</h3>
          {vendor.email && <p>Email: {vendor.email}</p>}
          {vendor.phone && <p>Phone: {vendor.phone}</p>}
        </div>
      )}

      {vendor.portfolio_images && vendor.portfolio_images.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Portfolio</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {vendor.portfolio_images.map((url, idx) => (
              <img key={idx} src={url} alt={`Portfolio ${idx + 1}`} style={{ width: 150 }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
