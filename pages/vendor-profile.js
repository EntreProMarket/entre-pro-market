// pages/vendor-profile.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import useInactivityLogout from "../hooks/useInactivityLogout";
import ImageEditor from "../components/ImageEditor";
import { sharpenCanvas, useHighQualitySmoothing } from "../lib/imageQuality";

function cleanHandle(value) { return value.trim().replace(/^@/, "").replace(/\s+/g, ""); }
function sanitizeHandle(value) { return value.trim().replace(/^@/, "").replace(/[^a-zA-Z0-9_-]/g, ""); }
function isValidHandle(value) { return value.length > 0 && /^[a-zA-Z0-9_-]+$/.test(value); }

function formatSocialLink(platform, value) {
  if (!value || !value.trim()) return "";
  const v = value.trim();
  if (v.startsWith("https://")) return v;
  if (v.startsWith("http://")) return v.replace("http://", "https://");
  if (v.startsWith("www.")) return `https://${v}`;
  const domains = { instagram: "instagram.com", facebook: "facebook.com", tiktok: "tiktok.com", youtube: "youtube.com" };
  if (domains[platform] && v.toLowerCase().includes(domains[platform])) return `https://${v}`;
  const h = cleanHandle(v);
  switch (platform) {
    case "instagram": return `https://instagram.com/${h}`;
    case "facebook": return `https://facebook.com/${h}`;
    case "tiktok": return `https://tiktok.com/@${h}`;
    case "youtube": return `https://youtube.com/@${h}`;
    case "x_twitter": return `https://x.com/${h}`;
    case "website": return `https://${h}`;
    default: return `https://${h}`;
  }
}

function compressImage(file, maxWidth = 1200, quality = 0.9) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width, height = img.height;
        if (width <= maxWidth) { resolve(file); return; }
        const newWidth = maxWidth, newHeight = Math.round((height * maxWidth) / width);
        const canvas = document.createElement("canvas");
        canvas.width = newWidth; canvas.height = newHeight;
        const ctx = canvas.getContext("2d");
        useHighQualitySmoothing(ctx);
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        sharpenCanvas(ctx, newWidth, newHeight, 0.25);
        canvas.toBlob((blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })), "image/jpeg", quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const DEFAULT_LOGOS = ["/default-logos/EPM-PH1.png", "/default-logos/EPM-PH2.png", "/default-logos/EPM-PH3.png"];
const PRODUCT_LIMITS = { free: 4, premium: 10, featured: 30 };
const PRODUCT_IMAGE_LIMITS = { free: 6, premium: 14, featured: 40 };

