// pages/product-success.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ProductSuccess() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); router.replace("/marketplace"); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "sans-serif", backgroundColor: "#fafafa", textAlign: "center" }}>
      <img src="/logo-transparent.png" alt="EntreProMarket" style={{ width: 120, marginBottom: 24 }} />
      <div style={{ backgroundColor: "white", border: "2px solid #AABB23", borderRadius: 16, padding: "32px 24px", maxWidth: 400, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <p style={{ fontSize: 60, margin: "0 0 12px" }}>🎉</p>
        <h1 style={{ margin: "0 0 8px", color: "#AABB23", fontSize: 22 }}>Order Confirmed!</h1>
        <p style={{ margin: "0 0 20px", color: "#666", fontSize: 15 }}>Thank you for your purchase. The vendor will be in touch with you shortly.</p>
        <div style={{ backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 8, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#888B00", fontWeight: "bold" }}>
          ✅ Payment successful!
        </div>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
          {countdown > 0 ? `Redirecting to marketplace in ${countdown}...` : "Redirecting..."}
        </p>
        <button onClick={() => router.replace("/marketplace")}
          style={{ width: "100%", padding: "13px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}>
          Continue Shopping →
        </button>
      </div>
    </div>
  );
}
