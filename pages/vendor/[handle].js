import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function VendorPage() {
  const router = useRouter();
  const { handle } = router.query;

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Vendor Page</h1>
      <p>Vendor handle: {handle}</p>
    </div>
  );
}
