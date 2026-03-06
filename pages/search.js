import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function SearchVendors() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredVendors, setFilteredVendors] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from("vendors")
      .select("*");

    if (!error) {
      setVendors(data);
      setFilteredVendors(data);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);

    const filtered = vendors.filter((vendor) =>
      vendor.handle.toLowerCase().includes(value.toLowerCase()) ||
      vendor.name?.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredVendors(filtered);
  };

  const openProfile = (handle) => {
    router.push(`/vendor/${handle}`);
  };

  return (
    <div style={{ padding: 30, fontFamily: "sans-serif" }}>
      <h1>Find Vendors</h1>

      <input
        type="text"
        placeholder="Search vendors..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          padding: 10,
          width: 300,
          marginBottom: 30,
          borderRadius: 5,
          border: "1px solid #ccc"
        }}
      />

      <div>
        {filteredVendors.length === 0 && <p>No vendors found.</p>}

        {filteredVendors.map((vendor) => (
          <div
            key={vendor.id}
            onClick={() => openProfile(vendor.handle)}
            style={{
              padding: 20,
              marginBottom: 15,
              border: "1px solid #ddd",
              borderRadius: 8,
              cursor: "pointer"
            }}
          >
            <h3>{vendor.name || vendor.handle}</h3>
            <p>@{vendor.handle}</p>
            <p>{vendor.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
