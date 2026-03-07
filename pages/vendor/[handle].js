import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient" // Correct path for your project

export default function VendorProfile() {
  const router = useRouter()
  const { handle } = router.query

  const [vendor, setVendor] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!handle) return

    async function loadVendor() {
      try {
        const { data, error } = await supabase
          .from("vendors")
          .select("*")
          .eq("handle", handle)
          .single()

        if (error) {
          console.log("Vendor load error:", error.message)
          setVendor(null)
        } else {
          setVendor(data)
        }
      } catch (err) {
        console.log("Vendor fetch failed:", err)
        setVendor(null)
      }
    }

    async function loadPortfolio() {
      try {
        const { data, error } = await supabase
          .from("vendor_portfolio")
          .select("*")
          .eq("vendor_handle", handle)

        if (!error && data) {
          setPortfolio(data)
        }
      } catch (err) {
        console.log("Portfolio fetch failed:", err)
        setPortfolio([])
      }
    }

    Promise.all([loadVendor(), loadPortfolio()]).finally(() => setLoading(false))
  }, [handle])

  if (loading) return <div style={{ padding: 40 }}>Loading vendor...</div>
  if (!vendor) return <div style={{ padding: 40 }}>Vendor not found.</div>

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 40 }}>
      <h1>{vendor.business_name || "Unnamed Vendor"}</h1>
      <p>{vendor.bio || "No bio provided."}</p>

      <h2 style={{ marginTop: 40 }}>Portfolio</h2>
      {portfolio.length === 0 ? (
        <p style={{ marginTop: 10 }}>No portfolio items yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginTop: 20
          }}
        >
          {portfolio.map((item) => (
            <img
              key={item.id}
              src={item.image_url}
              alt="portfolio"
              style={{ width: "100%", borderRadius: 8, objectFit: "cover" }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
