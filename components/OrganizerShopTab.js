// components/OrganizerShopTab.js
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { sharpenCanvas, useHighQualitySmoothing } from "../lib/imageQuality";
import useDragReorder from "./useDragReorder";
import CropModal from "./CropModal";

const BUCKET = "organizer-portfolio";
const PRODUCT_LIMIT = 30;
const PRODUCT_IMAGE_LIMIT = 40;
const FEATURED_COUNT = 4;
const PRODUCT_ASPECT = 0.8; // 4:5

// ── Draft saving: text typed in the "Add New Product" form survives leaving the page ──
const DRAFT_PREFIX = "draft_organizer_shop_";
// One stable preview URL per file. (Making a new one on every render made photos reload and
// "stick" while you dragged them.)
const previewUrlCache = new WeakMap();
function previewUrl(file) {
  let u = previewUrlCache.get(file);
  if (!u) { u = URL.createObjectURL(file); previewUrlCache.set(file, u); }
  return u;
}

function loadDraft(key, fallback) {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(DRAFT_PREFIX + key);
  return v !== null ? v : fallback;
}
function saveDraft(key, value) {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(DRAFT_PREFIX + key, value);
  else window.localStorage.removeItem(DRAFT_PREFIX + key);
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

// Product photos: non-destructive drag-to-position, saved as a #pos=x,y tag on the image URL
// (same technique as the Vendor shop and the event flyers).
function parseProductPos(url) {
  if (!url) return { src: url, position: { x: 50, y: 50 } };
  const [base, frag] = url.split("#pos=");
  if (!frag) return { src: base, position: { x: 50, y: 50 } };
  const [x, y] = frag.split(",").map(Number);
  return { src: base, position: { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y } };
}
function withProductPos(url, pos) {
  if (!url) return url;
  const base = url.split("#")[0];
  if (!pos) return base;
  return `${base}#pos=${pos.x.toFixed(1)},${pos.y.toFixed(1)}`;
}
function PositionableProductImage({ src, position, onChange, readOnly = false, badge = null, onReplace }) {
  const ref = useRef(null);
  const dragState = useRef(null);
  const [adjusting, setAdjusting] = useState(false);
  const [cropping, setCropping] = useState(false);
  const active = adjusting && !readOnly; // moving only works while "Adjust" is on, so the page scrolls normally otherwise
  const pill = { position: "absolute", background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: 10, padding: "4px 8px", fontSize: 11, fontWeight: "bold", cursor: "pointer" };
  return (
    <div
      ref={ref}
      onPointerDown={(e) => { if (!active) return; dragState.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }}
      onPointerMove={(e) => {
        const d = dragState.current;
        if (!active || !d || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        onChange({
          x: Math.min(100, Math.max(0, d.posX - ((e.clientX - d.x) / rect.width) * 100)),
          y: Math.min(100, Math.max(0, d.posY - ((e.clientY - d.y) / rect.height) * 100)),
        });
      }}
      onPointerUp={() => { dragState.current = null; }}
      onPointerCancel={() => { dragState.current = null; }}
      style={{ width: "100%", aspectRatio: PRODUCT_ASPECT, borderRadius: 8, overflow: "hidden", border: readOnly ? "1px solid #e5e7eb" : (active ? "3px solid #AABB23" : "2px solid #701890"), cursor: active ? "grab" : "default", touchAction: active ? "none" : "pan-y", position: "relative", backgroundColor: "#eee" }}
    >
      <img src={src} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${position.x}% ${position.y}%`, display: "block", pointerEvents: "none" }} />
      {!readOnly && onReplace && (
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setCropping(true); }} style={{ ...pill, top: 4, left: 6 }}>✂️ Crop</button>
      )}
      {!readOnly && (
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setAdjusting((a) => !a); }} style={{ ...pill, bottom: 4, right: 6, background: adjusting ? "#701890" : "rgba(0,0,0,0.6)" }}>{adjusting ? "✓ Done" : "✋ Adjust"}</button>
      )}
      {badge}
      {cropping && <CropModal src={src} onCancel={() => setCropping(false)} onDone={(file) => { setCropping(false); if (onReplace) onReplace(file); }} />}
    </div>
  );
}

const iS = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };
const lS = { display: "block", fontWeight: "bold", marginBottom: 6, fontSize: 14, color: "#333" };

export default function OrganizerShopTab({ userId }) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [cashappHandle, setCashappHandle] = useState("");
  const [venmoHandle, setVenmoHandle] = useState("");
  const [products, setProducts] = useState([]);
  const [productOrder, setProductOrder] = useState([]);
  const [newProduct, setNewProduct] = useState({ title: loadDraft("title", ""), description: loadDraft("description", ""), price: loadDraft("price", "") });
  const [newImages, setNewImages] = useState([]); // [{ file, position }]
  const [newImageKey, setNewImageKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", price: "" });
  const [editImages, setEditImages] = useState([]); // [{ url, src, position }]
  const [editNewFiles, setEditNewFiles] = useState([]); // [{ file, position }]
  const [editFileKey, setEditFileKey] = useState(0);
  const [markSaleProductId, setMarkSaleProductId] = useState(null);
  const [markSaleEmail, setMarkSaleEmail] = useState("");
  const [markSaleMethod, setMarkSaleMethod] = useState("cashapp");
  const [markSaleProofFile, setMarkSaleProofFile] = useState(null);
  const [markingSale, setMarkingSale] = useState(false);
  const [markSaleMessage, setMarkSaleMessage] = useState("");

  const loadProducts = async () => {
    const { data } = await supabase.from("vendor_products").select("*").eq("vendor_id", userId).order("created_at", { ascending: false });
    setProducts(data || []);
  };

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data: p } = await supabase.from("profiles").select("cashapp_handle, venmo_handle, product_order").eq("id", userId).single();
      if (p) {
        setCashappHandle(p.cashapp_handle || "");
        setVenmoHandle(p.venmo_handle || "");
        setProductOrder(p.product_order || []);
      }
      await loadProducts();
      setLoading(false);
    };
    load();
  }, [userId]); // eslint-disable-line

  // Display/saved order: the organizer's dragged order first, anything new after.
  const orderedProducts = (() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    const inOrder = productOrder.map((id) => byId.get(id)).filter(Boolean);
    const seen = new Set(inOrder.map((p) => p.id));
    return [...inOrder, ...products.filter((p) => !seen.has(p.id))];
  })();

  const reorderProducts = async (from, to) => {
    const ids = orderedProducts.map((p) => p.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    setProductOrder(ids);
    const { error } = await supabase.from("profiles").update({ product_order: ids }).eq("id", userId);
    if (error) setMessage("❌ Couldn't save the product order: " + error.message);
  };
  const drag = useDragReorder((from, to) => reorderProducts(from, to));

  const uploadFile = async (file, bucket = BUCKET) => {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.jpg`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) { setMessage("❌ Upload error: " + error.message); return null; }
    return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
  };

  const saveHandles = async () => {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ cashapp_handle: cashappHandle.replace(/^\$/, "").trim(), venmo_handle: venmoHandle.replace(/^@/, "").trim() }).eq("id", userId);
    setBusy(false);
    setMessage(error ? "❌ " + error.message : "✅ Payment handles saved!");
  };

  const setNewField = (field) => (value) => { setNewProduct((prev) => ({ ...prev, [field]: value })); saveDraft(field, value); };
  const setEditField = (field) => (value) => { setEditForm((prev) => ({ ...prev, [field]: value })); if (editingId) saveDraft(`edit_${editingId}_${field}`, value); };

  const addProduct = async () => {
    if (!newProduct.title || !newProduct.price) { alert("Title and price are required."); return; }
    if (newImages.length === 0) { alert("At least one product image is required."); return; }
    if (products.length >= PRODUCT_LIMIT) { alert(`Your plan allows up to ${PRODUCT_LIMIT} products.`); return; }
    setBusy(true); setMessage("⏳ Uploading product images...");
    const urls = [];
    for (const item of newImages) {
      const comp = await compressImage(item.file, 1200, 0.9);
      const url = await uploadFile(comp);
      if (url) urls.push(withProductPos(url, item.position));
    }
    if (urls.length === 0) { setBusy(false); return; }
    const { error } = await supabase.from("vendor_products").insert({ vendor_id: userId, title: newProduct.title, description: newProduct.description, price: Math.round(parseFloat(newProduct.price) * 100), image_url: urls[0], images: urls, is_active: true });
    setBusy(false);
    if (error) { setMessage("❌ Error: " + error.message); return; }
    setNewProduct({ title: "", description: "", price: "" });
    ["title", "description", "price"].forEach((k) => saveDraft(k, ""));
    setNewImages([]); setNewImageKey((k) => k + 1);
    setMessage("✅ Product added!");
    await loadProducts();
  };

  const startEdit = (p) => {
    const imgs = p.images?.length > 0 ? p.images : (p.image_url ? [p.image_url] : []);
    setEditingId(p.id);
    setEditForm({
      title: loadDraft(`edit_${p.id}_title`, p.title),
      description: loadDraft(`edit_${p.id}_description`, p.description || ""),
      price: loadDraft(`edit_${p.id}_price`, (p.price / 100).toFixed(2)),
    });
    setEditImages(imgs.map((url) => { const parsed = parseProductPos(url); return { url: parsed.src, src: parsed.src, position: parsed.position }; }));
    setEditNewFiles([]);
  };

  const saveEdit = async () => {
    if (!editForm.title || !editForm.price) { alert("Title and price are required."); return; }
    setBusy(true);
    let updated = editImages.map((item) => withProductPos(item.url, item.position));
    if (editNewFiles.length > 0) {
      setMessage("⏳ Uploading new images...");
      const remaining = PRODUCT_IMAGE_LIMIT - updated.length;
      for (const item of editNewFiles.slice(0, remaining)) {
        const comp = await compressImage(item.file, 1200, 0.9);
        const url = await uploadFile(comp);
        if (url) updated.push(withProductPos(url, item.position));
      }
    }
    const { error } = await supabase.from("vendor_products").update({ title: editForm.title, description: editForm.description, price: Math.round(parseFloat(editForm.price) * 100), image_url: updated[0] || null, images: updated }).eq("id", editingId);
    setBusy(false);
    if (error) { setMessage("❌ Error: " + error.message); return; }
    ["title", "description", "price"].forEach((k) => saveDraft(`edit_${editingId}_${k}`, ""));
    setMessage("✅ Product updated!");
    setEditingId(null); setEditNewFiles([]); setEditFileKey((k) => k + 1);
    await loadProducts();
  };

  // ✂️ Crop a saved photo: the cropped version replaces it in the same slot.
  const replaceEditImage = async (i, file) => {
    setMessage("⏳ Uploading cropped photo...");
    const url = await uploadFile(file);
    if (!url) return;
    setEditImages((prev) => prev.map((it, idx) => (idx === i ? { ...it, url, src: url, position: { x: 50, y: 50 } } : it)));
    setMessage("✅ Photo cropped — tap Save on the product to keep it.");
  };

  const toggleProduct = async (id, current) => { await supabase.from("vendor_products").update({ is_active: !current }).eq("id", id); await loadProducts(); };
  const deleteProduct = async (id) => { if (!confirm("Delete this product?")) return; await supabase.from("vendor_products").delete().eq("id", id); await loadProducts(); };

  const submitMarkSale = async () => {
    if (!markSaleEmail.trim() || !markSaleEmail.includes("@")) { setMarkSaleMessage("⚠️ Enter a valid buyer email."); return; }
    if (!markSaleProofFile) { setMarkSaleMessage("⚠️ Upload a screenshot of the payment as proof."); return; }
    setMarkingSale(true); setMarkSaleMessage("⏳ Uploading proof...");
    try {
      const comp = await compressImage(markSaleProofFile, 1200, 0.9);
      const proofUrl = await uploadFile(comp, "payment-proofs");
      if (!proofUrl) { setMarkSaleMessage("❌ Failed to upload proof image."); setMarkingSale(false); return; }
      setMarkSaleMessage("⏳ Recording sale...");
      const res = await fetch("/api/mark-manual-sale", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: userId, productId: markSaleProductId, buyerEmail: markSaleEmail.trim(), paymentMethod: markSaleMethod, proofImageUrl: proofUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setMarkSaleMessage("✅ Sale recorded! Buyer can review now — subject to admin review within 3 business days.");
        setTimeout(() => { setMarkSaleProductId(null); setMarkSaleEmail(""); setMarkSaleProofFile(null); setMarkSaleMessage(""); }, 3000);
      } else {
        setMarkSaleMessage("❌ " + data.error);
      }
    } catch (err) {
      setMarkSaleMessage("❌ " + err.message);
    }
    setMarkingSale(false);
  };

  if (loading) return <div style={{ padding: 20, color: "#888" }}>Loading shop...</div>;

  const limitReached = products.length >= PRODUCT_LIMIT;

  return (
    <div>
      <div style={{ backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
        <label style={{ ...lS, color: "#888B00", marginBottom: 10 }}>💸 Your Payment Handles</label>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 10, marginTop: -4 }}>Buyers send payments directly to these accounts.</p>
        <input placeholder="CashApp (e.g. $YourHandle)" value={cashappHandle} onChange={(e) => setCashappHandle(e.target.value)} style={iS} />
        <input placeholder="Venmo (e.g. @YourHandle)" value={venmoHandle} onChange={(e) => setVenmoHandle(e.target.value)} style={iS} />
        <button onClick={saveHandles} disabled={busy} style={{ padding: "8px 20px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>{busy ? "Saving..." : "Save Handles"}</button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>Your Products</h2>
        <span style={{ fontSize: 13, color: limitReached ? "#cc0000" : "#888", fontWeight: "bold" }}>{products.length} / {PRODUCT_LIMIT}</span>
      </div>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 6, marginTop: 0 }}>Elite plan: up to <strong>{PRODUCT_LIMIT} products</strong>, <strong>{PRODUCT_IMAGE_LIMIT} images</strong> each.</p>
      {orderedProducts.length > 0 && (
        <p style={{ fontSize: 12, color: "#701890", marginBottom: 16, marginTop: 0 }}>Hold and drag the ⠿ handle to reorder. The first {FEATURED_COUNT} are pinned to the top of your shop; the rest rotate for each visitor.</p>
      )}

      {limitReached && <div style={{ backgroundColor: "#fff8e1", border: "1px solid #f0c040", borderRadius: 8, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#856404" }}>⚠️ You've reached your {PRODUCT_LIMIT}-product limit.</div>}

      {!limitReached && (
        <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #eee", borderRadius: 10, padding: 16, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>➕ Add New Product</h3>
          <input placeholder="Product Title *" value={newProduct.title} onChange={(e) => setNewField("title")(e.target.value)} style={iS} />
          <textarea placeholder="Description" value={newProduct.description} onChange={(e) => setNewField("description")(e.target.value)} style={{ ...iS, height: 80, resize: "vertical" }} />
          <input type="number" step="0.01" placeholder="Price in USD *" value={newProduct.price} onChange={(e) => setNewField("price")(e.target.value)} style={iS} />
          <label style={lS}>Product Images * <span style={{ fontSize: 12, color: "#888", fontWeight: "normal" }}>(up to {PRODUCT_IMAGE_LIMIT} — first is main. Drag each photo to position it)</span></label>
          {newImages.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 12 }}>
              {newImages.map((item, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <PositionableProductImage
                    src={previewUrl(item.file)}
                    onReplace={(file) => setNewImages((prev) => prev.map((it, idx) => (idx === i ? { ...it, file, position: { x: 50, y: 50 } } : it)))}
                    position={item.position}
                    onChange={(pos) => setNewImages((prev) => prev.map((it, idx) => (idx === i ? { ...it, position: pos } : it)))}
                    badge={i === 0 ? <div style={{ position: "absolute", bottom: 4, left: 6, backgroundColor: "#701890", color: "white", fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: "bold" }}>MAIN</div> : null}
                  />
                  <button onClick={() => setNewImages((prev) => prev.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 12, lineHeight: "22px", textAlign: "center", padding: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}
          {newImages.length < PRODUCT_IMAGE_LIMIT && (
            <input key={newImageKey} type="file" accept="image/*" multiple onChange={(e) => {
              const remaining = PRODUCT_IMAGE_LIMIT - newImages.length;
              const files = Array.from(e.target.files).slice(0, remaining);
              e.target.value = "";
              if (files.length === 0) return;
              setNewImages((prev) => [...prev, ...files.map((file) => ({ file, position: { x: 50, y: 50 } }))]);
            }} style={{ display: "block", marginBottom: 12 }} />
          )}
          <button onClick={addProduct} disabled={busy} style={{ padding: "12px 24px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>{busy ? "Working..." : "Add Product"}</button>
        </div>
      )}

      <div style={{ backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#701890" }}>
        ℹ️ Reviews on your products require a verified purchase. Use "💸 Mark Sale Paid" below for CashApp/Venmo sales — the buyer gets review access right away, subject to a proof review by Entre PRO Market within 3 business days.
      </div>

      {orderedProducts.length === 0 ? <p style={{ color: "#888", textAlign: "center" }}>No products yet. Add your first product above!</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orderedProducts.map((p, idx) => {
            const imgs = p.images?.length > 0 ? p.images : (p.image_url ? [p.image_url] : []);
            const main = imgs[0] ? parseProductPos(imgs[0]) : null;
            const isEditing = editingId === p.id;
            return (
              <div key={p.id} ref={drag.setItemRef(idx)} style={{ position: "relative", backgroundColor: "white", border: `1px solid ${p.is_active ? "#eee" : "#fca5a5"}`, borderRadius: 10, padding: 14, display: "flex", gap: 14, alignItems: "flex-start", ...drag.itemStyle(idx) }}>
                {!isEditing && (
                  <div
                    {...drag.handleProps(idx)}
                    title="Hold and drag to reorder"
                    style={{ position: "absolute", top: 8, right: 8, zIndex: 2, ...drag.handleBaseStyle, background: idx < FEATURED_COUNT ? "#AABB23" : "rgba(0,0,0,0.55)", color: "white", borderRadius: 10, padding: "4px 9px", fontSize: 13, fontWeight: "bold" }}
                  >⠿ {idx + 1}</div>
                )}
                {main && <div style={{ width: 80, height: 100, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0 }}><img src={main.src} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${main.position.x}% ${main.position.y}%`, display: "block" }} /></div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <>
                      <input value={editForm.title} onChange={(e) => setEditField("title")(e.target.value)} style={{ ...iS, marginBottom: 6 }} />
                      <textarea value={editForm.description} onChange={(e) => setEditField("description")(e.target.value)} style={{ ...iS, height: 60, resize: "vertical", marginBottom: 6 }} />
                      <input type="number" step="0.01" value={editForm.price} onChange={(e) => setEditField("price")(e.target.value)} style={{ ...iS, marginBottom: 8 }} />
                      {editImages.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 8 }}>
                          {editImages.map((item, i) => (
                            <div key={i} style={{ position: "relative" }}>
                              <PositionableProductImage
                                src={item.src}
                                onReplace={(file) => replaceEditImage(i, file)}
                                position={item.position}
                                onChange={(pos) => setEditImages((prev) => prev.map((it, k) => (k === i ? { ...it, position: pos } : it)))}
                                badge={i === 0 ? <div style={{ position: "absolute", bottom: 4, left: 6, backgroundColor: "#701890", color: "white", fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: "bold" }}>MAIN</div> : null}
                              />
                              <button onClick={() => setEditImages((prev) => prev.filter((_, k) => k !== i))} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 12, lineHeight: "22px", textAlign: "center", padding: 0 }}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {editNewFiles.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 8 }}>
                          {editNewFiles.map((item, i) => (
                            <div key={i} style={{ position: "relative" }}>
                              <PositionableProductImage
                                src={previewUrl(item.file)}
                                onReplace={(file) => setEditNewFiles((prev) => prev.map((it, k) => (k === i ? { ...it, file, position: { x: 50, y: 50 } } : it)))}
                                position={item.position}
                                onChange={(pos) => setEditNewFiles((prev) => prev.map((it, k) => (k === i ? { ...it, position: pos } : it)))}
                              />
                              <button onClick={() => setEditNewFiles((prev) => prev.filter((_, k) => k !== i))} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 12, lineHeight: "22px", textAlign: "center", padding: 0 }}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {(editImages.length + editNewFiles.length) < PRODUCT_IMAGE_LIMIT && (
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ fontSize: 12, color: "#555", display: "block", marginBottom: 4 }}>Add more ({editImages.length + editNewFiles.length}/{PRODUCT_IMAGE_LIMIT}) — drag each to position</label>
                          <input key={editFileKey} type="file" accept="image/*" multiple onChange={(e) => {
                            const remaining = PRODUCT_IMAGE_LIMIT - (editImages.length + editNewFiles.length);
                            const files = Array.from(e.target.files).slice(0, remaining);
                            e.target.value = "";
                            if (files.length === 0) return;
                            setEditNewFiles((prev) => [...prev, ...files.map((file) => ({ file, position: { x: 50, y: 50 } }))]);
                          }} style={{ display: "block" }} />
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={saveEdit} disabled={busy} style={{ padding: "6px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>{busy ? "Saving..." : "Save"}</button>
                        <button onClick={() => { setEditingId(null); setEditNewFiles([]); setEditFileKey((k) => k + 1); }} style={{ padding: "6px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: "0 36px 4px 0", fontWeight: "bold", fontSize: 14 }}>{p.title}</p>
                      {p.description && <p style={{ margin: "0 0 4px", fontSize: 12, color: "#666", whiteSpace: "pre-wrap" }}>{p.description}</p>}
                      <p style={{ margin: "0 0 8px", color: "#701890", fontWeight: "bold", fontSize: 14 }}>${(p.price / 100).toFixed(2)}</p>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, backgroundColor: p.is_active ? "#f0fdf4" : "#fef2f2", color: p.is_active ? "#166534" : "#991b1b", fontWeight: "bold" }}>{p.is_active ? "Active" : "Hidden"}</span>

                      {markSaleProductId === p.id ? (
                        <div style={{ marginTop: 10, backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 8, padding: 12 }}>
                          <p style={{ margin: "0 0 8px", fontWeight: "bold", fontSize: 12, color: "#888B00" }}>💸 Mark CashApp/Venmo Sale as Paid</p>
                          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                            <button onClick={() => setMarkSaleMethod("cashapp")} style={{ flex: 1, padding: "6px 10px", backgroundColor: markSaleMethod === "cashapp" ? "#00D632" : "#eee", color: markSaleMethod === "cashapp" ? "white" : "#555", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>CashApp</button>
                            <button onClick={() => setMarkSaleMethod("venmo")} style={{ flex: 1, padding: "6px 10px", backgroundColor: markSaleMethod === "venmo" ? "#008CFF" : "#eee", color: markSaleMethod === "venmo" ? "white" : "#555", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>Venmo</button>
                          </div>
                          <input placeholder="Buyer's email (their EPM account email)" value={markSaleEmail} onChange={(e) => setMarkSaleEmail(e.target.value)} style={{ ...iS, marginBottom: 8, fontSize: 13 }} />
                          <label style={{ fontSize: 12, fontWeight: "bold", color: "#555", display: "block", marginBottom: 4 }}>Screenshot proof of payment *</label>
                          {markSaleProofFile ? (
                            <div style={{ marginBottom: 8, position: "relative", maxWidth: 200 }}>
                              <div style={{ borderRadius: 6, overflow: "hidden", border: "1px solid #AABB23" }}>
                                <img src={previewUrl(markSaleProofFile)} alt="proof" style={{ width: "100%", height: "auto", display: "block" }} />
                              </div>
                              <button onClick={() => setMarkSaleProofFile(null)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 12 }}>×</button>
                            </div>
                          ) : (
                            <input type="file" accept="image/*" onChange={(e) => setMarkSaleProofFile(e.target.files[0] || null)} style={{ display: "block", marginBottom: 8 }} />
                          )}
                          <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px" }}>The buyer must have an EntreProMarket account with this email. Buyer gets review access immediately — this proof will be reviewed by Entre PRO Market within 3 business days; a rejected proof removes the review.</p>
                          {markSaleMessage && <p style={{ fontSize: 12, margin: "0 0 8px", color: markSaleMessage.startsWith("✅") ? "#166534" : "#991b1b", fontWeight: "bold" }}>{markSaleMessage}</p>}
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={submitMarkSale} disabled={markingSale} style={{ padding: "6px 14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>{markingSale ? "Saving..." : "Confirm Sale"}</button>
                            <button onClick={() => { setMarkSaleProductId(null); setMarkSaleEmail(""); setMarkSaleProofFile(null); setMarkSaleMessage(""); }} style={{ padding: "6px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                          <button onClick={() => startEdit(p)} style={{ padding: "5px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Edit</button>
                          <button onClick={() => toggleProduct(p.id, p.is_active)} style={{ padding: "5px 12px", backgroundColor: p.is_active ? "#888" : "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>{p.is_active ? "Hide" : "Show"}</button>
                          <button onClick={() => deleteProduct(p.id)} style={{ padding: "5px 12px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Delete</button>
                          <button onClick={() => { setMarkSaleProductId(p.id); setMarkSaleEmail(""); setMarkSaleProofFile(null); setMarkSaleMessage(""); }} style={{ padding: "5px 12px", backgroundColor: "#00D632", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>💸 Mark Sale Paid</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {message && <p style={{ padding: "12px 16px", backgroundColor: message.startsWith("✅") ? "#f0fdf4" : message.startsWith("⏳") ? "#eff6ff" : "#fef2f2", borderRadius: 6, color: message.startsWith("✅") ? "#166534" : message.startsWith("⏳") ? "#1e40af" : "#991b1b", fontWeight: "bold", marginTop: 16 }}>{message}</p>}
    </div>
  );
}
