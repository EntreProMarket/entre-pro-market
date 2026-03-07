import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function VendorPage() {
  const router = useRouter();
  const { handle } = router.query;

  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    if (!handle) return;

    async function fetchVendor() {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("handle", handle)
        .single();

      if (error) {
        console.log(error);
      } else {
        setVendor(data);
      }
    }

    fetchVendor();
  }, [handle]);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Vendor Page</h1>
      <p>Handle: {handle}</p>

      {vendor && (
        <div>
          <h2>{vendor.business_name}</h2>
          <p>{vendor.bio}</p>
        </div>
      )}
    </div>
  );
}
