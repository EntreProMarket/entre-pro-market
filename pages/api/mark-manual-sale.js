// pages/api/mark-manual-sale.js
// Vendor marks a CashApp/Venmo sale as paid with a required screenshot proof.
// The buyer gets INSTANT review access (order created as status: paid), but
// proof_status starts as "pending" until the admin approves/rejects it. If
// rejected later, review access is revoked and the review itself is deleted.

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { vendorId, productId, buyerEmail, paymentMethod, proofImageUrl } = req.body;
  if (!vendorId || !productId || !buyerEmail) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!proofImageUrl) {
    return res.status(400).json({ error: "A screenshot of the payment is required." });
  }

  try {
    const { data: product, error: productError } = await supabaseAdmin
      .from("vendor_products")
      .select("id, vendor_id, price, title")
      .eq("id", productId)
      .single();
    if (productError || !product) return res.status(404).json({ error: "Product not found" });
    if (product.vendor_id !== vendorId) return res.status(403).json({ error: "This product does not belong to you" });

    let buyerId = null;
    let page = 1;
    const perPage = 200;
    while (!buyerId) {
      const { data: usersPage, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (listError) throw listError;
      const match = usersPage.users.find(u => u.email?.toLowerCase() === buyerEmail.toLowerCase());
      if (match) { buyerId = match.id; break; }
      if (usersPage.users.length < perPage) break;
      page++;
    }

    if (!buyerId) {
      return res.status(404).json({ error: "No EntreProMarket account found with that email. The buyer must have an account to be marked as a verified purchase." });
    }

    const { data: newOrder, error: insertError } = await supabaseAdmin.from("orders").insert({
      product_id: productId,
      buyer_id: buyerId,
      vendor_id: vendorId,
      amount: product.price,
      stripe_session_id: null,
      status: "paid",
      payment_method: paymentMethod || "manual",
      proof_image_url: proofImageUrl,
      proof_status: "pending",
    }).select().single();
    if (insertError) throw insertError;

    const { data: vendorProfile } = await supabaseAdmin.from("profiles").select("business_name, handle").eq("id", vendorId).single();

    // Alert admin — non-blocking, don't fail the request if the email fails
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://app.entrepromarket.com"}/api/send-manual-sale-alert`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: newOrder.id,
        productTitle: product.title,
        vendorName: vendorProfile?.business_name || "Unknown Vendor",
        vendorHandle: vendorProfile?.handle || "",
        buyerEmail,
        amount: product.price,
        paymentMethod: paymentMethod || "manual",
        proofImageUrl,
      }),
    }).catch(() => {});

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("mark-manual-sale error:", err);
    return res.status(500).json({ error: err.message });
  }
}
