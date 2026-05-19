// pages/product/[id].js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user || null);
      const { data: prod } = await supabase.from("vendor_products").select("*").eq("id", id).single();
      if (!prod) { setLoading(false); return; }
      setProduct(prod);
      const { data: v } = await supabase.from("profiles").select("business_name, handle, logo_url").eq("id", prod.vendor_id).single();
      setVendor(v);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleBuyWithStripe = async () => {
    if (!user) { router.push("/"); return; }
    setBuying(true);
    try {
      const res = await fetch("/api/create-product-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, userId: user.id }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { alert("Checkout error: " + data.error); }
    } catch (err) { alert("Error: " + err.message); }
    setBuying(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  if (!product) return <div style={{ padding: 40, textAlign: "center" }}>Product not found.</div>;

  const price = (product.price / 100).toFixed(2);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
      <button onClick={() => router.back()} style={{ marginBottom: 20, padding: "8px 16px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>← Back</button>

      {/* PRODUCT IMAGE — tap to fullscreen */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <img src={product.image_url} alt={product.title}
          onClick={() => setFullscreen(true)}
          style={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: 12, cursor: "zoom-in", display: "block" }} />
        <div style={{ position: "absolute", bottom: 10, right: 12, backgroundColor: "rgba(0,0,0,0.5)", color: "white", fontSize: 11, padding: "3px 8px", borderRadius: 10 }}>Tap to enlarge</div>
      </div>

      {/* VENDOR LINK */}
      {vendor && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, cursor: "pointer" }}
          onClick={() => router.push(`/vendor/${vendor.handle}`)}>
          {vendor.logo_url && <img src={vendor.logo_url} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />}
          <span style={{ fontSize: 13, color: "#701890", fontWeight: "bold" }}>@{vendor.handle} · {vendor.business_name}</span>
        </div>
      )}

      <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>{product.title}</h1>
      <p style={{ margin: "0 0 20px", fontSize: 28, fontWeight: "bold", color: "#701890" }}>${price}</p>
      {product.description && <p style={{ margin: "0 0 28px", fontSize: 15, color: "#444", lineHeight: 1.6 }}>{product.description}</p>}

      {/* BUY BUTTONS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* STRIPE / CARD */}
        <button onClick={handleBuyWithStripe} disabled={buying}
          style={{ padding: "15px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {buying ? "Processing..." : `💳 Pay with Card — $${price}`}
        </button>

        {/* CASHAPP */}
        <a href={`https://cash.app/$EntreProMarket/${price}`} target="_blank" rel="noreferrer"
          style={{ padding: "15px 20px", backgroundColor: "#00D632", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}>
          💸 Pay with CashApp — ${price}
        </a>

        {/* VENMO */}
        <a href={`https://venmo.com/?txn=pay&amount=${price}&note=${encodeURIComponent(product.title)}`} target="_blank" rel="noreferrer"
          style={{ padding: "15px 20px", backgroundColor: "#008CFF", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}>
          🔵 Pay with Venmo — ${price}
        </a>

        {/* GOOGLE PAY via Stripe */}
        <button onClick={handleBuyWithStripe} disabled={buying}
          style={{ padding: "15px 20px", backgroundColor: "#4285F4", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          G Pay — ${price}
        </button>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: "#aaa", textAlign: "center" }}>
        Secure checkout. For CashApp/Venmo, please include your order details in the payment note.
      </p>

      {/* FULLSCREEN IMAGE */}
      {fullscreen && (
        <div onClick={() => setFullscreen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, cursor: "zoom-out" }}>
          <img src={product.image_url} alt={product.title} style={{ maxWidth: "95%", maxHeight: "95vh", borderRadius: 8, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}