export default function VendorProfile() {
  useInactivityLogout();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [businessName, setBusinessName] = useState("");
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [xTwitter, setXTwitter] = useState("");
  const [cashappHandle, setCashappHandle] = useState("");
  const [venmoHandle, setVenmoHandle] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [logoFilePreview, setLogoFilePreview] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [editingLogo, setEditingLogo] = useState(false);
  const [logoEditSrc, setLogoEditSrc] = useState(null);
  const [logoOriginalSrc, setLogoOriginalSrc] = useState(null);
  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [repositioningIndex, setRepositioningIndex] = useState(null);
  const [pfQueue, setPfQueue] = useState([]);
  const [pfIndex, setPfIndex] = useState(0);
  const [pfEditSrc, setPfEditSrc] = useState(null);
  const [accountType, setAccountType] = useState("free");
  const [videoUrls, setVideoUrls] = useState(["","","","","","","","","",""]);
  const [photoLimits, setPhotoLimits] = useState({ free: 5, premium: 20, featured: 40 });
  const [videoLimits, setVideoLimits] = useState({ free: 0, premium: 5, featured: 10 });
  const photoLimit = photoLimits[accountType] ?? photoLimits.free;
  const videoLimit = videoLimits[accountType] ?? videoLimits.free;
  const productLimit = PRODUCT_LIMITS[accountType] ?? PRODUCT_LIMITS.free;
  const productImageLimit = PRODUCT_IMAGE_LIMITS[accountType] ?? PRODUCT_IMAGE_LIMITS.free;
  const [shopProducts, setShopProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ title: "", description: "", price: "" });
  const [newProductImages, setNewProductImages] = useState([]);
  const [newProductImageKey, setNewProductImageKey] = useState(0);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", price: "" });
  const [editProductImages, setEditProductImages] = useState([]);
  const [editProductNewFiles, setEditProductNewFiles] = useState([]);
  const [editProductFileKey, setEditProductFileKey] = useState(0);
  const [userId, setUserId] = useState(null);

  // ── Manual sale marking (CashApp/Venmo) ──
  const [markSaleProductId, setMarkSaleProductId] = useState(null);
  const [markSaleEmail, setMarkSaleEmail] = useState("");
  const [markSaleMethod, setMarkSaleMethod] = useState("cashapp");
  const [markingSale, setMarkingSale] = useState(false);
  const [markSaleMessage, setMarkSaleMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) { router.push("/"); return; }
      setUserId(user.id);
      const { data: s } = await supabase.from("app_settings").select("*");
      if (s) {
        const m = {};
        s.forEach(r => { m[r.key] = parseInt(r.value, 10); });
        setPhotoLimits({ free: m.vendor_free_photos ?? 5, premium: m.vendor_premium_photos ?? 20, featured: m.vendor_featured_photos ?? 40 });
        setVideoLimits({ free: m.vendor_free_videos ?? 0, premium: m.vendor_premium_videos ?? 5, featured: m.vendor_featured_videos ?? 10 });
      }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p) {
        setBusinessName(p.business_name || ""); setHandle(p.handle || ""); setCategory(p.category || "");
        setTags(p.tags ? p.tags.join(", ") : ""); setAccountType(p.account_type || "free");
        if (p.video_urls) setVideoUrls(p.video_urls.concat(["","","","","","","","","",""]).slice(0, 10));
        setCity(p.city || ""); setState(p.state || ""); setDescription(p.description || "");
        setWebsite(p.website || ""); setInstagram(p.instagram || ""); setFacebook(p.facebook || "");
        setTiktok(p.tiktok || ""); setYoutube(p.youtube || ""); setXTwitter(p.x_twitter || "");
        setPortfolioImages(p.portfolio_images || []);
        setLogoUrl(p.logo_url ? p.logo_url.split("#")[0] : "");
        setCashappHandle(p.cashapp_handle || ""); setVenmoHandle(p.venmo_handle || "");
      }
      await loadProducts(user.id);
      setLoading(false);
    };
    load();
  }, [router]);

  const loadProducts = async (uid) => {
    const { data } = await supabase.from("vendor_products").select("*").eq("vendor_id", uid).order("created_at", { ascending: false });
    setShopProducts(data || []);
  };

  const uploadFile = async (file, bucket) => {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.jpg`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) { setMessage("❌ Upload error: " + error.message); return null; }
    return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
  };

  const handleSave = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.email) { setMessage("❌ Your account has no email. Update it in Settings first."); return; }
    if (!handle) { setMessage("❌ Please enter a handle."); return; }
    if (!isValidHandle(handle)) { setMessage("❌ Handle can only contain letters, numbers, hyphens and underscores. No spaces."); return; }
    if (!logoFile && !logoUrl) { setMessage("❌ Please upload a logo before saving."); return; }
    setSaving(true); setMessage("");
    const user = authData.user;
    try {
      let finalLogoUrl = logoUrl || null;
      if (logoFile) {
        setMessage("⏳ Compressing logo...");
        const comp = await compressImage(logoFile, 800, 0.92);
        setMessage("⏳ Uploading logo...");
        const up = await uploadFile(comp, "vendor-logos");
        if (up) finalLogoUrl = up;
      }
      let portfolio = [...portfolioImages];
      if (portfolioFiles.length > 0) {
        for (let i = 0; i < portfolioFiles.length; i++) {
          setMessage(`⏳ Uploading ${i + 1} of ${portfolioFiles.length} images...`);
          const comp = await compressImage(portfolioFiles[i], 1200, 0.9);
          const url = await uploadFile(comp, "vendor-portfolio");
          if (url) portfolio.push(url);
        }
      }
      if (portfolio.length > photoLimit) portfolio = portfolio.slice(0, photoLimit);
      setMessage("⏳ Saving profile...");
      const { error } = await supabase.from("profiles").update({
        business_name: businessName, handle, category,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        video_urls: videoUrls.filter(v => v.trim()),
        city, state, description,
        website: formatSocialLink("website", website),
        instagram: formatSocialLink("instagram", instagram),
        facebook: formatSocialLink("facebook", facebook),
        tiktok: formatSocialLink("tiktok", tiktok),
        youtube: formatSocialLink("youtube", youtube),
        x_twitter: formatSocialLink("x_twitter", xTwitter),
        cashapp_handle: cashappHandle.replace(/^\$/, "").trim(),
        venmo_handle: venmoHandle.replace(/^@/, "").trim(),
        logo_url: finalLogoUrl, portfolio_images: portfolio,
      }).eq("id", user.id);
      if (error) throw error;
      setPortfolioImages(portfolio); setPortfolioFiles([]); setLogoUrl(finalLogoUrl); setLogoFile(null); setLogoFilePreview(null);
      setMessage("✅ Profile saved!");
      setTimeout(() => router.replace(`/vendor/${handle}`), 1200);
    } catch (err) { setMessage("❌ Error: " + err.message); }
    setSaving(false);
  };

  const removePortfolioImage = (url) => setPortfolioImages(portfolioImages.filter(x => x !== url));

  const addProduct = async () => {
    if (!newProduct.title || !newProduct.price) { alert("Title and price are required."); return; }
    if (newProductImages.length === 0) { alert("At least one product image is required."); return; }
    if (shopProducts.length >= productLimit) { alert(`Your ${accountType} plan allows up to ${productLimit} products.`); return; }
    setMessage("⏳ Uploading product images...");
    const uploadedUrls = [];
    for (const file of newProductImages) {
      const comp = await compressImage(file, 1200, 0.9);
      const url = await uploadFile(comp, "vendor-portfolio");
      if (url) uploadedUrls.push(url);
    }
    if (uploadedUrls.length === 0) return;
    const { error } = await supabase.from("vendor_products").insert({ vendor_id: userId, title: newProduct.title, description: newProduct.description, price: Math.round(parseFloat(newProduct.price) * 100), image_url: uploadedUrls[0], images: uploadedUrls, is_active: true });
    if (error) { setMessage("❌ Error: " + error.message); return; }
    setMessage("✅ Product added!");
    setNewProduct({ title: "", description: "", price: "" });
    setNewProductImages([]); setNewProductImageKey(k => k + 1);
    await loadProducts(userId);
  };

  const saveEditProduct = async () => {
    if (!editForm.title || !editForm.price) { alert("Title and price are required."); return; }
    let updatedImages = [...editProductImages];
    if (editProductNewFiles.length > 0) {
      setMessage("⏳ Uploading new images...");
      const remaining = productImageLimit - updatedImages.length;
      for (const file of editProductNewFiles.slice(0, remaining)) {
        const comp = await compressImage(file, 1200, 0.9);
        const url = await uploadFile(comp, "vendor-portfolio");
        if (url) updatedImages.push(url);
      }
    }
    const { error } = await supabase.from("vendor_products").update({ title: editForm.title, description: editForm.description, price: Math.round(parseFloat(editForm.price) * 100), image_url: updatedImages[0] || null, images: updatedImages }).eq("id", editingProduct);
    if (error) { setMessage("❌ Error: " + error.message); return; }
    setMessage("✅ Product updated!"); setEditingProduct(null);
    setEditProductNewFiles([]); setEditProductFileKey(k => k + 1);
    await loadProducts(userId);
  };

  const removeEditImage = (url) => setEditProductImages(editProductImages.filter(u => u !== url));
  const toggleProduct = async (id, current) => { await supabase.from("vendor_products").update({ is_active: !current }).eq("id", id); await loadProducts(userId); };
  const deleteProduct = async (id) => { if (!confirm("Delete this product?")) return; await supabase.from("vendor_products").delete().eq("id", id); await loadProducts(userId); };

  const submitMarkSale = async () => {
    if (!markSaleEmail.trim() || !markSaleEmail.includes("@")) { setMarkSaleMessage("⚠️ Enter a valid buyer email."); return; }
    setMarkingSale(true); setMarkSaleMessage("");
    try {
      const res = await fetch("/api/mark-manual-sale", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: userId, productId: markSaleProductId, buyerEmail: markSaleEmail.trim(), paymentMethod: markSaleMethod }),
      });
      const data = await res.json();
      if (data.success) {
        setMarkSaleMessage("✅ Sale recorded! The buyer can now leave a review.");
        setTimeout(() => { setMarkSaleProductId(null); setMarkSaleEmail(""); setMarkSaleMessage(""); }, 2000);
      } else {
        setMarkSaleMessage("❌ " + data.error);
      }
    } catch (err) {
      setMarkSaleMessage("❌ " + err.message);
    }
    setMarkingSale(false);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 20 }}>Edit Vendor Profile</h1>
      <div style={{ display: "flex", marginBottom: 24, borderBottom: "2px solid #ddd" }}>
        <button onClick={() => setActiveTab("profile")} style={{ flex: 1, padding: 12,
