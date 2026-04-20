// pages/api/stripe-setup.js
// Run ONCE to create all Stripe products and prices
// Visit: https://entre-pro-market.vercel.app/api/stripe-setup
// DELETE THIS FILE after running!

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    const products = [
      {
        name: "Premium Vendor",
        description: "All contact info public, higher search ranking, 20 photos + 5 videos",
        role: "vendor",
        tier: "premium",
        amount: 7500, // $75.00
        mode: "subscription",
      },
      {
        name: "Featured Vendor",
        description: "Featured carousel placement, top of search, 40 photos + 10 videos",
        role: "vendor",
        tier: "featured",
        amount: 12500, // $125.00
        mode: "subscription",
      },
      {
        name: "Basic Organizer",
        description: "Contact up to 5 vendors",
        role: "organizer",
        tier: "basic",
        amount: 3000, // $30.00
        mode: "payment", // one-time
      },
      {
        name: "Pro Organizer",
        description: "Contact up to 20 vendors per month",
        role: "organizer",
        tier: "pro",
        amount: 7500, // $75.00
        mode: "subscription",
      },
      {
        name: "Elite Organizer",
        description: "Unlimited vendor contacts, create events, save contacts",
        role: "organizer",
        tier: "elite",
        amount: 12500, // $125.00
        mode: "subscription",
      },
    ];

    const results = [];

    for (const p of products) {
      // Create product
      const product = await stripe.products.create({
        name: p.name,
        description: p.description,
        metadata: { role: p.role, tier: p.tier },
      });

      // Create price
      const priceData = {
        product: product.id,
        currency: "usd",
        unit_amount: p.amount,
        metadata: { role: p.role, tier: p.tier },
      };

      if (p.mode === "subscription") {
        priceData.recurring = { interval: "month" };
      }

      const price = await stripe.prices.create(priceData);

      results.push({
        name: p.name,
        role: p.role,
        tier: p.tier,
        mode: p.mode,
        priceId: price.id,
        amount: `$${p.amount / 100}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "✅ All Stripe products created! Copy these Price IDs into your .env file.",
      prices: results,
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
