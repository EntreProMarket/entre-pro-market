// pages/api/send-payment-received.js

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { vendorEmail, vendorName, productTitle, amount, buyerName, buyerEmail } = req.body;
  if (!vendorEmail || !productTitle) return res.status(400).json({ error: "Missing required fields" });

  const priceFormatted = amount ? `$${(amount / 100).toFixed(2)}` : "";
  const netAmount = amount ? `$${((amount * 0.971 - 30) / 100).toFixed(2)}` : "";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Entre PRO Market <hello@entrepromarket.com>",
        reply_to: "EntreProMarket@gmail.com",
        to: [vendorEmail],
        subject: `💰 You made a sale! ${productTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
              <tr><td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
                  <tr><td style="background:#701890;padding:32px;text-align:center;">
                    <h1 style="color:white;margin:0;font-size:26px;font-weight:bold;">Entre PRO Market</h1>
                    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Payment Received</p>
                  </td></tr>
                  <tr><td style="padding:36px 32px;">
                    <div style="text-align:center;margin-bottom:24px;">
                      <span style="font-size:48px;">💰</span>
                      <h2 style="color:#AABB23;margin:8px 0 0;font-size:22px;">You made a sale!</h2>
                    </div>
                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">Hi${vendorName ? ` ${vendorName}` : ""}! Great news — someone just purchased your product on Entre PRO Market.</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9ffe8;border:1px solid #AABB23;border-radius:10px;padding:20px;margin-bottom:24px;">
                      <tr><td>
                        <p style="margin:0 0 10px;font-weight:bold;font-size:16px;color:#333;">📦 ${productTitle}</p>
                        ${priceFormatted ? `<p style="margin:0 0 6px;font-size:15px;color:#555;">Sale price: <strong style="color:#701890;">${priceFormatted}</strong></p>` : ""}
                        ${netAmount ? `<p style="margin:0 0 6px;font-size:13px;color:#888;">Est. payout after Stripe fees: <strong>${netAmount}</strong></p>` : ""}
                        ${buyerName ? `<p style="margin:0 0 4px;font-size:14px;color:#555;">Buyer: <strong>${buyerName}</strong></p>` : ""}
                        ${buyerEmail ? `<p style="margin:0;font-size:13px;color:#888;">${buyerEmail}</p>` : ""}
                      </td></tr>
                    </table>
                    <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">Please reach out to your buyer to arrange delivery or fulfillment as soon as possible.</p>
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                      <tr><td style="background:#701890;border-radius:8px;padding:12px 28px;text-align:center;">
                        <a href="https://app.entrepromarket.com/vendor-dashboard" style="color:white;text-decoration:none;font-weight:bold;font-size:14px;">Go to Dashboard →</a>
                      </td></tr>
                    </table>
                    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
                    <p style="color:#888;font-size:13px;margin:0;">Your payout will be processed by Stripe on their standard schedule. Questions? Reply to this email.</p>
                  </td></tr>
                  <tr><td style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
                    <p style="color:#aaa;font-size:12px;margin:0;">© ${new Date().getFullYear()} Entre PRO Market. All rights reserved.</p>
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
    if (!response.ok) throw new Error(data.message || "Failed to send email");
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Payment received email error:", err);
    return res.status(500).json({ error: err.message });
  }
}
