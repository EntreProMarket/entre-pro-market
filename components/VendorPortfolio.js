import { useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function VendorPortfolio({ vendorHandle, portfolio, setPortfolio }) {

  const [file, setFile] = useState(null)

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file")
      return
    }

    const cleanHandle = vendorHandle.trim()
    const filePath = `${cleanHandle}/${Date.now()}-${file.name}`

    // Upload to storage bucket
    const { error: uploadError } = await supabase.storage
      .from("vendor-portfolio")
      .upload(filePath, file)

    if (uploadError) {
      alert("Upload failed: " + uploadError.message)
      return
    }

    // Get public URL of uploaded file
    const { data } = supabase
      .storage
      .from("vendor-portfolio")
      .getPublicUrl(filePath)

    const imageUrl = data.publicUrl

    // Insert row into vendor_portfolio table
    const { data: newRow, error: insertError } = await supabase
      .from("vendor_portfolio")
      .insert([
        {
          vendor_handle: cleanHandle,
          image_url: imageUrl
        }
      ])
      .select()
      .single()

    if (insertError) {
      alert("Database insert failed: " + insertError.message)
      return
    }

    // Update portfolio grid
    setPortfolio([...portfolio, newRow])
    alert("Upload successful!")
    setFile(null)
  }

  return (
    <div>

      {/* Hidden file input */}
      <input
        id="fileUploadButton"
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        style={{ display: "none" }}
      />

      {/* Custom buttons */}
      <button onClick={() => document.getElementById('fileUploadButton').click()}>
        Choose File
      </button>
      <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
        Upload Image
      </button>

      {/* Show message if portfolio is empty */}
      {portfolio.length === 0 && (
        <p style={{ marginTop: "20px" }}>No images uploaded yet.</p>
      )}

      {/* Only render grid if there are images */}
      {portfolio.length > 0 && (
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fill,200px)",
          gap:"20px",
          marginTop:"20px"
        }}>
          {portfolio.map((item) => (
            <img
              key={item.id}
              src={item.image_url}
              style={{
                width:"200px",
                height:"200px",
                objectFit:"cover",
                borderRadius:"8px"
              }}
              alt="Portfolio"
            />
          ))}
        </div>
      )}

    </div>
  )
}
