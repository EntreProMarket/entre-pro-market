// components/VendorFeatured.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function VendorFeatured() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("is_featured", true)
        .order("featured_order", { ascending: true });

      if (error) {
        console.error("Error fetching featured vendors:", error);
        setVendors([]);
      } else {
        setVendors(data || []);
      }
      setLoading(false);
    };

    loadFeatured();
  }, []);

  if (loading) return <p style={{ padding: 40 }}>Loading featured vendors...</p>;
  if (vendors.length === 0) return <p style={{ padding: 40 }}>No featured vendors yet.</p>;

  return (
    <div style={{ maxWidth: 1000, margin: "auto", padding: 40 }}>
      <h2 style={{ fontSize: 24, marginBottom: 20 }}>Featured Vendors</h2>

      {/* Container: grid on desktop, horizontal scroll on mobile */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 20,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          paddingBottom: 10,
          paddingLeft: 10,  // padding at start
          paddingRight: 10, // padding at end
        }}
      >
        {vendors.map((vendor) => (
          <Link key={vendor.id} href={`/vendor/${vendor.handle}`}>
            <a
              style={{
                display: "block",
                border: "1px solid #ddd",
                borderRadius: 10,
                overflow: "hidden",
                textDecoration: "none",
                color: "inherit",
                transition: "transform 0.2s, box-shadow 0.2s",
                scrollSnapAlign: "start",
                minWidth: 180, // slightly smaller for mobile spacing
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {vendor.image_url ? (
                <img
                  src={vendor.image_url}
                  alt={vendor.business_name}
                  style={{ width: "100%", height: 140, objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 140,
                    backgroundColor: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    fontSize: 14,
                  }}
                >
                  No Image
                </div>
              )}

              <div style={{ padding: 10 }}>
                <h3 style={{ margin: 5, fontSize: 15, fontWeight: 600 }}>
                  {vendor.business_name}
                </h3>
                <p style={{ margin: 2, fontSize: 13, color: "#555" }}>
                  {vendor.category}
                </p>
                <p style={{ margin: 2, fontSize: 12, color: "#777" }}>
                  {vendor.location}
                </p>
              </div>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
