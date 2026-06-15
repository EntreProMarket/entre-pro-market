// pages/api/verify-product-payment.js

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return res.status(200).json({ success: false, status: session.payment_status });
    }

    const { productId, buyerId, vendorId } = session.metadata;

    const { data: product } = await supabaseAdmin
      .from("vendor_products")
      .select("title, price, image_url")
      .eq("id", productId)
      .single();

    const { data: buyer } = await supabaseAdmin
      .from("profiles")
      .select("email, business_name")
      .eq("id", buyerId)
      .single();

    const { data: vendor } = await supabaseAdmin
      .from("profiles")
      .select("email, business_name, handle")
      .eq("id", vendorId)
      .single();

    const buyerEmail = buyer?.email || session.customer_details?.email;
    const buyerName = buyer?.business_name || session.customer_details?.name;

    try {
      await supabaseAdmin.from("orders").insert({
        product_id: productId,
        buyer_id: buyerId,
        vendor_id: vendorId,
        amount: session.amount_total,
        stripe_session_id: sessionId,
        status: "paid",
      });
    } catch (_) {
      // orders table may not exist yet
    }

    return res.status(200).json({
      success: true,
      product: product || null,
      amount: session.amount_total,
      buyerEmail,
      buyerName,
      vendorEmail: vendor?.email || null,
      vendorName: vendor?.business_name || null,
      vendorHandle: vendor?.handle || null,
    });
  } catch (err) {
    console.error("verify-product-payment error:", err);
    return res.status(500).json({ error: err.message });
  }
}
