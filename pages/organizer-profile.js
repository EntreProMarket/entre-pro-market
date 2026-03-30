import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function OrganizerProfile() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      }

      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;

    let uploadedLogoUrl = logoUrl;

    if (logoFile) {
      const fileExt = logoFile.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, logoFile, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage
          .from("logos")
          .getPublicUrl(fileName);

        uploadedLogoUrl = data.publicUrl;
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
      tags: tags.split(",").map((t) => t.trim()),
      logo_url: uploadedLogoUrl,
      role: "organizer",
    });

    if (!error) {
      router.push(`/organizer/${handle}`);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      
      {/* ✅ TITLE FIXED */}
      <h1 style={{ marginBottom: 20 }}>Vendor Profile</h1>

      <input
        placeholder="Organizer Name"
        value={organizerName}
        onChange={(e) => setOrganizerName(e.target.value)}
      />

      <input
        placeholder="Handle"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
      />

      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <input
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      <input
        placeholder="State"
        value={stateVal}
        onChange={(e) => setStateVal(e.target.value)}
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        placeholder="Website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />

      <input
        placeholder="Instagram"
        value={instagram}
        onChange={(e) => setInstagram(e.target.value)}
      />

      <input
        placeholder="Facebook"
        value={facebook}
        onChange={(e) => setFacebook(e.target.value)}
      />

      <input
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      {/* LOGO UPLOAD */}
      <input
        type="file"
        onChange={(e) => setLogoFile(e.target.files[0])}
      />

      {logoUrl && (
        <img
          src={logoUrl}
          alt="logo"
          style={{ width: 120, marginTop: 10 }}
        />
      )}

      {/* BUTTONS */}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
        
        <button
          onClick={() => router.back()}
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
