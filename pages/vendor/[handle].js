import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function VendorPage() {
  const router = useRouter();
  const { handle } = router.query;

  const [vendor, setVendor] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Fetch vendor info
  useEffect(() => {
    if (!handle) return;

    async function fetchVendor() {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("handle", handle)
        .single();

      if (error) console.log("Vendor fetch error:", error.message);
      else setVendor(data);
    }

    fetchVendor();
  }, [handle]);

  // Fetch portfolio images
  useEffect(() => {
    if (!handle) return;

    async function fetchPortfolio() {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .eq("vendor_handle", handle);

      if (error) console.log("Portfolio fetch error:", error.message);
      else setPortfolio(data);
    }

    fetchPortfolio();
  }, [handle]);

  // Upload new image
  const handleUpload = async () => {
    if (!newImageUrl) return;

    const { data, error } = await supabase
      .from("vendor_portfolio")
      .insert([{ vendor_handle: handle, image_url: newImageUrl }]);

    if (error) {
      console.log("Upload error:", error.message);
    } else {
      setPortfolio([...portfolio, data[0]]);
      setNewImageUrl("");
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Vendor Page</h1>
      <p>Handle: {handle}</p>

      {vendor && (
        <div>
          <h2>{vendor.business_name}</h2>
          <p>{vendor.bio}</p>
        </div>
      )}

      {portfolio.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Portfolio Images</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {portfolio.map((item) => (
              <img
                key={item.id}
                src={item.image_url}
                alt="Portfolio Image"
                style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 5 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload section */}
      <div style={{ marginTop: 20 }}>
        <h3>Add New Image</h3>
        <input
          type="text"
          placeholder="Image URL"
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
          style={{ padding: 8, width: 250, marginRight: 10 }}
        />
        <button
          onClick={handleUpload}
          style={{
            padding: "8px 16px",
            backgroundColor: "#701890",
            color: "white",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
          }}
        >
          Upload
        </button>
      </div>
    </div>
  );
}
