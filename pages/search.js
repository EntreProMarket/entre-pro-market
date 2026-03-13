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

      // Fetch vendors and their first portfolio image
      let { data, error } = await supabase
        .from("vendors")
        .select(`
          handle, 
          business_name, 
          category, 
          city, 
          state, 
          premium, 
          featured,
          portfolio:image_url (url)
        `);

      if (error) {
        console.log("Error fetching vendors:", error.message);
      } else {
        // Map each vendor to include only the first portfolio image if exists
        const mapped = data.map((vendor) => ({
          ...vendor,
          thumbnail: vendor.portfolio?.[0]?.url || null,
        }));
        setVendors(mapped);
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
          className="border rounded shadow cursor-pointer hover:shadow-lg transition overflow-hidden"
          onClick={() => router.push(`/vendor/${vendor.handle}`)}
        >
          {/* Thumbnail image */}
          {vendor.thumbnail ? (
            <img
              src={vendor.thumbnail}
              alt={`${vendor.business_name} thumbnail`}
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500">
              No image
            </div>
          )}

          {/* Badge for premium/featured */}
          {(vendor.premium || vendor.featured) && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-xs px-2 py-1 rounded">
              {vendor.premium ? "Premium" : "Featured"}
            </div>
          )}

          {/* Text info */}
          <div className="p-2">
            <h2 className="font-bold text-lg">{vendor.business_name}</h2>
            <p className="text-sm text-gray-600">{vendor.category}</p>
            <p className="text-sm text-gray-600">{vendor.city}, {vendor.state}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
