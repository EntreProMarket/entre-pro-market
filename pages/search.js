import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

export default function Search() {

  const [vendors, setVendors] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {

    let query = supabase
      .from("vendors")
      .select("*");

    if (searchText) {
      query = query.ilike("handle", `%${searchText}%`);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (tag) {
      query = query.ilike("tags", `%${tag}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.log(error);
    } else {
      setVendors(data);
    }
  }

  return (

    <div style={{ padding: 40, fontFamily: "sans-serif" }}>

      <h1>Find Vendors</h1>

      {/* SEARCH BAR */}

      <input
        type="text"
        placeholder="Search by vendor handle..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ padding: 10, width: 250, marginRight: 10 }}
      />

      <button
        onClick={fetchVendors}
        style={{
          padding: "10px 20px",
          backgroundColor: "#701890",
          color: "white",
          border: "none",
          borderRadius: 5,
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Search
      </button>

      <br /><br />

      {/* CATEGORY FILTER */}

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={{ padding: 10, marginRight: 10 }}
      >

        <option value="">All Categories</option>
        <option value="DJ">DJ</option>
        <option value="Catering">Catering</option>
        <option value="Photography">Photography</option>
        <option value="Venue">Venue</option>
        <option value="Decor">Decor</option>

      </select>

      {/* TAG FILTER */}

      <input
        type="text"
        placeholder="Tag (wedding, party, corporate)"
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        style={{ padding: 10, width: 200 }}
      />

      <button
        onClick={fetchVendors}
        style={{
          padding: "10px 20px",
          marginLeft: 10,
          backgroundColor: "#AABB23",
          color: "white",
          border: "none",
          borderRadius: 5,
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Apply Filters
      </button>

      <hr style={{ margin: "30px 0" }} />

      {/* RESULTS */}

      {vendors.map((vendor) => (

        <div
          key={vendor.id}
          style={{
            border: "1px solid #ddd",
            padding: 20,
            marginBottom: 20,
            borderRadius: 10
          }}
        >

          <h2>

            <Link href={`/vendor/${vendor.handle}`}>
              @{vendor.handle}
            </Link>

            {vendor.premium && (
              <span
                style={{
                  marginLeft: 10,
                  color: "#AABB23",
                  fontWeight: "bold"
                }}
              >
                PREMIUM
              </span>
            )}

          </h2>

          <p>{vendor.bio}</p>

          <p>
            <strong>Category:</strong> {vendor.category}
          </p>

          {vendor.tags && (
            <p>
              <strong>Tags:</strong> {vendor.tags}
            </p>
          )}

        </div>

      ))}

    </div>

  );

}
