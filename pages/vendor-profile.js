// pages/vendor-profile.js

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

// ── LINK FORMATTER ──
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
    case "instagram":  return `https://instagram.com/${handle}`;
    case "facebook":   return `https://facebook.com/${handle}`;
    case "tiktok":     return `https://tiktok.com/@${handle}`;
    case "youtube":    return `https://youtube.com/@${handle}`;
    case "x_twitter":  return `https://x.com/${handle}`;
    case "website":    return `https://${handle}`;
    default:           return `https://${handle}`;
  }
}

export default function VendorProfile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
  const [videoUrls, setVideoUrls] = useState(["", "", "", "", ""]);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) { router.push("/"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setBusinessName(profile.business_name || "");
        setHandle(profile.handle || "");
        setCategory(profile.category || "");
        setTags(profile.tags ? profile.tags.join(", ") : "");
        setAccountType(profile.account_type || "free");
        if (profile.video_urls) setVideoUrls(profile.video_urls.concat(["","","","",""]).slice(0,5));
        setCity(profile.city || "");
        setState(profile.state || "");
        setDescription(profile.description || "");
        setWebsite(profile.website || "");
        setInstagram(profile.instagram || "");
        setFacebook(profile.facebook || "");
        setTiktok(profile.tiktok || "");
        setYoutube(profile.youtube || "");
        setXTwitter(profile.x_twitter || "");
        setPortfolioImages(profile.portfolio_images || []);
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  // ── EXACT SAME UPLOAD PATTERN THAT WORKS ──
  const uploadFile = async (file, bucket) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) {
      setMessage("❌ Upload error: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };



  const removePortfolioImage = (url) => {
    setPortfolioImages(portfolioImages.filter((img) => img !== url));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("logo_url, portfolio_images")
        .eq("id", user.id)
        .single();

      let logoUrl = existing?.logo_url || null;

      if (logoFile) {
        const uploaded = await uploadFile(logoFile, "vendor-logos");
        if (uploaded) logoUrl = uploaded;
      }

      let portfolio = existing?.portfolio_images || portfolioImages;

      if (portfolioFiles.length > 0) {
        const newUrls = [];
        for (const file of portfolioFiles) {
          const url = await uploadFile(file, "vendor-portfolio");
          if (url) newUrls.push(url);
        }
        if (newUrls.length > 0) portfolio = newUrls;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          business_name: businessName,
          handle,
          category,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          video_urls: videoUrls.filter(v => v.trim()),
          city,
          state,
          description,
          website:   formatSocialLink("website",   website),
          instagram: formatSocialLink("instagram", instagram),
          facebook:  formatSocialLink("facebook",  facebook),
          tiktok:    formatSocialLink("tiktok",    tiktok),
          youtube:   formatSocialLink("youtube",   youtube),
          x_twitter: formatSocialLink("x_twitter", xTwitter),
          logo_url: logoUrl,
          portfolio_images: portfolio,
        })
        .eq("id", user.id);

      if (error) throw error;
      setMessage("✅ Profile saved!");
      setTimeout(() => router.push(`/vendor/${handle}`), 1200);

    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }

    setSaving(false);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, fontFamily: "sans-serif" }}>

      <h1 style={{ marginBottom: 20 }}>Edit Vendor Profile</h1>

      <input placeholder="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={inputStyle} />
      <input placeholder="Handle" value={handle} onChange={(e) => setHandle(e.target.value)} style={inputStyle} />
      <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
        <option value="">Select a Category...</option>
        <option value="DJ">DJ</option>
        <option value="Photographer">Photographer</option>
        <option value="Videographer">Videographer</option>
        <option value="Caterer">Caterer</option>
        <option value="Decorator">Decorator</option>
        <option value="Venue">Venue</option>
        <option value="Florist">Florist</option>
        <option value="Hair & Makeup">Hair & Makeup</option>
        <option value="Music">Music</option>
        <option value="Bakery">Bakery</option>
        <option value="Clothing & Apparel">Clothing & Apparel</option>
        <option value="Jewelry">Jewelry</option>
        <option value="Crafts & Art">Crafts & Art</option>
        <option value="Food & Beverage">Food & Beverage</option>
        <option value="Health & Wellness">Health & Wellness</option>
        <option value="Entertainment">Entertainment</option>
        <option value="Security">Security</option>
        <option value="Transportation">Transportation</option>
        <option value="Other">Other</option>
      </select>
      <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
      <input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} style={inputStyle} />
      <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />

      {/* TAGS */}
      <input
        placeholder="Tags (comma separated, e.g. weddings, corporate, outdoor)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        style={inputStyle}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>

      </div>

      {/* ⚠️ WARNING */}
      <div style={{ backgroundColor: "#fff0f0", border: "1px solid #f5c6c6", borderRadius: 6, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#cc0000" }}>
        ⚠️ Links must be public or they may not open correctly.
      </div>

      <input placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} style={inputStyle} />
      <input placeholder="Instagram (e.g. nike or @nike)" value={instagram} onChange={(e) => setInstagram(e.target.value)} style={inputStyle} />
      <input placeholder="Meta / Facebook (e.g. nike or @nike)" value={facebook} onChange={(e) => setFacebook(e.target.value)} style={inputStyle} />
      <input placeholder="TikTok (e.g. nike or @nike)" value={tiktok} onChange={(e) => setTiktok(e.target.value)} style={inputStyle} />
      <input placeholder="YouTube (e.g. nike or @nike)" value={youtube} onChange={(e) => setYoutube(e.target.value)} style={inputStyle} />
      <input placeholder="X / Twitter (e.g. nike or @nike)" value={xTwitter} onChange={(e) => setXTwitter(e.target.value)} style={inputStyle} />

      {/* LOGO */}
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <label style={labelStyle}>Logo</label>
        <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} />
      </div>

      {/* PORTFOLIO */}
      <div style={{ marginTop: 20, marginBottom: 8 }}>
        <label style={labelStyle}>Portfolio</label>
        {portfolioImages.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 12 }}>
            {portfolioImages.map((img, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={img} alt="portfolio" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6 }} />
                <button onClick={() => removePortfolioImage(img)} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 11, cursor: "pointer", lineHeight: "20px", textAlign: "center", padding: 0 }}>×</button>
              </div>
            ))}
          </div>
        )}
        <input type="file" accept="image/*" multiple onChange={(e) => setPortfolioFiles(Array.from(e.target.files))} />
        <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>You can select multiple images at once.</p>
      </div>

      {/* STATUS MESSAGE */}
      {message && (
        <p style={{ padding: "12px 16px", backgroundColor: message.startsWith("✅") ? "#f0fdf4" : "#fef2f2", border: `1px solid ${message.startsWith("✅") ? "#86efac" : "#fca5a5"}`, borderRadius: 6, color: message.startsWith("✅") ? "#166534" : "#991b1b", fontWeight: "bold", marginTop: 16 }}>
          {message}
        </p>
      )}


      {/* VIDEO URLS — Premium and Featured only */}
      {(accountType === "premium" || accountType === "featured") && (
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>
            🎬 Video Links (up to {accountType === "featured" ? 10 : 5}) — YouTube, Instagram or TikTok URLs
          </label>
          {Array.from({ length: accountType === "featured" ? 10 : 5 }).map((_, i) => (
            <input
              key={i}
              value={videoUrls[i] || ""}
              onChange={e => {
                const updated = [...videoUrls];
                updated[i] = e.target.value;
                setVideoUrls(updated);
              }}
              placeholder={`Video link ${i + 1}`}
              style={{ display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 8, boxSizing: "border-box" }}
            />
          ))}
        </div>
      )}

      {/* BUTTONS */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
        <button onClick={() => router.back()} style={{ padding: "12px 20px", backgroundColor: "#ccc", border: "none", borderRadius: 20, fontWeight: "bold", cursor: "pointer" }}>
          ← Back
        </button>
        <button onClick={handleSave} disabled={saving} style={{ padding: "12px 24px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, fontWeight: "bold", cursor: "pointer", fontSize: 15 }}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

    </div>
  );
}

const inputStyle = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };
const labelStyle = { display: "block", fontWeight: "bold", marginBottom: 6, fontSize: 14, color: "#333" };
