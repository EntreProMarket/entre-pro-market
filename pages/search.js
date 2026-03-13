import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useRouter } from "next/router"

export default function SearchPage() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    async function fetchVendors() {

      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.log("Error loading vendors:", error)
      } else {
        setVendors(data)
      }

      setLoading(false)
    }

    fetchVendors()
  }, [])

  if (loading) return <p style={{padding:20}}>Loading vendors...</p>

  return (
    <div style={{padding:20}}>

      <h1 style={{
        fontSize:24,
        fontWeight:"bold",
        marginBottom:20
      }}>
        Vendors
      </h1>

      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr",
        gap:20
      }}>

        {vendors.map((vendor) => (

          <div
            key={vendor.handle}
            onClick={() => router.push(`/vendor/${vendor.handle}`)}
            style={{
              border:"1px solid #ddd",
              borderRadius:10,
              padding:16,
              cursor:"pointer",
              background:"#fff",
              boxShadow:"0 2px 6px rgba(0,0,0,0.05)"
            }}
          >

            <div style={{
              fontSize:18,
              fontWeight:"600",
              marginBottom:6
            }}>
              {vendor.business_name}
            </div>

            <div style={{
              color:"#666",
              marginBottom:4
            }}>
              {vendor.category}
            </div>

            <div style={{
              color:"#888",
              fontSize:14
            }}>
              {vendor.city}, {vendor.state}
            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
