// pages/product-success.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ProductSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState("verifying");
  const [product, setProduct] = useState(null);
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (!router.isReady) return;
    const { session_id } = router.query;
    window.history.replaceState(null, "", window.location.href);
    if (!session_id) { setStatus("error"); return; }
    verifyPayment(session_id);
  }, [router.isReady, router.query]);

  const verifyPayment = async (sessionId) => {
    try {
      const res = await fetch("/api/verify-product-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        setProduct(data.product);
        setStatus("success");

        if (data.buyerEmail) {
          fetch("/api/send-order-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              buyerEmail: data.buyerEmail,
              buyerName: data.buyerName,
              productTitle: data.product?.title,
              productImage: data.product?.image_url,
              amount: data.amount,
              vendorName: data.vendorName,
              vendorHandle: data.vendorHandle,
            }),
          });
        }
        if (data.vendorEmail) {
          fetch("/api/send-payment-received", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vendorEmail: data.vendorEmail,
              vendorName: data.vendorName,
              productTitle: data.product?.title,
              amount: data.amount,
              buyerName: data.buyerName,
              buyerEmail: data.buyerEmail,
            }),
          });
        }

        let count = 8;
        const timer = setInterval(() => {
          count--;
          setCountdown(count);
          if (count <= 0) { clearInterval(timer); window.location.replace("/marketplace"); }
        }, 1000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "verifying") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "sans-serif", backgroundColor: "#fafafa", textAlign: "center" }}>
      <img src="/logo-transparent.png" alt="EntreProMarket" style={{ width: 120, marginBottom: 24 }} />
      <div style={{ backgroundColor: "white", border: "2px solid #701890", borderRadius: 16, padding: "32px 24px", maxWidth: 400, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <p style={{ fontSize: 48, margin: "0 0 16px" }}>⏳</p>
        <h2 style={{ color: "#701890", margin: "0 0 8px" }}>Confirming Payment...</h2>
        <p style={{ color: "#888", fontSize: 14, margin: 0 }}>Please wait while we verify your order.</p>
      </div>
    </div>
  );

  if (status === "error") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "sans-serif", backgroundColor: "#fafafa", textAlign: "center" }}>
      <img src="/logo-transparent.png" alt="EntreProMarket" style={{ width: 120, marginBottom: 24 }} />
      <div style={{ backgroundColor: "white", border: "2px solid #cc0000", borderRadius: 16, padding: "32px 24px", maxWidth: 400, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <p style={{ fontSize: 48, margin: "0 0 16px" }}>⚠️</p>
        <h2 style={{ color: "#cc0000", margin: "0 0 8px" }}>Something Went Wrong</h2>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>Your payment may have been processed but we couldn't confirm it. Please contact support.</p>
        <button onClick={() => window.location.replace("/marketplace")} style={{ width: "100%", padding: "13px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}>Go to Marketplace</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "sans-serif", backgroundColor: "#fafafa", textAlign: "center" }}>
      <img src="/logo-transparent.png" alt="EntreProMarket" style={{ width: 120, marginBottom: 24 }} />
      <div style={{ backgroundColor: "white", border: "2px solid #AABB23", borderRadius: 16, padding: "32px 24px", maxWidth: 400, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <p style={{ fontSize: 60, margin: "0 0 12px" }}>🎉</p>
        <h1 style={{ margin: "0 0 8px", color: "#AABB23", fontSize: 22 }}>Order Confirmed!</h1>
        {product && (
          <div style={{ margin: "16px 0", padding: "12px 16px", backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 8 }}>
            {product.image_url && <img src={product.image_url} alt={product.title} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginBottom: 8, display: "block", margin: "0 auto 8px" }} />}
            <p style={{ margin: 0, fontWeight: "bold", fontSize: 15, color: "#333" }}>{product.title}</p>
            <p style={{ margin: "4px 0 0", color: "#AABB23", fontWeight: "bold", fontSize: 16 }}>${(product.price / 100).toFixed(2)}</p>
          </div>
        )}
        <p style={{ margin: "16px 0", color: "#666", fontSize: 14 }}>Thank you for your purchase! A confirmation email has been sent to you. The vendor will be in touch shortly.</p>
        <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#166534", fontWeight: "bold" }}>✅ Payment verified and secured by Stripe</div>

        {/* ── SPAM WARNING ── */}
        <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#92400e" }}>
          ⚠️ Confirmation emails sometimes land in your <strong>spam or junk folder</strong>. Please check there if you don't see it in your inbox.
        </div>

        <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>{countdown > 0 ? `Returning to Marketplace in ${countdown}...` : "Redirecting..."}</p>
        <button onClick={() => window.location.replace("/marketplace")} style={{ width: "100%", padding: "13px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}>Continue Shopping →</button>
      </div>
    </div>
  );
}
