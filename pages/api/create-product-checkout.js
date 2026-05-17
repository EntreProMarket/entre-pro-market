// pages/api/create-product-checkout.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { productId, userId } = req.body;

  if (!productId || !userId) {
    return res.status(400).json({ error: "Missing productId or userId" });
  }

  try {
    // Fetch product from Supabase
    const { createClient } = require("@supabase/supabase-js");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: product } = await supabaseAdmin
      .from("vendor_products")
      .select("*")
      .eq("id", productId)
      .single();

    if (!product || !product.is_active) {
      return res.status(404).json({ error: "Product not found" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",                    // One-time payment for products
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: product.title,
            description: product.description || "",
            images: product.image_url ? [product.image_url] : [],
          },
          unit_amount: product.price,
        },
        quantity: 1,
      }],
      success_url: `${req.headers.origin}/product-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `\( {req.headers.origin}/vendor/ \){product.vendor_id}`,
      metadata: {
        productId: product.id,
        buyerId: userId,
        vendorId: product.vendor_id,
      },
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: error.message });
  }
}
