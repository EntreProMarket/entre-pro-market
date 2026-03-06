import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function SearchVendors() {

  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const router = useRouter();

  const categories = [
    "All",
    "Music",
    "Catering",
    "Photography",
    "Videography",
    "Decor",
    "Lighting",
    "Security",
    "Staffing",
    "Transportation"
  ];

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

  const runFilter = (text, cat) => {

    let results = vendors;

    if (text) {
      results = results.filter(vendor =>
        vendor.handle?.toLowerCase().includes(text.toLowerCase()) ||
        vendor.name?.toLowerCase().includes(text.toLowerCase())
      );
    }

    if (cat !== "All") {
      results = results.filter(vendor =>
        vendor.category === cat
      );
    }

    setFilteredVendors(results);

  };

  const handleSearch = (value) => {
    setSearch(value);
    runFilter(value, category);
  };

  const handleCategory = (value) => {
    setCategory(value);
    runFilter(search, value);
  };

  const openProfile = (handle) => {
    router.push(`/vendor/${handle}`);
  };

  return (

    <div style={{ padding: 30, fontFamily: "sans-serif" }}>

      <h1>Find Vendors</h1>

      {/* Search */}

      <input
        type="text"
        placeholder="Search vendors..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          padding: 10,
          width: 300,
          marginBottom: 20,
          borderRadius: 5,
          border: "1px solid #ccc"
        }}
      />

      <br/>

      {/* Category Filter */}

      <select
        value={category}
        onChange={(e) => handleCategory(e.target.value)}
        style={{
          padding: 10,
          marginBottom: 30,
          borderRadius: 5
        }}
      >
        {categories.map((cat) => (
          <option key={cat}>{cat}</option>
        ))}
      </select>

      {/* Results */}

      <div>

        {filteredVendors.length === 0 && (
          <p>No vendors found.</p>
        )}

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
