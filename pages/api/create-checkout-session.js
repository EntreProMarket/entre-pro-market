// pages/api/create-checkout-session.js

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { priceId, userId, role, tier } = req.body;
  if (!priceId || !userId || !role || !tier) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // ── Initialize Stripe inside handler so env var is always available ──
    const Stripe = require("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // The checkout mode must match the price: monthly prices are subscriptions, one-time prices are payments.
    // We read it from Stripe itself instead of trusting the page, so the two can never disagree.
    const price = await stripe.prices.retrieve(priceId);
    const checkoutMode = price.type === "recurring" ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: checkoutMode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/upgrade-success?session_id={CHECKOUT_SESSION_ID}&role=${role}&tier=${tier}`,
      cancel_url: `${req.headers.origin}/${role}-info`,
      metadata: { userId, role, tier },
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
}
