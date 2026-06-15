// pages/api/send-upgrade-confirmation.js

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, name, role, tier } = req.body;
  if (!email || !role || !tier) return res.status(400).json({ error: "Missing required fields" });

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const dashboardPath = role === "organizer" ? "/organizer-dashboard" : "/vendor-dashboard";

  const tierBenefits = {
    premium: ["Up to 20 portfolio photos", "Up to 5 video links", "Direct messaging with organizers", "Priority marketplace listing"],
    featured: ["Up to 40 portfolio photos", "Up to 10 video links", "Featured placement in marketplace", "Direct messaging with organizers", "Top search visibility"],
    basic: ["Up to 10 portfolio photos", "5 contact saves per month", "Event listing access", "Marketplace visibility"],
    pro: ["Up to 20 portfolio photos", "20 contact saves per month", "Priority event listings", "Direct vendor messaging"],
    elite: ["Up to 40 portfolio photos", "Unlimited contact saves", "Featured event listings", "Videos support", "Top search visibility"],
  };

  const benefits = tierBenefits[tier] || [];

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
        subject: `You're now on the ${tierLabel} plan! 🚀`,
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
                    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Plan Upgrade Confirmed</p>
                  </td></tr>
                  <tr><td style="padding:36px 32px;">
                    <div style="text-align:center;margin-bottom:24px;">
                      <span style="font-size:48px;">🚀</span>
                      <h2 style="color:#701890;margin:8px 0 4px;font-size:22px;">Welcome to ${tierLabel}!</h2>
                      <p style="color:#888;margin:0;font-size:14px;">${roleLabel} ${tierLabel} Plan</p>
                    </div>
                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">Hi${name ? ` ${name}` : ""}! Your upgrade to the <strong>${tierLabel} plan</strong> is now active. Here's what you unlocked:</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3e8ff;border-radius:10px;padding:20px;margin-bottom:24px;">
                      <tr><td>
                        <p style="margin:0 0 12px;font-weight:bold;font-size:15px;color:#701890;">✨ Your ${tierLabel} Benefits:</p>
                        ${benefits.map(b => `<p style="margin:0 0 8px;font-size:14px;color:#444;">✅ ${b}</p>`).join("")}
                      </td></tr>
                    </table>
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                      <tr><td style="background:#AABB23;border-radius:8px;padding:14px 32px;text-align:center;">
                        <a href="https://app.entrepromarket.com${dashboardPath}" style="color:white;text-decoration:none;font-weight:bold;font-size:15px;">Go to My Dashboard →</a>
                      </td></tr>
                    </table>
                    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
                    <p style="color:#888;font-size:13px;margin:0;">Your subscription renews monthly. To manage your plan, visit your dashboard settings. Questions? Reply to this email.</p>
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
    console.error("Upgrade confirmation email error:", err);
    return res.status(500).json({ error: err.message });
  }
}
