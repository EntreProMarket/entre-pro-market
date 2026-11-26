// pages/api/create-checkout-session.js
import { createClient } from "@supabase/supabase-js";

// The SERVER decides what each plan means (who it is for and which tier it gives) — never the browser.
// A price that is not listed here is refused. If you add or change a plan in Stripe, add its price ID here.
const PLANS = {
  "price_1Tip3LIofgLPwGzFexWb2FId": { role: "vendor",    tier: "premium"  },
  "price_1Tip97IofgLPwGzFE3Dl0bjX": { role: "vendor",    tier: "featured" },
  "price_1TipJ9IofgLPwGzFtIXDEV5c": { role: "organizer", tier: "basic"    },
  "price_1TipLiIofgLPwGzFrg7I5pap": { role: "organizer", tier: "pro"      },
  "price_1TipMfIofgLPwGzF432mjiJB": { role: "organizer", tier: "elite"    },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { priceId, userId } = req.body || {};
  if (!priceId || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const plan = PLANS[priceId];
  if (!plan) {
    console.error("Checkout refused — unknown price:", priceId);
    return res.status(400).json({ error: "That plan is not available." });
  }

  try {
    // A vendor cannot buy an organizer plan (or the other way round)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (!profile) {
      return res.status(400).json({ error: "Account not found." });
    }
    if (profile.role && profile.role !== plan.role) {
      return res.status(400).json({ error: `You are already registered as a ${profile.role} and cannot buy ${plan.role} plans.` });
    }

    // ── Initialize Stripe inside handler so env var is always available ──
    const Stripe = require("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // The checkout mode must match the price: monthly prices are subscriptions, one-time prices are payments.
    const price = await stripe.prices.retrieve(priceId);
    const checkoutMode = price.type === "recurring" ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: checkoutMode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/upgrade-success?session_id={CHECKOUT_SESSION_ID}&role=${plan.role}&tier=${plan.tier}`,
      cancel_url: `${req.headers.origin}/${plan.role}-info`,
      metadata: { userId, role: plan.role, tier: plan.tier },
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
}
