// components/PageFooter.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function EmailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export default function PageFooter() {
  const [settings, setSettings] = useState({
    footer_company: "Entre PRO Market",
    footer_year: new Date().getFullYear().toString(),
    footer_email: "",
    footer_instagram: "",
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

  const iconBtn = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", textDecoration: "none", transition: "background 0.2s" };

  return (
    <div style={{
      backgroundColor: "#701890",
      color: "white",
      padding: "28px 20px 36px",
      marginTop: 40,
      textAlign: "center",
      /* Break out of parent max-width container to go full width */
      width: "100vw",
      position: "relative",
      left: "50%",
      transform: "translateX(-50%)",
    }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
        {settings.footer_email && (
          <a href={`mailto:${settings.footer_email}`} style={iconBtn}>
            <EmailIcon />
          </a>
        )}
        {settings.footer_instagram && (
          <a href={settings.footer_instagram} target="_blank" rel="noreferrer" style={iconBtn}>
            <InstagramIcon />
          </a>
        )}
        {settings.footer_facebook && (
          <a href={settings.footer_facebook} target="_blank" rel="noreferrer" style={iconBtn}>
            <FacebookIcon />
          </a>
        )}
        {settings.footer_tiktok && (
          <a href={settings.footer_tiktok} target="_blank" rel="noreferrer" style={iconBtn}>
            <TikTokIcon />
          </a>
        )}
        {settings.footer_x && (
          <a href={settings.footer_x} target="_blank" rel="noreferrer" style={iconBtn}>
            <XIcon />
          </a>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
        © {settings.footer_company} {settings.footer_year}. All rights reserved.
      </p>
    </div>
  );
}
