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

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) { router.replace("/"); return; }

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData);

      // Load saved contacts with their profile info
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

  if (loading) return <DashboardLayout><div style={{ padding: 20 }}>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 700, fontFamily: "sans-serif" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => router.back()}
            style={{ padding: "8px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
            ← Back
          </button>
          <h1 style={{ margin: 0 }}>💾 Saved Contacts</h1>
        </div>

        {contacts.length === 0 ? (
          <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 40, margin: 0 }}>📋</p>
            <h3>No saved contacts yet</h3>
            <p style={{ color: "#888", fontSize: 13 }}>
              Visit vendor or organizer profiles and tap "Save Contact" to add them here.
            </p>
            <button onClick={() => router.push("/marketplace")}
              style={{ padding: "10px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {contacts.map(saved => {
              const c = saved.contact;
              if (!c) return null;
              return (
                <div key={saved.id} style={{
                  backgroundColor: "white",
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}>
                  {/* AVATAR */}
                  {c.logo_url ? (
                    <img src={c.logo_url} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>👤</div>
                  )}

                  {/* INFO */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 15 }}>{getName(c)}</strong>
                      <span style={{
                        fontSize: 10, fontWeight: "bold", padding: "2px 7px", borderRadius: 10,
                        backgroundColor: c.role === "vendor" ? "#f3e8ff" : "#f9ffe8",
                        color: c.role === "vendor" ? "#701890" : "#888B00",
                      }}>
                        {c.role?.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>
                      {c.category && `${c.category} · `}{c.city}{c.state ? `, ${c.state}` : ""}
                    </p>
                  </div>

                  {/* ACTIONS */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => router.push(`/messages?to=${c.id}&from=saved-contacts`)}
                      style={{ padding: "8px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}
                    >
                      ✉️ Message
                    </button>
                    <button
                      onClick={() => router.push(`/${c.role}/${c.handle}`)}
                      style={{ padding: "8px 14px", backgroundColor: "#f0f0f0", color: "#333", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => removeContact(c.id)}
                      style={{ padding: "8px 10px", backgroundColor: "white", color: "#cc0000", border: "1px solid #fca5a5", borderRadius: 6, cursor: "pointer", fontSize: 12 }}
                    >
                      ✕
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
