// /pages/organizer-dashboard.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function OrganizerDashboard() {
  const [loading, setLoading] = useState(true);
  const [organizer, setOrganizer] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);

  const [searchCategory, setSearchCategory] = useState("");
  const [searchTags, setSearchTags] = useState([]);
  const [searchCity, setSearchCity] = useState("");
  const [searchState, setSearchState] = useState("");
  const [searchText, setSearchText] = useState("");

  // Organizer subscription tiers
  const tiers = ["Basic", "Pro", "Premium"];

  useEffect(() => {
    const fetchOrganizer = async () => {
      const user = supabase.auth.user();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) console.error(error);
      else setOrganizer(data);
    };

    fetchOrganizer();
  }, []);

  useEffect(() => {
    const fetchVendors = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "vendor"); // fetch all vendors

      if (error) console.error(error);
      else {
        setVendors(data);
        setFilteredVendors(data);
      }
      setLoading(false);
    };

    fetchVendors();
  }, []);

  // Filter vendors based on search inputs
  const handleSearch = () => {
    let filtered = vendors;

    if (searchCategory) {
      filtered = filtered.filter((v) => v.category === searchCategory);
    }

    if (searchTags.length > 0) {
      filtered = filtered.filter((v) =>
        searchTags.every((tag) => v.tags?.includes(tag))
      );
    }

    if (searchCity) {
      filtered = filtered.filter((v) =>
        v.city?.toLowerCase().includes(searchCity.toLowerCase())
      );
    }

    if (searchState) {
      filtered = filtered.filter((v) =>
        v.state?.toLowerCase().includes(searchState.toLowerCase())
      );
    }

    if (searchText) {
      filtered = filtered.filter(
        (v) =>
          v.business_name?.toLowerCase().includes(searchText.toLowerCase()) ||
          v.handle?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredVendors(filtered);
  };

  if (loading) return <p>Loading...</p>;
  if (!organizer) return <p>Please log in as an Organizer.</p>;

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h1>Organizer Dashboard</h1>

      <p>
        Subscription Tier:{" "}
        <strong>{organizer.subscription_tier || "None"}</strong>
      </p>

      {!organizer.subscription_tier && (
        <p>Please subscribe to a tier to access vendor contacts.</p>
      )}

      <h2>Search Vendors</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <input
          type="text"
          placeholder="Search by handle or business name"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <input
          type="text"
          placeholder="City"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
        />

        <input
          type="text"
          placeholder="State"
          value={searchState}
          onChange={(e) => setSearchState(e.target.value)}
        />

        <select
          value={searchCategory}
          onChange={(e) => setSearchCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {[
            "DJ",
            "Catering",
            "Photography",
            "Videography",
            "Florist",
            "Balloon Artist",
            "Event Planner",
            "Bartender",
            "Venue",
            "Lighting",
            "Photo Booth",
            "Makeup Artist",
            "Cake Designer",
            "Decor Rental",
            "Security",
            "Entertainment",
            "Transportation",
            "Party Rentals",
            "Audio / Visual",
            "Event Staffing",
          ].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button onClick={handleSearch}>Search</button>
      </div>

      <h2 style={{ marginTop: 30 }}>Results ({filteredVendors.length})</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {filteredVendors.map((v) => {
          const showContact =
            v.role === "paid_vendor" ||
            (v.role === "vendor" &&
              organizer.subscription_tier === "Pro") ||
            organizer.subscription_tier === "Premium";

          return (
            <div
              key={v.id}
              style={{
                border: "1px solid #ddd",
                padding: 10,
                borderRadius: 8,
                display: "flex",
                gap: 15,
                alignItems: "center",
              }}
            >
              {v.logo_url && (
                <img
                  src={v.logo_url}
                  alt={v.business_name}
                  style={{ width: 80 }}
                />
              )}
              <div>
                <h3>
                  {v.business_name}{" "}
                  {v.is_premium && <span style={{ color: "gold" }}>★</span>}
                </h3>
                <p>
                  Category: {v.category} | Tags:{" "}
                  {v.tags?.join(", ") || "None"}
                </p>

                {showContact && (
                  <div>
                    {v.email && <p>Email: {v.email}</p>}
                    {v.phone && <p>Phone: {v.phone}</p>}
                  </div>
                )}

                <a href={`/vendor/${v.handle}`}>View Profile</a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
