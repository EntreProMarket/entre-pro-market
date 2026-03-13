import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";

export default function SearchPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchVendors() {
      setLoading(true);
      let { data, error } = await supabase
        .from("vendors")
        .select("handle, business_name, category, city, state")
        .order("business_name", { ascending: true });

      if (error) {
        console.log("Error fetching vendors:", error.message);
      } else {
        setVendors(data);
      }
      setLoading(false);
    }

    fetchVendors();
  }, []);

  if (loading) return <p className="p-4">Loading vendors...</p>;
  if (!vendors.length) return <p className="p-4">No vendors found.</p>;

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {vendors.map((vendor) => (
        <div
          key={vendor.handle}
          className="p-4 border rounded shadow cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push(`/vendor/${vendor.handle}`)}
        >
          <h2 className="font-bold text-lg">{vendor.business_name}</h2>
          <p className="text-sm text-gray-600">{vendor.category}</p>
          <p className="text-sm text-gray-600">{vendor.city}, {vendor.state}</p>
        </div>
      ))}
    </div>
  );
}
