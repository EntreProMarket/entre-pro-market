import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function VendorPortfolio({ vendorHandle, portfolio, setPortfolio }) {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) {
      alert("Please choose a file first");
      return;
    }

    const cleanHandle = vendorHandle.trim();
    const filePath = `${cleanHandle}/${Date.now()}-${file.name}`;

    // Upload image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("vendor-portfolio")
      .upload(filePath, file);

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      return;
    }

    // Get public URL
    const { data } = supabase.storage
      .from("vendor-portfolio")
      .getPublicUrl(filePath);

    const imageUrl = data.publicUrl;

    // Insert into database
    const { data: newRow, error: insertError } = await supabase
      .from("vendor_portfolio")
      .insert([{ vendor_handle: cleanHandle, image_url: imageUrl }])
      .select()
      .single();

    if (insertError) {
      alert("Database insert failed: " + insertError.message);
      return;
    }

    // Update state
    setPortfolio([...portfolio, newRow]);
    setFile(null);

    alert("Upload successful!");
  };

  return (
    <div style={{ marginTop: 20 }}>
      {/* File upload controls */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button onClick={handleUpload} style={{ marginLeft: 10 }}>
          Upload Image
        </button>
      </div>

      {/* No images message */}
      {portfolio.length === 0 && (
        <p>No images uploaded yet.</p>
      )}

      {/* Portfolio grid */}
      {portfolio.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, 200px)",
            gap: "20px",
          }}
        >
          {portfolio
            .filter((item) => item.image_url) // ensures no empty src
            .map((item) => (
              <img
                key={item.id}
                src={item.image_url}
                alt="Portfolio"
                style={{
                  width: "200px",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            ))}
        </div>
      )}
    </div>
  );
}
