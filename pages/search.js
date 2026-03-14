import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useRouter } from "next/router"

export default function SearchPage() {

  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadVendors()
  }, [])

  async function loadVendors() {

    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.log("Vendor fetch error:", error)
      setLoading(false)
      return
    }

    // Attach image path for vendor card
    const vendorsWithImages = data.map(vendor => {

      let image = null

      if (vendor.handle === "test-vendor") {
        image = "https://oikftedsjtvjzhdbnkue.supabase.co/storage/v1/object/public/vendor-portfolio/test-vendor/1773117845542-Test-Face-EPM.jpg"
      }

      return {
        ...vendor,
        image
      }
    })

    setVendors(vendorsWithImages)
    setLoading(false)
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Loading vendors...</div>
  }

  return (

    <div style={{ padding: 20 }}>

      <h1 style={{
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20
      }}>
        Vendors
      </h1>

      <div style={{
        display: "grid",
        gap: 20
      }}>

        {vendors.map(vendor => (

          <div
            key={vendor.handle}
            onClick={() => router.push(`/vendor/${vendor.handle}`)}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              overflow: "hidden",
              cursor: "pointer",
              background: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
            }}
          >

            {vendor.image && (
              <img
                src={vendor.image}
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover"
                }}
              />
            )}

            <div style={{ padding: 16 }}>

              <div style={{
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 6
              }}>
                {vendor.business_name}
              </div>

              <div style={{
                color: "#666",
                marginBottom: 4
              }}>
                {vendor.category}
              </div>

              <div style={{
                color: "#888",
                fontSize: 14
              }}>
                {vendor.city}, {vendor.state}
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
