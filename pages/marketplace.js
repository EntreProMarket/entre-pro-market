import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Marketplace() {
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
    } else {
      setVendors(data);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>Vendor Marketplace</h1>

      {loading ? (
        <p>Loading vendors...</p>
      ) : vendors.length === 0 ? (
        <p>No vendors yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              style={{
                border: "1px solid #ccc",
                padding: 15,
                borderRadius: 8,
                backgroundColor: "#fff",
              }}
            >
              <h3>{vendor.business_name || "Vendor"}</h3>

              <p>
                Account Type: <strong>{vendor.account_type}</strong>
              </p>

              <button
                style={{
                  marginTop: 10,
                  padding: "8px 15px",
                  backgroundColor: "#701890",
                  color: "white",
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                }}
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
