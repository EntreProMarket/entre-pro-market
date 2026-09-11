// pages/api/review-manual-sale.js
// Admin approves or rejects a manually-marked CashApp/Venmo sale.
// Approve: just marks it confirmed.
// Reject: revokes review eligibility AND deletes the buyer's existing review
// (if any) on that product, then emails the vendor explaining the decision.

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { orderId, decision, adminId } = req.body;
  if (!orderId || !["approved", "rejected"].includes(decision)) {
    return res.status(400).json({ error: "Missing orderId or invalid decision" });
  }

  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*, product:product_id(title, vendor_id)")
      .eq("id", orderId)
      .single();
    if (orderError || !order) return res.status(404).json({ error: "Order not found" });

    const { error: updateError } = await supabaseAdmin.from("orders").update({
      proof_status: decision,
      proof_reviewed_at: new Date().toISOString(),
      proof_reviewed_by: adminId || null,
    }).eq("id", orderId);
    if (updateError) throw updateError;

    if (decision === "rejected") {
      await supabaseAdmin.from("product_reviews").delete().eq("product_id", order.product_id).eq("user_id", order.buyer_id);
    }

    // Notify the vendor of the decision
    const vendorId = order.vendor_id || order.product?.vendor_id;
    let vendorEmail = null;
    try {
      const { data: vendorAuth } = await supabaseAdmin.auth.admin.getUserById(vendorId);
      vendorEmail = vendorAuth?.user?.email || null;
    } catch (_) {}

    if (vendorEmail) {
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://app.entrepromarket.com"}/api/send-proof-decision`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorEmail,
          productTitle: order.product?.title || "your product",
          decision,
        }),
      }).catch(() => {});
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("review-manual-sale error:", err);
    return res.status(500).json({ error: err.message });
  }
}
