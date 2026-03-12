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

      const { error } = await supabase.storage
        .from("vendor-portfolio")
        .upload(fileName, file, { upsert: true });

      if (error) {
        alert("Upload failed: " + error.message);
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
          image_url: imageUrl
        })
        .select();

      if (!insertError && inserted) {
        setPortfolio([...portfolio, ...inserted]);
      }

      alert("Upload successful");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>

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
          marginTop: 20
        }}
      >
        {portfolio &&
          portfolio
            .filter((item) => item.image_url)
            .map((item) => (
              <img
                key={item.id}
                src={item.image_url}
                style={{
                  width: "100%",
                  height: 140,
                  objectFit: "cover",
                  borderRadius: 6
                }}
              />
            ))}
      </div>

    </div>
  );
}
