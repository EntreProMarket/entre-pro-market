// pages/api/admin-downgrade.js

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId, newTier, reason, adminId } = req.body;
  if (!userId || !newTier) return res.status(400).json({ error: "Missing userId or newTier" });

  try {
    // Get current profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, role, account_type, stripe_customer_id, business_name, organizer_name, handle")
      .eq("id", userId)
      .single();

    if (!profile) return res.status(404).json({ error: "User not found" });

    // Cancel active Stripe subscriptions if downgrading from a paid tier
    const paidTiers = ["premium", "featured", "pro", "elite"];
    const wasPaid = paidTiers.includes(profile.account_type);
    const isDowngrade = wasPaid && !paidTiers.includes(newTier);

    let stripeCancelled = false;
    let stripeError = null;

    if (isDowngrade && profile.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: "active",
          limit: 10,
        });
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
        stripeCancelled = subscriptions.data.length > 0;
      } catch (err) {
        stripeError = err.message;
        console.error("Stripe cancellation error:", err.message);
      }
    }

    // Update profile tier in Supabase
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        account_type: newTier,
        subscription_expires_at: null,
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Log the downgrade
    try {
      await supabaseAdmin.from("admin_actions").insert({
        admin_id: adminId || null,
        target_user_id: userId,
        action: "manual_tier_change",
        details: JSON.stringify({
          from: profile.account_type,
          to: newTier,
          reason: reason || "No reason provided",
          stripe_cancelled: stripeCancelled,
          stripe_error: stripeError,
        }),
      });
    } catch (_) {
      // admin_actions table may not exist yet — non-blocking
    }

    return res.status(200).json({
      success: true,
      stripeCancelled,
      stripeError,
      previousTier: profile.account_type,
      newTier,
    });
  } catch (err) {
    console.error("admin-downgrade error:", err);
    return res.status(500).json({ error: err.message });
  }
}
