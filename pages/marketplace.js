// pages/marketplace.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import AnnouncementBanner from "../components/AnnouncementBanner";

const CATEGORIES = ["All","DJ","Photographer","Videographer","Caterer","Decorator","Florist","Hair & Makeup","Music","Bakery","Clothing & Apparel","Jewelry","Crafts & Art","Food & Beverage","Health & Wellness","Entertainment","Security","Transportation","Poetry & Literature","Performing Arts","Theater & Acting","Other"];
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function Marketplace() {
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [emailGateOpen, setEmailGateOpen] = useState(false);
  const [gateEmail, setGateEmail] = useState("");
  const [gateSubmitted, setGateSubmitted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user || null);
      const { data } = await supabase.from("profiles").select("id, business_name, category, city, state, description, logo_url, account_type, handle, tags, portfolio_images").eq("role", "vendor").not("handle", "is", null).not("business_name", "is", null);
      if (data) {
        const featured = shuffle(data.filter(v => v.account_type === "featured"));
        const premium = shuffle(data.filter(v => v.account_type === "premium"));
        const free = shuffle(data.filter(v => !["featured","premium"].includes(v.account_type)));
        const sorted = [...featured, ...premium, ...free];
        setVendors(sorted); setFiltered(sorted);
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    let result = vendors;
    if (selectedCategory !== "All") result = result.filter(v => v.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.business_name?.toLowerCase().includes(q) || v.category?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q) ||
        v.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [selectedCategory, searchQuery, vendors]);

  const handleVendorClick = (vendor) => {
    if (!user) { setEmailGateOpen(true); return; }
    router.push(`/vendor/${vendor.handle}`);
  };

  const handleGateSubmit = () => {
    if (!gateEmail.includes("@")) return;
    setGateSubmitted(true);
    setTimeout(() => { setEmailGateOpen(false); setGateSubmitted(false); setGateEmail(""); }, 2000);
  };

  const tierBadge = (tier) => {
    if (tier === "featured") return <span style={{ fontSize: 10, backgroundColor: "#AABB23", color: "white", padding: "2px 7px", borderRadius: 10, fontWeight: "bold", position: "absolute", top: 8, left: 8 }}>🔥 Featured</span>;
    if (tier === "premium") return <span style={{ fontSize: 10, backgroundColor: "#701890", color: "white", padding: "2px 7px", borderRadius: 10, fontWeight: "bold", position: "absolute", top: 8, left: 8 }}>💜 Premium</span>;
    return null;
  };
  const tierBorder = (tier) => tier === "featured" ? "1px solid #AABB23" : tier === "premium" ? "1px solid #701890" : "1px solid #e5e7eb";

  if (loading) return <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>Loading marketplace...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif", padding: "0 0 40px" }}>

      {/* HEADER — logo enlarged to 140px */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #eee", backgroundColor: "white", position: "sticky", top: 0, zIndex: 10 }}>
        <img src="/logo-circle.png" alt="EntreProMarket" style={{ width: 140, height: 140, objectFit: "contain", borderRadius: "50%" }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => router.push("/home")} style={{ padding: "7px 14px", backgroundColor: "white", color: "#701890", border: "1px solid #701890", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>🏡 Home</button>
          {user ? (
            <button onClick={() => router.push("/vendor-dashboard")} style={{ padding: "7px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>📊 Dashboard</button>
          ) : (
            <button onClick={() => router.push("/")} style={{ padding: "7px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>Log In</button>
          )}
        </div>
      </div>

      <div style={{ padding: "20px 16px 0" }}>
        <AnnouncementBanner />
        <h1 style={{ margin: "0 0 4px", fontSize: 20 }}>🛒 Vendor Marketplace</h1>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>{filtered.length} vendor{filtered.length !== 1 ? "s" : ""} found</p>

        <div style={{ position: "relative", marginBottom: 14 }}>
          <input type="text" placeholder="Search by name, category, city..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ display: "block", width: "100%", padding: "11px 16px 11px 38px", borderRadius: 30, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
          <span style={{ position: "absolute", left: 13, top: 12, color: "#aaa", fontSize: 15 }}>🔍</span>
          {searchQuery && <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 13, top: 9, background: "none", border: "none", color: "#aaa", fontSize: 18, cursor: "pointer" }}>✕</button>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setShowFilters(!showFilters)} style={{ padding: "7px 16px", backgroundColor: showFilters ? "#701890" : "white", color: showFilters ? "white" : "#701890", border: "1px solid #701890", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13, marginBottom: 10 }}>
            🏷️ {selectedCategory === "All" ? "Filter by Category" : selectedCategory} {showFilters ? "▲" : "▼"}
          </button>
          {showFilters && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setSelectedCategory(cat); setShowFilters(false); }}
                  style={{ padding: "5px 13px", borderRadius: 20, border: `1px solid ${selectedCategory === cat ? "#701890" : "#ddd"}`, backgroundColor: selectedCategory === cat ? "#701890" : "white", color: selectedCategory === cat ? "white" : "#555", fontSize: 12, cursor: "pointer", fontWeight: selectedCategory === cat ? "bold" : "normal" }}>
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
            <p style={{ fontSize: 48, margin: 0 }}>🔍</p>
            <p style={{ fontSize: 15, marginTop: 12 }}>No vendors found.</p>
            <button onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }} style={{ marginTop: 16, padding: "10px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>Clear Filters</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14 }}>
            {filtered.map(vendor => (
              <div key={vendor.id} onClick={() => handleVendorClick(vendor)}
                style={{ border: tierBorder(vendor.account_type), borderRadius: 10, overflow: "hidden", cursor: "pointer", backgroundColor: "white" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ height: 140, backgroundColor: "#f5f5f5", position: "relative", overflow: "hidden" }}>
                  {vendor.logo_url ? <img src={vendor.logo_url} alt={vendor.business_name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: 13 }}>No Image</div>}
                  {tierBadge(vendor.account_type)}
                </div>
                <div style={{ padding: "10px 12px 12px" }}>
                  <p style={{ margin: "0 0 3px", fontWeight: "bold", fontSize: 14, color: "#111" }}>{vendor.business_name}</p>
                  <p style={{ margin: "0 0 3px", color: "#701890", fontSize: 12, fontWeight: "bold" }}>{vendor.category}</p>
                  <p style={{ margin: 0, color: "#888", fontSize: 12 }}>{vendor.city}{vendor.state ? `, ${vendor.state}` : ""}</p>
                  {vendor.tags?.length > 0 && (
                    <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {vendor.tags.slice(0, 2).map(tag => <span key={tag} style={{ fontSize: 10, backgroundColor: "#f0f0f0", padding: "2px 6px", borderRadius: 8, color: "#666" }}>{tag}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {emailGateOpen && (
        <div onClick={() => setEmailGateOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: 16, padding: "32px 28px", maxWidth: 380, width: "100%", textAlign: "center" }}>
            <img src="/logo-circle.png" alt="EntreProMarket" style={{ width: 100, height: 100, objectFit: "contain", borderRadius: "50%", marginBottom: 20 }} />
            <h2 style={{ margin: "0 0 8px" }}>Join to View Vendor Profiles</h2>
            {!gateSubmitted ? (
              <>
                <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>Sign up free to access the full marketplace and contact vendors.</p>
                <input type="email" placeholder="Your email address" value={gateEmail} onChange={e => setGateEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleGateSubmit()} style={{ display: "block", width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, marginBottom: 12, boxSizing: "border-box" }} />
                <button onClick={handleGateSubmit} style={{ width: "100%", padding: "13px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 12 }}>Get Free Access</button>
                <button onClick={() => { setEmailGateOpen(false); router.push("/"); }} style={{ background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>Already have an account? Log in</button>
              </>
            ) : (
              <div style={{ padding: 20 }}>
                <p style={{ fontSize: 40, margin: 0 }}>🎉</p>
                <p style={{ fontWeight: "bold", fontSize: 16, color: "#701890" }}>You're in!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
