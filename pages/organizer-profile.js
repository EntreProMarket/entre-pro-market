// pages/organizer-profile.js

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
    case "facebook":  return `https://facebook.com/${handle}`;
    case "tiktok":    return `https://tiktok.com/@${handle}`;
    case "youtube":   return `https://youtube.com/@${handle}`;
    case "x_twitter": return `https://x.com/${handle}`;
    case "website":   return `https://${handle}`;
    default:          return `https://${handle}`;
  }
}

export default function OrganizerProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [accountType, setAccountType] = useState("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [xTwitter, setXTwitter] = useState("");
  const [tags, setTags] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [imageLimits, setImageLimits] = useState({ basic: 10, pro: 20, elite: 40 });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user;
      if (!currentUser) { router.push("/"); return; }
      setUser(currentUser);

      const { data: s } = await supabase.from("app_settings").select("*");
      if (s) {
        const m = {};
        s.forEach(r => { m[r.key] = parseInt(r.value, 10); });
        setImageLimits({ basic: m.organizer_basic_photos ?? 10, pro: m.organizer_pro_photos ?? 20, elite: m.organizer_elite_photos ?? 40 });
      }

      const { data: p } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single();
      if (p) {
        setOrganizerName(p.organizer_name || "");
        setHandle(p.handle || "");
        setCategory(p.category || "");
        setCity(p.city || "");
        setStateVal(p.state || "");
        setDescription(p.description || "");
        setWebsite(p.website || "");
        setInstagram(p.instagram || "");
        setFacebook(p.facebook || "");
        setTiktok(p.tiktok || "");
        setYoutube(p.youtube || "");
        setXTwitter(p.x_twitter || "");
        setTags(p.tags ? p.tags.join(", ") : "");
        setLogoUrl(p.logo_url || "");
        setPortfolioImages(p.portfolio_images || []);
        setAccountType(p.account_type || "basic");
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const uploadFile = async (file, bucket) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) { setMessage("❌ Upload error: " + error.message); return null; }
    return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage("");
    try {
      const { data: ex } = await supabase.from("profiles").select("logo_url").eq("id", user.id).single();
      let uploadedLogoUrl = ex?.logo_url || logoUrl;
      if (logoFile) {
        const up = await uploadFile(logoFile, "organizer-logos");
        if (up) uploadedLogoUrl = up;
      }
      let updatedPortfolio = [...portfolioImages];
      if (portfolioFiles.length > 0) {
        const limit = imageLimits[accountType] ?? 10;
        const remaining = limit - updatedPortfolio.length;
        for (const file of portfolioFiles.slice(0, remaining)) {
          const url = await uploadFile(file, "organizer-portfolio");
          if (url) updatedPortfolio.push(url);
        }
      }
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        organizer_name: organizerName, handle, category, city, state: stateVal, description,
        website:   formatSocialLink("website",   website),
        instagram: formatSocialLink("instagram", instagram),
        facebook:  formatSocialLink("facebook",  facebook),
        tiktok:    formatSocialLink("tiktok",    tiktok),
        youtube:   formatSocialLink("youtube",   youtube),
        x_twitter: formatSocialLink("x_twitter", xTwitter),
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        logo_url: uploadedLogoUrl,
        portfolio_images: updatedPortfolio,
        role: "organizer",
      });
      if (error) throw error;
      setPortfolioImages(updatedPortfolio);
      setPortfolioFiles([]);
      setMessage("✅ Profile saved!");
      setTimeout(() => router.replace("/organizer-dashboard"), 1200);
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
    setSaving(false);
  };

  const removePortfolioImage = async (url) => {
    const fileName = url.split("/").pop();
    await supabase.storage.from("organizer-portfolio").remove([fileName]);
    const updated = portfolioImages.filter(img => img !== url);
    setPortfolioImages(updated);
    if (user) await supabase.from("profiles").update({ portfolio_images: updated }).eq("id", user.id);
  };

  const imageLimit = imageLimits[accountType] ?? 10;
  const atLimit = portfolioImages.length >= imageLimit;

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 20 }}>Edit Organizer Profile</h1>
      <input placeholder="Organizer Name" value={organizerName} onChange={e => setOrganizerName(e.target.value)} style={iS} />
      <input placeholder="Handle" value={handle} onChange={e => setHandle(e.target.value)} style={iS} />
      <select value={category} onChange={e => setCategory(e.target.value)} style={iS}>
        <option value="">Select a Category...</option>
        {["Music Event","Pop Up Shop","Business Expo","Fashion Show","Spoken Word","Meet & Greet","Art Show","Dance Event","Party","Classes","Paint & Sip","Festival","Corporate Event","Wedding","Birthday","Fundraiser","Community Event","Sports Event","Venue","Other"].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input placeholder="City" value={city} onChange={e => setCity(e.target.value)} style={iS} />
      <input placeholder="State" value={stateVal} onChange={e => setStateVal(e.target.value)} style={iS} />
      <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ ...iS, resize: "vertical" }} />
      <div style={{ backgroundColor: "#fff0f0", border: "1px solid #f5c6c6", borderRadius: 6, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#cc0000" }}>
        ⚠️ Links must be public or they may not open correctly.
      </div>
      <input placeholder="Website" value={website} onChange={e => setWebsite(e.target.value)} style={iS} />
      <input placeholder="Instagram (e.g. nike or @nike)" value={instagram} onChange={e => setInstagram(e.target.value)} style={iS} />
      <input placeholder="Facebook (e.g. nike or @nike)" value={facebook} onChange={e => setFacebook(e.target.value)} style={iS} />
      <input placeholder="TikTok (e.g. nike or @nike)" value={tiktok} onChange={e => setTiktok(e.target.value)} style={iS} />
      <input placeholder="YouTube (e.g. nike or @nike)" value={youtube} onChange={e => setYoutube(e.target.value)} style={iS} />
      <input placeholder="X / Twitter (e.g. nike or @nike)" value={xTwitter} onChange={e => setXTwitter(e.target.value)} style={iS} />
      <input placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} style={iS} />

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <label style={lS}>Logo</label>
        {logoUrl && <img src={logoUrl} alt="logo" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", marginBottom: 8, display: "block" }} />}
        <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={e => setLogoFile(e.target.files[0])} />
      </div>

      <div style={{ marginTop: 20, marginBottom: 8 }}>
        <label style={lS}>Portfolio</label>
        <p style={{ fontSize: 12, color: atLimit ? "#cc0000" : "#888", marginBottom: 8, fontWeight: atLimit ? "bold" : "normal" }}>
          {portfolioImages.length}/{imageLimit} images used{atLimit && " — Remove some before adding more"}
        </p>
        <div style={{ backgroundColor: "#fff8e1", border: "1px solid #f0c040", borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#856404" }}>
          ⚠️ Accepted: JPG, PNG, WebP only. HEIC not supported — convert to JPG first.
        </div>
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
        {!atLimit && (
          <div>
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" multiple
              onChange={e => {
                const remaining = imageLimit - portfolioImages.length;
                const files = Array.from(e.target.files).slice(0, remaining);
                if (Array.from(e.target.files).length > remaining) alert(`You can only add ${remaining} more image(s).`);
                setPortfolioFiles(files);
              }} style={{ display: "block", marginBottom: 4 }} />
            <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Select multiple images at once. Max {imageLimit} total for your plan.</p>
          </div>
        )}
      </div>

      {message && (
        <p style={{ padding: "12px 16px", backgroundColor: message.startsWith("✅") ? "#f0fdf4" : "#fef2f2", border: `1px solid ${message.startsWith("✅") ? "#86efac" : "#fca5a5"}`, borderRadius: 6, color: message.startsWith("✅") ? "#166534" : "#991b1b", fontWeight: "bold", marginTop: 16 }}>
          {message}
        </p>
      )}

      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={() => router.replace("/organizer-dashboard")} style={{ padding: "12px 20px", backgroundColor: "#ccc", border: "none", borderRadius: 20, fontWeight: "bold", cursor: "pointer" }}>← Back</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: "12px 24px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, fontWeight: "bold", cursor: "pointer", fontSize: 15 }}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

const iS = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };
const lS = { display: "block", fontWeight: "bold", marginBottom: 6, fontSize: 14, color: "#333" };
