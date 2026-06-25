// pages/api/send-owner-notification.js

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { type, userEmail, userName, role, tier, productTitle, amount } = req.body;
  if (!type) return res.status(400).json({ error: "Missing type" });

  const isUpgrade = type === "upgrade";
  const isPurchase = type === "purchase";

  const subject = isUpgrade
    ? `New Upgrade: ${userName || userEmail} → ${tier} ${role}`
    : `New Sale: ${productTitle} — $${amount ? (amount / 100).toFixed(2) : "?"}`;

  const bodyHtml = isUpgrade ? `
    <h2 style="color:#701890;margin:0 0 16px;">New Plan Upgrade 🚀</h2>
    <table style="width:100%;border-collapse:collapse;font-size:15px;">
      <tr><td style="padding:8px 0;color:#888;width:140px;">User</td><td style="padding:8px 0;font-weight:bold;">${userName || "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;">${userEmail || "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Role</td><td style="padding:8px 0;text-transform:capitalize;">${role || "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">New Tier</td><td style="padding:8px 0;font-weight:bold;color:#701890;text-transform:capitalize;">${tier || "—"}</td></tr>
    </table>
  ` : `
    <h2 style="color:#AABB23;margin:0 0 16px;">New Product Sale 💰</h2>
    <table style="width:100%;border-collapse:collapse;font-size:15px;">
      <tr><td style="padding:8px 0;color:#888;width:140px;">Product</td><td style="padding:8px 0;font-weight:bold;">${productTitle || "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Buyer</td><td style="padding:8px 0;">${userName || "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Buyer Email</td><td style="padding:8px 0;">${userEmail || "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Amount</td><td style="padding:8px 0;font-weight:bold;color:#701890;">$${amount ? (amount / 100).toFixed(2) : "—"}</td></tr>
    </table>
  `;

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
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
              <tr><td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
                  <tr><td style="background:#111;padding:20px 28px;display:flex;align-items:center;">
                    <span style="color:white;font-weight:bold;font-size:18px;">Entre PRO Market — Owner Alert</span>
                  </td></tr>
                  <tr><td style="padding:28px;">
                    ${bodyHtml}
                    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
                    <a href="https://app.entrepromarket.com/admin" style="display:inline-block;padding:10px 20px;background:#701890;color:white;border-radius:6px;text-decoration:none;font-weight:bold;font-size:13px;">View Admin Dashboard</a>
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
    console.error("Owner notification error:", err);
    return res.status(500).json({ error: err.message });
  }
}
