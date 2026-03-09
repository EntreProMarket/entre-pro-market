import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

export default function VendorPage() {
  const router = useRouter()
  const { handle } = router.query

  const [vendor, setVendor] = useState(null)
  const [portfolio, setPortfolio] = useState([])

  useEffect(() => {
    if (!handle) return

    const loadVendor = async () => {

      const { data: vendorData } = await supabase
        .from("vendors")
        .select("*")
        .eq("handle", handle)
        .single()

      setVendor(vendorData)

      if (!vendorData) return

      const { data: portfolioData } = await supabase
        .from("vendor_portfolio")
        .select("*")
        .eq("vendor_handle", handle)

      setPortfolio(portfolioData || [])
    }

    loadVendor()

  }, [handle])

  if (!handle) return <p style={{padding:40}}>Loading...</p>

if (!vendor) return <p style={{padding:40}}>Vendor not found.</p>
  return (

    <div style={{maxWidth:900, margin:"auto", padding:40}}>

      <h1>{vendor.business_name}</h1>

      <p>{vendor.bio}</p>

      <h2 style={{marginTop:40}}>Portfolio</h2>

<VendorPortfolio vendorHandle={vendor.handle} />
    
{portfolio.length === 0 && (
        <p>No images uploaded yet.</p>
      )}

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
