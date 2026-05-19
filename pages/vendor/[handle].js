// pages/vendor/[handle].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

// ── Your existing functions (cleanHandle, formatSocialLink, Icons) ──
function cleanHandle(value) {
  return value.trim().replace(/^@/, "").replace(/\s+/g, "");
}
function formatSocialLink(platform, value) {
  if (!value || !value.trim()) return "";
  const v = value.trim();
  if (v.startsWith("https://")) return v;
  if (v.startsWith("http://")) return v.replace("http://", "https://");
  if (v.startsWith("www.")) return `https://${v}`;
  const domains = { instagram: "instagram.com", facebook: "facebook.com", tiktok: "tiktok.com", youtube: "youtube.com" };
  if (domains[platform] && v.toLowerCase().includes(domains[platform])) return `https://${v}`;
  const handle = cleanHandle(v);
  switch (platform) {
    case "instagram": return `https://instagram.com/${handle}`;
    case "facebook":  return `https://facebook.com/${handle}`;
    case "tiktok":    return `https://tiktok.com/@${handle}`;
    case "youtube":   return `https://youtube.com/@${handle}`;
    case "x_twitter": return `https://x.com/${handle}`;
    case "website":   return `https://${handle}`;
    default:          return `https://${handle}`;
  }
}

// Your Icon components (WebsiteIcon, InstagramIcon, etc.) — keep them as-is
// ... [Paste all your Icon components here - I kept them out for brevity but include them] ...

export default function VendorPublicProfile() {
  const router = useRouter();
  const { handle } = router.query;

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);        // ← New
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [viewerProfile, setViewerProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!handle) return;

    const fetchVendor = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("handle", handle)
        .single();

      if (error || !data) { 
        console.log(error); 
        setLoading(false); 
        return; 
      }

      setVendor(data);
      const ownerViewing = user && data.id === user.id;
      if (ownerViewing) setIsOwner(true);

      if (user) {
        const { data: vp } = await supabase
          .from("profiles")
          .select("role, account_type, id")
          .eq("id", user.id)
          .single();
        setViewerProfile(vp);
      }

      // Load Shop Products
      const { data: prods } = await supabase
        .from("vendor_products")
        .select("*")
        .eq("vendor_id", data.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setProducts(prods || []);

      // Track view...
      if (!ownerViewing) {
        await supabase.from("profile_views").insert([{
          profile_id: data.id,
          viewer_id: user?.id || null,
        }]);
      }

      setLoading(false);
    };

    fetchVendor();
  }, [handle]);

  const buyProduct = async (product) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      alert("Please log in to make a purchase.");
      return;
    }

    const res = await fetch("/api/create-product-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, userId: user.user.id }),
    });

    const result = await res.json();
    if (result.url) {
      window.location.href = result.url;
    } else {
      alert("Checkout error. Please try again.");
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!vendor) return <div style={{ padding: 40 }}>Vendor not found</div>;

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20, position: "relative" }}>
      {/* Your existing code (owner menu, header, logo, info, description, tags, social icons, portfolio, videos, message button, etc.) remains unchanged */}

      {/* ==================== NEW SHOP SECTION ==================== */}
      <div style={{ marginTop: 40, marginBottom: 30 }}>
        <h2 style={{ marginBottom: 16 }}>🛒 Shop</h2>
        {products.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
            {products.map((p) => (
              <div key={p.id} style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden", cursor: "pointer" }} onClick={() => buyProduct(p)}>
                <img src={p.image_url} alt={p.title} style={{ width: "100%", height: 180, objectFit: "cover" }} />
                <div style={{ padding: 14 }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{p.title}</h3>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: "bold", color: "#701890" }}>
                    ${(p.price / 100).toFixed(2)}
                  </p>
                  <button style={{ marginTop: 12, width: "100%", padding: 12, background: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold" }}>
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No products in shop yet.</p>
        )}
      </div>

      {/* ==================== REST OF YOUR ORIGINAL CODE ==================== */}
      {/* Paste the rest of your original return JSX here (from Portfolio down to the end) */}

      {/* ... your portfolio, videos, message button, back button, fullscreen image modal ... */}

    </div>
  );
}
