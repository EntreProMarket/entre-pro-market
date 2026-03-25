import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Marketplace() {
  const [vendors, setVendors] = useState([]);

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
      return;
    }

    setVendors(data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Vendor Marketplace</h1>

      {vendors.length === 0 && <p>No vendors yet.</p>}

      <div style={{ display: "grid", gap: 20 }}>
        {vendors.map((vendor) => (
          <div
            key={vendor.id}
            style={{
              border: "1px solid #ccc",
              padding: 15,
              borderRadius: 8,
            }}
          >
            <h3>{vendor.business_name || "Vendor"}</h3>

            <p>Account Type: {vendor.account_type}</p>

            <button
              style={{
                marginTop: 10,
                padding: "8px 15px",
                backgroundColor: "#701890",
                color: "white",
                border: "none",
                borderRadius: 5,
              }}
            >
              View Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
