// pages/marketplace.js

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

const CATEGORIES = [
  "All", "DJ", "Photographer", "Videographer", "Caterer", "Decorator",
  "Venue", "Florist", "Hair & Makeup", "Music", "Bakery",
  "Clothing & Apparel", "Jewelry", "Crafts & Art", "Food & Beverage",
  "Health & Wellness", "Entertainment", "Security", "Transportation", "Other"
];

export default function Marketplace() {
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [gateEmail, setGateEmail] = useState("");
  const [showGate, setShowGate] = useState(false);
  const [gateLoading, setGateLoading] = useState(false);
  const [loggedInProfile, setLoggedInProfile] = useState(null);
  const [viewMode, setViewMode] = useState("card"); // "card" or "grid"
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Check if visitor has already provided email or is logged in
    const checkAccess = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        setShowGate(false);
        const { data: prof } = await supabase
          .from("profiles")
          .select("role, account_type, is_admin")
          .eq("id", userData.user.id)
          .single();
        setLoggedInProfile(prof);
      } else {
        // Check localStorage for returning visitors
        const hasEmail = typeof window !== "undefined" && localStorage.getItem("epm_visitor_email");
        setShowGate(!hasEmail);
      }
    };
    checkAccess();
    fetchVendors();
  }, []);

  const handleGateSubmit = async () => {
    if (!gateEmail || !gateEmail.includes("@")) return;
    setGateLoading(true);
    // Save visitor email to Supabase
    await supabase.from("visitor_emails").insert([{ email: gateEmail }]).select();
    // Store in localStorage so they don't see gate again
    if (typeof window !== "undefined") {
      localStorage.setItem("epm_visitor_email", gateEmail);
    }
    setShowGate(false);
    setGateLoading(false);
  };

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
    // Shuffle within each tier for dynamic ordering
    const shuffle = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const featured = shuffle((data || []).filter(v => v.account_type === "featured"));
    const premium = shuffle((data || []).filter(v => v.account_type === "premium"));
    const free = shuffle((data || []).filter(v => v.account_type !== "featured" && v.account_type !== "premium"));
    const sorted = [...featured, ...premium, ...free];
    setVendors(sorted);
    setFiltered(sorted);
    setLoading(false);
  };

  // ✅ FIXED: featured is its own tier, separate from premium
  const featuredVendors = filtered.filter(v => v.account_type === "featured");
  const premiumVendors = filtered.filter(v => v.account_type === "premium");
  const regularVendors = filtered.filter(v => v.account_type !== "featured" && v.account_type !== "premium");

  const VendorCard = ({ vendor }) => {
    const isFeatured = vendor.account_type === "featured";
    const isPremium = vendor.account_type === "premium";

    // Small grid mode
    if (viewMode === "grid") {
      return (
        <div onClick={() => router.push(`/vendor/${vendor.handle}`)}
          style={{
            border: `2px solid ${isFeatured ? "#AABB23" : isPremium ? "#701890" : "#eee"}`,
            borderRadius: 10, overflow: "hidden", cursor: "pointer",
            backgroundColor: "white", position: "relative",
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: 8, textAlign: "center",
          }}>
          <div style={{ width: 60, height: 60, borderRadius: 8, overflow: "hidden", backgroundColor: "#f4f4f4", marginBottom: 6 }}>
            {vendor.logo_url
              ? <img src={vendor.logo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#bbb" }}>No img</div>
            }
          </div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
            {vendor.business_name}
          </p>
          <p style={{ margin: 0, fontSize: 10, color: "#888" }}>{vendor.category}</p>
        </div>
      );
    }

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

  // EMAIL GATE OVERLAY
  if (showGate) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa", fontFamily: "sans-serif", padding: 20 }}>
        <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <img src="/logo-transparent.png" alt="EntreProMarket" style={{ width: 90, borderRadius: "50%", marginBottom: 16 }} />
          <h2 style={{ marginBottom: 8 }}>Browse Our Vendors</h2>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>
            Enter your email to browse thousands of vendors — free, no account needed.
          </p>
          <input
            type="email"
            placeholder="your@email.com"
            value={gateEmail}
            onChange={e => setGateEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleGateSubmit()}
            style={{ display: "block", width: "100%", padding: "12px 14px", marginBottom: 12, borderRadius: 6, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }}
          />
          <button onClick={handleGateSubmit} disabled={gateLoading || !gateEmail.includes("@")}
            style={{ width: "100%", padding: "13px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 16, opacity: !gateEmail.includes("@") ? 0.6 : 1 }}>
            {gateLoading ? "Please wait..." : "Browse Vendors →"}
          </button>
          <p style={{ fontSize: 12, color: "#aaa", marginBottom: 16 }}>
            No spam. We respect your privacy.
          </p>
          <div style={{ borderTop: "1px solid #eee", paddingTop: 16 }}>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>Already have an account?</p>
            <button onClick={() => router.push("/")}
              style={{ padding: "10px 20px", backgroundColor: "white", color: "#701890", border: "2px solid #701890", borderRadius: 8, fontWeight: "bold", fontSize: 13, cursor: "pointer" }}>
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", fontFamily: "sans-serif" }}>

      {/* STICKY BLACK TOP BAR */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        backgroundColor: "#111", color: "white",
        padding: "12px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {loggedInProfile && (
            <button onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: "none", border: "none", color: "white", fontSize: 20, cursor: "pointer", padding: "0 4px" }}>
              ☰
            </button>
          )}
          <span style={{ fontWeight: "bold", fontSize: 16 }}>Entre PRO Market</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {loggedInProfile?.role === "vendor" && (
            <button onClick={() => window.location.href = "/vendor-dashboard"}
              style={{ padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>
              Dashboard
            </button>
          )}
          {loggedInProfile?.role === "organizer" && (
            <button onClick={() => window.location.href = "/organizer-dashboard"}
              style={{ padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>
              Dashboard
            </button>
          )}
          {loggedInProfile?.is_admin && (
            <button onClick={() => window.location.href = "/admin"}
              style={{ padding: "6px 12px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>
              Admin
            </button>
          )}
          {loggedInProfile ? (
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
              style={{ padding: "6px 12px", backgroundColor: "#333", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
              Log Out
            </button>
          ) : (
            <button onClick={() => window.location.href = "/"}
              style={{ padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>
              Log In
            </button>
          )}
        </div>
      </div>

      {/* SIDEBAR DROPDOWN MENU */}
      {menuOpen && loggedInProfile && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200,
        }} onClick={() => setMenuOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            position: "absolute", top: 0, left: 0,
            width: 240, height: "100%",
            backgroundColor: "white", boxShadow: "4px 0 16px rgba(0,0,0,0.2)",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ backgroundColor: "#111", padding: "16px 20px", color: "white", fontWeight: "bold", fontSize: 16 }}>
              Entre PRO Market
            </div>
            {[
              { label: "🏡 Home", path: "/home" },
              { label: "📊 Dashboard", path: loggedInProfile.role === "organizer" ? "/organizer-dashboard" : "/vendor-dashboard" },
              { label: "🛒 Marketplace", path: "/marketplace" },
              { label: "✉️ Messages", path: "/messages" },
              { label: "💾 Saved Contacts", path: "/saved-contacts" },
            ].map(item => (
              <button key={item.path}
                onClick={() => { setMenuOpen(false); window.location.href = item.path; }}
                style={{
                  padding: "14px 20px", backgroundColor: "white", border: "none",
                  borderBottom: "1px solid #f0f0f0", cursor: "pointer",
                  textAlign: "left", fontSize: 15, fontWeight: "bold", color: "#333",
                }}>
                {item.label}
              </button>
            ))}
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
              style={{
                marginTop: "auto", padding: "14px 20px", backgroundColor: "white",
                border: "none", borderTop: "1px solid #eee", cursor: "pointer",
                textAlign: "left", fontSize: 15, fontWeight: "bold", color: "#cc0000",
              }}>
              🚪 Log Out
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: 20 }}>
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

      {/* VIEW TOGGLE — shows when 50+ vendors */}
      {!loading && filtered.length >= 50 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, gap: 8 }}>
          <button onClick={() => setViewMode("card")}
            style={{ padding: "7px 14px", backgroundColor: viewMode === "card" ? "#701890" : "#eee", color: viewMode === "card" ? "white" : "#333", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>
            ▦ Cards
          </button>
          <button onClick={() => setViewMode("grid")}
            style={{ padding: "7px 14px", backgroundColor: viewMode === "grid" ? "#701890" : "#eee", color: viewMode === "grid" ? "white" : "#333", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>
            ⊞ Grid
          </button>
        </div>
      )}

      {/* 🔥 FEATURED VENDORS */}
      {!loading && featuredVendors.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14, color: "#AABB23" }}>🔥 Featured Vendors</h2>
          <div style={{ display: "grid", gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(100px, 1fr))" : "repeat(auto-fill, minmax(220px, 1fr))", gap: viewMode === "grid" ? 8 : 16 }}>
            {featuredVendors.map(v => <VendorCard key={v.id} vendor={v} />)}
          </div>
        </div>
      )}

      {/* 💜 PREMIUM VENDORS */}
      {!loading && premiumVendors.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14, color: "#701890" }}>💜 Premium Vendors</h2>
          <div style={{ display: "grid", gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(100px, 1fr))" : "repeat(auto-fill, minmax(220px, 1fr))", gap: viewMode === "grid" ? 8 : 16 }}>
            {premiumVendors.map(v => <VendorCard key={v.id} vendor={v} />)}
          </div>
        </div>
      )}

      {/* ALL VENDORS */}
      {!loading && regularVendors.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>All Vendors</h2>
          <div style={{ display: "grid", gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(100px, 1fr))" : "repeat(auto-fill, minmax(220px, 1fr))", gap: viewMode === "grid" ? 8 : 16 }}>
            {regularVendors.map(v => <VendorCard key={v.id} vendor={v} />)}
          </div>
        </div>
      )}

      {/* BOTTOM BANNERS */}
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Become a Vendor */}
        <div style={{
          backgroundColor: "#f9ffe8", border: "1px solid #AABB23",
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

        {/* Become an Organizer */}
        <div style={{
          backgroundColor: "#f3e8ff", border: "1px solid #701890",
          borderRadius: 10, padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
        }}>
          <div>
            <p style={{ margin: 0, fontWeight: "bold", color: "#701890", fontSize: 14 }}>🎪 Are you an Event Organizer?</p>
            <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Find and connect with the best vendors for your events</p>
          </div>
          <button onClick={() => router.push("/organizer-info")} style={{ padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
            Become an Organizer
          </button>
        </div>
      </div>


      </div>
    </div>
  );
}
