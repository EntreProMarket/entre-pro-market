// /pages/marketplace.js
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

    setVendors(data || []);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Vendor Marketplace</h1>

      {loading && <p>Loading vendors...</p>}

      {!loading && vendors.length === 0 && <p>No vendors yet.</p>}

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
              onClick={() => router.push(`/vendor/${vendor.handle}`)}
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
    </div>
  );
}
