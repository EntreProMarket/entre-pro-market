// pages/vendor/[handle].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function PublicVendorProfile() {
  const router = useRouter();
  const { handle } = router.query;
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) return;

    const loadVendor = async () => {
      // Load vendor profile
      const { data: v } = await supabase
        .from("profiles")
        .select("*")
        .eq("handle", handle)
        .eq("role", "vendor")
        .single();

      if (v) {
        setVendor(v);

        // Load their shop products
        const { data: prods } = await supabase
          .from("vendor_products")
          .select("*")
          .eq("vendor_id", v.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        setProducts(prods || []);
      }
      setLoading(false);
    };

    loadVendor();
  }, [handle]);

  const buyProduct = async (product) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      alert("Please log in to purchase");
      return;
    }

    const res = await fetch("/api/create-product-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, userId: user.user.id }),
    });

    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading vendor...</div>;
  if (!vendor) return <div style={{ padding: 40, textAlign: "center" }}>Vendor not found</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
      <button onClick={() => router.push("/marketplace")} style={{ marginBottom: 20 }}>← Back to Marketplace</button>

      <div style={{ display: "flex", gap: 30, flexWrap: "wrap" }}>
        {/* Vendor Info */}
        <div style={{ flex: 1, minWidth: 300 }}>
          {vendor.logo_url && <img src={vendor.logo_url} alt={vendor.business_name} style={{ width: "100%", borderRadius: 12 }} />}
          <h1 style={{ margin: "20px 0 8px" }}>{vendor.business_name}</h1>
          <p style={{ color: "#666", fontSize: 15 }}>{vendor.category} • {vendor.city}, {vendor.state}</p>
          <p style={{ marginTop: 20, lineHeight: 1.6 }}>{vendor.description}</p>
        </div>

        {/* Shop Section */}
        <div style={{ flex: 2, minWidth: 300 }}>
          <h2>🛒 Shop</h2>
          {products.length === 0 ? (
            <p>No products yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
              {products.map((p) => (
                <div key={p.id} style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden", cursor: "pointer" }} onClick={() => buyProduct(p)}>
                  <img src={p.image_url} alt={p.title} style={{ width: "100%", height: 180, objectFit: "cover" }} />
                  <div style={{ padding: 14 }}>
                    <h3 style={{ margin: "0 0 8px" }}>{p.title}</h3>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: "bold", color: "#701890" }}>
                      ${(p.price / 100).toFixed(2)}
                    </p>
                    <button style={{ marginTop: 12, width: "100%", padding: 12, background: "#701890", color: "white", border: "none", borderRadius: 8 }}>
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
