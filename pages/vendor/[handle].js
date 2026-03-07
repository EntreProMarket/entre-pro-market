import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function VendorPage() {
  const router = useRouter();
  const { handle } = router.query;

  const [vendor, setVendor] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [videos, setVideos] = useState([]);

  // Fetch vendor info
  useEffect(() => {
    if (!handle) return;

    async function fetchVendor() {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("handle", handle)
        .single();

      if (error) {
        console.log("Vendor fetch error:", error.message);
      } else {
        setVendor(data);
      }
    }

    fetchVendor();
  }, [handle]);

  // Fetch portfolio images
  useEffect(() => {
    if (!handle) return;

    async function fetchPortfolio() {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .eq("vendor_handle", handle);

      if (error) {
        console.log("Portfolio fetch error:", error.message);
      } else {
        setPortfolio(data);
      }
    }

    fetchPortfolio();
  }, [handle]);

  // Fetch premium videos (only if vendor is premium)
  useEffect(() => {
    if (!handle || !vendor || !vendor.premium) return;

    async function fetchVideos() {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("vendor_handle", handle);

      if (error) {
        console.log("Videos fetch error:", error.message);
      } else {
        setVideos(data);
      }
    }

    fetchVideos();
  }, [handle, vendor]);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Vendor Page</h1>
      <p>Handle: {handle}</p>

      {vendor && (
        <div>
          <h2>{vendor.business_name}</h2>
          <p>{vendor.bio}</p>
          <p>Status: {vendor.premium ? "Premium Vendor" : "Standard Vendor"}</p>
        </div>
      )}

      {portfolio.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Portfolio Images</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {portfolio.map((item) => (
              <img
                key={item.id}
                src={item.image_url}
                alt={item.caption || "Portfolio Image"}
                style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 5 }}
              />
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Premium Videos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {videos.map((vid) => (
              <video key={vid.id} controls width={300}>
                <source src={vid.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
