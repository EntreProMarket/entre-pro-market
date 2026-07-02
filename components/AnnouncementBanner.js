// components/AnnouncementBanner.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AnnouncementBanner() {
  const [banner, setBanner] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("epm_banner_dismissed") === "true") {
      setDismissed(true); return;
    }
    const load = async () => {
      const { data } = await supabase.from("app_settings").select("key, value").in("key", ["announcement_banner", "announcement_active", "announcement_style"]);
      if (!data) return;
      const map = {};
      data.forEach(r => { map[r.key] = r.value; });
      if (map.announcement_active === "true" && map.announcement_banner?.trim()) {
        setBanner({ text: map.announcement_banner, style: map.announcement_style || "promo" });
      }
    };
    load();
  }, []);

  if (!banner || dismissed) return null;

  const styles = {
    info:    { bg: "#eff6ff", border: "#93c5fd", color: "#1e40af" },
    success: { bg: "#f0fdf4", border: "#86efac", color: "#166534" },
    warning: { bg: "#fffbeb", border: "#fcd34d", color: "#92400e" },
    promo:   { bg: "#f3e8ff", border: "#701890", color: "#701890" },
  };
  const s = styles[banner.style] || styles.promo;

  return (
    <div style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
      <p style={{ margin: 0, fontSize: 14, color: s.color, fontWeight: "bold", lineHeight: 1.5, flex: 1 }}>{banner.text}</p>
      <button onClick={() => { setDismissed(true); sessionStorage.setItem("epm_banner_dismissed", "true"); }} style={{ background: "none", border: "none", color: s.color, fontSize: 18, cursor: "pointer", opacity: 0.6, flexShrink: 0 }}>✕</button>
    </div>
  );
}
