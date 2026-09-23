// pages/epm-shop.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import useForceLogoutIfExpired from "../hooks/useForceLogoutIfExpired";
import FooterBar from "../components/FooterBar";
import PageFooter from "../components/PageFooter";

export default function EpmShop() {
  useForceLogoutIfExpired();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: adminProfiles } = await supabase.from("profiles").select("id").eq("is_admin", true);
      const adminIds = (adminProfiles || []).map(p => p.id);
      if (adminIds.length === 0) { setProducts([]); setLoading(false); return; }
      const { data } = await supabase.from("vendor_products").select("*").in("vendor_id", adminIds).eq("is_active", true).order("created_at", { ascending: false });
      setProducts(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #eee", backgroundColor: "white", position: "sticky", top: 0, zIndex: 10 }}>
          <img src="/logo-circle.png" alt="EntreProMarket" style={{ width: 90, height: 90, objectFit: "contain", borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => router.push("/home")} style={{ padding: "7px 14px", backgroundColor: "white", color: "#701890", border: "1px solid #701890", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>🏡 Home</button>
            <button onClick={() => router.push("/marketplace")} style={{ padding: "7px 14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>🛒 Marketplace</button>
          </div>
        </div>

        <div style={{ padding: "20px 16px" }}>
          <div style={{ background: "linear-gradient(135deg, #701890, #AABB23)", borderRadius: 16, padding: "24px 20px", marginBottom: 24, textAlign: "center", color: "white" }}>
            <h1 style={{ margin: "0 0 6px", fontSize: 22 }}>🏢 EPM Shop</h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>Official merchandise and goods from Entre PRO Market</p>
          </div>

          {products.length === 0 ? (
            <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 40, textAlign: "center", color: "#aaa" }}>
              <p style={{ fontSize: 14, margin: 0 }}>No products available right now. Check back soon!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
              {products.map(p => {
                const imgs = p.images?.length > 0 ? p.images : (p.image_url ? [p.image_url] : []);
                return (
                  <div key={p.id} onClick={() => router.push(`/product/${p.id}`)}
                    style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", backgroundColor: "white", cursor: "pointer" }}>
                    <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
                      {imgs[0] ? <img src={imgs[0]} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc" }}>No Image</div>}
                      {imgs.length > 1 && <div style={{ position: "absolute", bottom: 6, right: 8, backgroundColor: "rgba(0,0,0,0.6)", color: "white", fontSize: 10, padding: "2px 6px", borderRadius: 8 }}>1/{imgs.length}</div>}
                    </div>
                    <div style={{ padding: 12 }}>
                      <p style={{ margin: "0 0 6px", fontWeight: "bold", fontSize: 14 }}>{p.title}</p>
                      {p.description && <p style={{ margin: "0 0 6px", fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.description}</p>}
                      <p style={{ margin: 0, color: "#701890", fontWeight: "bold", fontSize: 16 }}>${(p.price / 100).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <PageFooter />
      <FooterBar />
    </div>
  );
}
