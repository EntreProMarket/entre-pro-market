import { useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function VendorPortfolio({ vendorHandle, portfolio, setPortfolio }) {

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const fileName = `${vendorHandle}/${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from("vendor-portfolio")
      .upload(fileName, file)

    if (error) {
      alert("Upload failed: " + error.message)
      return
    }

    const { data } = supabase
      .storage
      .from("vendor-portfolio")
      .getPublicUrl(fileName)

    const imageUrl = data.publicUrl

    const { data: newRow, error: dbError } = await supabase
      .from("vendor_portfolio")
      .insert([
        {
          vendor_handle: vendorHandle,
          image_url: imageUrl
        }
      ])
      .select()

    if (dbError) {
      alert("Database error: " + dbError.message)
      return
    }

    setPortfolio([...portfolio, ...newRow])
  }

  return (
    <div>

      <input type="file" onChange={handleUpload} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          marginTop: "20px"
        }}
      >
        {portfolio
  .filter(item => item.image_url)
  .map((item) => (
    <img
      key={item.id}
      src={item.image_url}
            style={{
              width: "100%",
              height: "120px",
              objectFit: "cover",
              borderRadius: "8px",
              cursor: "pointer"
            }}
            onClick={() => window.open(item.image_url, "_blank")}
          />
        ))}
      </div>

    </div>
  )
}
