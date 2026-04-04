// pages/vendor-dashboard.js

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import DashboardLayout from "../components/DashboardLayout";

export default function VendorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        router.replace("/");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      setLoading(false);
    };

    loadUser();
  }, [router]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  const tier = profile?.account_type || "free";

  const tierConfig = {
    free:    { label: "Free",    color: "#888",    bg: "#f5f5f5" },
    pro:     { label: "Pro",     color: "#701890", bg: "#f3e8ff" },
    premium: { label: "Premium", color: "#AABB23", bg: "#f9ffe8" },
  };

  const { label, color, bg } = tierConfig[tier] || tierConfig.free;

  // Profile completion check
  const fields = [
    profile?.business_name,
    profile?.category,
    profile?.city,
    profile?.description,
    profile?.logo_url,
    profile?.portfolio_images?.length > 0,
    profile?.website || profile?.instagram || profile?.facebook,
  ];
  const completed = fields.filter(Boolean).length;
  const total = fields.length;
  const percent = Math.round((completed / total) * 100);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 700, fontFamily: "sans-serif" }}>

        {/* WELCOME */}
        <h1 style={{ marginBottom: 4 }}>Vendor Dashboard</h1>
        <p style={{ color: "#666", marginBottom: 24 }}>
          Welcome back, <strong>{profile?.business_name || "Vendor"}</strong>
        </p>

        {/* TIER BADGE */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          backgroundColor: bg,
          border: `1px solid ${color}`,
          borderRadius: 20,
          padding: "6px 16px",
          marginBottom: 24,
        }}>
          <span style={{ fontSize: 16 }}>
            {tier === "free" ? "🆓" : tier === "pro" ? "💼" : "👑"}
          </span>
          <span style={{ color, fontWeight: "bold", fontSize: 14 }}>
            {label} Vendor
          </span>
        </div>

        {/* UPGRADE PROMPT */}
        {tier === "free" && (
          <div style={{
            backgroundColor: "#f3e8ff",
            border: "1px solid #701890",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 24,
          }}>
            <p style={{ margin: 0, fontWeight: "bold", color: "#701890", marginBottom: 8 }}>
              ⬆️ Upgrade to Pro or Premium
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#555", marginBottom: 12 }}>
              Pro gives you increased visibility. Premium lets you contact Organizers directly and get featured in search.
            </p>
            <button
              onClick={() => router.push("/upgrade")}
              style={{ padding: "10px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}
            >
              View Upgrade Options
            </button>
          </div>
        )}

        {tier === "pro" && (
          <div style={{
            backgroundColor: "#f9ffe8",
            border: "1px solid #AABB23",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 24,
          }}>
            <p style={{ margin: 0, fontWeight: "bold", color: "#888B00", marginBottom: 8 }}>
              👑 Upgrade to Premium
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#555", marginBottom: 12 }}>
              Premium Vendors can view and contact Organizers directly to book events and opportunities.
            </p>
            <button
              onClick={() => router.push("/upgrade")}
              style={{ padding: "10px 20px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}
            >
              Upgrade to Premium
            </button>
          </div>
        )}

        {/* PROFILE COMPLETION */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid #eee",
          borderRadius: 10,
          padding: "16px 20px",
          marginBottom: 24,
        }}>
          <p style={{ margin: 0, fontWeight: "bold", marginBottom: 10 }}>
            📋 Profile Completion — {percent}%
          </p>
          <div style={{ backgroundColor: "#eee", borderRadius: 20, height: 10, overflow: "hidden" }}>
            <div style={{
              width: `${percent}%`,
              height: "100%",
              backgroundColor: percent === 100 ? "#AABB23" : "#701890",
              borderRadius: 20,
              transition: "width 0.4s ease",
            }} />
          </div>
          {percent < 100 && (
            <p style={{ fontSize: 12, color: "#888", marginTop: 8, marginBottom: 0 }}>
              Complete your profile to attract more Organizers and customers.{" "}
              <span
                onClick={() => router.push("/vendor-profile")}
                style={{ color: "#701890", cursor: "pointer", textDecoration: "underline" }}
              >
                Edit Profile
              </span>
            </p>
          )}
          {percent === 100 && (
            <p style={{ fontSize: 12, color: "#AABB23", marginTop: 8, marginBottom: 0, fontWeight: "bold" }}>
              ✅ Profile is fully complete!
            </p>
          )}
        </div>

        {/* STATS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}>
          <div style={{ backgroundColor: "#fff", border: "1px solid #eee", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: "bold", color: "#701890", margin: 0 }}>—</p>
            <p style={{ fontSize: 13, color: "#888", margin: 0, marginTop: 4 }}>Profile Views</p>
          </div>
          <div style={{ backgroundColor: "#fff", border: "1px solid #eee", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: "bold", color: "#701890", margin: 0 }}>—</p>
            <p style={{ fontSize: 13, color: "#888", margin: 0, marginTop: 4 }}>Contacts Received</p>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "#aaa" }}>
          📊 Stats tracking coming soon.
        </p>

      </div>
    </DashboardLayout>
  );
}
