// pages/api/send-manual-sale-alert.js
// Notifies the admin (you) whenever a vendor marks a CashApp/Venmo sale as
// paid, with a link to review the uploaded proof screenshot in the Admin
// Orders tab.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { orderId, productTitle, vendorName, vendorHandle, buyerEmail, amount, paymentMethod, proofImageUrl } = req.body;
  if (!orderId || !proofImageUrl) return res.status(400).json({ error: "Missing required fields" });

  const methodLabel = paymentMethod === "cashapp" ? "CashApp" : paymentMethod === "venmo" ? "Venmo" : "Manual";
  const priceFormatted = amount ? `$${(amount / 100).toFixed(2)}` : "—";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Entre PRO Market <hello@entrepromarket.com>",
        to: ["EntreProMarket@gmail.com"],
        subject: `⏳ Review Needed: ${methodLabel} sale — ${productTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
              <tr><td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
                  <tr><td style="background:#111;padding:20px 28px;">
                    <span style="color:white;font-weight:bold;font-size:18px;">Entre PRO Market — Proof Review Needed</span>
                  </td></tr>
                  <tr><td style="padding:28px;">
                    <h2 style="color:#AABB23;margin:0 0 16px;">⏳ New ${methodLabel} Sale — Awaiting Approval</h2>
                    <table style="width:100%;border-collapse:collapse;font-size:15px;margin-bottom:20px;">
                      <tr><td style="padding:8px 0;color:#888;width:140px;">Product</td><td style="padding:8px 0;font-weight:bold;">${productTitle}</td></tr>
                      <tr><td style="padding:8px 0;color:#888;">Vendor</td><td style="padding:8px 0;">${vendorName}${vendorHandle ? ` (@${vendorHandle})` : ""}</td></tr>
                      <tr><td style="padding:8px 0;color:#888;">Buyer Email</td><td style="padding:8px 0;">${buyerEmail}</td></tr>
                      <tr><td style="padding:8px 0;color:#888;">Amount</td><td style="padding:8px 0;font-weight:bold;color:#701890;">${priceFormatted}</td></tr>
                      <tr><td style="padding:8px 0;color:#888;">Method</td><td style="padding:8px 0;">${methodLabel}</td></tr>
                    </table>
                    <p style="color:#555;font-size:14px;margin:0 0 12px;">Proof screenshot:</p>
                    <img src="${proofImageUrl}" alt="Payment proof" style="max-width:100%;border-radius:8px;border:1px solid #eee;margin-bottom:20px;" />
                    <p style="color:#888;font-size:13px;margin:0 0 20px;">Note: the buyer already has review access — approving or rejecting only confirms or revokes it.</p>
                    <a href="https://app.entrepromarket.com/admin?tab=Orders" style="display:inline-block;padding:12px 24px;background:#701890;color:white;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Review in Admin →</a>
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
    console.error("send-manual-sale-alert error:", err);
    return res.status(500).json({ error: err.message });
  }
}
