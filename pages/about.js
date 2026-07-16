// pages/about.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function AboutPage() {
  const router = useRouter();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("about_sections")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });
      setSections(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", fontFamily: "sans-serif", padding: "0 0 60px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #eee", backgroundColor: "white", position: "sticky", top: 0, zIndex: 10 }}>
        <img src="/logo-circle.png" alt="Entre PRO Market" style={{ width: 80, height: 80, objectFit: "contain", borderRadius: "50%" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => router.push("/home")} style={{ padding: "7px 14px", backgroundColor: "white", color: "#701890", border: "1px solid #701890", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>🏡 Home</button>
          <button onClick={() => router.push("/marketplace")} style={{ padding: "7px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>🛒 Marketplace</button>
        </div>
      </div>

      <div style={{ padding: "32px 20px 0" }}>
        <h1 style={{ marginBottom: 6, fontSize: 26 }}>ℹ️ About Entre PRO Market</h1>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 36 }}>Learn more about us, our mission, and our platform.</p>

        {loading ? (
          <p style={{ color: "#aaa", textAlign: "center" }}>Loading...</p>
        ) : sections.length === 0 ? (
          <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #eee", borderRadius: 10, padding: 32, textAlign: "center", color: "#aaa" }}>
            <p style={{ fontSize: 36, margin: 0 }}>📝</p>
            <p style={{ fontSize: 14, marginTop: 12 }}>Content coming soon. Check back shortly!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
            {sections.map((section, i) => (
              <div key={section.id || i} style={{ borderBottom: i < sections.length - 1 ? "1px solid #f0f0f0" : "none", paddingBottom: 36 }}>
                <h2 style={{ margin: "0 0 16px", fontSize: 20, color: "#701890" }}>{section.title}</h2>
                {section.image_url && (
                  <div style={{ marginBottom: 20, borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                    <img src={section.image_url} alt={section.title} style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }} />
                  </div>
                )}
                {section.content && (
                  <div style={{ fontSize: 15, color: "#444", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{section.content}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
