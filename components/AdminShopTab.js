// components/AdminShopTab.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import ImageEditor from "./ImageEditor";

// ── EPM Shop — admin-managed products, publicly listed at /epm-shop, no schema
// changes needed: vendor_id just points at whichever admin profile added the item,
// and the public page queries vendor_id IN (profiles WHERE is_admin = true). ──
const SHOP_PRODUCT_IMAGE_LIMIT = 10;
const inputStyle = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };
const labelStyle = { display: "block", fontWeight: "bold", marginBottom: 5, fontSize: 13, color: "#333" };

export default function AdminShopTab({ adminId }) {
  const [shopProducts, setShopProducts] = useState([]);
  const [loadingShop, setLoadingShop] = useState(true);
  const [message, setMessage] = useState("");

  const [shopNewProduct, setShopNewProduct] = useState({ title: "", description: "", price: "" });
  const [shopNewProductImages, setShopNewProductImages] = useState([]);
  const [shopNewProductImageKey, setShopNewProductImageKey] = useState(0);
  const [shopNpQueue, setShopNpQueue] = useState([]);
  const [shopNpIndex, setShopNpIndex] = useState(0);
  const [shopNpEditSrc, setShopNpEditSrc] = useState(null);

  const [shopEditingProduct, setShopEditingProduct] = useState(null);
  const [shopEditForm, setShopEditForm] = useState({ title: "", description: "", price: "" });
  const [shopEditProductImages, setShopEditProductImages] = useState([]);
  const [shopEditProductNewFiles, setShopEditProductNewFiles] = useState([]);
  const [shopEditProductFileKey, setShopEditProductFileKey] = useState(0);
  const [shopEpQueue, setShopEpQueue] = useState([]);
  const [shopEpIndex, setShopEpIndex] = useState(0);
  const [shopEpEditSrc, setShopEpEditSrc] = useState(null);

  useEffect(() => { loadShopProducts(); }, []);

  const loadShopProducts = async () => {
    setLoadingShop(true);
    const { data: adminProfiles } = await supabase.from("profiles").select("id").eq("is_admin", true);
    const adminIds = (adminProfiles || []).map(p => p.id);
    if (adminIds.length === 0) { setShopProducts([]); setLoadingShop(false); return; }
    const { data } = await supabase.from("vendor_products").select("*").in("vendor_id", adminIds).order("created_at", { ascending: false });
    setShopProducts(data || []);
    setLoadingShop(false);
  };

  const uploadFile = async (file, bucket, attempt = 1) => {
    const fileName = `${Date.now()}-${file.name}`;
    try {
      const { error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) {
        if (attempt < 3 && /fetch|network|timeout/i.test(error.message || "")) {
          await new Promise(r => setTimeout(r, 1500 * attempt));
          return uploadFile(file, bucket, attempt + 1);
        }
        setMessage("❌ Upload error: " + error.message);
        return null;
      }
      return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
    } catch (err) {
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 1500 * attempt));
        return uploadFile(file, bucket, attempt + 1);
      }
      setMessage("❌ Upload error: " + err.message);
      return null;
    }
  };

  const addShopProduct = async () => {
    if (!shopNewProduct.title || !shopNewProduct.price) { setMessage("⚠️ Product title and price are required."); return; }
    if (shopNewProductImages.length === 0) { setMessage("⚠️ At least one product image is required."); return; }
    setMessage("");
    const uploadedUrls = [];
    for (const file of shopNewProductImages) {
      const url = await uploadFile(file, "vendor-portfolio");
      if (url) uploadedUrls.push(url);
    }
    if (uploadedUrls.length === 0) return;
    const { error } = await supabase.from("vendor_products").insert({ vendor_id: adminId, title: shopNewProduct.title, description: shopNewProduct.description, price: Math.round(parseFloat(shopNewProduct.price) * 100), image_url: uploadedUrls[0], images: uploadedUrls, is_active: true });
    if (error) { setMessage("❌ Error: " + error.message); return; }
    setMessage("✅ Product added to EPM Shop!");
    setShopNewProduct({ title: "", description: "", price: "" });
    setShopNewProductImages([]); setShopNewProductImageKey(k => k + 1);
    setShopNpQueue([]); setShopNpIndex(0); setShopNpEditSrc(null);
    await loadShopProducts();
  };

  const saveShopEditProduct = async () => {
    if (!shopEditForm.title || !shopEditForm.price) { setMessage("⚠️ Title and price are required."); return; }
    let updatedImages = [...shopEditProductImages];
    if (shopEditProductNewFiles.length > 0) {
      const remaining = SHOP_PRODUCT_IMAGE_LIMIT - updatedImages.length;
      for (const file of shopEditProductNewFiles.slice(0, remaining)) {
        const url = await uploadFile(file, "vendor-portfolio");
        if (url) updatedImages.push(url);
      }
    }
    const { error } = await supabase.from("vendor_products").update({ title: shopEditForm.title, description: shopEditForm.description, price: Math.round(parseFloat(shopEditForm.price) * 100), image_url: updatedImages[0] || null, images: updatedImages }).eq("id", shopEditingProduct);
    if (error) { setMessage("❌ Error: " + error.message); return; }
    setMessage("✅ Product updated!");
    setShopEditingProduct(null); setShopEditProductNewFiles([]); setShopEditProductFileKey(k => k + 1);
    setShopEpQueue([]); setShopEpIndex(0); setShopEpEditSrc(null);
    await loadShopProducts();
  };

  const toggleShopProduct = async (id, current) => { await supabase.from("vendor_products").update({ is_active: !current }).eq("id", id); await loadShopProducts(); };
  const deleteShopProduct = async (id) => { if (!confirm("Delete this product from the EPM Shop?")) return; await supabase.from("vendor_products").delete().eq("id", id); await loadShopProducts(); };
  const removeShopEditImage = (url) => setShopEditProductImages(shopEditProductImages.filter(u => u !== url));

  return (
    <div>
      <h2 style={{ marginBottom: 6 }}>🏢 EPM Shop</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 8 }}>Products added here appear on the public EPM Shop page, linked from a badge on the Homepage whenever at least one product is active. Share this link anywhere:</p>
      <div style={{ backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#701890", fontWeight: "bold" }}>app.entrepromarket.com/epm-shop</div>

      {message && (
        <div style={{ marginBottom: 16, padding: "12px 16px", backgroundColor: message.startsWith("✅") ? "#f0fdf4" : message.startsWith("⚠️") ? "#fffbeb" : "#fef2f2", border: `1px solid ${message.startsWith("✅") ? "#86efac" : message.startsWith("⚠️") ? "#fcd34d" : "#fca5a5"}`, borderRadius: 8, color: message.startsWith("✅") ? "#166534" : message.startsWith("⚠️") ? "#92400e" : "#991b1b", fontWeight: "bold" }}>
          {message}
        </div>
      )}

      <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <p style={{ fontWeight: "bold", marginBottom: 12, fontSize: 15 }}>➕ Add New Product</p>
        <input placeholder="Product Title *" value={shopNewProduct.title} onChange={e => setShopNewProduct({ ...shopNewProduct, title: e.target.value })} style={inputStyle} />
        <textarea placeholder="Description" value={shopNewProduct.description} onChange={e => setShopNewProduct({ ...shopNewProduct, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        <input type="number" step="0.01" placeholder="Price in USD *" value={shopNewProduct.price} onChange={e => setShopNewProduct({ ...shopNewProduct, price: e.target.value })} style={inputStyle} />
        <label style={labelStyle}>Product Images * <span style={{ fontWeight: "normal", color: "#888" }}>(up to {SHOP_PRODUCT_IMAGE_LIMIT} — first is main)</span></label>
        {shopNewProductImages.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
            {shopNewProductImages.map((file, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div style={{ height: 90, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb" }}><img src={URL.createObjectURL(file)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
                <button onClick={() => setShopNewProductImages(shopNewProductImages.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 11, lineHeight: "20px", textAlign: "center", padding: 0 }}>×</button>
                {i === 0 && <div style={{ position: "absolute", bottom: 2, left: 2, backgroundColor: "#701890", color: "white", fontSize: 9, padding: "2px 5px", borderRadius: 4, fontWeight: "bold" }}>MAIN</div>}
              </div>
            ))}
          </div>
        )}
        {shopNpEditSrc && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: "#701890", fontWeight: "bold", margin: "0 0 6px" }}>Cropping image {shopNpIndex + 1} of {shopNpQueue.length}</p>
            <ImageEditor
              src={shopNpEditSrc}
              aspect={null}
              onCancel={() => { setShopNpQueue([]); setShopNpIndex(0); setShopNpEditSrc(null); }}
              onDone={(file) => {
                setShopNewProductImages(prev => [...prev, file].slice(0, SHOP_PRODUCT_IMAGE_LIMIT));
                const next = shopNpIndex + 1;
                if (next < shopNpQueue.length) { setShopNpIndex(next); setShopNpEditSrc(URL.createObjectURL(shopNpQueue[next])); }
                else { setShopNpQueue([]); setShopNpIndex(0); setShopNpEditSrc(null); }
              }}
            />
          </div>
        )}
        {!shopNpEditSrc && shopNewProductImages.length < SHOP_PRODUCT_IMAGE_LIMIT && (
          <input key={shopNewProductImageKey} type="file" accept="image/*" multiple onChange={e => {
            const remaining = SHOP_PRODUCT_IMAGE_LIMIT - shopNewProductImages.length;
            const files = Array.from(e.target.files).slice(0, remaining);
            e.target.value = "";
            if (files.length === 0) return;
            setShopNpQueue(files); setShopNpIndex(0); setShopNpEditSrc(URL.createObjectURL(files[0]));
          }} style={{ display: "block", marginBottom: 12 }} />
        )}
        <button onClick={addShopProduct} style={{ padding: "10px 24px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Add Product</button>
      </div>

      {loadingShop ? <p style={{ color: "#888" }}>Loading...</p> : shopProducts.length === 0 ? (
        <p style={{ color: "#888", fontSize: 13 }}>No EPM Shop products yet. Add your first one above!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {shopProducts.map(p => {
            const productImages = p.images?.length > 0 ? p.images : (p.image_url ? [p.image_url] : []);
            return (
              <div key={p.id} style={{ backgroundColor: "white", border: `1px solid ${p.is_active ? "#eee" : "#fca5a5"}`, borderRadius: 10, padding: 14, display: "flex", gap: 14, alignItems: "flex-start" }}>
                {productImages.length > 0 && <div style={{ width: 80, height: 80, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0 }}><img src={productImages[0]} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
                <div style={{ flex: 1 }}>
                  {shopEditingProduct === p.id ? (
                    <>
                      <input value={shopEditForm.title} onChange={e => setShopEditForm({ ...shopEditForm, title: e.target.value })} style={{ ...inputStyle, marginBottom: 6 }} />
                      <textarea value={shopEditForm.description} onChange={e => setShopEditForm({ ...shopEditForm, description: e.target.value })} style={{ ...inputStyle, height: 60, resize: "vertical", marginBottom: 6 }} />
                      <input type="number" step="0.01" value={shopEditForm.price} onChange={e => setShopEditForm({ ...shopEditForm, price: e.target.value })} style={{ ...inputStyle, marginBottom: 8 }} />
                      {shopEditProductImages.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 8 }}>
                          {shopEditProductImages.map((url, i) => (
                            <div key={i} style={{ position: "relative" }}>
                              <div style={{ height: 70, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb" }}><img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
                              <button onClick={() => removeShopEditImage(url)} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 10, lineHeight: "18px", textAlign: "center", padding: 0 }}>×</button>
                              {i === 0 && <div style={{ position: "absolute", bottom: 2, left: 2, backgroundColor: "#701890", color: "white", fontSize: 9, padding: "2px 5px", borderRadius: 4, fontWeight: "bold" }}>MAIN</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      {shopEpEditSrc && (
                        <div style={{ marginBottom: 10 }}>
                          <p style={{ fontSize: 11, color: "#701890", fontWeight: "bold", margin: "0 0 6px" }}>Cropping image {shopEpIndex + 1} of {shopEpQueue.length}</p>
                          <ImageEditor
                            src={shopEpEditSrc}
                            aspect={null}
                            onCancel={() => { setShopEpQueue([]); setShopEpIndex(0); setShopEpEditSrc(null); }}
                            onDone={(file) => {
                              setShopEditProductNewFiles(prev => [...prev, file]);
                              const next = shopEpIndex + 1;
                              if (next < shopEpQueue.length) { setShopEpIndex(next); setShopEpEditSrc(URL.createObjectURL(shopEpQueue[next])); }
                              else { setShopEpQueue([]); setShopEpIndex(0); setShopEpEditSrc(null); }
                            }}
                          />
                        </div>
                      )}
                      {!shopEpEditSrc && shopEditProductImages.length < SHOP_PRODUCT_IMAGE_LIMIT && (
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ fontSize: 12, color: "#555", display: "block", marginBottom: 4 }}>Add more ({shopEditProductImages.length}/{SHOP_PRODUCT_IMAGE_LIMIT})</label>
                          <input key={shopEditProductFileKey} type="file" accept="image/*" multiple onChange={e => {
                            const remaining = SHOP_PRODUCT_IMAGE_LIMIT - shopEditProductImages.length;
                            const files = Array.from(e.target.files).slice(0, remaining);
                            e.target.value = "";
                            if (files.length === 0) return;
                            setShopEpQueue(files); setShopEpIndex(0); setShopEpEditSrc(URL.createObjectURL(files[0]));
                          }} style={{ display: "block" }} />
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={saveShopEditProduct} style={{ padding: "6px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Save</button>
                        <button onClick={() => { setShopEditingProduct(null); setShopEditProductNewFiles([]); setShopEditProductFileKey(k => k + 1); setShopEpQueue([]); setShopEpIndex(0); setShopEpEditSrc(null); }} style={{ padding: "6px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: "0 0 4px", fontWeight: "bold", fontSize: 14 }}>{p.title}</p>
                      {p.description && <p style={{ margin: "0 0 4px", fontSize: 12, color: "#666" }}>{p.description}</p>}
                      <p style={{ margin: "0 0 8px", color: "#701890", fontWeight: "bold", fontSize: 14 }}>${(p.price / 100).toFixed(2)}</p>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, backgroundColor: p.is_active ? "#f0fdf4" : "#fef2f2", color: p.is_active ? "#166534" : "#991b1b", fontWeight: "bold" }}>{p.is_active ? "Active" : "Hidden"}</span>
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        <button onClick={() => { const imgs = p.images?.length > 0 ? p.images : (p.image_url ? [p.image_url] : []); setShopEditingProduct(p.id); setShopEditForm({ title: p.title, description: p.description || "", price: (p.price / 100).toFixed(2) }); setShopEditProductImages(imgs); setShopEditProductNewFiles([]); setShopEpQueue([]); setShopEpIndex(0); setShopEpEditSrc(null); }} style={{ padding: "5px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Edit</button>
                        <button onClick={() => toggleShopProduct(p.id, p.is_active)} style={{ padding: "5px 12px", backgroundColor: p.is_active ? "#888" : "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>{p.is_active ? "Hide" : "Show"}</button>
                        <button onClick={() => deleteShopProduct(p.id)} style={{ padding: "5px 12px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Delete</button>
                        <button onClick={() => window.open(`/product/${p.id}`, "_blank")} style={{ padding: "5px 12px", backgroundColor: "#111", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>🔗 View</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
