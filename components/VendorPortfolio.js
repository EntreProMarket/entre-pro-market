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

    const { error: uploadError } = await supabase.storage
      .from("vendor-portfolio")
      .upload(filePath, file)

    if (uploadError) {
      alert("Upload failed: " + uploadError.message)
      return
    }

    const { data } = supabase
      .storage
      .from("vendor-portfolio")
      .getPublicUrl(filePath)

    const imageUrl = data.publicUrl

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

    setPortfolio([...portfolio, newRow])

    alert("Upload successful!")

    setFile(null)
  }

  return (

    <div>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={handleUpload}>
        Upload Image
      </button>

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
          />

        ))}

      </div>

    </div>

  )

}
