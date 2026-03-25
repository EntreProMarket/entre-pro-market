// /pages/vendor-profile.js
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function VendorProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [portfolioFiles, setPortfolioFiles] = useState([]);

  const [handleEdited, setHandleEdited] = useState(false);

  const categories = [
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
  ];

  // Auto-generate handle
  useEffect(() => {
    if (!handleEdited) {
      const generated = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setHandle(generated);
    }
  }, [businessName]);

  const addTag = (e) => {
    e.preventDefault();
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput("");
  };

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const uploadFile = async (file, folder) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(folder)
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage.from(folder).getPublicUrl(filePath);
    return data.publicUrl;
  };

const loadProfile = async () => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) {
    setBusinessName(profile.business_name || "");
    setHandle(profile.handle || "");
    setCategory(profile.category || "");
    setTags(profile.tags || []);
    setCity(profile.city || "");
    setState(profile.state || "");
    setDescription(profile.description || "");
    setWebsite(profile.website || "");
    setInstagram(profile.instagram || "");
    setFacebook(profile.facebook || "");
    setTiktok(profile.tiktok || "");
    setYoutube(profile.youtube || "");
  }
};
  
  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      let logoUrl = null;
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, "vendor-logos");
      }

      const portfolioUrls = [];
      for (const file of portfolioFiles) {
        const url = await uploadFile(file, "vendor-portfolio");
        portfolioUrls.push(url);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          business_name: businessName,
          handle,
          category,
          tags,
          city,
          state,
          description,
          website,
          instagram,
          facebook,
          tiktok,
          youtube,
          logo_url: logoUrl,
          portfolio_images: portfolioUrls,
        })
        .eq("id", user.id);

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Profile saved!");
        router.push(`/vendor/${handle}`);
      }
    } catch (err) {
      setMessage(err.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>Create Vendor Profile</h1>
      {message && <p>{message}</p>}

      <label>Business Name</label>
      <input
        type="text"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
      />

      <label>Profile Handle</label>
      <input
        type="text"
        value={handle}
        onChange={(e) => {
          setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, ""));
          setHandleEdited(true);
        }}
      />
      <small>URL: entrepromarket.com/vendor/{handle}</small>

      <label>Category</label>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Select Category</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <label>Tags (press Enter to add)</label>
      <form onSubmit={addTag}>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
        />
      </form>

      <div>
        {tags.map((t) => (
          <span
            key={t}
            style={{
              display: "inline-block",
              margin: "2px",
              padding: "2px 6px",
              border: "1px solid #aaa",
              borderRadius: "12px",
              cursor: "pointer",
            }}
            onClick={() => removeTag(t)}
          >
            {t} ×
          </span>
        ))}
      </div>

      <label>City</label>
      <input value={city} onChange={(e) => setCity(e.target.value)} />

      <label>State</label>
      <input value={state} onChange={(e) => setState(e.target.value)} />

      <label>Description</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

      <label>Website</label>
      <input value={website} onChange={(e) => setWebsite(e.target.value)} />

      <label>Instagram</label>
      <input value={instagram} onChange={(e) => setInstagram(e.target.value)} />

      <label>Facebook</label>
      <input value={facebook} onChange={(e) => setFacebook(e.target.value)} />

      <label>TikTok</label>
      <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} />

      <label>YouTube</label>
      <input value={youtube} onChange={(e) => setYoutube(e.target.value)} />

      <label>Logo Upload</label>
      <input type="file" onChange={(e) => setLogoFile(e.target.files[0])} />

      <label>Portfolio Images</label>
      <input
        type="file"
        multiple
        onChange={(e) => setPortfolioFiles(Array.from(e.target.files))}
      />

      <button onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}
