// pages/organizer-profile.js

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function OrganizerProfile() {
  const router = useRouter();

  const [user, setUser] = useState(null);
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
  const [tags, setTags] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");

  // Portfolio
  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [portfolioImages, setPortfolioImages] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user;

      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profile) {
        setOrganizerName(profile.organizer_name || "");
        setHandle(profile.handle || "");
        setCategory(profile.category || "");
        setCity(profile.city || "");
        setStateVal(profile.state || "");
        setDescription(profile.description || "");
        setWebsite(profile.website || "");
        setInstagram(profile.instagram || "");
        setFacebook(profile.facebook || "");
        setTags(profile.tags ? profile.tags.join(", ") : "");
        setLogoUrl(profile.logo_url || "");
        setPortfolioImages(profile.portfolio_images || []);
      }

      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage("");

    try {
      let uploadedLogoUrl = logoUrl;

      // Upload logo if new one selected
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${user.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("logos")
          .upload(fileName, logoFile, { upsert: true });

        if (!uploadError) {
          const { data } = supabase.storage.from("logos").getPublicUrl(fileName);
          uploadedLogoUrl = data.publicUrl;
        }
      }

      // Upload new portfolio images
      let updatedPortfolio = [...portfolioImages];

      if (portfolioFiles.length > 0) {
        for (const file of portfolioFiles) {
          const fileName = `${user.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("logos")
            .upload(fileName, file, { upsert: true });

          if (!uploadError) {
            const { data } = supabase.storage.from("logos").getPublicUrl(fileName);
            updatedPortfolio.push(data.publicUrl);
          }
        }
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        organizer_name: organizerName,
        handle,
        category,
        city,
        state: stateVal,
        description,
        website,
        instagram,
        facebook,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        logo_url: uploadedLogoUrl,
        portfolio_images: updatedPortfolio,
        role: "organizer",
      });

      if (error) throw error;

      setMessage("✅ Profile saved!");
      setTimeout(() => router.push(`/organizer/${handle}`), 1200);

    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }

    setSaving(false);
  };

  const removePortfolioImage = (url) => {
    setPortfolioImages(portfolioImages.filter((img) => img !== url));
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, fontFamily: "sans-serif" }}>

      {/* ✅ FIXED: Clear title so it's not confused with the public profile */}
      <h1 style={{ marginBottom: 20 }}>Edit Organizer Profile</h1>

      <input
        placeholder="Organizer Name"
        value={organizerName}
        onChange={(e) => setOrganizerName(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="Handle"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="State"
        value={stateVal}
        onChange={(e) => setStateVal(e.target.value)}
        style={inputStyle}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        style={{ ...inputStyle, resize: "vertical" }}
      />
      <input
        placeholder="Website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="Instagram"
        value={instagram}
        onChange={(e) => setInstagram(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="Facebook"
        value={facebook}
        onChange={(e) => setFacebook(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        style={inputStyle}
      />

      {/* LOGO */}
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <label style={labelStyle}>Logo</label>
        {logoUrl && (
          <img
            src={logoUrl}
            alt="logo"
            style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, display: "block", marginBottom: 8 }}
          />
        )}
        <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} />
      </div>

      {/* ✅ PORTFOLIO — restored */}
      <div style={{ marginTop: 20, marginBottom: 8 }}>
        <label style={labelStyle}>Portfolio</label>

        {/* Existing images */}
        {portfolioImages.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: 8,
            marginBottom: 12,
          }}>
            {portfolioImages.map((img, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={img}
                  alt="portfolio"
                  style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6 }}
                />
                <button
                  onClick={() => removePortfolioImage(img)}
                  style={{
                    position: "absolute",
                    top: 2, right: 2,
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: 20, height: 20,
                    fontSize: 11,
                    cursor: "pointer",
                    lineHeight: "20px",
                    textAlign: "center",
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setPortfolioFiles(Array.from(e.target.files))}
        />
        <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
          You can select multiple images at once.
        </p>
      </div>

      {/* STATUS MESSAGE */}
      {message && (
        <p style={{
          padding: "12px 16px",
          backgroundColor: message.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${message.startsWith("✅") ? "#86efac" : "#fca5a5"}`,
          borderRadius: 6,
          color: message.startsWith("✅") ? "#166534" : "#991b1b",
          fontWeight: "bold",
          marginTop: 16,
        }}>
          {message}
        </p>
      )}

      {/* BACK + SAVE BUTTONS — matches Vendor profile style */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "12px 20px",
            backgroundColor: "#ccc",
            border: "none",
            borderRadius: 6,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 24px",
            backgroundColor: "#701890",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: 15,
          }}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 14,
  marginBottom: 12,
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontWeight: "bold",
  marginBottom: 6,
  fontSize: 14,
  color: "#333",
};
