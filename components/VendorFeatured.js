import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function VendorFeatured({ vendor }) {
  const [loading, setLoading] = useState(false)
  const [featured, setFeatured] = useState(vendor.featured)

  async function handlePromote() {
    setLoading(true)

    // Placeholder: Stripe integration will go here later
    await new Promise(resolve => setTimeout(resolve, 1000))

    // For now, simulate vendor becoming featured
    setFeatured(true)
    alert("✅ Featured status would be updated after Stripe payment")
    setLoading(false)
  }

  if (featured) {
    return (
      <div style={{
        padding: 12,
        background: "#e0ffe0",
        borderRadius: 6,
        marginTop: 10,
        fontWeight: "600"
      }}>
        ⭐ You are a Featured Vendor!
      </div>
    )
  }

  return (
    <button
      onClick={handlePromote}
      disabled={loading}
      style={{
        padding: "12px 18px",
        borderRadius: 6,
        border: "none",
        background: "#000",
        color: "#fff",
        cursor: "pointer",
        marginTop: 10,
        fontWeight: "600"
      }}
    >
      {loading ? "Processing..." : "Promote to Featured"}
    </button>
  )
}
