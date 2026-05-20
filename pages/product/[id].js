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
  const [manualPay, setManualPay] = useState(null);
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user || null);
      const { data: prod } = await supabase.from("vendor_products").select("*").eq("id", id).single();
      if (!prod) { setLoading(false); return; }
      setProduct(prod);
      const { data: v } = await supabase.from("profiles").select("business_name, handle, logo_url, cashapp_handle, venmo_handle").eq("id", prod.vendor_id).single();
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

  const images = product.images && product.images.length > 0 ? product.images : (product.image_url ? [product.image_url] : []);
  const price = (product.price / 100).toFixed(2);
  const cashappHandle = vendor?.cashapp_handle || "Meta4rikalMindz";
  const venmoHandle = vendor?.venmo_handle || "Meta4rikal-Mindz";
  const productNote = encodeURIComponent(`${product.title} - $${price}`);
  const cashappUrl = `https://cash.app/$${cashappHandle}/${price}`;
  const venmoUrl = `https://venmo.com/${venmoHandle}?txn=pay&amount=${price}&note=${productNote}`;

  // Back destination — vendor shop tab
  const backUrl = vendor?.handle ? `/vendor/${vendor.handle}?tab=shop` : null;

  // MANUAL PAYMENT SCREEN
  if (manualPay) {
    const isCashApp = manualPay === "cashapp";
    const payHandle = isCashApp ? `$${cashappHandle}` : `@${venmoHandle}`;
    const payUrl = isCashApp ? cashappUrl : venmoUrl;
    const color = isCashApp ? "#00D632" : "#008CFF";
    const appName = isCashApp ? "CashApp" : "Venmo";
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, fontFamily: "sans-serif", textAlign: "center" }}>
        <div style={{ backgroundColor: "white", border: `2px solid ${color}`, borderRadius: 16, padding: "32px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <p style={{ fontSize: 48, margin: "0 0 12px" }}>{isCashApp ? "💸" : "🔵"}</p>
          <h2 style={{ color, margin: "0 0 8px" }}>Pay via {appName}</h2>
          <p style={{ color: "#444", fontSize: 15, marginBottom: 4 }}><strong>{product.title}</strong></p>
          <p style={{ color, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>${price}</p>
          <div style={{ backgroundColor: "#f9f9f9", borderRadius: 10, padding: "14px 16px", marginBottom: 20, textAlign: "left" }}>
            <p style={{ margin: "0 0 6px", fontWeight: "bold", fontSize: 14 }}>Instructions:</p>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "#444" }}>1. Tap the button below to open {appName}</p>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "#444" }}>2. Send <strong>${price}</strong> to <strong>{payHandle}</strong></p>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "#444" }}>3. Note: <strong>{product.title}</strong></p>
            <p style={{ margin: 0, fontSize: 13, color: "#888" }}>The vendor will confirm after payment is received.</p>
          </div>
          <a href={payUrl} target="_blank" rel="noreferrer"
            style={{ display: "block", padding: "14px 20px", backgroundColor: color, color: "white", borderRadius: 10, fontWeight: "bold", fontSize: 16, textDecoration: "none", marginBottom: 12 }}>
            Open {appName} → {payHandle}
          </a>
          <button onClick={() => setManualPay(null)}
            style={{ width: "100%", padding: "12px", backgroundColor: "#eee", border: "none", borderRadius: 10, fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>
            ← Back to Payment Options
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>

      {/* BACK — goes to shop tab */}
      <button onClick={() => backUrl ? router.push(backUrl) : router.back()}
        style={{ marginBottom: 20, padding: "8px 16px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>
        ← Back to Shop
      </button>

      {/* IMAGE GALLERY */}
      {images.length > 0 && (
        <div style={{ position: "relative", marginBottom: 24 }}>
          <img src={images[currentImg]} alt={product.title}
            onClick={() => setFullscreen(true)}
            style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 12, cursor: "zoom-in", display: "block" }} />

          {/* Enlarge hint */}
          <div style={{ position: "absolute", bottom: 10, right: 12, backgroundColor: "rgba(0,0,0,0.5)", color: "white", fontSize: 11, padding: "3px 8px", borderRadius: 10 }}>
            Tap to enlarge
          </div>

          {/* Image counter */}
          {images.length > 1 && (
            <div style={{ position: "absolute", bottom: 10, left: 12, backgroundColor: "rgba(0,0,0,0.5)", color: "white", fontSize: 11, padding: "3px 8px", borderRadius: 10 }}>
              {currentImg + 1} / {images.length}
            </div>
          )}

          {/* Prev / Next arrows */}
          {images.length > 1 && (
            <>
              <button onClick={() => setCurrentImg(i => (i - 1 + images.length) % images.length)}
                style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", backgroundColor: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
              <button onClick={() => setCurrentImg(i => (i + 1) % images.length)}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", backgroundColor: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            </>
          )}

          {/* Dot indicators */}
          {images.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
              {images.map((_, i) => (
                <div key={i} onClick={() => setCurrentImg(i)}
                  style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: i === currentImg ? "#701890" : "#ddd", cursor: "pointer", transition: "background 0.2s" }} />
              ))}
            </div>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
              {images.map((img, i) => (
                <img key={i} src={img} alt="" onClick={() => setCurrentImg(i)}
                  style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: i === currentImg ? "2px solid #701890" : "2px solid transparent", flexShrink: 0 }} />
              ))}
            </div>
          )}
        </div>
      )}

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
        <button onClick={handleBuyWithStripe} disabled={buying}
          style={{ padding: "15px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 16, cursor: "pointer" }}>
          {buying ? "Processing..." : `💳 Pay with Card or Google Pay — $${price}`}
        </button>
        <p style={{ margin: "-6px 0 6px", fontSize: 11, color: "#aaa", textAlign: "center" }}>Google Pay appears automatically on supported devices</p>

        {cashappHandle && (
          <button onClick={() => setManualPay("cashapp")}
            style={{ padding: "15px 20px", backgroundColor: "#00D632", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 16, cursor: "pointer" }}>
            💸 Pay with CashApp — ${price}
          </button>
        )}

        {venmoHandle && (
          <button onClick={() => setManualPay("venmo")}
            style={{ padding: "15px 20px", backgroundColor: "#008CFF", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 16, cursor: "pointer" }}>
            🔵 Pay with Venmo — ${price}
          </button>
        )}
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: "#aaa", textAlign: "center" }}>Secure checkout. Card payments processed by Stripe.</p>

      {/* FULLSCREEN */}
      {fullscreen && (
        <div onClick={() => setFullscreen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 9999, cursor: "zoom-out" }}>
          <img src={images[currentImg]} alt={product.title} style={{ maxWidth: "95%", maxHeight: "85vh", borderRadius: 8, objectFit: "contain" }} />
          {images.length > 1 && (
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              {images.map((img, i) => (
                <img key={i} src={img} onClick={e => { e.stopPropagation(); setCurrentImg(i); }}
                  style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: i === currentImg ? "2px solid white" : "2px solid transparent" }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
