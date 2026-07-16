// pages/saved-contacts.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import DashboardLayout from "../components/DashboardLayout";
import { SocialLinks } from "../components/SocialIcons";

export default function SavedContacts() {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const u = userData?.user;
      if (!u) { router.replace("/"); return; }
      setUser(u);

      const { data: savedData } = await supabase
        .from("saved_contacts")
        .select("contact_id, created_at")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false });

      if (!savedData?.length) { setLoading(false); return; }

      const contactIds = savedData.map(s => s.contact_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, business_name, organizer_name, handle, role, account_type, category, city, state, logo_url, website, instagram, facebook, tiktok, youtube, x_twitter")
        .in("id", contactIds);

      setContacts(profiles || []);
      setFiltered(profiles || []);
      setLoading(false);
    };
    load();
  }, [router]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(contacts); return; }
    const q = search.toLowerCase();
    setFiltered(contacts.filter(c =>
      (c.business_name || c.organizer_name || "").toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.handle?.toLowerCase().includes(q)
    ));
  }, [search, contacts]);

  const removeContact = async (contactId) => {
    if (!confirm("Remove this contact?")) return;
    await supabase.from("saved_contacts").delete().eq("user_id", user.id).eq("contact_id", contactId);
    setContacts(prev => prev.filter(c => c.id !== contactId));
    setFiltered(prev => prev.filter(c => c.id !== contactId));
  };

  const getName = (c) => c.business_name || c.organizer_name || "—";

  const tierBadge = (tier) => {
    const styles = {
      premium:  { bg: "#f3e8ff", color: "#701890", label: "💜 PREMIUM" },
      featured: { bg: "#f9ffe8", color: "#AABB23", label: "🔥 FEATURED" },
      pro:      { bg: "#f3e8ff", color: "#701890", label: "🚀 PRO" },
      elite:    { bg: "#f9ffe8", color: "#AABB23", label: "👑 ELITE" },
    };
    const s = styles[tier];
    if (!s) return null;
    return <span style={{ fontSize: 11, backgroundColor: s.bg, color: s.color, padding: "2px 8px", borderRadius: 10, fontWeight: "bold" }}>{s.label}</span>;
  };

  if (loading) return <DashboardLayout><div style={{ padding: 20 }}>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 700, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => router.back()} style={{ padding: "8px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>← Back</button>
          <h1 style={{ margin: 0, fontSize: 22 }}>💾 Saved Contacts</h1>
        </div>

        <div style={{ position: "relative", marginBottom: 16 }}>
          <input type="text" placeholder="Search by name, category, city..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ display: "block", width: "100%", padding: "11px 16px 11px 38px", borderRadius: 30, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
          <span style={{ position: "absolute", left: 13, top: 12, color: "#aaa", fontSize: 15 }}>🔍</span>
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 13, top: 9, background: "none", border: "none", color: "#aaa", fontSize: 18, cursor: "pointer" }}>✕</button>}
        </div>

        {filtered.length === 0 ? (
          <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 32, textAlign: "center", color: "#aaa" }}>
            <p style={{ fontSize: 36, margin: 0 }}>💾</p>
            <p style={{ fontSize: 14, marginTop: 12 }}>{contacts.length === 0 ? "No saved contacts yet. Visit a vendor or organizer profile and save them here." : "No contacts match your search."}</p>
          </div>
        ) : (
          <>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>{filtered.length} of {contacts.length} contact{contacts.length !== 1 ? "s" : ""}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filtered.map(contact => (
                <div key={contact.id} style={{ backgroundColor: "white", border: `2px solid ${contact.account_type === "featured" || contact.account_type === "elite" ? "#AABB23" : contact.account_type === "premium" || contact.account_type === "pro" ? "#701890" : "#eee"}`, borderRadius: 12, padding: "16px 16px 16px 16px", position: "relative" }}>

                  <button onClick={() => removeContact(contact.id)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "1px solid #fca5a5", color: "#cc0000", borderRadius: 6, width: 32, height: 32, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0 }}>
                      {contact.logo_url ? <img src={contact.logo_url} alt={getName(contact)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <strong style={{ fontSize: 15 }}>{getName(contact)}</strong>
                        <span style={{ fontSize: 10, backgroundColor: contact.role === "vendor" ? "#f3e8ff" : "#f9ffe8", color: contact.role === "vendor" ? "#701890" : "#888B00", padding: "2px 7px", borderRadius: 10, fontWeight: "bold", textTransform: "uppercase" }}>{contact.role}</span>
                        {tierBadge(contact.account_type)}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{contact.category}{contact.city ? ` · ${contact.city}${contact.state ? `, ${contact.state}` : ""}` : ""}</p>
                    </div>
                  </div>

                  {/* ── Real social icons ── */}
                  <div style={{ marginBottom: 14 }}>
                    <SocialLinks profile={contact} size={26} />
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => router.push(`/messages?to=${contact.id}`)}
                      style={{ flex: 1, padding: "10px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
                      ✉️ Message
                    </button>
                    <button onClick={() => router.push(`/${contact.role}/${contact.handle}`)}
                      style={{ flex: 1, padding: "10px", backgroundColor: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
                      👤 View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
