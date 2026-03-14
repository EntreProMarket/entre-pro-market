import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import VendorFeatured from "../components/VendorFeatured"

export default function Dashboard() {
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadVendor() {
      const user = supabase.auth.user()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("email", user.email)
        .single()

      if (error) {
        console.log(error)
        setLoading(false)
        return
      }

      setVendor(data)
      setLoading(false)
    }

    loadVendor()
  }, [])

  if (loading) return <div style={{padding:20}}>Loading dashboard...</div>
  if (!vendor) return <div style={{padding:20}}>No vendor profile found.</div>

  return (
    <div style={{padding:20, maxWidth:600, margin:"0 auto"}}>
      <h1 style={{fontSize:24, fontWeight:"bold", marginBottom:20}}>
        Welcome, {vendor.business_name}!
      </h1>

      <div style={{
        display:"flex",
        flexDirection:"column",
        gap:12,
        marginBottom:20
      }}>
        <div><strong>Category:</strong> {vendor.category}</div>
        <div><strong>City, State:</strong> {vendor.city}, {vendor.state}</div>
        <div><strong>Bio:</strong> {vendor.bio}</div>
        <div><strong>Website:</strong> {vendor.website || "N/A"}</div>
        <div><strong>Instagram:</strong> {vendor.instagram || "N/A"}</div>
        <div><strong>TikTok:</strong> {vendor.tiktok || "N/A"}</div>
        <div><strong>YouTube:</strong> {vendor.youtube || "N/A"}</div>
        <div><strong>Phone:</strong> {vendor.phone || "N/A"}</div>
        <div><strong>Email:</strong> {vendor.email}</div>
      </div>

      {/* Promote to Featured Button */}
      <VendorFeatured vendor={vendor} />

    </div>
  )
}
