// pages/api/resend-inbound-webhook.js
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VALID_MAILBOXES = ["noreply", "support", "events", "shop", "services"];

// ── Next.js parses JSON bodies by default, which breaks signature verification
// (the raw, unmodified request body is required). This disables that so we can
// read the exact raw bytes Resend actually sent. ──
export const config = {
  api: { bodyParser: false },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

// ── Verifies Resend's Svix-based webhook signature using only Node's built-in
// crypto module (no extra npm dependency needed). ──
function verifySignature(rawBody, headers, secret) {
  const svixId = headers["svix-id"];
  const svixTimestamp = headers["svix-timestamp"];
  const svixSignature = headers["svix-signature"];
  if (!svixId || !svixTimestamp || !svixSignature || !secret) return false;

  // Reject anything older than 5 minutes to prevent replay attacks
  const timestampSeconds = parseInt(svixTimestamp, 10);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > 300) return false;

  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const secretBytes = Buffer.from(secret.replace("whsec_", ""), "base64");
  const expectedSignature = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");

  const receivedSignatures = svixSignature.split(" ").map((s) => s.split(",")[1]);
  return receivedSignatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const rawBody = await readRawBody(req);

  const verified = verifySignature(rawBody, req.headers, process.env.RESEND_WEBHOOK_SECRET);
  if (!verified) {
    console.error("resend-inbound-webhook: signature verification failed");
    return res.status(401).json({ error: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (event.type !== "email.received") {
    // Acknowledge other event types (sent/delivered/bounced etc.) without processing
    return res.status(200).json({ received: true });
  }

  try {
    const emailId = event.data.email_id;

    // Webhook only carries metadata — fetch the actual body/content separately
    const detailRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    const detail = await detailRes.json();
    if (!detailRes.ok) throw new Error(detail?.message || "Failed to fetch received email content");

    const toAddress = Array.isArray(detail.to) ? detail.to[0] : detail.to;
    const localPart = (toAddress || "").split("@")[0].toLowerCase();
    const mailbox = VALID_MAILBOXES.includes(localPart) ? localPart : "support";

    const { error: insertError } = await supabaseAdmin.from("business_emails").insert([{
      direction: "inbound",
      mailbox,
      from_address: detail.from,
      to_address: toAddress,
      subject: detail.subject || "(no subject)",
      body: detail.text || detail.html || "(no content)",
      resend_email_id: emailId,
      status: "received",
      read: false,
    }]);
    if (insertError) throw insertError;

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("resend-inbound-webhook processing error:", err);
    // Still return 200 so Resend doesn't endlessly retry a permanently-failing payload;
    // the error is logged for us to investigate.
    return res.status(200).json({ received: true, error: err.message });
  }
}
