// pages/marketplace.js

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

const CATEGORIES = [
  "All", "DJ", "Photographer", "Caterer", "Decorator",
  "Venue", "Florist", "Hair & Makeup", "Music", "Other"
];

export default function Marketplace() {
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => { fetchVendors(); }, []);

  useEffect(() => {
    let results = [...vendors];
    if (category !== "All") {
      results = results.filter(v => v.category === category);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(v =>
        v.business_name?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q) ||
        v.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    setFiltered(results);
  }, [vendors, category, query]);

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "vendor")
      .not("business_name", "is", null);
    if (error) { console.log(error); setLoading(false); return; }
    setVendors(data || []);
    setFiltered(data || []);
    setLoading(false);
  };

  // ✅ FIXED: featured is its own tier, separate from premium
  const featuredVendors = filtered.filter(v => v.account_type === "featured");
  const premiumVendors = filtered.filter(v => v.account_type === "premium");
  const regularVendors = filtered.filter(v => v.account_type !== "featured" && v.account_type !== "premium");

  const VendorCard = ({ vendor }) => {
    const isFeatured = vendor.account_type === "featured";
    const isPremium = vendor.account_type === "premium";
    return (
      <div
        onClick={() => router.push(`/vendor/${vendor.handle}`)}
        style={{
          border: `2px solid ${isFeatured ? "#AABB23" : isPremium ? "#701890" : "#eee"}`,
          borderRadius: 12,
          overflow: "hidden",
          cursor: "pointer",
          backgroundColor: "white",
          boxShadow: isFeatured ? "0 2px 12px rgba(170,187,35,0.2)" : "0 2px 8px rgba(0,0,0,0.07)",
          position: "relative",
        }}
      >
        {isFeatured && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            backgroundColor: "#AABB23", color: "white",
            fontSize: 10, fontWeight: "bold",
            padding: "3px 8px", borderRadius: 10, zIndex: 1,
          }}>
            🔥 FEATURED
          </div>
        )}
        {isPremium && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            backgroundColor: "#701890", color: "white",
            fontSize: 10, fontWeight: "bold",
            padding: "3px 8px", borderRadius: 10, zIndex: 1,
          }}>
            💜 PREMIUM
          </div>
        )}
        <div style={{ height: 160, backgroundColor: "#f4f4f4", overflow: "hidden" }}>
          {vendor.logo_url ? (
            <img src={vendor.logo_url} alt={vendor.business_name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 13 }}>
              No Image
            </div>
          )}
        </div>
        <div style={{ padding: 14 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>{vendor.business_name}</h3>
          <p style={{ margin: 0, color: "#777", fontSize: 13 }}>{vendor.category}</p>
          <p style={{ margin: "4px 0 8px", fontSize: 12, color: "#999" }}>
            📍 {vendor.city}{vendor.state ? `, ${vendor.state}` : ""}
          </p>
          <div>
            {vendor.tags?.slice(0, 3).map(tag => (
              <span key={tag} style={{
                fontSize: 11, background: "#f0e8ff", color: "#701890",
                padding: "3px 8px", borderRadius: 10,
                marginRight: 4, display: "inline-block", marginBottom: 4,
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>Vendor Marketplace</h1>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>
        Browse and connect with vendors for your next event
      </p>

      {/* AD BANNER */}
      <div style={{
        backgroundColor: "#f3e8ff", border: "1px solid #701890",
        borderRadius: 10, padding: "14px 20px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <p style={{ margin: 0, fontWeight: "bold", color: "#701890", fontSize: 14 }}>📢 Advertise Here</p>
          <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Reach thousands of event organizers and shoppers</p>
        </div>
        <button onClick={() => router.push("/contact")} style={{ padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
          Learn More
        </button>
      </div>

      {/* SEARCH */}
      <input type="text" placeholder="🔍 Search by name, city, category or tag..."
        value={query} onChange={e => setQuery(e.target.value)}
        style={{ width: "100%", padding: "12px 16px", marginBottom: 16, borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
      />

      {/* CATEGORY FILTERS */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 24, paddingBottom: 4 }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            padding: "7px 14px", borderRadius: 20, border: "1px solid #ddd",
            backgroundColor: category === cat ? "#701890" : "#fff",
            color: category === cat ? "#fff" : "#333",
            cursor: "pointer", fontSize: 13, whiteSpace: "nowrap",
            fontWeight: category === cat ? "bold" : "normal",
          }}>
            {cat}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: "#888" }}>Loading vendors...</p>}
      {!loading && filtered.length === 0 && (
        <p style={{ color: "#888", textAlign: "center", marginTop: 40 }}>
          No vendors found. Try a different search or category.
        </p>
      )}

      {/* 🔥 FEATURED VENDORS */}
      {!loading && featuredVendors.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14, color: "#AABB23" }}>🔥 Featured Vendors</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {featuredVendors.map(v => <VendorCard key={v.id} vendor={v} />)}
          </div>
        </div>
      )}

      {/* 💜 PREMIUM VENDORS */}
      {!loading && premiumVendors.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14, color: "#701890" }}>💜 Premium Vendors</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {premiumVendors.map(v => <VendorCard key={v.id} vendor={v} />)}
          </div>
        </div>
      )}

      {/* ALL VENDORS */}
      {!loading && regularVendors.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>All Vendors</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {regularVendors.map(v => <VendorCard key={v.id} vendor={v} />)}
          </div>
        </div>
      )}

      {/* BOTTOM BANNER */}
      <div style={{
        marginTop: 40, backgroundColor: "#f9ffe8", border: "1px solid #AABB23",
        borderRadius: 10, padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <p style={{ margin: 0, fontWeight: "bold", color: "#888B00", fontSize: 14 }}>🛒 Are you a Vendor?</p>
          <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Join EntreProMarket and get discovered by event organizers</p>
        </div>
        <button onClick={() => router.push("/vendor-info")} style={{ padding: "8px 16px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
          Become a Vendor
        </button>
      </div>
    </div>
  );
}
