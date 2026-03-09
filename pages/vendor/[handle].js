// pages/vendor/[handle].js

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient"; // adjust path if needed
import VendorPortfolio from "../../components/VendorPortfolio"; // import the new portfolio component
import { useRouter } from "next/router";

export default function VendorPage() {
  const router = useRouter();
  const { handle } = router.query;
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch vendor data by handle
  useEffect(() => {
    if (!handle) return;

    const fetchVendor = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("handle", handle)
        .single();

      if (error) {
        console.error("Error fetching vendor:", error.message);
        setVendor(null);
      } else {
        setVendor(data);
      }
      setLoading(false);
    };

    fetchVendor();
  }, [handle]);

  if (loading) return <p>Loading vendor...</p>;
  if (!vendor) return <p>Vendor not found</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{vendor.business_name}</h1>
      {vendor.bio && <p>{vendor.bio}</p>}

      {/* Add your social links if they exist */}
      <div style={{ marginTop: "10px" }}>
        {vendor.website && (
          <p>
            Website: <a href={vendor.website}>{vendor.website}</a>
          </p>
        )}
        {vendor.instagram && (
          <p>
            Instagram: <a href={vendor.instagram}>{vendor.instagram}</a>
          </p>
        )}
        {vendor.facebook && (
          <p>
            Facebook: <a href={vendor.facebook}>{vendor.facebook}</a>
          </p>
        )}
        {vendor.tiktok && (
          <p>
            TikTok: <a href={vendor.tiktok}>{vendor.tiktok}</a>
          </p>
        )}
        {vendor.youtube && (
          <p>
            YouTube: <a href={vendor.youtube}>{vendor.youtube}</a>
          </p>
        )}
      </div>

      {/* Portfolio section */}
      <div style={{ marginTop: "20px" }}>
        <VendorPortfolio vendorId={vendor.id} />
      </div>
    </div>
  );
}
