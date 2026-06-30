// pages/api/send-downgrade-notification.js

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, name, fromTier, toTier, role } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

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
        to: [email],
        subject: "Your Entre PRO Market Plan Has Changed",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
              <tr><td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
                  <tr><td style="background:#701890;padding:28px;text-align:center;">
                    <h1 style="color:white;margin:0;font-size:22px;">Entre PRO Market</h1>
                  </td></tr>
                  <tr><td style="padding:32px 28px;">
                    <h2 style="color:#333;margin:0 0 16px;font-size:20px;">Hi${name ? ` ${name}` : ""},</h2>
                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px;">
                      Your ${role || "account"} plan has been changed from <strong>${fromTier}</strong> to <strong>${toTier}</strong> by our team.
                    </p>
                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px;">
                      If you believe this was a mistake or have questions, please reply to this email and we'll be happy to help.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin:20px auto 0;">
                      <tr><td style="background:#701890;border-radius:8px;padding:12px 28px;text-align:center;">
                        <a href="https://app.entrepromarket.com" style="color:white;text-decoration:none;font-weight:bold;font-size:14px;">Go to My Dashboard</a>
                      </td></tr>
                    </table>
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
    console.error("Downgrade notification error:", err);
    return res.status(500).json({ error: err.message });
  }
}
