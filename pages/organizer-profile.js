import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function OrganizerProfile() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [organizerName, setOrganizerName] = useState("");
  const [handle, setHandle] = useState("");
  const [eventType, setEventType] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [description, setDescription] = useState("");

  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");

  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setOrganizerName(profile.organizer_name || "");
        setHandle(profile.handle || "");
        setEventType(profile.event_type || "");
        setTags(profile.tags || []);
        setCity(profile.city || "");
        setState(profile.state || "");
        setDescription(profile.description || "");

        setWebsite(profile.website || "");
        setInstagram(profile.instagram || "");
        setFacebook(profile.facebook || "");
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

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) return null;

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setMessage("Saving...");

    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    const { data: existing } = await supabase
      .from("profiles")
      .select("logo_url")
      .eq("id", user.id)
      .single();

    let logoUrl = existing?.logo_url || null;

    if (logoFile) {
      const uploaded = await uploadFile(logoFile, "vendor-logos");
      if (uploaded) logoUrl = uploaded;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        organizer_name: organizerName,
        handle,
        event_type: eventType,
        tags,
        city,
        state,
        description,
        website,
        instagram,
        facebook,
        logo_url: logoUrl,
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
      <h1>Organizer Profile</h1>
      {message && <p>{message}</p>}

      <input placeholder="Organizer Name" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} />
      <input placeholder="Handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
      <input placeholder="Event Type" value={eventType} onChange={(e) => setEventType(e.target.value)} />

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

      <div style={{ background: "#ffe5e5", color: "#b30000", padding: 10, marginTop: 20 }}>
        ⚠️ Links must be public or they may not open correctly.
      </div>

      <input placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
      <input placeholder="Instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
      <input placeholder="Facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} />

      <p>Logo</p>
      <input type="file" onChange={(e) => setLogoFile(e.target.files[0])} />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <button onClick={() => window.history.back()}>← Back</button>
        <button onClick={handleSave}>Save Profile</button>
      </div>
    </div>
  );
}
