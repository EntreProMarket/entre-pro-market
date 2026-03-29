import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function VendorProfile() {
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
      const user = data.user;

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

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      console.log(error);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setMessage("Saving...");

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) return;

    // Get existing images so they don't get wiped
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("logo_url, portfolio_images")
      .eq("id", user.id)
      .single();

    let logoUrl = null;
    if (logoFile) {
      logoUrl = await uploadFile(logoFile, "vendor-logos");
    }

    const portfolioUrls = [];
    for (const file of portfolioFiles) {
      const url = await uploadFile(file, "vendor-portfolio");
      if (url) portfolioUrls.push(url);
    }

    const finalLogo = logoUrl || existingProfile?.logo_url || null;

    const finalPortfolio =
      portfolioUrls.length > 0
        ? portfolioUrls
        : existingProfile?.portfolio_images || [];

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
        logo_url: finalLogo,
        portfolio_images: finalPortfolio,
      })
      .eq("id", user.id);

    if (error) {
      console.log
