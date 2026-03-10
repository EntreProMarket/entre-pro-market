import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import VendorPortfolio from "../../components/VendorPortfolio"

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

      {/* Only show Portfolio heading if there are images */}
      {portfolio.length > 0 && <h2 style={{marginTop:40}}>Portfolio</h2>}

      {/* VendorPortfolio component handles grid and uploads */}
      <VendorPortfolio 
        vendorHandle={vendor.handle} 
        portfolio={portfolio} 
        setPortfolio={setPortfolio} 
      />

    </div>
  )
}
