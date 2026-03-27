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
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [description, setDescription] = useState("");

  const [handleEdited, setHandleEdited] = useState(false);

  // 🔒 PROTECT PAGE
  useEffect(() => {
    const protect = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        router.replace("/");
        return;
      }

      // check role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "vendor") {
        router.replace("/marketplace");
        return;
      }

      setLoading(false);
    };

    protect();
  }, [router]);

  // auto-generate handle
  useEffect(() => {
    if (!handleEdited) {
      const generated = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      setHandle(generated);
    }
  }, [businessName]);

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const { error } = await supabase
      .from("profiles")
      .update({
        business_name: businessName,
        handle,
        category,
        city,
        state,
        description,
      })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Profile saved!");
    router.push(`/vendor/${handle}`);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>Create Vendor Profile</h1>

      {message && <p>{message}</p>}

      <label>Business Name</label>
      <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />

      <label>Handle</label>
      <input
        value={handle}
        onChange={(e) => {
          setHandle(e.target.value);
          setHandleEdited(true);
        }}
      />

      <label>Category</label>
      <input value={category} onChange={(e) => setCategory(e.target.value)} />

      <label>City</label>
      <input value={city} onChange={(e) => setCity(e.target.value)} />

      <label>State</label>
      <input value={state} onChange={(e) => setState(e.target.value)} />

      <label>Description</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

      <button onClick={handleSave} style={{ marginTop: 20 }}>
        Save Profile
      </button>
    </div>
  );
}
