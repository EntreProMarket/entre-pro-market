// pages/api/mark-manual-sale.js
// Lets a vendor manually record a CashApp/Venmo sale as paid, creating an
// `orders` row so the buyer becomes eligible to leave a review. Buyer is
// identified by email (looked up via the service role key, since vendors
// don't have access to auth.admin from the client).

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { vendorId, productId, buyerEmail, paymentMethod } = req.body;
  if (!vendorId || !productId || !buyerEmail) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Confirm the product belongs to this vendor (prevents marking sales on someone else's product)
    const { data: product, error: productError } = await supabaseAdmin
      .from("vendor_products")
      .select("id, vendor_id, price")
      .eq("id", productId)
      .single();
    if (productError || !product) return res.status(404).json({ error: "Product not found" });
    if (product.vendor_id !== vendorId) return res.status(403).json({ error: "This product does not belong to you" });

    // Look up the buyer by email across all auth users
    let buyerId = null;
    let page = 1;
    const perPage = 200;
    while (!buyerId) {
      const { data: usersPage, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (listError) throw listError;
      const match = usersPage.users.find(u => u.email?.toLowerCase() === buyerEmail.toLowerCase());
      if (match) { buyerId = match.id; break; }
      if (usersPage.users.length < perPage) break; // no more pages
      page++;
    }

    if (!buyerId) {
      return res.status(404).json({ error: "No EntreProMarket account found with that email. The buyer must have an account to be marked as a verified purchase." });
    }

    const { error: insertError } = await supabaseAdmin.from("orders").insert({
      product_id: productId,
      buyer_id: buyerId,
      vendor_id: vendorId,
      amount: product.price,
      stripe_session_id: null,
      status: "paid",
      payment_method: paymentMethod || "manual",
    });
    if (insertError) throw insertError;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("mark-manual-sale error:", err);
    return res.status(500).json({ error: err.message });
  }
}
