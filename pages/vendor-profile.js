import { useState, useEffect } from "react";
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

  const [handleEdited, setHandleEdited] = useState(false);

  // 🔒 PROTECT PAGE + LOAD DATA
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        router.replace("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "vendor") {
        router.replace("/marketplace");
        return;
      }

      // LOAD EXISTING DATA
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

    init();
  }, [router]);

  // AUTO HANDLE
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

  const uploadFile = async (file, bucket) => {
    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
  setLoading(true);
  setMessage("");

  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    // 🔥 GET EXISTING PROFILE FIRST
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // ✅ LOGO (only replace if new uploaded)
    let logoUrl = existingProfile?.logo_url || null;

    if (logoFile) {
      logoUrl = await uploadFile(logoFile, "vendor-logos");
    }

    // ✅ PORTFOLIO (only replace if new uploaded)
    let portfolioUrls = existingProfile?.portfolio_images || [];

    if (portfolioFiles.length > 0) {
      portfolioUrls = [];

      for (const file of portfolioFiles) {
        const url = await uploadFile(file, "vendor-portfolio");
        portfolioUrls.push(url);
      }
    }

    // 🔥 UPDATE PROFILE
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
      setMessage("Profile updated!");
      router.push(`/vendor/${handle}`);
    }
  } catch (err) {
    setMessage(err.message);
  }

  setLoading(false);
};
    setLoading(true);
    setMessage("");

    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

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

      if (error) throw error;

      setMessage("Profile saved!");
      router.push(`/vendor/${handle}`);
    } catch (err) {
      setMessage(err.message);
    }

    setLoading(false);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

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

      <input placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
      <input placeholder="Instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
      <input placeholder="Facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
      <input placeholder="TikTok" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
      <input placeholder="YouTube" value={youtube} onChange={(e) => setYoutube(e.target.value)} />

      <p>Logo</p>
      <input type="file" onChange={(e) => setLogoFile(e.target.files[0])} />

      <p>Portfolio</p>
      <input type="file" multiple onChange={(e) => setPortfolioFiles(Array.from(e.target.files))} />

      <button onClick={handleSave} style={{ marginTop: 20 }}>
        Save Profile
      </button>
    </div>
  );
}
