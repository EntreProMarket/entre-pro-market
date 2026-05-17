// pages/vendor-profile.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

function cleanHandle(value) {
  return value.trim().replace(/^@/, "").replace(/\s+/g, "");
}

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
    case "facebook": return `https://facebook.com/${handle}`;
    case "tiktok": return `https://tiktok.com/@${handle}`;
    case "youtube": return `https://youtube.com/@${handle}`;
    case "x_twitter": return `https://x.com/${handle}`;
    case "website": return `https://${handle}`;
    default: return `https://${handle}`;
  }
}

function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        }, "image/jpeg", quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function VendorProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  const [businessName, setBusinessName] = useState("");
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [xTwitter, setXTwitter] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [accountType, setAccountType] = useState("free");
  const [videoUrls, setVideoUrls] = useState(["","","","","","","","","",""]);
  const [photoLimits, setPhotoLimits] = useState({ free: 5, premium: 20, featured: 40 });
  const [videoLimits, setVideoLimits] = useState({ free: 0, premium: 5, featured: 10 });

  const photoLimit = photoLimits[accountType] ?? photoLimits.free;
  const videoLimit = videoLimits[accountType] ?? videoLimits.free;

  const [shopProducts, setShopProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ title: "", description: "", price: "" });
  const [shopFiles, setShopFiles] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) { router.push("/"); return; }

      const { data: s } = await supabase.from("app_settings").select("*");
      if (s) {
        const m = {};
        s.forEach(r => { m[r.key] = parseInt(r.value, 10); });
        setPhotoLimits({ free: m.vendor_free_photos ?? 5, premium: m.vendor_premium_photos ?? 20, featured: m.vendor_featured_photos ?? 40 });
        setVideoLimits({ free: m.vendor_free_videos ?? 0, premium: m.vendor_premium_videos ?? 5, featured: m.vendor_featured_videos ?? 10 });
      }

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p) {
        setBusinessName(p.business_name || "");
        setHandle(p.handle || "");
        setCategory(p.category || "");
        setTags(p.tags ? p.tags.join(", ") : "");
        setAccountType(p.account_type || "free");
        if (p.video_urls) setVideoUrls(p.video_urls.concat(["","","","","","","","","",""]).slice(0, 10));
        setCity(p.city || "");
        setState(p.state || "");
        setDescription(p.description || "");
        setWebsite(p.website || "");
        setInstagram(p.instagram || "");
        setFacebook(p.facebook || "");
        setTiktok(p.tiktok || "");
        setYoutube(p.youtube || "");
        setXTwitter(p.x_twitter || "");
        setPortfolioImages(p.portfolio_images || []);
      }

      const { data: products } = await supabase
        .from("vendor_products")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false });
      setShopProducts(products || []);

      setLoading(false);
    };
    load();
  }, [router]);

  const uploadFile = async (file, bucket) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `\( {timestamp}- \){randomStr}.${fileExt}`;.${fileExt}`;

    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) {
      setMessage("❌ Upload error: " + error.message);
      console.error("Upload error:", error);
      return null;
    }
    return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    try {
      const { data: ex } = await supabase.from("profiles").select("logo_url").eq("id", user.id).single();
      let logoUrl = ex?.logo_url || null;
      if (logoFile) {
        setMessage("⏳ Compressing logo...");
        const comp = await compressImage(logoFile, 800, 0.85);
        setMessage("⏳ Uploading logo...");
        const up = await uploadFile(comp, "vendor-logos");
        if (up) logoUrl = up;
      }
      let portfolio = [...portfolioImages];
      if (portfolioFiles.length > 0) {
        for (let i = 0; i < portfolioFiles.length; i++) {
          setMessage(`⏳ Uploading ${i + 1} of ${portfolioFiles.length} images...`);
          const comp = await compressImage(portfolioFiles[i], 1200, 0.8);
          const url = await uploadFile(comp, "vendor-portfolio");
          if (url) portfolio.push(url);
        }
      }
      if (portfolio.length > photoLimit) portfolio = portfolio.slice(0, photoLimit);

      setMessage("⏳ Saving profile...");
      const { error } = await supabase.from("profiles").update({
        business_name: businessName, handle, category,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        video_urls: videoUrls.filter(v => v.trim()),
        city, state, description,
        website: formatSocialLink("website", website),
        instagram: formatSocialLink("instagram", instagram),
        facebook: formatSocialLink("facebook", facebook),
        tiktok: formatSocialLink("tiktok", tiktok),
        youtube: formatSocialLink("youtube", youtube),
        x_twitter: formatSocialLink("x_twitter", xTwitter),
        logo_url: logoUrl,
        portfolio_images: portfolio,
      }).eq("id", user.id);
      if (error) throw error;

      setPortfolioImages(portfolio);
      setPortfolioFiles([]);
      setMessage("✅ Profile saved!");
      setTimeout(() => router.replace("/vendor-dashboard"), 1200);
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
    setSaving(false);
  };

  const addShopProduct = async () => {
    if (!newProduct.title || !newProduct.price || shopFiles.length === 0) {
      alert("Title, price, and image are required.");
      return;
    }

    setMessage("⏳ Uploading product image...");
    const url = await uploadFile(shopFiles[0], "vendor-portfolio");
    if (!url) return;

    const { data: user } = await supabase.auth.getUser();

    const { error } = await supabase.from("vendor_products").insert({
      vendor_id: user.user.id,
      title: newProduct.title,
      description: newProduct.description,
      price: Math.round(parseFloat(newProduct.price) * 100),
      image_url: url,
    });

    if (error) {
      setMessage("❌ Error adding product: " + error.message);
    } else {
      setMessage("✅ Product added to shop!");
      setNewProduct({ title: "", description: "", price: "" });
      setShopFiles([]);

      const { data: products } = await supabase
        .from("vendor_products")
        .select("*")
        .eq("vendor_id", user.user.id)
        .order("created_at", { ascending: false });
      setShopProducts(products || []);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 20 }}>Edit Vendor Profile</h1>

      <div style={{ display: "flex", marginBottom: 24, borderBottom: "2px solid #ddd" }}>
        <button onClick={() => setActiveTab("profile")} style={{ flex: 1, padding: 12, fontWeight: activeTab === "profile" ? "bold" : "normal", borderBottom: activeTab === "profile" ? "4px solid #701890" : "none", background: "none", border: "none" }}>📋 Profile</button>
        <button onClick={() => setActiveTab("shop")} style={{ flex: 1, padding: 12, fontWeight: activeTab === "shop" ? "bold" : "normal", borderBottom: activeTab === "shop" ? "4px solid #701890" : "none", background: "none", border: "none" }}>🛒 Shop / Products</button>
      </div>

      {activeTab === "profile" && (
        <>
          <input placeholder="Business Name" value={businessName} onChange={e => setBusinessName(e.target.value)} style={iS} />
          <input placeholder="Handle" value={handle} onChange={e => setHandle(e.target.value)} style={iS} />
          <select value={category} onChange={e => setCategory(e.target.value)} style={iS}>
            <option value="">Select a Category...</option>
            {["DJ","Photographer","Videographer","Caterer","Decorator","Florist","Hair & Makeup","Music","Bakery","Clothing & Apparel","Jewelry","Crafts & Art","Food & Beverage","Health & Wellness","Entertainment","Security","Transportation","Poetry & Literature","Performing Arts","Theater & Acting","Other"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="City" value={city} onChange={e => setCity(e.target.value)} style={iS} />
          <input placeholder="State" value={state} onChange={e => setState(e.target.value)} style={iS} />
          <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ ...iS, resize: "vertical" }} />
          <input placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} style={iS} />

          <div style={{ backgroundColor: "#fff0f0", border: "1px solid #f5c6c6", borderRadius: 6, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#cc0000" }}>
            ⚠️ Links must be public or they may not open correctly.
          </div>

          <input placeholder="Website" value={website} onChange={e => setWebsite(e.target.value)} style={iS} />
          <input placeholder="Instagram" value={instagram} onChange={e => setInstagram(e.target.value)} style={iS} />
          <input placeholder="Facebook" value={facebook} onChange={e => setFacebook(e.target.value)} style={iS} />
          <input placeholder="TikTok" value={tiktok} onChange={e => setTiktok(e.target.value)} style={iS} />
          <input placeholder="YouTube" value={youtube} onChange={e => setYoutube(e.target.value)} style={iS} />
          <input placeholder="X / Twitter" value={xTwitter} onChange={e => setXTwitter(e.target.value)} style={iS} />

          <div style={{ marginTop: 16, marginBottom: 8 }}>
            <label style={lS}>Logo</label>
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} />
          </div>

          <div style={{ marginTop: 20, marginBottom: 8 }}>
            <label style={lS}>Portfolio</label>
            <p style={{ fontSize: 12, color: portfolioImages.length >= photoLimit ? "#cc0000" : "#888", marginBottom: 8, fontWeight: "bold" }}>
              {portfolioImages.length} / {photoLimit} images
            </p>
            {portfolioImages.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 12 }}>
                {portfolioImages.map((img, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={img} alt="" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6 }} />
                    <button onClick={() => setPortfolioImages(portfolioImages.filter(x => x !== img))} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20 }}>×</button>
                  </div>
                ))}
              </div>
            )}
            {portfolioImages.length < photoLimit && (
              <input type="file" accept="image/*" multiple onChange={e => {
                const remaining = photoLimit - portfolioImages.length;
                const files = Array.from(e.target.files).slice(0, remaining);
                setPortfolioFiles(files);
              }} />
            )}
          </div>

          {videoLimit > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label style={lS}>Video Links (up to {videoLimit})</label>
              {Array.from({ length: videoLimit }).map((_, i) => (
                <input key={i} value={videoUrls[i] || ""} onChange={e => {
                  const u = [...videoUrls]; u[i] = e.target.value; setVideoUrls(u);
                }} placeholder={`Video ${i+1}`} style={iS} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "shop" && (
        <div>
          <h2>Add New Product</h2>
          <input placeholder="Product Title" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} style={iS} />
          <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} style={{...iS, height: 100}} />
          <input type="number" step="0.01" placeholder="Price in USD" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} style={iS} />

          <label style={lS}>Product Image</label>
          <input type="file" accept="image/*" onChange={e => setShopFiles(Array.from(e.target.files))} />

          <button onClick={addShopProduct} style={{ padding: "14px 28px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, marginTop: 16, fontWeight: "bold" }}>
            Add Product to Shop
          </button>

          <h3 style={{ marginTop: 40 }}>Your Shop Products ({shopProducts.length})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
            {shopProducts.map(p => (
              <div key={p.id} style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
                <img src={p.image_url} alt={p.title} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                <div style={{ padding: 10 }}>
                  <p style={{ margin: "4px 0", fontWeight: "bold" }}>{p.title}</p>
                  <p style={{ margin: 0, color: "#701890", fontWeight: "bold" }}>${(p.price / 100).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && (
        <p style={{ padding: "12px 16px", backgroundColor: message.includes("✅") ? "#f0fdf4" : "#fef2f2", borderRadius: 6, marginTop: 16 }}>
          {message}
        </p>
      )}

      {activeTab === "profile" && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
          <button onClick={() => router.replace("/vendor-dashboard")} style={{ padding: "12px 20px", backgroundColor: "#ccc", border: "none", borderRadius: 20 }}>← Back</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "12px 24px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, fontWeight: "bold" }}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}
    </div>
  );
}

const iS = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };
const lS = { display: "block", fontWeight: "bold", marginBottom: 6, fontSize: 14, color: "#333" };
