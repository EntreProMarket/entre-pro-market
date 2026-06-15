// pages/api/send-order-confirmation.js

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { buyerEmail, buyerName, productTitle, productImage, amount, vendorName, vendorHandle } = req.body;
  if (!buyerEmail || !productTitle) return res.status(400).json({ error: "Missing required fields" });

  const priceFormatted = amount ? `$${(amount / 100).toFixed(2)}` : "";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Entre PRO Market Orders <orders@entrepromarket.com>",
        reply_to: "EntreProMarket@gmail.com",
        to: [buyerEmail],
        subject: `Order Confirmed: ${productTitle} ✅`,
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
                    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Order Confirmation</p>
                  </td></tr>
                  <tr><td style="padding:36px 32px;">
                    <div style="text-align:center;margin-bottom:24px;">
                      <span style="font-size:48px;">🎉</span>
                      <h2 style="color:#AABB23;margin:8px 0 0;font-size:22px;">Order Confirmed!</h2>
                    </div>
                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">Hi${buyerName ? ` ${buyerName}` : ""}! Your payment was successful and your order has been placed.</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;padding:20px;margin-bottom:24px;">
                      <tr>
                        ${productImage ? `<td width="80" style="padding-right:16px;vertical-align:top;"><img src="${productImage}" width="80" height="80" style="border-radius:8px;object-fit:cover;" /></td>` : ""}
                        <td style="vertical-align:top;">
                          <p style="margin:0 0 6px;font-weight:bold;font-size:16px;color:#333;">${productTitle}</p>
                          ${vendorName ? `<p style="margin:0 0 6px;font-size:13px;color:#888;">Sold by ${vendorName}</p>` : ""}
                          ${priceFormatted ? `<p style="margin:0;font-size:20px;font-weight:bold;color:#701890;">${priceFormatted}</p>` : ""}
                        </td>
                      </tr>
                    </table>
                    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
                      <p style="margin:0;color:#166534;font-size:14px;font-weight:bold;">✅ Payment verified and secured by Stripe</p>
                    </div>
                    <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">The vendor will be in touch with you shortly to arrange delivery or fulfillment.</p>
                    ${vendorHandle ? `
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                      <tr><td style="background:#701890;border-radius:8px;padding:12px 28px;text-align:center;">
                        <a href="https://app.entrepromarket.com/vendor/${vendorHandle}" style="color:white;text-decoration:none;font-weight:bold;font-size:14px;">View Vendor Profile →</a>
                      </td></tr>
                    </table>` : ""}
                    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
                    <p style="color:#888;font-size:13px;margin:0;">Questions about your order? Reply to this email and we'll help.</p>
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
    console.error("Order confirmation email error:", err);
    return res.status(500).json({ error: err.message });
  }
}
