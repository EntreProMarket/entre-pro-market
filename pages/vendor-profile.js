import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function VendorProfile() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleEdited, setHandleEdited] = useState(false);
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

  // AUTO HANDLE
  useEffect(() => {
    if (!handleEdited) {
      const generated = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setHandle(generated);
    }
  }, [businessName, handleEdited]);

  // LOAD PROFILE
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
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

    const { error } = await supabase.storage
      .from(folder)
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage.from(folder).getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ✅ SMART WEBSITE FORMATTER
  const formatWebsite = (url) => {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    if (!url.includes(".")) {
      return "https://www." + url + ".com";
    }

    return "https://" + url;
  };

  // ✅ SOCIAL FORMATTER
  const formatSocial = (username, baseUrl) => {
    if (!username) return "";
    if (username.startsWith("http")) return username;
    return baseUrl + username.replace(/^@/, "");
  };

  // SAVE
  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      let logoUrl = existingProfile?.logo_url || null;

      if (logoFile) {
        logoUrl = await uploadFile(logoFile, "vendor-logos");
      }

      let portfolioUrls = existingProfile?.portfolio_images || [];

      if (portfolioFiles.length > 0) {
        portfolioUrls = [];

        for (const file of portfolioFiles) {
          const url = await uploadFile(file, "vendor-portfolio");
          portfolioUrls.push(url);
        }
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
          website: formatWebsite(website),
          instagram: formatSocial(instagram, "https://instagram.com/"),
          facebook: formatSocial(facebook, "https://facebook.com/"),
          tiktok: formatSocial(tiktok, "https://tiktok.com/@"),
          youtube: formatSocial(youtube, "https://youtube.com/"),
          logo_url: logoUrl,
          portfolio_images: portfolioUrls,
        })
        .eq("id", user.id);

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Profile updated!");
        router.push(`/vendor/${handle}`);
      }
    } catch (err) {
      setMessage(err.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>Vendor Profile</h1>
      {message && <p>{message}</p>}

      <input placeholder="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
      <input placeholder="Handle" value={handle} onChange={(e) => { setHandle(e.target.value); setHandleEdited(true); }} />
      <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />

      <form onSubmit={addTag}>
        <input placeholder="Add tag + Enter" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
      </form>

      <div>
        {tags.map((t) => (
          <span key={t} onClick={() => removeTag(t)} style={{ marginRight: 5, cursor: "pointer" }}>
            {t} ×
          </span>
        ))}
      </div>

      <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
      <input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
      <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

      <input placeholder="Website (e.g. mysite.com or mysite)" value={website} onChange={(e) => setWebsite(e.target.value)} />
      <input placeholder="Instagram Username" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
      <input placeholder="Facebook Username" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
      <input placeholder="TikTok Username" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
      <input placeholder="YouTube Channel" value={youtube} onChange={(e) => setYoutube(e.target.value)} />

      <p>Logo</p>
      <input type="file" onChange={(e) => setLogoFile(e.target.files[0])} />

      <p>Portfolio</p>
      <input type="file" multiple onChange={(e) => setPortfolioFiles(Array.from(e.target.files))} />

      <button onClick={handleSave} disabled={loading} style={{ marginTop: 20 }}>
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}
