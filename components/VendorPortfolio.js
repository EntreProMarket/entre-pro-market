import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function VendorPortfolio({ vendorHandle, portfolio, setPortfolio }) {

  const [uploading, setUploading] = useState(false)

  async function uploadImage(event) {
    try {
      setUploading(true)

      const file = event.target.files[0]
      if (!file) return

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${vendorHandle}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("vendor-portfolio")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from("vendor-portfolio")
        .getPublicUrl(filePath)

      const imageUrl = data.publicUrl

      const { data: newRow, error: insertError } = await supabase
        .from("vendor_portfolio")
        .insert([
          {
            vendor_handle: vendorHandle,
            image_url: imageUrl
          }
        ])
        .select()

      if (insertError) throw insertError

      setPortfolio([...portfolio, ...newRow])

    } catch (error) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  async function deleteImage(item) {

    const confirmDelete = confirm("Delete this image?")
    if (!confirmDelete) return

    try {

      const filePath = item.image_url.split("/vendor-portfolio/")[1]

      await supabase.storage
        .from("vendor-portfolio")
        .remove([filePath])

      await supabase
        .from("vendor_portfolio")
        .delete()
        .eq("id", item.id)

      setPortfolio(portfolio.filter(p => p.id !== item.id))

    } catch (error) {
      alert(error.message)
    }
  }

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
          gap: "10px",
          marginTop: "20px"
        }}
      >

        {portfolio
          .filter(item => item.image_url)
          .map((item) => (

            <div key={item.id} style={{ position: "relative" }}>

              <img
                src={item.image_url}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
                onClick={() => window.open(item.image_url, "_blank")}
              />

              <button
                onClick={() => deleteImage(item)}
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  cursor: "pointer"
                }}
              >
                ×
              </button>

            </div>

        ))}

      </div>

    </div>
  )
}
