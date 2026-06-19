// pages/api/webhook.js
// Handles Stripe webhook events and updates Supabase
// Handles BOTH tier upgrades AND product purchases

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// ── SECURITY FIX: organizers have no free tier.
// When their subscription lapses, account_type goes to null (locked out)
// rather than "basic" (which is a paid tier).
// Vendors correctly fall back to "free" since free vendor is a real tier.
function getDowngradedAccountType(role) {
  return role === "organizer" ? null : "free";
}

async function getProfileByCustomerId(customerId) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, role, account_type")
    .eq("stripe_customer_id", customerId)
    .single();
  return data;
}

async function saveCustomerId(userId, customerId) {
  if (!customerId) return;
  await supabaseAdmin
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", userId);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const rawBody = await getRawBody(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  // ── CHECKOUT COMPLETED ──
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata || {};

    // ── PRODUCT PURCHASE (has productId in metadata) ──
    if (metadata.productId) {
      console.log(`✅ Product purchase: ${metadata.productId} by buyer ${metadata.buyerId}`);
      try {
        if (metadata.productId && metadata.buyerId && metadata.vendorId) {
          await supabaseAdmin.from("orders").insert({
            product_id: metadata.productId,
            buyer_id: metadata.buyerId,
            vendor_id: metadata.vendorId,
            amount: session.amount_total,
            stripe_session_id: session.id,
            status: "paid",
          });
        }
      } catch (_) {
        // orders table may not exist yet — safe to ignore
      }
      return res.status(200).json({ received: true });
    }

    // ── TIER UPGRADE (has userId, role, tier in metadata) ──
    if (metadata.userId && metadata.role && metadata.tier) {
      const { userId, role, tier } = metadata;

      const isSubscription = session.mode === "subscription";
      const expiresAt = isSubscription
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      if (session.customer) {
        await saveCustomerId(userId, session.customer);
      }

      try {
        const updateData = {
          role,
          account_type: tier,
          subscription_expires_at: expiresAt,
        };

        // Only reset contacts if those columns exist in your profiles table.
        // If they don't, remove these two lines to avoid update errors.
        updateData.contacts_used_this_month = 0;
        updateData.contacts_reset_date = new Date().toISOString().split("T")[0];

        const { error } = await supabaseAdmin
          .from("profiles")
          .update(updateData)
          .eq("id", userId);

        if (error) {
          console.error("Supabase update error on tier upgrade:", error);
          return res.status(500).json({ error: "Failed to update profile" });
        }

        console.log(`✅ Upgraded ${userId} to ${role} ${tier}`);
      } catch (err) {
        console.error("Unexpected error on tier upgrade:", err);
        return res.status(500).json({ error: "Unexpected error" });
      }

      return res.status(200).json({ received: true });
    }

    // ── UNKNOWN SESSION TYPE ──
    console.log("checkout.session.completed with unrecognized metadata — ignoring");
    return res.status(200).json({ received: true });
  }

  // ── SUBSCRIPTION CANCELLED ──
  if (event.type === "customer.subscription.deleted") {
    try {
      const profile = await getProfileByCustomerId(event.data.object.customer);
      if (profile) {
        const downgradedType = getDowngradedAccountType(profile.role);
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            account_type: downgradedType,
            subscription_expires_at: null,
          })
          .eq("id", profile.id);

        if (error) {
          console.error("Supabase error on subscription cancellation:", error);
        } else {
          console.log(`⬇️ Subscription cancelled — downgraded ${profile.id} (${profile.role}) to account_type: ${downgradedType}`);
        }
      } else {
        console.warn("customer.subscription.deleted: no profile found for customer", event.data.object.customer);
      }
    } catch (err) {
      console.error("Unexpected error on subscription cancellation:", err);
    }
  }

  // ── PAYMENT FAILED ──
  if (event.type === "invoice.payment_failed") {
    try {
      const invoice = event.data.object;
      const profile = await getProfileByCustomerId(invoice.customer);
      if (profile) {
        const attemptCount = invoice.attempt_count || 1;
        if (attemptCount >= 3) {
          const downgradedType = getDowngradedAccountType(profile.role);
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              account_type: downgradedType,
              subscription_expires_at: null,
            })
            .eq("id", profile.id);

          if (error) {
            console.error("Supabase error on payment failure downgrade:", error);
          } else {
            console.log(`⬇️ Payment failed ${attemptCount}x — downgraded ${profile.id} (${profile.role}) to account_type: ${downgradedType}`);
          }
        }
      } else {
        console.warn("invoice.payment_failed: no profile found for customer", invoice.customer);
      }
    } catch (err) {
      console.error("Unexpected error on payment failure:", err);
    }
  }

  // ── SUBSCRIPTION RENEWED ──
  if (event.type === "invoice.payment_succeeded") {
    try {
      const invoice = event.data.object;
      if (invoice.billing_reason === "subscription_cycle") {
        const profile = await getProfileByCustomerId(invoice.customer);
        if (profile) {
          const updateData = {
            subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };

          // Only reset contacts if those columns exist in your profiles table.
          updateData.contacts_used_this_month = 0;
          updateData.contacts_reset_date = new Date().toISOString().split("T")[0];

          const { error } = await supabaseAdmin
            .from("profiles")
            .update(updateData)
            .eq("id", profile.id);

          if (error) {
            console.error("Supabase error on subscription renewal:", error);
          } else {
            console.log(`🔄 Subscription renewed for ${profile.id}`);
          }
        } else {
          console.warn("invoice.payment_succeeded: no profile found for customer", invoice.customer);
        }
      }
    } catch (err) {
      console.error("Unexpected error on subscription renewal:", err);
    }
  }

  res.status(200).json({ received: true });
}
