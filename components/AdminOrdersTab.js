// components/AdminOrdersTab.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const inputStyle = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };

export default function AdminOrdersTab({ adminId }) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersStatusFilter, setOrdersStatusFilter] = useState("pending");
  const [ordersSearch, setOrdersSearch] = useState("");
  const [reviewingOrderId, setReviewingOrderId] = useState(null);
  const [orderFullscreenImage, setOrderFullscreenImage] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoadingOrders(true);
    const { data: ordersData } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    const list = ordersData || [];
    const productIds = [...new Set(list.map(o => o.product_id).filter(Boolean))];
    const peopleIds = [...new Set([...list.map(o => o.buyer_id), ...list.map(o => o.vendor_id)].filter(Boolean))];
    const { data: productsData } = productIds.length ? await supabase.from("vendor_products").select("id, title").in("id", productIds) : { data: [] };
    const { data: profilesData } = peopleIds.length ? await supabase.from("profiles").select("id, business_name, organizer_name, handle").in("id", peopleIds) : { data: [] };
    const productMap = {}; (productsData || []).forEach(p => { productMap[p.id] = p; });
    const profileMap = {}; (profilesData || []).forEach(p => { profileMap[p.id] = p; });
    const merged = list.map(o => ({
      ...o,
      product_title: productMap[o.product_id]?.title || "Unknown Product",
      buyer_name: profileMap[o.buyer_id]?.business_name || profileMap[o.buyer_id]?.organizer_name || profileMap[o.buyer_id]?.handle || "Unknown Buyer",
      vendor_name: profileMap[o.vendor_id]?.business_name || profileMap[o.vendor_id]?.organizer_name || profileMap[o.vendor_id]?.handle || "Unknown Vendor",
    }));
    setOrders(merged);
    setLoadingOrders(false);
  };

  const reviewOrder = async (orderId, decision) => {
    setReviewingOrderId(orderId);
    try {
      const res = await fetch("/api/review-manual-sale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, decision, adminId }) });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, proof_status: decision } : o));
        setMessage(decision === "approved" ? "✅ Sale approved" : "✅ Sale rejected — review removed");
      } else {
        setMessage("❌ Error: " + data.error);
      }
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
    setReviewingOrderId(null);
  };

  const filtered = orders.filter(o => {
    if (ordersStatusFilter !== "all" && (o.proof_status || "approved") !== ordersStatusFilter) return false;
    if (!ordersSearch.trim()) return true;
    const q = ordersSearch.toLowerCase();
    return [o.product_title, o.buyer_name, o.vendor_name].some(f => f && f.toLowerCase().includes(q));
  });

  return (
    <div>
      <h2 style={{ marginBottom: 6 }}>💳 Orders</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>All product orders — Stripe sales are auto-approved. CashApp/Venmo sales need proof review.</p>

      {message && (
        <div style={{ marginBottom: 16, padding: "12px 16px", backgroundColor: message.startsWith("✅") ? "#f0fdf4" : "#fef2f2", border: `1px solid ${message.startsWith("✅") ? "#86efac" : "#fca5a5"}`, borderRadius: 8, color: message.startsWith("✅") ? "#166534" : "#991b1b", fontWeight: "bold" }}>
          {message}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["pending", "approved", "rejected", "all"].map(f => (
          <button key={f} onClick={() => setOrdersStatusFilter(f)}
            style={{ padding: "7px 16px", backgroundColor: ordersStatusFilter === f ? "#701890" : "white", color: ordersStatusFilter === f ? "white" : "#666", border: "1px solid #701890", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13, textTransform: "capitalize" }}>
            {f}
          </button>
        ))}
      </div>

      <input value={ordersSearch} onChange={e => setOrdersSearch(e.target.value)} placeholder="🔍 Search by product, buyer, or vendor..." style={{ ...inputStyle, marginBottom: 20 }} />

      {loadingOrders ? <p style={{ color: "#888" }}>Loading orders...</p> : filtered.length === 0 ? (
        <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 30, textAlign: "center", color: "#888" }}><p>No orders found.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(o => (
            <div key={o.id} style={{ backgroundColor: "white", border: `1px solid ${o.proof_status === "pending" ? "#f0c040" : o.proof_status === "rejected" ? "#fca5a5" : "#eee"}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{o.product_title}</strong>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>Buyer: {o.buyer_name} · Vendor: {o.vendor_name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{new Date(o.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#701890", fontSize: 16 }}>${((o.amount || 0) / 100).toFixed(2)}</p>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, backgroundColor: o.payment_method === "stripe" ? "#f3e8ff" : o.payment_method === "cashapp" ? "#dcfce7" : "#dbeafe", color: o.payment_method === "stripe" ? "#701890" : o.payment_method === "cashapp" ? "#166534" : "#1e40af", fontWeight: "bold", textTransform: "uppercase" }}>{o.payment_method || "manual"}</span>
                </div>
              </div>

              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: "bold", backgroundColor: o.proof_status === "pending" ? "#fffbeb" : o.proof_status === "rejected" ? "#fef2f2" : "#f0fdf4", color: o.proof_status === "pending" ? "#92400e" : o.proof_status === "rejected" ? "#991b1b" : "#166534" }}>
                {(o.proof_status || "approved").toUpperCase()}
              </span>

              {o.proof_image_url && (
                <div style={{ marginTop: 12 }}>
                  <img src={o.proof_image_url} alt="proof" onClick={() => setOrderFullscreenImage(o.proof_image_url)} style={{ maxWidth: 220, borderRadius: 8, border: "1px solid #eee", cursor: "zoom-in", display: "block" }} />
                </div>
              )}

              {o.payment_method !== "stripe" && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => reviewOrder(o.id, "approved")} disabled={reviewingOrderId === o.id || o.proof_status === "approved"} style={{ padding: "7px 16px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12, opacity: o.proof_status === "approved" ? 0.5 : 1 }}>✅ Approve</button>
                  <button onClick={() => reviewOrder(o.id, "rejected")} disabled={reviewingOrderId === o.id || o.proof_status === "rejected"} style={{ padding: "7px 16px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12, opacity: o.proof_status === "rejected" ? 0.5 : 1 }}>❌ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {orderFullscreenImage && (
        <div onClick={() => setOrderFullscreenImage(null)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, cursor: "zoom-out" }}>
          <img src={orderFullscreenImage} style={{ maxWidth: "95%", maxHeight: "95vh", borderRadius: 8, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}
