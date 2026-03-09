import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function VendorPortfolio({ vendorHandle, portfolio, setPortfolio }) {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const fileName = `${vendorHandle}/${file.name}`;

    // Upload to storage bucket
    const { error } = await supabase.storage
      .from("vendor-portfolio")
      .upload(fileName, file, { upsert: true });

    if (error) {
      alert("Upload failed: " + error.message);
      return;
    }

    // Insert a row into vendor_portfolio table
    const { data, error: insertError } = await supabase
      .from("vendor_portfolio")
      .insert([
        {
          vendor_handle: vendorHandle, // must match existing vendor
          image_url: fileName           // path in storage
        }
      ]);

    if (insertError) {
      alert("Failed to save to portfolio: " + insertError.message);
      return;
    }

    // Success — update portfolio grid immediately
    setPortfolio((prev) => [...prev, data[0]]);
    alert("Upload successful!");
    setFile(null);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload Image</button>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,200px)",
        gap: "20px",
        marginTop: "20px"
      }}>
        {portfolio.map((item) => (
          <img
            key={item.id}
            src={`https://YOUR_SUPABASE_BUCKET_URL/${item.image_url}`}
            style={{
              width: "200px",
              height: "200px",
              objectFit: "cover",
              borderRadius: "8px"
            }}
            alt="Portfolio"
          />
        ))}
      </div>
    </div>
  );
}
