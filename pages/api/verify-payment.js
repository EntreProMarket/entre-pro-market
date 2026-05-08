// pages/api/verify-payment.js
// Called by upgrade-success.js to immediately confirm payment and update the user's tier
// This makes upgrades instant without depending on webhook timing

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    // Retrieve the session from Stripe to verify payment
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return res.status(200).json({ success: false, status: session.payment_status });
    }

    const { userId, role, tier } = session.metadata;

    if (!userId || !role || !tier) {
      return res.status(400).json({ error: "Missing metadata in session" });
    }

    // Calculate expiry for subscriptions
    const isSubscription = session.mode === "subscription";
    const expiresAt = isSubscription
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Immediately update the user's profile
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        role,
        account_type: tier,
        subscription_expires_at: expiresAt,
        contacts_used_this_month: 0,
        contacts_reset_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", userId);

    if (error) {
      console.error("Supabase update error:", error);
      return res.status(500).json({ error: "Failed to update profile: " + error.message });
    }

    console.log(`✅ verify-payment: Updated ${userId} to ${role} ${tier}`);
    return res.status(200).json({ success: true, role, tier });

  } catch (err) {
    console.error("verify-payment error:", err);
    return res.status(500).json({ error: err.message });
  }
}
