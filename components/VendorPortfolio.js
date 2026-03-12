import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function VendorPortfolio({ vendorHandle, portfolio, setPortfolio }) {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (event) => {
    try {
      setUploading(true);

      const file = event.target.files[0];
      if (!file) return;

      const fileName = `${vendorHandle}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("vendor-portfolio")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        alert("Upload failed: " + uploadError.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from("vendor-portfolio")
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;

      const { data: inserted, error: insertError } = await supabase
        .from("vendor_portfolio")
        .insert({
          vendor_handle: vendorHandle,
          image_url: imageUrl,
        })
        .select();

      if (insertError) {
        alert("Database insert failed: " + insertError.message);
      } else {
        setPortfolio([...portfolio, ...inserted]);
        alert("Upload successful!");
      }
    } catch (err) {
      alert("Unexpected error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: 30 }}>
      <h2>Portfolio</h2>

      <input
        type="file"
        accept="image/*"
        onChange={uploadImage}
        disabled={uploading}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginTop: 20,
        }}
      >
        {portfolio &&
          portfolio.map((item) =>
            item.image_url ? (
              <img
                key={item.id}
                src={item.image_url}
                alt="Vendor work"
                style={{
                  width: "100%",
                  height: 120,
                  objectFit: "cover",
                  borderRadius: 6,
                }}
              />
            ) : null
          )}
      </div>
    </div>
  );
}
