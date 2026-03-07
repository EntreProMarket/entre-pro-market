import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function VendorProfile() {

  const router = useRouter()
  const { handle } = router.query

  const [vendor, setVendor] = useState(null)
  const [portfolio, setPortfolio] = useState([])

  useEffect(() => {

    if (!handle) return

    async function loadVendor() {

      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("handle", handle)
        .single()

      if (!error && data) {
        setVendor(data)
      }

    }

    async function loadPortfolio() {

      const { data, error } = await supabase
        .from("vendor_portfolio")
        .select("*")
        .eq("vendor_handle", handle)

      if (!error && data) {
        setPortfolio(data)
      }

    }

    loadVendor()
    loadPortfolio()

  }, [handle])

  if (!vendor) {
    return <div style={{padding:"40px"}}>Loading vendor...</div>
  }

  return (

    <div style={{maxWidth:"900px", margin:"auto", padding:"40px"}}>

      <h1>{vendor.business_name}</h1>

      <p>{vendor.bio}</p>

      <h2 style={{marginTop:"40px"}}>Portfolio</h2>

      <div
        style={{
          display:"grid",
          gridTemplateColumns:"repeat(3, 1fr)",
          gap:"12px",
          marginTop:"20px"
        }}
      >

        {portfolio.map((item) => (

          <img
            key={item.id}
            src={item.image_url}
            alt="portfolio"
            style={{
              width:"100%",
              borderRadius:"8px",
              objectFit:"cover"
            }}
          />

        ))}

      </div>

    </div>

  )

}
