// pages/vendor/[handle].js

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function cleanHandle(value) { return value.trim().replace(/^@/, "").replace(/\s+/g, ""); }
function formatSocialLink(platform, value) {
  if (!value || !value.trim()) return "";
  const v = value.trim();
  if (v.startsWith("https://")) return v;
  if (v.startsWith("http://")) return v.replace("http://", "https://");
  if (v.startsWith("www.")) return `https://${v}`;
  const domains = { instagram: "instagram.com", facebook: "facebook.com", tiktok: "tiktok.com", youtube: "youtube.com" };
  if (domains[platform] && v.toLowerCase().includes(domains[platform])) return `https://${v}`;
  const handle = cleanHandle(v);
  switch (platform) {
    case "instagram": return `https://instagram.com/${handle}`;
    case "facebook":  return `https://facebook.com/${handle}`;
    case "tiktok":    return `https://tiktok.com/@${handle}`;
    case "youtube":   return `https://youtube.com/@${handle}`;
    case "x_twitter": return `https://x.com/${handle}`;
    case "website":   return `https://${handle}`;
    default:          return `https://${handle}`;
  }
}

const IC = "#701890", IS = 32;
function WebsiteIcon() { return <svg width={IS} height={IS} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
function InstagramIcon() { return <svg width={IS} height={IS} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>; }
function MetaIcon() { return <svg width={IS} height={IS} viewBox="0 0 24 24" fill={IC}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>; }
function TikTokIcon() { return <svg width={IS} height={IS} viewBox="0 0 24 24" fill={IC}><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>; }
function YouTubeIcon() { return <svg width={IS} height={IS} viewBox="0 0 24 24" fill={IC}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>; }
function XIcon() { return <svg width={IS} height={IS} viewBox="0 0 24 24" fill={IC}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }

export default function VendorPublicProfile() {
  const router = useRouter();
  const { handle, tab } = router.query;
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [viewerProfile, setViewerProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // ── Support ?tab=shop query param (used by product page back button) ──
  useEffect(() => {
    if (tab === "shop") setActiveTab("shop");
  }, [tab]);

  useEffect(() => {
    if (!handle) return;
    const fetchVendor = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      const { data, error } = await supabase.from("profiles").select("*").eq("handle", handle).single();
      if (error) { setLoading(false); return; }
      setVendor(data);
      const ownerViewing = user && data.id === user.id;
      if (ownerViewing) setIsOwner(true);
      if (user) {
        const { data: vp } = await supabase.from("profiles").select("role, account_type, id").eq("id", user.id).single();
        setViewerProfile(vp);
      }
      if (!ownerViewing) {
        await supabase.from("profile_views").insert([{ profile_id: data.id, viewer_id: user?.id || null }]);
      }
      const { data: prods } = await supabase.from("vendor_products").select("*").eq("vendor_id", data.id).eq("is_active", true).order("created_at", { ascending: false });
      setProducts(prods || []);
      setLoading(false);
    };
    fetchVendor();
  }, [handle]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!vendor) return <div style={{ padding: 20 }}>Vendor not found</div>;

  const iL = { display: "flex", opacity: 1, transition: "opacity 0.2s" };

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20, position: "relative" }}>

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

      <h1 style={{ marginBottom: 5 }}>{vendor.business_name}</h1>
      <p style={{ color: "#777", marginBottom: 16 }}>@{vendor.handle}</p>

      {/* PROFILE / SHOP TABS */}
      <div style={{ display: "flex", borderBottom: "2px solid #eee", marginBottom: 24 }}>
        <button onClick={() => setActiveTab("profile")} style={{ padding: "10px 20px", border: "none", borderBottom: activeTab === "profile" ? "3px solid #701890" : "3px solid transparent", backgroundColor: "transparent", color: activeTab === "profile" ? "#701890" : "#666", fontWeight: activeTab === "profile" ? "bold" : "normal", cursor: "pointer", fontSize: 14 }}>📋 Profile</button>
        {products.length > 0 && (
          <button onClick={() => setActiveTab("shop")} style={{ padding: "10px 20px", border: "none", borderBottom: activeTab === "shop" ? "3px solid #701890" : "3px solid transparent", backgroundColor: "transparent", color: activeTab === "shop" ? "#701890" : "#666", fontWeight: activeTab === "shop" ? "bold" : "normal", cursor: "pointer", fontSize: 14 }}>🛒 Shop ({products.length})</button>
        )}
      </div>

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <>
          {vendor.logo_url && <img src={vendor.logo_url} alt="logo" onClick={() => setSelectedImage(vendor.logo_url)} style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 12, marginBottom: 20, cursor: "pointer" }} />}
          <p><strong>Category:</strong> {vendor.category || "N/A"}</p>
          <p><strong>Location:</strong> {vendor.city}, {vendor.state}</p>
          <p style={{ marginTop: 20 }}>{vendor.description}</p>
          <div style={{ marginTop: 15 }}>
            {vendor.tags?.map(tag => <span key={tag} style={{ display: "inline-block", marginRight: 8, marginBottom: 8, padding: "4px 10px", background: "#eee", borderRadius: 20, fontSize: 12 }}>{tag}</span>)}
          </div>
          <div style={{ marginTop: 25 }}>
            <h3 style={{ marginBottom: 12 }}>Links</h3>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
              {vendor.website   && <a href={formatSocialLink("website",   vendor.website)}   target="_blank" rel="noreferrer" style={iL} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><WebsiteIcon /></a>}
              {vendor.instagram && <a href={formatSocialLink("instagram", vendor.instagram)} target="_blank" rel="noreferrer" style={iL} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><InstagramIcon /></a>}
              {vendor.facebook  && <a href={formatSocialLink("facebook",  vendor.facebook)}  target="_blank" rel="noreferrer" style={iL} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><MetaIcon /></a>}
              {vendor.tiktok    && <a href={formatSocialLink("tiktok",    vendor.tiktok)}    target="_blank" rel="noreferrer" style={iL} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><TikTokIcon /></a>}
              {vendor.youtube   && <a href={formatSocialLink("youtube",   vendor.youtube)}   target="_blank" rel="noreferrer" style={iL} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><YouTubeIcon /></a>}
              {vendor.x_twitter && <a href={formatSocialLink("x_twitter",vendor.x_twitter)} target="_blank" rel="noreferrer" style={iL} onMouseEnter={e=>e.currentTarget.style.opacity="0.7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><XIcon /></a>}
            </div>
          </div>
          <div style={{ marginTop: 30 }}>
            <h3>Portfolio</h3>
            {vendor.portfolio_images && vendor.portfolio_images.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                {vendor.portfolio_images.map((img, i) => <img key={i} src={img} alt="portfolio" onClick={() => setSelectedImage(img)} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, cursor: "pointer" }} />)}
              </div>
            ) : <p>No portfolio images yet.</p>}
          </div>
          {vendor.video_urls && vendor.video_urls.filter(v => v).length > 0 && (
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
                <p style={{ margin: 0, color: "#888", fontSize: 13 }}>Upgrade your plan to contact this vendor directly.</p>
                <button onClick={() => router.push("/vendor-info")} style={{ marginTop: 8, padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Upgrade Plan</button>
              </div>
            ) : (
              <div style={{ marginTop: 20, padding: "12px 16px", backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 8, textAlign: "center" }}>
                <p style={{ margin: 0, color: "#701890", fontWeight: "bold", fontSize: 13 }}>Want to connect with vendors like this?</p>
                <button onClick={() => router.push("/vendor-info")} style={{ marginTop: 8, padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Become a Vendor</button>
              </div>
            );
          })()}
        </>
      )}

      {/* SHOP TAB */}
      {activeTab === "shop" && (
        <div>
          <h3 style={{ marginBottom: 16 }}>🛒 {vendor.business_name}'s Shop</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {products.map(p => {
              const imgs = p.images && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []);
              return (
                <div key={p.id} onClick={() => router.push(`/product/${p.id}`)}
                  style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden", cursor: "pointer", backgroundColor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(112,24,144,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"}>
                  <div style={{ position: "relative" }}>
                    <img src={imgs[0]} alt={p.title} style={{ width: "100%", height: 180, objectFit: "cover" }} />
                    {imgs.length > 1 && <div style={{ position: "absolute", bottom: 6, right: 8, backgroundColor: "rgba(0,0,0,0.6)", color: "white", fontSize: 10, padding: "2px 6px", borderRadius: 8 }}>1 / {imgs.length}</div>}
                  </div>
                  <div style={{ padding: 12 }}>
                    <p style={{ margin: "0 0 6px", fontWeight: "bold", fontSize: 14 }}>{p.title}</p>
                    <p style={{ margin: 0, color: "#701890", fontWeight: "bold", fontSize: 16 }}>${(p.price / 100).toFixed(2)}</p>
                    <button style={{ marginTop: 10, width: "100%", padding: "8px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>View & Buy</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40 }}>
        <button onClick={() => router.push("/marketplace")} style={{ padding: "10px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>← Back</button>
      </div>

      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <img src={selectedImage} alt="enlarged" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 10 }} />
        </div>
      )}
    </div>
  );
}
