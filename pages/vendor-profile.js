import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function VendorProfile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
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

      setLoading(false);
    };

    loadProfile();
  }, []);

  const addTag = (e) => {
    e.preventDefault();
    if (!tagInput) return;
    setTags([...tags, tagInput]);
    setTagInput("");
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const uploadFile = async (file, bucket) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setMessage("Saving...");
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;

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

    let portfolio = existing?.portfolio_images || [];

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
        portfolio_images: portfolio,
      })
      .eq("id", user.id);

    if (error) {
      console.log(error);
      setMessage("Error saving profile");
    } else {
      setMessage("Profile saved!");
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      
      {/* ✅ HEADER WITH VIEW PROFILE BUTTON */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1>Vendor Profile</h1>

        <button
          onClick={() => router.push(`/vendor/${handle}`)}
          style={{
            padding: "10px 18px",
            backgroundColor: "#701890",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          View Profile
        </button>
      </div>

      {message && <p>{message}</p>}

      <input placeholder="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
      <input placeholder="Handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
      <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />

      <form onSubmit={addTag}>
        <input
          placeholder="Add tag + Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
        />
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

      <div style={{ background: "#ffe5e5", color: "#b30000", padding: 10, marginTop: 20 }}>
        ⚠️ Links must be public or they may not open correctly.
      </div>

      <input placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
      <input placeholder="Instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
      <input placeholder="Facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
      <input placeholder="TikTok" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
      <input placeholder="YouTube" value={youtube} onChange={(e) => setYoutube(e.target.value)} />

      <p>Logo</p>
      <input type="file" onChange={(e) => setLogoFile(e.target.files[0])} />

      <p>Portfolio</p>
      <input type="file" multiple onChange={(e) => setPortfolioFiles(Array.from(e.target.files))} />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: "10px 14px",
            backgroundColor: "#ccc",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ← Back
        </button>

        <button
          onClick={handleSave}
          style={{
            padding: "10px 14px",
            backgroundColor: "#701890",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}
