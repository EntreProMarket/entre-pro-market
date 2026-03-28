import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Marketplace() {
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "vendor");

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setVendors(data);
    setLoading(false);
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading vendors...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 20 }}>Vendor Marketplace</h1>

      {vendors.length === 0 && <p>No vendors yet.</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 20,
        }}
      >
        {vendors.map((vendor) => (
          <div
            key={vendor.id}
            onClick={() => router.push(`/vendor/${vendor.handle}`)}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              overflow: "hidden",
              cursor: "pointer",
              transition: "0.2s",
              backgroundColor: "white",
            }}
          >
            {/* IMAGE */}
            <div style={{ height: 160, background: "#f4f4f4" }}>
              {vendor.logo_url ? (
                <img
                  src={vendor.logo_url}
                  alt="logo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div style={{ padding: 20 }}>No Image</div>
              )}
            </div>

            {/* CONTENT */}
            <div style={{ padding: 15 }}>
              <h3 style={{ margin: "0 0 5px 0" }}>
                {vendor.business_name || "Vendor"}
              </h3>

              <p style={{ margin: 0, color: "#777", fontSize: 14 }}>
                {vendor.category || "No category"}
              </p>

              <p style={{ margin: "5px 0", fontSize: 13 }}>
                {vendor.city}, {vendor.state}
              </p>

              {/* TAGS */}
              <div style={{ marginTop: 8 }}>
                {vendor.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 11,
                      background: "#eee",
                      padding: "3px 6px",
                      borderRadius: 10,
                      marginRight: 5,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
