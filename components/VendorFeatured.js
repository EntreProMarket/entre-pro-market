import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function VendorFeatured() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const loadFeatured = async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("is_featured", true)
        .order("featured_order", { ascending: true });

      if (error) {
        console.error("Error fetching featured vendors:", error);
        setVendors([]);
      } else {
        setVendors(data || []);
      }
      setLoading(false);
    };

    loadFeatured();
  }, []);

  if (loading) return <p style={{ padding: 40 }}>Loading featured vendors...</p>;
  if (vendors.length === 0) return <p style={{ padding: 40 }}>No featured vendors yet.</p>;

  const scrollLeft = () => {
    containerRef.current.scrollBy({ left: -220, behavior: "smooth" });
  };
  const scrollRight = () => {
    containerRef.current.scrollBy({ left: 220, behavior: "smooth" });
  };

  return (
    <div style={{ maxWidth: 1000, margin: "auto", padding: 40, position: "relative" }}>
      <h2 style={{ fontSize: 24, marginBottom: 20 }}>Featured Vendors</h2>

      {/* Arrows */}
      <button
        onClick={scrollLeft}
        className="mobile-arrow"
      >
        ◀
      </button>
      <button
        onClick={scrollRight}
        className="mobile-arrow"
      >
        ▶
      </button>

      {/* Container */}
      <div
        ref={containerRef}
        className="vendor-container"
      >
        {vendors.map((vendor) => (
          <Link key={vendor.id} href={`/vendor/${vendor.handle}`}>
            <a className="vendor-card">
              {vendor.image_url ? (
                <img src={vendor.image_url} alt={vendor.business_name} className="vendor-img" />
              ) : (
                <div className="vendor-img placeholder">No Image</div>
              )}
              <div className="vendor-info">
                <h3>{vendor.business_name}</h3>
                <p>{vendor.category}</p>
                <p>{vendor.location}</p>
              </div>
            </a>
          </Link>
        ))}
      </div>

      <style jsx>{`
        /* Container: grid desktop, scroll mobile */
        .vendor-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }

        /* Card styling */
        .vendor-card {
          display: block;
          border: 1px solid #ddd;
          border-radius: 10px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .vendor-card:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .vendor-img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eee;
          color: #999;
        }

        .vendor-info {
          padding: 10px;
        }

        .vendor-info h3 {
          margin: 5px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .vendor-info p {
          margin: 2px 0;
          color: #555;
          font-size: 14px;
        }

        /* Mobile tweaks */
        @media (max-width: 768px) {
          .vendor-container {
            display: flex;
            flex-direction: row;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 10px;
            padding: 0 10px;
          }

          .vendor-card {
            min-width: 180px;
            scroll-snap-align: start;
          }

          .mobile-arrow {
            display: block;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            z-index: 10;
            cursor: pointer;
          }

          .mobile-arrow:first-of-type { left: 0; }
          .mobile-arrow:last-of-type { right: 0; }
        }

        /* Hide arrows on desktop */
        @media (min-width: 769px) {
          .mobile-arrow { display: none; }
        }
      `}</style>
    </div>
  );
}
