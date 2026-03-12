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

    loadVendor()
    loadPortfolio()

  }, [handle])


  async function loadVendor() {

    const { data } = await supabase
      .from("vendors")
      .select("*")
      .eq("handle", handle)
      .single()

    setVendor(data)
  }


  async function loadPortfolio() {

    const { data } = await supabase
      .from("vendor_portfolio")
      .select("*")
      .eq("vendor_handle", handle)

    setPortfolio(data || [])
  }


  if (!vendor) {
    return <div>Loading vendor...</div>
  }


  return (
    <div style={{ padding: "20px" }}>

      <h1>{vendor.business_name}</h1>

      <VendorPortfolio
        vendorHandle={vendor.handle}
        portfolio={portfolio}
        setPortfolio={setPortfolio}
      />

    </div>
  )
}
