import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useRouter } from "next/router"

export default function SearchPage() {

  const [vendors, setVendors] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)

  const [category, setCategory] = useState("All")
  const [query, setQuery] = useState("")

  const router = useRouter()

  useEffect(() => {
    loadVendors()
  }, [])

  useEffect(() => {

    let results = vendors

    if (category !== "All") {
      results = results.filter(v => v.category === category)
    }

    if (query.trim() !== "") {

      const q = query.toLowerCase()

      results = results.filter(v =>
        v.business_name?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q)
      )

    }

    setFiltered(results)

  }, [vendors, category, query])

  async function loadVendors() {

    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.log(error)
      setLoading(false)
      return
    }

    setVendors(data)
    setFiltered(data)
    setLoading(false)
  }

  if (loading) return <div style={{padding:20}}>Loading vendors...</div>

  return (

    <div style={{padding:20}}>

      <h1 style={{
        fontSize:24,
        fontWeight:"bold",
        marginBottom:10
      }}>
        Vendors
      </h1>

      {/* SEARCH BAR */}

      <input
        type="text"
        placeholder="Search vendor or city..."
        value={query}
        onChange={(e)=>setQuery(e.target.value)}
        style={{
          width:"100%",
          padding:"10px 12px",
          marginBottom:20,
          borderRadius:8,
          border:"1px solid #ddd"
        }}
      />

      {/* CATEGORY FILTERS */}

      <div style={{
        display:"flex",
        gap:10,
        overflowX:"auto",
        marginBottom:20
      }}>

        {["All","Photographer","Caterer","DJ","Decorator","Venue"].map(cat => (

          <button
            key={cat}
            onClick={()=>setCategory(cat)}
            style={{
              padding:"8px 14px",
              borderRadius:20,
              border:"1px solid #ddd",
              background: category === cat ? "#000" : "#fff",
              color: category === cat ? "#fff" : "#000",
              cursor:"pointer"
            }}
          >
            {cat}
          </button>

        ))}

      </div>

      {/* VENDOR GRID */}

      <div style={{
        display:"grid",
        gap:20
      }}>

        {filtered.map(vendor => (

          <div
            key={vendor.handle}
            onClick={()=>router.push(`/vendor/${vendor.handle}`)}
            style={{
              border:"1px solid #ddd",
              borderRadius:10,
              overflow:"hidden",
              cursor:"pointer",
              background:"#fff",
              boxShadow:"0 2px 6px rgba(0,0,0,0.05)"
            }}
          >

            {vendor.profile_image && (

              <img
                src={vendor.profile_image}
                style={{
                  width:"100%",
                  height:180,
                  objectFit:"cover"
                }}
              />

            )}

            <div style={{padding:16}}>

              <div style={{
                fontSize:18,
                fontWeight:"600",
                marginBottom:6
              }}>
                {vendor.business_name}
              </div>

              <div style={{color:"#666",marginBottom:4}}>
                {vendor.category}
              </div>

              <div style={{color:"#888",fontSize:14}}>
                {vendor.city}, {vendor.state}
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
