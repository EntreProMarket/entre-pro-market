import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function VendorPage() {
  const router = useRouter();
  const { handle } = router.query;

  const [vendor, setVendor] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch vendor info
  useEffect(() => {
    if (!handle) return;

    const fetchVendor = async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("handle", handle)
        .single();
      if (!error) setVendor(data);
    };

    fetchVendor();
  }, [handle]);

  // Fetch portfolio
  useEffect(() => {
    if (!vendor) return;

    const fetchPortfolio = async () => {
      const { data, error } = await supabase
        .from("vendor_portfolio")
        .select("*")
        .eq("vendor_handle", vendor.handle);

      if (!error) setPortfolio(data);
    };

    fetchPortfolio();
  }, [vendor]);

  // Add new image
  const handleAddImage = async () => {
    if (!newImageUrl) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("vendor_portfolio")
      .insert([{ vendor_handle: vendor.handle, image_url: newImageUrl }]);

    if (!error) setPortfolio([...portfolio, data[0]]);
    setNewImageUrl("");
    setLoading(false);
  };

  if (!vendor) return <p>Loading vendor...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>{vendor.business_name}</h1>
      <p>{vendor.bio}</p>

      <h2>Portfolio</h2>
      {portfolio.length === 0 && <p>No images yet.</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {portfolio.map((item) => (
          <img
            key={item.id}
            src={item.image_url}
            alt="Portfolio"
            style={{ width: 150, height: 150, objectFit: "cover" }}
          />
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <input
          type="text"
          placeholder="New image URL"
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
          style={{ padding: 8, width: 300, marginRight: 10 }}
        />
        <button
          onClick={handleAddImage}
          disabled={loading}
          style={{
            padding: "8px 16px",
            backgroundColor: "#701890",
            color: "white",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
          }}
        >
          Add Image
        </button>
      </div>
    </div>
  );
}
