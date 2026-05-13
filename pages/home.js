// pages/home.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [featuredVendors, setFeaturedVendors] = useState([]);
  const [eliteEvents, setEliteEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) { router.replace("/"); return; }

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData);

      // ── SHUFFLED featured vendors ──
      const { data: vendors } = await supabase
        .from("profiles").select("*").eq("role", "vendor").eq("account_type", "featured")
        .not("business_name", "is", null);
      if (vendors && vendors.length > 0) {
        const shuffled = [...vendors].sort(() => Math.random() - 0.5);
        setFeaturedVendors(shuffled.slice(0, 6));
      }

      // ── ELITE ORGANIZER EVENTS ──
      const { data: eventsData } = await supabase
        .from("organizer_events")
        .select("*, organizer:organizer_id(organizer_name, handle, logo_url, account_type)")
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true })
        .limit(6);
      // Only show events from elite organizers
      const eliteOnly = (eventsData || []).filter(e => e.organizer?.account_type === "elite");
      setEliteEvents(eliteOnly);

      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif" }}>

      {/* TOP NAV */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #eee", backgroundColor: "white", position: "sticky", top: 0, zIndex: 10 }}>
        <img src="/logo-transparent.png" alt="EntreProMarket" style={{ width: 90, borderRadius: "50%", objectFit: "contain" }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {profile?.role === "vendor" && (
            <button onClick={() => router.push("/vendor-dashboard")} style={{ padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>📊 Dashboard</button>
          )}
          {profile?.role === "organizer" && (
            <button onClick={() => router.push("/organizer-dashboard")} style={{ padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>📊 Dashboard</button>
          )}
          <button onClick={() => router.push("/marketplace")} style={{ padding: "8px 16px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>🛒 Marketplace</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.replace("/"); }} style={{ padding: "8px 16px", backgroundColor: "white", color: "#666", border: "1px solid #ddd", borderRadius: 20, cursor: "pointer", fontSize: 13 }}>Log Out</button>
        </div>
      </div>

      <div style={{ padding: 20 }}>

        {/* WELCOME BANNER for public users with no role */}
        {profile && !profile.role && (
          <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "14px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <p style={{ margin: 0, fontWeight: "bold", color: "#166534", fontSize: 14 }}>👋 Welcome to EntreProMarket!</p>
              <p style={{ margin: 0, fontSize: 12, color: "#555" }}>Join as a Vendor or Organizer to unlock all features.</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => router.push("/vendor-info")} style={{ padding: "8px 14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, fontWeight: "bold", fontSize: 12, cursor: "pointer" }}>🛒 Become a Vendor</button>
              <button onClick={() => router.push("/organizer-info")} style={{ padding: "8px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, fontWeight: "bold", fontSize: 12, cursor: "pointer" }}>🎪 Become an Organizer</button>
            </div>
          </div>
        )}

        {/* HERO */}
        <div style={{ background: "linear-gradient(135deg, #701890, #9b2fc4)", borderRadius: 16, padding: "32px 24px", marginBottom: 28, textAlign: "center", color: "white" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>Welcome to Entre PRO Market</h1>
          <p style={{ margin: "0 0 20px", opacity: 0.9, fontSize: 15 }}>Connecting vendors with event organizers</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/marketplace")} style={{ padding: "12px 24px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>🔍 Browse Vendors</button>
            <button onClick={() => router.push("/vendor-info")} style={{ padding: "12px 24px", backgroundColor: "white", color: "#701890", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>🛒 Become a Vendor</button>
            <button onClick={() => router.push("/organizer-info")} style={{ padding: "12px 24px", backgroundColor: "rgba(255,255,255,0.2)", color: "white", border: "2px solid rgba(255,255,255,0.5)", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>🎪 Become an Organizer</button>
          </div>
        </div>

        {/* AD BANNER */}
        <div style={{ backgroundColor: "#f9ffe8", border: "1px solid #AABB23", borderRadius: 10, padding: "14px 20px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <p style={{ margin: 0, fontWeight: "bold", color: "#888B00", fontSize: 14 }}>📢 Advertise on EntreProMarket</p>
            <p style={{ margin: 0, fontSize: 12, color: "#888" }}>Reach thousands of vendors and event organizers</p>
          </div>
          <button onClick={() => router.push("/contact")} style={{ padding: "8px 16px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>Learn More</button>
        </div>

        {/* FEATURED VENDORS — shuffled on every visit */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>🔥 Featured Vendors</h2>
            <button onClick={() => router.push("/marketplace")} style={{ background: "none", border: "none", color: "#701890", cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>See all →</button>
          </div>
          {featuredVendors.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {featuredVendors.map(vendor => (
                <div key={vendor.id} onClick={() => router.push(`/vendor/${vendor.handle}`)}
                  style={{ border: "2px solid #AABB23", borderRadius: 12, overflow: "hidden", cursor: "pointer", backgroundColor: "white" }}>
                  <div style={{ height: 120, backgroundColor: "#f4f4f4" }}>
                    {vendor.logo_url ? <img src={vendor.logo_url} alt={vendor.business_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 13 }}>No Image</div>}
                  </div>
                  <div style={{ padding: 12 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>{vendor.business_name}</h3>
                    <p style={{ margin: 0, color: "#888", fontSize: 12 }}>{vendor.category} · {vendor.city}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 24, textAlign: "center", color: "#aaa" }}>
              <p style={{ fontSize: 14, margin: 0 }}>Featured vendors will appear here. 🔥 Coming soon!</p>
            </div>
          )}
        </div>

        {/* ELITE ORGANIZER EVENTS */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>👑 Upcoming Events</h2>
          </div>
          {eliteEvents.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {eliteEvents.map(event => (
                <div key={event.id} onClick={() => router.push(`/organizer/${event.organizer?.handle}`)}
                  style={{ border: "2px solid #AABB23", borderRadius: 12, overflow: "hidden", cursor: "pointer", backgroundColor: "white" }}>
                  <div style={{ height: 140, backgroundColor: "#f4f4f4" }}>
                    {event.flyer_url ? <img src={event.flyer_url} alt={event.event_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 13 }}>No Flyer</div>}
                  </div>
                  <div style={{ padding: 12 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>{event.event_name}</h3>
                    <p style={{ margin: "0 0 2px", fontSize: 12, color: "#701890", fontWeight: "bold" }}>
                      📅 {event.event_date ? new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}
                    </p>
                    {event.venue && <p style={{ margin: 0, color: "#888", fontSize: 12 }}>📍 {event.venue}</p>}
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#AABB23", fontWeight: "bold" }}>by {event.organizer?.organizer_name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 24, textAlign: "center", color: "#aaa" }}>
              <p style={{ fontSize: 14, margin: 0 }}>Elite Organizer events will appear here. 🎪 Coming soon!</p>
            </div>
          )}
        </div>

        {/* COMMUNITY PLACEHOLDER */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>📰 Community & News</h2>
          <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 24, textAlign: "center", color: "#aaa" }}>
            <p style={{ fontSize: 14, margin: 0 }}>Community news, blog posts and event highlights coming soon! 🎉</p>
          </div>
        </div>

      </div>
    </div>
  );
}
