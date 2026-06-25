// pages/complete-profile.js
// Shown when a user clicks "Profile" before completing their profile setup.

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function CompleteProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) { router.replace("/"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("role, account_type, handle")
        .eq("id", user.id)
        .single();

      // If they already have a handle, send straight to their profile
      if (data?.handle) {
        if (data.role === "vendor") router.replace(`/vendor/${data.handle}`);
        else if (data.role === "organizer") router.replace(`/organizer/${data.handle}`);
        else router.replace("/home");
        return;
      }

      // ── VENDOR: if they already have a paid tier, skip the warning and
      // send them straight to profile setup — they paid, just need to fill it in
      const paidVendorTiers = ["premium", "featured"];
      if (data?.role === "vendor" && paidVendorTiers.includes(data?.account_type)) {
        router.replace("/vendor-profile");
        return;
      }

      // ── ORGANIZER: if they have a valid paid tier, send to profile setup
      const paidOrgTiers = ["basic", "pro", "elite"];
      if (data?.role === "organizer" && paidOrgTiers.includes(data?.account_type)) {
        router.replace("/organizer-profile");
        return;
      }

      setProfile(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <p style={{ color: "#888" }}>Loading...</p>
    </div>
  );

  const isVendor = profile?.role === "vendor";
  const isOrganizer = profile?.role === "organizer";

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 20px", fontFamily: "sans-serif",
      backgroundColor: "#fafafa", textAlign: "center",
    }}>
      <img src="/logo-transparent.png" alt="Entre PRO Market" style={{ width: 120, marginBottom: 24 }} />

      {/* VENDOR — on free tier, prompt to upgrade or continue free */}
      {isVendor && (
        <>
          <div style={{ fontSize: 52, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ color: "#333", margin: "0 0 10px", fontSize: 22 }}>Your profile isn't set up yet</h2>
          <p style={{ color: "#666", fontSize: 14, maxWidth: 320, lineHeight: 1.6, marginBottom: 28 }}>
            It looks like you may have left before completing your signup. You can finish your Premium or Featured plan to unlock full benefits, or set up a free vendor profile now and upgrade anytime.
          </p>
          <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => router.push("/vendor-info")}
              style={{ padding: "14px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}
            >
              🚀 Complete Premium / Featured Signup
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
              <span style={{ color: "#aaa", fontSize: 12 }}>or</span>
              <div style={{ flex: 1, height: 1, backgroundColor: "#ddd" }} />
            </div>
            <button
              onClick={() => router.push("/vendor-profile")}
              style={{ padding: "14px 20px", backgroundColor: "white", color: "#701890", border: "2px solid #701890", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}
            >
              🆓 Continue as Free Vendor
            </button>
            <p style={{ color: "#aaa", fontSize: 11, margin: "4px 0 0", lineHeight: 1.5 }}>
              Free Vendors get a basic marketplace listing. Upgrade to Premium or Featured anytime from your dashboard.
            </p>
          </div>
        </>
      )}

      {/* ORGANIZER — no paid tier confirmed yet */}
      {isOrganizer && (
        <>
          <div style={{ fontSize: 52, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ color: "#333", margin: "0 0 10px", fontSize: 22 }}>Your profile isn't set up yet</h2>
          <p style={{ color: "#666", fontSize: 14, maxWidth: 320, lineHeight: 1.6, marginBottom: 28 }}>
            It looks like your plan payment wasn't completed. Organizer accounts require an active plan to contact vendors and post events. Complete your signup to get started.
          </p>
          <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => router.push("/organizer-info")}
              style={{ padding: "14px 20px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}
            >
              🎪 Complete My Organizer Signup
            </button>
          </div>
        </>
      )}

      {/* NO ROLE */}
      {!isVendor && !isOrganizer && (
        <>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🔒</div>
          <h2 style={{ color: "#333", margin: "0 0 10px", fontSize: 22 }}>No account type selected</h2>
          <p style={{ color: "#666", fontSize: 14, maxWidth: 300, lineHeight: 1.6, marginBottom: 28 }}>
            Choose a role to get started on Entre PRO Market.
          </p>
          <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => router.push("/vendor-info")}
              style={{ padding: "13px 20px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 14, cursor: "pointer" }}>
              🛒 Become a Vendor
            </button>
            <button onClick={() => router.push("/organizer-info")}
              style={{ padding: "13px 20px", backgroundColor: "#333", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 14, cursor: "pointer" }}>
              🎪 Become an Organizer
            </button>
          </div>
        </>
      )}

      <button
        onClick={() => router.push(profile?.role === "vendor" ? "/vendor-dashboard" : profile?.role === "organizer" ? "/organizer-dashboard" : "/home")}
        style={{ marginTop: 28, background: "none", border: "none", color: "#aaa", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}
