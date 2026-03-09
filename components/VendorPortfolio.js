// components/VendorPortfolio.js
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function VendorPortfolio({ vendorHandle }) {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const uploadFile = async () => {
    if (!file) return alert("Select a file");

    const fileName = `${vendorHandle}/${file.name}`;
    const { error } = await supabase.storage
      .from("vendor-portfolio")
      .upload(fileName, file, { upsert: true });

    if (error) alert("Upload failed: " + error.message);
    else alert("Upload successful!");
  };

  return (
    <div style={{ marginTop: 20 }}>
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadFile}>Upload Image</button>
    </div>
  );
}
