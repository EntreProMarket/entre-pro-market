// pages/api/send-welcome-email.js

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, name, role } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  const roleLabel = role === "organizer" ? "Organizer" : "Vendor";
  const dashboardPath = role === "organizer" ? "/organizer-dashboard" : "/vendor-dashboard";

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
        subject: "Welcome to Entre PRO Market! 🎉",
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
                    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Connecting Vendors & Organizers</p>
                  </td></tr>
                  <tr><td style="padding:36px 32px;">
                    <h2 style="color:#333;margin:0 0 16px;font-size:22px;">Welcome${name ? `, ${name}` : ""}! 👋</h2>
                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">You've successfully joined Entre PRO Market as a <strong>${roleLabel}</strong>. We're excited to have you in our community!</p>
                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px;">Start by setting up your profile so others can discover you on the marketplace.</p>
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                      <tr><td style="background:#AABB23;border-radius:8px;padding:14px 32px;text-align:center;">
                        <a href="https://app.entrepromarket.com${dashboardPath}" style="color:white;text-decoration:none;font-weight:bold;font-size:15px;">Go to My Dashboard →</a>
                      </td></tr>
                    </table>
                    <!-- SPAM WARNING -->
                    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#92400e;">
                      ⚠️ <strong>Check your spam folder</strong> if you don't receive future emails from us. Add <strong>hello@entrepromarket.com</strong> to your contacts to make sure our emails reach you.
                    </div>
                    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
                    <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">Need help? Reply to this email or visit <a href="https://app.entrepromarket.com" style="color:#701890;">app.entrepromarket.com</a></p>
                  </td></tr>
                  <tr><td style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
                    <p style="color:#aaa;font-size:12px;margin:0;">© ${new Date().getFullYear()} Entre PRO Market. All rights reserved.</p>
                    <p style="color:#aaa;font-size:12px;margin:4px 0 0;">app.entrepromarket.com</p>
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
    console.error("Welcome email error:", err);
    return res.status(500).json({ error: err.message });
  }
}
