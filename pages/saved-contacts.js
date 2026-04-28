// pages/saved-contacts.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import DashboardLayout from "../components/DashboardLayout";

export default function SavedContacts() {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) { router.replace("/"); return; }

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData);

      const { data: savedData } = await supabase
        .from("saved_contacts")
        .select("*, contact:contact_id(id, business_name, organizer_name, logo_url, role, handle, account_type, category, city, state, website, instagram, facebook, x_twitter, tiktok, youtube)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setContacts(savedData || []);
      setLoading(false);
    };
    load();
  }, []);

  const removeContact = async (contactId) => {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("saved_contacts")
      .delete()
      .eq("user_id", userData?.user?.id)
      .eq("contact_id", contactId);
    setContacts(contacts.filter(c => c.contact_id !== contactId));
  };

  const getName = (c) => c?.business_name || c?.organizer_name || "Unknown";

  const tierLabel = (accountType) => {
    if (accountType === "featured") return { label: "🔥 FEATURED", bg: "#f9ffe8", color: "#888B00", border: "#AABB23" };
    if (accountType === "premium")  return { label: "💜 PREMIUM",  bg: "#f3e8ff", color: "#701890", border: "#701890" };
    return null;
  };

  const filteredContacts = contacts.filter(saved => {
    const c = saved.contact;
    if (!c) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      getName(c).toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.role?.toLowerCase().includes(q)
    );
  });

  if (loading) return <DashboardLayout><div style={{ padding: 20 }}>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 700, fontFamily: "sans-serif" }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => router.back()}
            style={{ padding: "8px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
            ← Back
          </button>
          <h1 style={{ margin: 0 }}>💾 Saved Contacts</h1>
        </div>

        {/* SEARCH — only show if there are contacts */}
        {contacts.length > 0 && (
          <input
            type="text"
            placeholder="🔍 Search by name, category, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              display: "block", width: "100%", padding: "11px 14px",
              borderRadius: 8, border: "1px solid #ddd", fontSize: 14,
              marginBottom: 16, boxSizing: "border-box",
            }}
          />
        )}

        {/* COUNT */}
        {contacts.length > 0 && (
          <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
            {filteredContacts.length} of {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* EMPTY STATE */}
        {contacts.length === 0 ? (
          <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 12, padding: 48, textAlign: "center" }}>
            <p style={{ fontSize: 48, margin: "0 0 12px" }}>📋</p>
            <h3 style={{ margin: "0 0 8px" }}>No saved contacts yet</h3>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>
              Visit vendor or organizer profiles and tap "Save Contact" to add them here.
            </p>
            <button onClick={() => router.push("/marketplace")}
              style={{ padding: "12px 24px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 30, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
              Browse Marketplace
            </button>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
            <p style={{ fontSize: 32 }}>🔍</p>
            <p>No contacts match your search.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredContacts.map(saved => {
              const c = saved.contact;
              if (!c) return null;
              const tier = tierLabel(c.account_type);
              const borderColor = c.role === "vendor" ? "#701890" : "#AABB23";

              return (
                <div key={saved.id} style={{
                  backgroundColor: "white",
                  border: "1px solid #eee",
                  borderLeft: `4px solid ${borderColor}`,
                  borderRadius: 10,
                  padding: "16px",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                }}>

                  {/* TOP ROW — avatar + info + remove */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>

                    {/* AVATAR */}
                    {c.logo_url ? (
                      <img src={c.logo_url} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: "#f0e8ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                        👤
                      </div>
                    )}

                    {/* INFO */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                        <strong style={{ fontSize: 15 }}>{getName(c)}</strong>
                        {/* ROLE BADGE */}
                        <span style={{
                          fontSize: 10, fontWeight: "bold", padding: "2px 7px", borderRadius: 10,
                          backgroundColor: c.role === "vendor" ? "#f3e8ff" : "#f9ffe8",
                          color: c.role === "vendor" ? "#701890" : "#888B00",
                        }}>
                          {c.role?.toUpperCase()}
                        </span>
                        {/* TIER BADGE */}
                        {tier && (
                          <span style={{
                            fontSize: 10, fontWeight: "bold", padding: "2px 7px", borderRadius: 10,
                            backgroundColor: tier.bg, color: tier.color,
                            border: `1px solid ${tier.border}`,
                          }}>
                            {tier.label}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                        {c.category && `${c.category} · `}{c.city}{c.state ? `, ${c.state}` : ""}
                      </p>
                    </div>

                    {/* REMOVE */}
                    <button
                      onClick={() => removeContact(c.id)}
                      style={{ padding: "6px 10px", backgroundColor: "white", color: "#cc0000", border: "1px solid #fca5a5", borderRadius: 6, cursor: "pointer", fontSize: 13, flexShrink: 0 }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* SOCIAL LINKS ROW */}
                  {(c.website || c.instagram || c.facebook || c.tiktok || c.youtube || c.x_twitter) && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      {c.website    && <a href={c.website}   target="_blank" rel="noopener noreferrer" style={socialBtn}>🌐 Web</a>}
                      {c.instagram  && <a href={c.instagram} target="_blank" rel="noopener noreferrer" style={socialBtn}>📸 IG</a>}
                      {c.facebook   && <a href={c.facebook}  target="_blank" rel="noopener noreferrer" style={socialBtn}>👥 FB</a>}
                      {c.tiktok     && <a href={c.tiktok}    target="_blank" rel="noopener noreferrer" style={socialBtn}>🎵 TT</a>}
                      {c.youtube    && <a href={c.youtube}   target="_blank" rel="noopener noreferrer" style={socialBtn}>▶️ YT</a>}
                      {c.x_twitter  && <a href={c.x_twitter} target="_blank" rel="noopener noreferrer" style={socialBtn}>𝕏 X</a>}
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => router.push(`/messages?to=${c.id}&from=saved-contacts`)}
                      style={{ flex: 1, padding: "10px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}
                    >
                      ✉️ Message
                    </button>
                    <button
                      onClick={() => router.push(`/${c.role}/${c.handle}`)}
                      style={{ flex: 1, padding: "10px", backgroundColor: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}
                    >
                      👤 View Profile
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

const socialBtn = {
  fontSize: 11,
  fontWeight: "bold",
  padding: "4px 10px",
  borderRadius: 20,
  backgroundColor: "#f5f5f5",
  color: "#444",
  border: "1px solid #e0e0e0",
  textDecoration: "none",
  display: "inline-block",
};
