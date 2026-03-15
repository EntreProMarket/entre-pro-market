import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "../lib/supabase"

export default function Search() {

  const [vendors, setVendors] = useState([])
  const [featuredVendors, setFeaturedVendors] = useState([])

  useEffect(() => {
    loadVendors()
  }, [])

  async function loadVendors() {

    const { data, error } = await supabase
      .from("vendors")
      .select("*")

    if (error) {
      console.log(error)
      return
    }

    const featured = data.filter(v => v.featured === true)
    const normal = data.filter(v => !v.featured)

    setFeaturedVendors(featured)
    setVendors(normal)
  }

  function VendorCard({ vendor }) {
    return (
      <Link href={`/vendor/${vendor.handle}`}>
        <div style={{
          border: "1px solid #ddd",
          padding: 20,
          borderRadius: 10,
          marginBottom: 15,
          cursor: "pointer"
        }}>
          {vendor.profile_image && (
            <img
              src={vendor.profile_image}
              style={{
                width: "100%",
                height: 200,
                objectFit: "cover",
                borderRadius: 6,
                marginBottom: 10
              }}
            />
          )}

          <h3>{vendor.business_name}</h3>
          <p>{vendor.category}</p>
          <p>{vendor.city}, {vendor.state}</p>
        </div>
      </Link>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>

      {featuredVendors.length > 0 && (
        <>
          <h2 style={{ marginBottom: 20 }}>⭐ Featured Vendors</h2>

          {featuredVendors.map(vendor => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </>
      )}

      <h2 style={{ marginTop: 40, marginBottom: 20 }}>Vendors</h2>

      {vendors.map(vendor => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}

    </div>
  )
}
