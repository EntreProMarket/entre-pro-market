import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function VendorPage() {
  const router = useRouter();
  const { handle } = router.query;

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) return; // Wait until handle is available from router

    console.log("handle value:", handle); // FACT: what is the handle at runtime

    const fetchVendor = async () => {
      try {
        const { data, error } = await supabase
          .from("vendors")
          .select("*")
          .eq("handle", handle)
          .single();

        if (error) {
          console.log("Supabase error:", error);
          setVendor(null);
        } else {
          setVendor(data);
        }
      } catch (err) {
        console.log("Fetch error:", err);
        setVendor(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [handle]);

  if (!handle) return <p style={{ padding: 40 }}>Loading...</p>;
  if (loading) return <p style={{ padding: 40 }}>Loading vendor...</p>;
  if (!vendor) return <p style={{ padding: 40 }}>Vendor not found.</p>;

  return (
    <div style={{ padding: 40 }}>
      <h1>{vendor.business_name}</h1>
      <p>{vendor.bio || "No bio provided."}</p>
      <div>
        <h2>Portfolio</h2>
        {/* Portfolio images would go here */}
      </div>
    </div>
  );
}
