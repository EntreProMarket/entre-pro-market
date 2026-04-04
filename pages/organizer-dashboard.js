// pages/organizer-dashboard.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import DashboardLayout from "../components/DashboardLayout";

export default function OrganizerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        router.push("/");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        router.push("/");
        return;
      }

      setProfile(profileData);

      // Load event count for premium organizers
      if (profileData.account_type === "premium") {
        const { count } = await supabase
          .from("organizer_events")
          .select("*", { count: "exact", head: true })
          .eq("organizer_id", user.id);
        setEventCount(count || 0);
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  const tier = profile?.account_type || "pro";

  const tierConfig = {
    pro:     { label: "Pro",     color: "#701890", bg: "#f3e8ff" },
    premium: { label: "Premium", color: "#AABB23", bg: "#f9ffe8" },
  };

  const { label, color, bg } = tierConfig[tier] || tierConfig.pro;

  // Profile completion check
  const fields = [
    profile?.organizer_name,
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
        <h1 style={{ marginBottom: 4 }}>Organizer Dashboard</h1>
        <p style={{ color: "#666", marginBottom: 24 }}>
          Welcome back, <strong>{profile?.organizer_name || "Organizer"}</strong>
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
            {tier === "pro" ? "💼" : "👑"}
          </span>
          <span style={{ color, fontWeight: "bold", fontSize: 14 }}>
            {label} Organizer
          </span>
        </div>

        {/* UPGRADE PROMPT — Pro only */}
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
              Premium Organizers can post upcoming events on their public profile and promote them to vendors.
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
              A complete profile attracts more vendors.{" "}
              <span
                onClick={() => router.push("/organizer-profile")}
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

        {/* EVENT MANAGER — Premium only */}
        {tier === "premium" && (
          <div style={{
            backgroundColor: "#fff",
            border: "1px solid #AABB23",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 24,
          }}>
            <p style={{ margin: 0, fontWeight: "bold", marginBottom: 4 }}>
              🎪 Your Upcoming Events
            </p>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
              You have <strong>{eventCount}</strong> event{eventCount !== 1 ? "s" : ""} posted on your profile.
            </p>
            <button
              onClick={() => router.push("/organizer-profile")}
              style={{ padding: "10px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}
            >
              Manage Events
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
