// pages/api/send-business-email.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── All business email addresses send/receive on this subdomain ──
const SEND_DOMAIN = "entrepromarket.com";
const VALID_MAILBOXES = ["noreply", "support", "events", "shop", "services"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mailbox, to, subject, body, adminId, replyToEmailId } = req.body;
  if (!mailbox || !to || !subject || !body || !adminId) {
    return res.status(400).json({ error: "Missing mailbox, to, subject, body, or adminId" });
  }
  if (!VALID_MAILBOXES.includes(mailbox)) {
    return res.status(400).json({ error: "Invalid mailbox" });
  }

  try {
    // ── Verify the caller is actually an admin before sending real email ──
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", adminId)
      .single();
    if (profileError || !profile?.is_admin) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const fromAddress = `${mailbox}@${SEND_DOMAIN}`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Entre PRO Market <${fromAddress}>`,
        to: [to],
        subject,
        text: body,
      }),
    });
    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      // Log the failed attempt too, so it shows up in Sent with an error status
      await supabaseAdmin.from("business_emails").insert([{
        direction: "outbound", mailbox, from_address: fromAddress, to_address: to,
        subject, body, status: "failed", sender_admin_id: adminId,
      }]);
      return res.status(500).json({ error: resendData?.message || "Failed to send email" });
    }

    const { error: insertError } = await supabaseAdmin.from("business_emails").insert([{
      direction: "outbound", mailbox, from_address: fromAddress, to_address: to,
      subject, body, resend_email_id: resendData.id, status: "sent", sender_admin_id: adminId,
    }]);
    if (insertError) throw insertError;

    // ── If this was a reply, mark the original inbound message as read ──
    if (replyToEmailId) {
      await supabaseAdmin.from("business_emails").update({ read: true }).eq("id", replyToEmailId);
    }

    return res.status(200).json({ success: true, id: resendData.id });
  } catch (err) {
    console.error("send-business-email error:", err);
    return res.status(500).json({ error: err.message });
  }
}
