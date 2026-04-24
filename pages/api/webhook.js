// pages/api/webhook.js
// Handles Stripe webhook events and updates Supabase

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Use service role to bypass RLS for webhook updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false, // Required for Stripe webhook signature verification
  },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, role, tier } = session.metadata;

    if (!userId || !role || !tier) {
      console.error("Missing metadata in session");
      return res.status(400).json({ error: "Missing metadata" });
    }

    // Calculate subscription expiry
    const isSubscription = session.mode === "subscription";
    const expiresAt = isSubscription
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      : null; // One-time payments don't expire

    // Update user profile in Supabase
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        role: role,           // ✅ Set role from metadata
        account_type: tier,
        subscription_expires_at: expiresAt,
        contacts_used_this_month: 0,
        contacts_reset_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", userId);

    if (error) {
      console.error("Supabase update error:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    console.log(`✅ Updated ${userId} to ${role} ${tier}`);
  }

  // Handle subscription cancellation / expiry
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    // Find user by stripe customer ID and downgrade them
    const customerId = subscription.customer;

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("stripe_customer_id", customerId);

    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      const defaultTier = profile.role === "vendor" ? "free" : "basic";

      await supabaseAdmin
        .from("profiles")
        .update({
          account_type: defaultTier,
          subscription_expires_at: null,
        })
        .eq("id", profile.id);

      console.log(`⬇️ Downgraded ${profile.id} to ${defaultTier}`);
    }
  }

  res.status(200).json({ received: true });
}
