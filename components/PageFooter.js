// components/PageFooter.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function PageFooter() {
  const [settings, setSettings] = useState({
    footer_company: "Entre PRO Market",
    footer_year: new Date().getFullYear().toString(),
    footer_email: "EntreProMarket@gmail.com",
    footer_instagram: "https://instagram.com/entrepromarket",
    footer_facebook: "",
    footer_tiktok: "",
    footer_x: "",
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("app_settings").select("key, value").like("key", "footer_%");
      if (data?.length) {
        const m = {};
        data.forEach(r => { m[r.key] = r.value; });
        setSettings(prev => ({ ...prev, ...m }));
      }
    };
    load();
  }, []);

  const iconStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)", color: "white", textDecoration: "none", fontSize: 16 };

  return (
    <div style={{ backgroundColor: "#701890", color: "white", padding: "24px 20px 32px", marginTop: 40, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        {settings.footer_email && <a href={`mailto:${settings.footer_email}`} style={iconStyle}>✉️</a>}
        {settings.footer_instagram && <a href={settings.footer_instagram} target="_blank" rel="noreferrer" style={iconStyle}>📸</a>}
        {settings.footer_facebook && <a href={settings.footer_facebook} target="_blank" rel="noreferrer" style={iconStyle}>👥</a>}
        {settings.footer_tiktok && <a href={settings.footer_tiktok} target="_blank" rel="noreferrer" style={iconStyle}>🎵</a>}
        {settings.footer_x && <a href={settings.footer_x} target="_blank" rel="noreferrer" style={iconStyle}>✖️</a>}
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
        © {settings.footer_company} {settings.footer_year}. All rights reserved.
      </p>
    </div>
  );
}
