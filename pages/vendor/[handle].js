// pages/vendor/[handle].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { SocialLinks } from "../../components/SocialIcons";

const thumbStyle = (w, h, radius = 12) => ({ width: w, height: h, borderRadius: radius, border: "1px solid #e5e7eb", overflow: "hidden", cursor: "pointer", flexShrink: 0, display: "block" });
const thumbImg = { width: "100%", height: "100%", objectFit: "cover", display: "block" };

export default function VendorPublicProfile() {
  const router = useRouter();
  const { handle, tab, from: fromParam } = router.query;
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [viewerProfile, setViewerProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [notFoundIsOwner, setNotFoundIsOwner] = useState(false);

  useEffect(() => { setActiveTab(tab === "shop" ? "shop" : "profile"); }, [tab]);

  const switchTab = (t) => {
    setActiveTab(t);
    const newQuery = { ...router.query };
    if (t === "shop") newQuery.tab = "shop"; else delete newQuery.tab;
    router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
  };

  useEffect(() => {
    if (!handle) return;
    const fetchVendor = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!handle || handle === "undefined" || handle === "null") {
        if (user) {
          const { data: myProfile } = await supabase.from("profiles").select("role, handle").eq("id", user.id).single();
          if (myProfile?.role === "vendor") setNotFoundIsOwner(true);
        }
        setLoading(false); return;
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("handle", handle).single();

      if (error || !data) {
        if (user) {
          const { data: myProfile } = await supabase.from("profiles").select("role, handle").eq("id", user.id).single();
          if (myProfile?.role === "vendor") setNotFoundIsOwner(true);
        }
        setLoading(false); return;
      }

      setVendor(data);
      const ownerViewing = user && data.id === user.id;
      if (ownerViewing) setIsOwner(true);

      let viewerIsAdmin = false;
      if (user) {
        const { data: vp } = await supabase.from("profiles").select("role, account_type, id, is_admin").eq("id", user.id).single();
        setViewerProfile(vp);
        viewerIsAdmin = vp?.is_admin === true;
      }

      // ── Count all views except owner and admin (anonymous visitors tracked too) ──
      if (!ownerViewing && !viewerIsAdmin) {
        await supabase.from("profile_views").insert([{ profile_id: data.id, viewer_id: user?.id || null }]);
      }

      const { data: prods } = await supabase.from("vendor_products").select("*").eq("vendor_id", data.id).eq("is_active", true).order("created_at", { ascending: false });
      setProducts(prods || []);
      setLoading(false);
    };
    fetchVendor();
  }, [handle]);

  const handleBack = () => {
    if (fromParam === "insights") { router.push("/profile-insights"); return; }
    if (fromParam === "admin") { router.push("/admin"); return; }
    router.push("/marketplace");
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (!vendor) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, fontFamily: "sans-serif", textAlign: "center" }}>
        <img src="/logo-circle.png" alt="Entre PRO Market" style={{ width: 120, marginBottom: 24 }} />
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏗️</div>
        <h2 style={{ color: "#333", marginBottom: 8 }}>{notFoundIsOwner ? "Your Profile Isn't Set Up Yet" : "Vendor Not Found"}</h2>
        <p style={{ color: "#888", fontSize: 14, maxWidth: 300, lineHeight: 1.6, marginBottom: 28 }}>
          {notFoundIsOwner ? "Complete your vendor profile so organizers and buyers can find you." : "This vendor profile doesn't exist or may have been removed."}
        </p>
        {notFoundIsOwner && <button onClick={() => router.replace("/vendor-profile")} style={{ padding: "13px 28px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 12, width: "100%", maxWidth: 280 }}>✏️ Set Up My Profile</button>}
        <button onClick={() => router.replace(notFoundIsOwner ? "/vendor-dashboard" : "/marketplace")} style={{ padding: "11px 24px", backgroundColor: "white", color: "#701890", border: "2px solid #701890", borderRadius: 8, fontWeight: "bold", fontSize: 14, cursor: "pointer", width: "100%", maxWidth: 280 }}>
          {notFoundIsOwner ? "← Back to Dashboard" : "← Back to Marketplace"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20, position: "relative", fontFamily: "sans-serif" }}>
      {isOwner && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ padding: "8px 14px", backgroundColor: "#111", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>☰ Menu</button>
          <button onClick={() => router.push("/vendor-profile")} style={{ padding: "8px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>✏️ Edit Profile</button>
        </div>
      )}

      {menuOpen && isOwner && (
        <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 0, left: 0, width: 240, height: "100%", backgroundColor: "white", boxShadow: "4px 0 16px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
            <div style={{ backgroundColor: "#111", padding: "16px 20px", color: "white", fontWeight: "bold", fontSize: 16 }}>Entre PRO Market</div>
            {[{ label: "🏡 Home", path: "/home" }, { label: "📊 Dashboard", path: "/vendor-dashboard" }, { label: "👤 My Profile", path: `/vendor/${vendor?.handle}` }, { label: "✏️ Edit Profile", path: "/vendor-profile" }, { label: "🛒 Marketplace", path: "/marketplace" }, { label: "✉️ Messages", path: "/messages" }, { label: "💾 Saved Contacts", path: "/saved-contacts" }].map(item => (
              <button key={item.path} onClick={() => { setMenuOpen(false); router.push(item.path); }} style={{ padding: "14px 20px", backgroundColor: "white", border: "none", borderBottom: "1px solid #f0f0f0", cursor: "pointer", textAlign: "left", fontSize: 15, fontWeight: "bold", color: "#333" }}>{item.label}</button>
            ))}
            <button onClick={async () => { await supabase.auth.signOut(); router.replace("/"); }} style={{ marginTop: "auto", padding: "14px 20px", backgroundColor: "white", border: "none", borderTop: "1px solid #eee", cursor: "pointer", textAlign: "left", fontSize: 15, fontWeight: "bold", color: "#cc0000" }}>🚪 Log Out</button>
          </div>
        </div>
      )}

      <h1 style={{ marginBottom: 4 }}>{vendor.business_name}</h1>
      <p style={{ color: "#777", marginBottom: 16 }}>@{vendor.handle}</p>

      <div style={{ display: "flex", borderBottom: "2px solid #eee", marginBottom: 20 }}>
        <button onClick={() => switchTab("profile")} style={{ padding: "10px 20px", border: "none", borderBottom: activeTab === "profile" ? "3px solid #701890" : "3px solid transparent", backgroundColor: "transparent", color: activeTab === "profile" ? "#701890" : "#666", fontWeight: activeTab === "profile" ? "bold" : "normal", cursor: "pointer", fontSize: 14 }}>📋 Profile</button>
        {products.length > 0 && <button onClick={() => switchTab("shop")} style={{ padding: "10px 20px", border: "none", borderBottom: activeTab === "shop" ? "3px solid #701890" : "3px solid transparent", backgroundColor: "transparent", color: activeTab === "shop" ? "#701890" : "#666", fontWeight: activeTab === "shop" ? "bold" : "normal", cursor: "pointer", fontSize: 14 }}>🛒 Shop ({products.length})</button>}
      </div>

      {activeTab === "profile" && (
        <>
          {vendor.logo_url && <div onClick={() => setSelectedImage(vendor.logo_url)} style={thumbStyle(160, 160, 12)}><img src={vendor.logo_url} alt="logo" style={thumbImg} /></div>}
          <div style={{ marginTop: 16 }}>
            <p><strong>Category:</strong> {vendor.category || "N/A"}</p>
            <p><strong>Location:</strong> {vendor.city}{vendor.state ? `, ${vendor.state}` : ""}</p>
            {vendor.description && <p style={{ marginTop: 16, lineHeight: 1.6 }}>{vendor.description}</p>}
            <div style={{ marginTop: 12 }}>
              {vendor.tags?.map(tag => <span key={tag} style={{ display: "inline-block", marginRight: 8, marginBottom: 8, padding: "4px 10px", background: "#eee", borderRadius: 20, fontSize: 12 }}>{tag}</span>)}
            </div>
          </div>

          {/* ── Real social icons from shared component ── */}
          <div style={{ marginTop: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Links</h3>
            <SocialLinks profile={vendor} size={32} />
          </div>

          <div style={{ marginTop: 28 }}>
            <h3>Portfolio</h3>
            {vendor.portfolio_images?.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                {vendor.portfolio_images.map((img, i) => <div key={i} onClick={() => setSelectedImage(img)} style={{ ...thumbStyle("100%", 150, 8), width: "100%" }}><img src={img} alt="portfolio" style={thumbImg} /></div>)}
              </div>
            ) : <p style={{ color: "#888" }}>No portfolio images yet.</p>}
          </div>

          {vendor.video_urls?.filter(v => v).length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ marginBottom: 12 }}>🎬 Videos</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {vendor.video_urls.filter(v => v).map((url, i) => {
                  let embedUrl = url;
                  if (url.includes("youtube.com/watch")) { const id = new URL(url).searchParams.get("v"); embedUrl = `https://www.youtube.com/embed/${id}`; }
                  else if (url.includes("youtu.be/")) { const id = url.split("youtu.be/")[1].split("?")[0]; embedUrl = `https://www.youtube.com/embed/${id}`; }
                  else if (url.includes("instagram.com")) return <button key={i} onClick={() => window.location.href = url} style={{ padding: "12px 16px", backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 10, color: "#701890", fontWeight: "bold", cursor: "pointer", width: "100%", textAlign: "left", fontSize: 14 }}>📸 Watch on Instagram</button>;
                  else if (url.includes("tiktok.com")) return <button key={i} onClick={() => window.location.href = url} style={{ padding: "12px 16px", backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 10, color: "#888B00", fontWeight: "bold", cursor: "pointer", width: "100%", textAlign: "left", fontSize: 14 }}>🎵 Watch on TikTok</button>;
                  return <iframe key={i} src={embedUrl} style={{ width: "100%", height: 200, borderRadius: 8, border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
                })}
              </div>
            </div>
          )}

          {!isOwner && (() => {
            const vr = viewerProfile?.role, vt = viewerProfile?.account_type;
            const canMessage = (vr === "vendor" && (vt === "premium" || vt === "featured")) || vr === "organizer";
            return canMessage ? (
              <div style={{ marginTop: 20 }}>
                <button onClick={() => router.push(`/messages?to=${vendor.id}&from=vendor/${vendor.handle}`)} style={{ padding: "12px 24px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 15, width: "100%" }}>✉️ Send Message</button>
              </div>
            ) : viewerProfile ? (
              <div style={{ marginTop: 20, padding: "12px 16px", backgroundColor: "#f5f5f5", borderRadius: 8, textAlign: "center" }}>
                <p style={{ margin: 0, color: "#888", fontSize: 13 }}>Upgrade your plan to contact this vendor.</p>
                <button onClick={() => router.push("/vendor-info")} style={{ marginTop: 8, padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Upgrade Plan</button>
              </div>
            ) : null;
          })()}
        </>
      )}

      {activeTab === "shop" && (
        <div>
          <h3 style={{ marginBottom: 16 }}>🛒 {vendor.business_name}'s Shop</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {products.map(p => {
              const imgs = p.images?.length > 0 ? p.images : (p.image_url ? [p.image_url] : []);
              return (
                <div key={p.id} onClick={() => router.push(`/product/${p.id}`)}
                  style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", backgroundColor: "white", cursor: "pointer" }}>
                  <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
                    {imgs[0] ? <img src={imgs[0]} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc" }}>No Image</div>}
                    {imgs.length > 1 && <div style={{ position: "absolute", bottom: 6, right: 8, backgroundColor: "rgba(0,0,0,0.6)", color: "white", fontSize: 10, padding: "2px 6px", borderRadius: 8 }}>1/{imgs.length}</div>}
                  </div>
                  <div style={{ padding: 12 }}>
                    <p style={{ margin: "0 0 6px", fontWeight: "bold", fontSize: 14 }}>{p.title}</p>
                    {p.description && <p style={{ margin: "0 0 6px", fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.description}</p>}
                    <p style={{ margin: 0, color: "#701890", fontWeight: "bold", fontSize: 16 }}>${(p.price / 100).toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Back button uses router.back() so it always returns to where user came from ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40 }}>
        <button onClick={handleBack} style={{ padding: "10px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>← Back</button>
      </div>

      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <img src={selectedImage} alt="enlarged" style={{ maxWidth: "95%", maxHeight: "90vh", borderRadius: 10, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}
