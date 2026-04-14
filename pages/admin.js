// pages/admin.js
// Only accessible to users with is_admin = true

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

const TABS = ["Overview", "Plans & Pricing", "Users", "Featured Vendors", "Premium Vendors", "Ads", "Reports", "Settings"];

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [stats, setStats] = useState({});
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [ads, setAds] = useState([]);
  const [reports, setReports] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkAdmin();

    // ✅ FREEZE BACKSPACING — admin panel stays put
    const freezeBack = () => {
      window.history.pushState(null, document.title, window.location.href);
    };
    freezeBack();
    window.addEventListener("popstate", freezeBack);
    return () => window.removeEventListener("popstate", freezeBack);
  }, []);

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) { router.replace("/"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      router.replace("/");
      return;
    }

    await loadAllData();
    setLoading(false);
  };

  const loadAllData = async () => {
    // Load stats
    const { count: totalVendors } = await supabase
      .from("profiles").select("*", { count: "exact", head: true })
      .eq("role", "vendor");

    const { count: totalOrganizers } = await supabase
      .from("profiles").select("*", { count: "exact", head: true })
      .eq("role", "organizer");

    const { count: premiumVendors } = await supabase
      .from("profiles").select("*", { count: "exact", head: true })
      .eq("role", "vendor").eq("account_type", "premium");

    const { count: featuredVendors } = await supabase
      .from("profiles").select("*", { count: "exact", head: true })
      .eq("role", "vendor").eq("account_type", "featured");

    setStats({
      totalVendors: totalVendors || 0,
      totalOrganizers: totalOrganizers || 0,
      premiumVendors: premiumVendors || 0,
      featuredVendors: featuredVendors || 0,
    });

    // Load plans
    const { data: plansData } = await supabase
      .from("plans")
      .select("*")
      .order("role", { ascending: true })
      .order("sort_order", { ascending: true });
    setPlans(plansData || []);

    // Load all users via RPC (bypasses RLS)
    const { data: usersData, error: usersError } = await supabase
      .rpc("get_all_profiles");
    if (usersError) console.log("Users error:", usersError);
    setUsers(usersData || []);

    // Load ads
    const { data: adsData } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });
    setAds(adsData || []);

    // Load reports
    const { data: reportsData } = await supabase
      .from("reports")
      .select("*, reporter:reporter_id(business_name, organizer_name, handle), message:message_id(content, sender_id, recipient_id)")
      .order("created_at", { ascending: false });
    setReports(reportsData || []);
  };

  const savePlan = async (plan) => {
    setSaving(true);
    setMessage("");
    const { error } = await supabase
      .from("plans")
      .update({
        name: plan.name,
        price: plan.price,
        description: plan.description,
        features: plan.features,
      })
      .eq("id", plan.id);

    if (error) {
      setMessage("❌ Error saving plan: " + error.message);
    } else {
      setMessage("✅ Plan saved!");
    }
    setSaving(false);
  };

  const updateUserTier = async (userId, newAccountType) => {
    const { error } = await supabase
      .from("profiles")
      .update({ account_type: newAccountType })
      .eq("id", userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, account_type: newAccountType } : u));
      setMessage("✅ User tier updated!");
    } else {
      setMessage("❌ Error: " + error.message);
    }
  };

  const suspendUser = async (userId, suspended) => {
    const { error } = await supabase
      .from("profiles")
      .update({ suspended })
      .eq("id", userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, suspended } : u));
      setMessage(suspended ? "✅ User suspended" : "✅ User reinstated");
    }
  };

  const saveAd = async (ad) => {
    setSaving(true);
    const { error } = await supabase
      .from("ads")
      .update({ title: ad.title, body: ad.body, link: ad.link, active: ad.active })
      .eq("id", ad.id);
    if (!error) setMessage("✅ Ad saved!");
    else setMessage("❌ Error: " + error.message);
    setSaving(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading Admin Panel...</div>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", fontFamily: "sans-serif" }}>

      {/* TOP BAR */}
      <div style={{
        backgroundColor: "#111",
        color: "white",
        padding: "14px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => window.location.replace('/home')}
            style={{
              background: "none",
              border: "1px solid #555",
              color: "white",
              padding: "6px 12px",
              borderRadius: 20,
              cursor: "pointer",
              fontSize: 12,
              whiteSpace: "nowrap",
            }}
          >
            ← Home
          </button>
          <span style={{ fontWeight: "bold", fontSize: 16, whiteSpace: "nowrap" }}>Entre PRO Market</span>
          <span style={{
            backgroundColor: "#701890",
            color: "white",
            fontSize: 10,
            padding: "3px 8px",
            borderRadius: 10,
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}>
            ADMIN
          </span>
        </div>
        <button
          onClick={logout}
          style={{
            padding: "6px 14px",
            backgroundColor: "#ff6b6b",
            color: "white",
            border: "1px solid #ff6b6b",
            borderRadius: 20,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          Log Out
        </button>
      </div>

      {/* TABS */}
      <div style={{
        backgroundColor: "white",
        borderBottom: "1px solid #eee",
        display: "flex",
        overflowX: "auto",
        padding: "0 24px",
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "14px 18px",
              border: "none",
              borderBottom: activeTab === tab ? "3px solid #701890" : "3px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === tab ? "#701890" : "#666",
              fontWeight: activeTab === tab ? "bold" : "normal",
              cursor: "pointer",
              fontSize: 14,
              whiteSpace: "nowrap",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* MESSAGE */}
      {message && (
        <div style={{
          margin: "16px 24px 0",
          padding: "12px 16px",
          backgroundColor: message.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${message.startsWith("✅") ? "#86efac" : "#fca5a5"}`,
          borderRadius: 8,
          color: message.startsWith("✅") ? "#166534" : "#991b1b",
          fontWeight: "bold",
        }}>
          {message}
        </div>
      )}

      {/* CONTENT */}
      <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "Overview" && (
          <div>
            <h2 style={{ marginBottom: 20 }}>📊 Overview</h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}>
              {[
                { label: "Total Vendors", value: stats.totalVendors, color: "#701890" },
                { label: "Total Organizers", value: stats.totalOrganizers, color: "#AABB23" },
                { label: "Premium Vendors", value: stats.premiumVendors, color: "#701890" },
                { label: "Featured Vendors", value: stats.featuredVendors, color: "#AABB23" },
              ].map(stat => (
                <div key={stat.label} style={{
                  backgroundColor: "white",
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: "20px 16px",
                  textAlign: "center",
                }}>
                  <p style={{ fontSize: 32, fontWeight: "bold", color: stat.color, margin: 0 }}>
                    {stat.value}
                  </p>
                  <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div style={{
              backgroundColor: "white",
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 20,
            }}>
              <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { label: "Manage Users", tab: "Users" },
                  { label: "Edit Prices", tab: "Plans & Pricing" },
                  { label: "Manage Ads", tab: "Ads" },
                  { label: "🔥 Featured Vendors", tab: "Featured Vendors" },
                ].map(action => (
                  <button
                    key={action.label}
                    onClick={() => setActiveTab(action.tab)}
                    style={{
                      padding: "10px 18px",
                      backgroundColor: "#701890",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    {action.label}
                  </button>
                ))}
                {/* ✅ PUBLIC VIEW BUTTONS */}
                <button
                  onClick={() => window.open("/marketplace", "_blank")}
                  style={{
                    padding: "10px 18px",
                    backgroundColor: "#AABB23",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: 13,
                  }}
                >
                  👁️ Preview Marketplace
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PLANS & PRICING TAB ── */}
        {activeTab === "Plans & Pricing" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>💰 Plans & Pricing</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
              Edit prices and features here — changes go live immediately across the entire app.
            </p>

            {plans.length === 0 ? (
              <div style={{
                backgroundColor: "white",
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 30,
                textAlign: "center",
                color: "#888",
              }}>
                <p>No plans found. Run the plans table SQL in Supabase first.</p>
                <code style={{ fontSize: 12, backgroundColor: "#f5f5f5", padding: "4px 8px", borderRadius: 4 }}>
                  See the SQL file provided with this build.
                </code>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {plans.map((plan, i) => (
                  <div key={plan.id} style={{
                    backgroundColor: "white",
                    border: "1px solid #eee",
                    borderRadius: 10,
                    padding: 20,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div>
                        <span style={{
                          fontSize: 11,
                          backgroundColor: plan.role === "vendor" ? "#f3e8ff" : "#f9ffe8",
                          color: plan.role === "vendor" ? "#701890" : "#888B00",
                          padding: "3px 8px",
                          borderRadius: 10,
                          fontWeight: "bold",
                          marginRight: 8,
                        }}>
                          {plan.role?.toUpperCase()}
                        </span>
                        <strong style={{ fontSize: 16 }}>{plan.name}</strong>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={labelStyle}>Plan Name</label>
                        <input
                          value={plan.name || ""}
                          onChange={e => setPlans(plans.map((p, idx) => idx === i ? { ...p, name: e.target.value } : p))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Price ($ per month)</label>
                        <input
                          type="number"
                          value={plan.price || ""}
                          onChange={e => setPlans(plans.map((p, idx) => idx === i ? { ...p, price: e.target.value } : p))}
                          style={inputStyle}
                          placeholder="0 = Free"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={labelStyle}>Description (shown to users)</label>
                      <input
                        value={plan.description || ""}
                        onChange={e => setPlans(plans.map((p, idx) => idx === i ? { ...p, description: e.target.value } : p))}
                        style={inputStyle}
                        placeholder="Short description of this plan"
                      />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={labelStyle}>Features (one per line)</label>
                      <textarea
                        value={Array.isArray(plan.features) ? plan.features.join("\n") : plan.features || ""}
                        onChange={e => setPlans(plans.map((p, idx) => idx === i ? { ...p, features: e.target.value.split("\n") } : p))}
                        rows={4}
                        style={{ ...inputStyle, resize: "vertical" }}
                        placeholder="Create profile&#10;Sell products&#10;Contact info hidden"
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => savePlan(plan)}
                        disabled={saving}
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#701890",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        {saving ? "Saving..." : "Save Plan"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === "Users" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>👥 Users</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
              Manage user tiers, suspend accounts, and view all profiles.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: "#111", color: "white" }}>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Tier</th>
                    <th style={thStyle}>Change Tier</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === "vendor" || u.role === "organizer").map((user, i) => (
                    <tr key={user.id} style={{ backgroundColor: i % 2 === 0 ? "#f9f9f9" : "white" }}>
                      <td style={tdStyle}>
                        <strong>{user.business_name || user.organizer_name || "—"}</strong>
                        <br />
                        <span style={{ fontSize: 11, color: "#888" }}>@{user.handle}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: "bold",
                          backgroundColor: user.role === "vendor" ? "#f3e8ff" : "#f9ffe8",
                          color: user.role === "vendor" ? "#701890" : "#888B00",
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={tdStyle}>{user.account_type || "free"}</td>
                      <td style={tdStyle}>
                        <select
                          value={user.account_type || "free"}
                          onChange={e => updateUserTier(user.id, e.target.value)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          {user.role === "vendor" ? (
                            <>
                              <option value="free">Free</option>
                              <option value="premium">Premium</option>
                              <option value="featured">Featured</option>
                            </>
                          ) : (
                            <>
                              <option value="basic">Basic</option>
                              <option value="pro">Pro</option>
                              <option value="elite">Elite</option>
                            </>
                          )}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          color: user.suspended ? "#cc0000" : "#16a34a",
                          fontWeight: "bold",
                          fontSize: 12,
                        }}>
                          {user.suspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => { window.location.assign(`/${user.role}/${user.handle}`); }}
                          style={smallBtnStyle}
                        >
                          View
                        </button>
                        <button
                          onClick={() => suspendUser(user.id, !user.suspended)}
                          style={{
                            ...smallBtnStyle,
                            backgroundColor: user.suspended ? "#16a34a" : "#cc0000",
                            marginLeft: 6,
                          }}
                        >
                          {user.suspended ? "Reinstate" : "Suspend"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FEATURED TAB ── */}
        {activeTab === "Featured Vendors" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>🔥 Featured Vendors</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
              Featured vendors appear at the very top of the marketplace with a highlighted card and 🔥 badge.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {users.filter(u => u.role === "vendor").map((user, i) => (
                <div key={user.id} style={{
                  backgroundColor: "white",
                  border: `1px solid ${user.account_type === "featured" ? "#AABB23" : "#eee"}`,
                  borderRadius: 10,
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {user.logo_url && (
                      <img src={user.logo_url} alt="logo" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
                    )}
                    <div>
                      <strong>{user.business_name}</strong>
                      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{user.category} · {user.city}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize: 12,
                      color: user.account_type === "featured" ? "#AABB23" : "#888",
                      fontWeight: "bold",
                    }}>
                      {user.account_type === "featured" ? "👑 Featured" : user.account_type}
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => updateUserTier(user.id, user.account_type === "featured" ? "free" : "featured")}
                        style={{
                          padding: "8px 14px",
                          backgroundColor: user.account_type === "featured" ? "#ccc" : "#AABB23",
                          color: user.account_type === "featured" ? "#333" : "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: 12,
                        }}
                      >
                        {user.account_type === "featured" ? "Remove Featured" : "🔥 Make Featured"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PREMIUM VENDORS TAB ── */}
        {activeTab === "Premium Vendors" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>💜 Premium Vendors</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
              Premium vendors appear with a 💜 badge in the marketplace. Manage upgrades and downgrades here.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {users.filter(u => u.role === "vendor").map((user, i) => (
                <div key={user.id} style={{
                  backgroundColor: "white",
                  border: `1px solid ${user.account_type === "premium" ? "#701890" : "#eee"}`,
                  borderRadius: 10,
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {user.logo_url && (
                      <img src={user.logo_url} alt="logo" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
                    )}
                    <div>
                      <strong>{user.business_name || "—"}</strong>
                      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{user.category} · {user.city}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: user.account_type === "premium" ? "#701890" : "#888", fontWeight: "bold" }}>
                      {user.account_type === "premium" ? "💜 Premium" : user.account_type}
                    </span>
                    <button
                      onClick={() => updateUserTier(user.id, user.account_type === "premium" ? "free" : "premium")}
                      style={{
                        padding: "8px 14px",
                        backgroundColor: user.account_type === "premium" ? "#ccc" : "#701890",
                        color: user.account_type === "premium" ? "#333" : "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      {user.account_type === "premium" ? "Remove Premium" : "💜 Make Premium"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ADS TAB ── */}
        {activeTab === "Ads" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>📢 Ad Management</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
              Edit the ad banners that appear across the marketplace and public pages.
            </p>

            {ads.length === 0 ? (
              <div style={{
                backgroundColor: "white",
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 30,
                textAlign: "center",
                color: "#888",
              }}>
                <p>No ads found. Run the ads table SQL to get started.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {ads.map((ad, i) => (
                  <div key={ad.id} style={{
                    backgroundColor: "white",
                    border: "1px solid #eee",
                    borderRadius: 10,
                    padding: 20,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                      <strong>Ad Slot: {ad.slot || `#${i + 1}`}</strong>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={ad.active || false}
                          onChange={e => setAds(ads.map((a, idx) => idx === i ? { ...a, active: e.target.checked } : a))}
                        />
                        Active
                      </label>
                    </div>
                    <label style={labelStyle}>Headline</label>
                    <input
                      value={ad.title || ""}
                      onChange={e => setAds(ads.map((a, idx) => idx === i ? { ...a, title: e.target.value } : a))}
                      style={inputStyle}
                    />
                    <label style={labelStyle}>Body Text</label>
                    <input
                      value={ad.body || ""}
                      onChange={e => setAds(ads.map((a, idx) => idx === i ? { ...a, body: e.target.value } : a))}
                      style={inputStyle}
                    />
                    <label style={labelStyle}>Link URL</label>
                    <input
                      value={ad.link || ""}
                      onChange={e => setAds(ads.map((a, idx) => idx === i ? { ...a, link: e.target.value } : a))}
                      style={inputStyle}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                      <button
                        onClick={() => saveAd(ad)}
                        disabled={saving}
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#701890",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        {saving ? "Saving..." : "Save Ad"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {activeTab === "Reports" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>🚩 Reports</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
              User-submitted reports about messages. Review and take action.
            </p>

            {reports.length === 0 ? (
              <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 30, textAlign: "center", color: "#888" }}>
                <p>No reports yet. 🎉</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reports.map((report, i) => (
                  <div key={report.id} style={{
                    backgroundColor: "white",
                    border: `1px solid ${report.status === "pending" ? "#fca5a5" : "#eee"}`,
                    borderRadius: 10, padding: 16,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <strong style={{ fontSize: 14 }}>
                          {report.reporter?.business_name || report.reporter?.organizer_name || "Unknown"} reported a message
                        </strong>
                        <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                          {new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <span style={{
                        padding: "4px 10px", borderRadius: 10, fontSize: 11, fontWeight: "bold",
                        backgroundColor: report.status === "pending" ? "#fef2f2" : report.status === "resolved" ? "#f0fdf4" : "#f9ffe8",
                        color: report.status === "pending" ? "#991b1b" : report.status === "resolved" ? "#166534" : "#888B00",
                      }}>
                        {report.status?.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ backgroundColor: "#f9f9f9", borderRadius: 6, padding: "10px 14px", marginBottom: 12 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                        <strong>Reason:</strong> {report.reason}
                      </p>
                      {report.message?.content && (
                        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#444", fontStyle: "italic" }}>
                          Message: "{report.message.content}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        onClick={async () => {
                          await supabase.from("reports").update({ status: "reviewed" }).eq("id", report.id);
                          setReports(reports.map(r => r.id === report.id ? { ...r, status: "reviewed" } : r));
                          setMessage("✅ Marked as reviewed");
                        }}
                        style={{ padding: "7px 14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}
                      >
                        Mark Reviewed
                      </button>
                      <button
                        onClick={async () => {
                          await supabase.from("reports").update({ status: "resolved" }).eq("id", report.id);
                          setReports(reports.map(r => r.id === report.id ? { ...r, status: "resolved" } : r));
                          setMessage("✅ Marked as resolved");
                        }}
                        style={{ padding: "7px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === "Settings" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>⚙️ Settings</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
              Global app settings and configuration.
            </p>

            <div style={{
              backgroundColor: "white",
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 20,
              marginBottom: 16,
            }}>
              <h3 style={{ marginTop: 0 }}>App Links</h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => window.location.replace('/home')} style={smallBtnStyle}>Homepage</button>
                <button onClick={() => { window.location.assign('/marketplace'); }} style={smallBtnStyle}>Marketplace</button>
                <button onClick={() => { window.location.assign('/vendor-info'); }} style={smallBtnStyle}>Vendor Info Page</button>
                <button onClick={() => { window.location.assign('/organizer-info'); }} style={smallBtnStyle}>Organizer Info Page</button>
              </div>
            </div>

            <div style={{
              backgroundColor: "#fff8e1",
              border: "1px solid #f0c040",
              borderRadius: 10,
              padding: 20,
            }}>
              <h3 style={{ marginTop: 0, color: "#856404" }}>⚠️ Danger Zone</h3>
              <p style={{ fontSize: 13, color: "#856404" }}>
                These actions are irreversible. Use with caution.
              </p>
              <button
                onClick={async () => {
                  if (confirm("Delete all NULL profiles? This cannot be undone.")) {
                    await supabase.from("profiles").delete().is("business_name", null).eq("role", "vendor");
                    setMessage("✅ Null vendor profiles deleted");
                    await loadAllData();
                  }
                }}
                style={{
                  padding: "10px 18px",
                  backgroundColor: "#cc0000",
                  color: "white",
                  border: "none",
                          borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: 13,
                }}
              >
                🗑️ Delete Incomplete Profiles
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const inputStyle = {
  display: "block", width: "100%", padding: "10px 12px",
  borderRadius: 6, border: "1px solid #d1d5db",
  fontSize: 14, marginBottom: 12, boxSizing: "border-box",
};
const labelStyle = {
  display: "block", fontWeight: "bold",
  marginBottom: 5, fontSize: 13, color: "#333",
};
const thStyle = {
  padding: "12px 14px", textAlign: "left",
  fontWeight: "bold", whiteSpace: "nowrap",
};
const tdStyle = {
  padding: "12px 14px", borderBottom: "1px solid #eee", verticalAlign: "middle",
};
const smallBtnStyle = {
  padding: "6px 12px", backgroundColor: "#701890", color: "white",
  border: "none", borderRadius: 6, cursor: "pointer",
  fontWeight: "bold", fontSize: 12,
};
