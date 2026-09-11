// pages/api/send-proof-decision.js
// Tells the vendor whether their manually-marked sale's proof screenshot was
// approved or rejected.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { vendorEmail, productTitle, decision } = req.body;
  if (!vendorEmail || !decision) return res.status(400).json({ error: "Missing required fields" });

  const approved = decision === "approved";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Entre PRO Market <hello@entrepromarket.com>",
        to: [vendorEmail],
        subject: approved ? `✅ Sale Confirmed — ${productTitle}` : `⚠️ Sale Proof Rejected — ${productTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
              <tr><td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
                  <tr><td style="background:${approved ? "#AABB23" : "#cc0000"};padding:24px 28px;text-align:center;">
                    <span style="color:white;font-weight:bold;font-size:20px;">${approved ? "✅ Sale Confirmed" : "⚠️ Proof Rejected"}</span>
                  </td></tr>
                  <tr><td style="padding:28px;">
                    ${approved ? `
                      <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 16px;">Your CashApp/Venmo sale for <strong>${productTitle}</strong> has been reviewed and confirmed. The buyer's review will remain active.</p>
                    ` : `
                      <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 16px;">Your marked sale for <strong>${productTitle}</strong> could not be verified from the screenshot provided, so it has been rejected.</p>
                      <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 16px;">Any review tied to this sale has been removed. If you believe this was a mistake, please contact support with clearer proof of payment.</p>
                    `}
                    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
                    <p style="color:#888;font-size:13px;margin:0;">Questions? Reply to this email.</p>
                  </td></tr>
                  <tr><td style="background:#f9f9f9;padding:16px 28px;text-align:center;border-top:1px solid #eee;">
                    <p style="color:#aaa;font-size:12px;margin:0;">© ${new Date().getFullYear()} Entre PRO Market</p>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to send");
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("send-proof-decision error:", err);
    return res.status(500).json({ error: err.message });
  }
}
