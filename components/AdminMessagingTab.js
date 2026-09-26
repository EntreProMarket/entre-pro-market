// components/AdminMessagingTab.js
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const inputStyle = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };

export default function AdminMessagingTab({ adminId, users }) {
  const [broadcastSearch, setBroadcastSearch] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [messagingView, setMessagingView] = useState("compose");
  const [sentMessages, setSentMessages] = useState([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [message, setMessage] = useState("");

  const broadcastRecipients = users.filter(u => (u.role === "vendor" || u.role === "organizer") && (u.business_name || u.organizer_name || u.handle));
  const filteredRecipients = broadcastRecipients.filter(u => {
    if (!broadcastSearch.trim()) return true;
    const q = broadcastSearch.toLowerCase();
    return [u.business_name, u.organizer_name, u.handle, u.category, u.city].some(f => f && f.toLowerCase().includes(q));
  });
  const toggleRecipient = (id) => setSelectedRecipients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAllFiltered = () => setSelectedRecipients(Array.from(new Set([...selectedRecipients, ...filteredRecipients.map(u => u.id)])));

  const sendBroadcastMessage = async () => {
    if (!broadcastMessage.trim()) { setMessage("⚠️ Please write a message."); return; }
    if (selectedRecipients.length === 0) { setMessage("⚠️ Select at least one recipient."); return; }
    setSendingBroadcast(true); setMessage("");
    try {
      const rows = selectedRecipients.map(id => ({ sender_id: adminId, recipient_id: id, content: broadcastMessage.trim(), read: false }));
      const { error } = await supabase.from("messages").insert(rows);
      if (error) throw error;
      setMessage(`✅ Message sent to ${selectedRecipients.length} recipient${selectedRecipients.length !== 1 ? "s" : ""}!`);
      setSelectedRecipients([]); setBroadcastMessage("");
      if (messagingView === "sent") loadSentMessages();
    } catch (err) { setMessage("❌ Error sending message: " + err.message); }
    setSendingBroadcast(false);
  };

  const loadSentMessages = async () => {
    if (!adminId) return;
    setLoadingSent(true);
    const { data } = await supabase.from("messages").select("*, recipient:recipient_id(business_name, organizer_name, handle, role)").eq("sender_id", adminId).order("created_at", { ascending: false });
    setSentMessages(data || []);
    setLoadingSent(false);
  };

  const deleteSentMessage = async (id) => {
    if (!confirm("Delete this sent message?")) return;
    await supabase.from("messages").delete().eq("id", id);
    setSentMessages(sentMessages.filter(m => m.id !== id));
  };

  const resendMessage = async (msg) => {
    try {
      const { error } = await supabase.from("messages").insert([{ sender_id: adminId, recipient_id: msg.recipient_id, content: msg.content, read: false }]);
      if (error) throw error;
      setMessage("✅ Message resent!");
      loadSentMessages();
    } catch (err) { setMessage("❌ Error: " + err.message); }
  };

  const replyToRecipient = (msg) => {
    setMessagingView("compose");
    setSelectedRecipients([msg.recipient_id]);
    setBroadcastMessage("");
  };

  return (
    <div>
      <h2 style={{ marginBottom: 6 }}>✉️ Message Vendors & Organizers</h2>

      {message && (
        <div style={{ marginBottom: 16, padding: "12px 16px", backgroundColor: message.startsWith("✅") ? "#f0fdf4" : message.startsWith("⚠️") ? "#fffbeb" : "#fef2f2", border: `1px solid ${message.startsWith("✅") ? "#86efac" : message.startsWith("⚠️") ? "#fcd34d" : "#fca5a5"}`, borderRadius: 8, color: message.startsWith("✅") ? "#166534" : message.startsWith("⚠️") ? "#92400e" : "#991b1b", fontWeight: "bold" }}>
          {message}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button onClick={() => setMessagingView("compose")} style={{ padding: "8px 16px", backgroundColor: messagingView === "compose" ? "#701890" : "white", color: messagingView === "compose" ? "white" : "#701890", border: "1px solid #701890", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>✏️ Compose</button>
        <button onClick={() => { setMessagingView("sent"); loadSentMessages(); }} style={{ padding: "8px 16px", backgroundColor: messagingView === "sent" ? "#701890" : "white", color: messagingView === "sent" ? "white" : "#701890", border: "1px solid #701890", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>📤 Sent Messages</button>
      </div>

      {messagingView === "compose" ? (
        <>
          <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>Select one or more recipients below and send them a message directly from Admin. Users see your messages as coming from "Entre PRO Market" and cannot reply to this inbox — they're auto-redirected to email instead.</p>
          <input value={broadcastSearch} onChange={e => setBroadcastSearch(e.target.value)} placeholder="🔍 Search recipients by name, handle, city..." style={{ ...inputStyle, marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <button onClick={selectAllFiltered} style={{ padding: "6px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Select All Shown ({filteredRecipients.length})</button>
            <button onClick={() => setSelectedRecipients([])} style={{ padding: "6px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Clear Selection</button>
            <span style={{ fontSize: 13, color: "#701890", fontWeight: "bold" }}>{selectedRecipients.length} selected</span>
          </div>
          <div style={{ maxHeight: 380, overflowY: "auto", border: "1px solid #eee", borderRadius: 8, marginBottom: 16 }}>
            {filteredRecipients.length === 0 ? <p style={{ padding: 16, color: "#888", margin: 0 }}>No matching vendors or organizers.</p> : filteredRecipients.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid #f0f0f0" }}>
                <input type="checkbox" checked={selectedRecipients.includes(u.id)} onChange={() => toggleRecipient(u.id)} />
                {u.logo_url && <div onClick={() => window.open(`/${u.role}/${u.handle}?from=admin`, "_blank")} style={{ width: 34, height: 34, borderRadius: 6, overflow: "hidden", cursor: "pointer", flexShrink: 0, border: "1px solid #e5e7eb" }}><img src={u.logo_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: "bold", fontSize: 13 }}>{u.business_name || u.organizer_name || u.handle}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{u.role === "vendor" ? "🛒" : "🎪"} {u.role} · {u.account_type || "—"} · {u.city || ""}</p>
                </div>
              </div>
            ))}
          </div>
          <textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="Write your message..." rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          <button onClick={sendBroadcastMessage} disabled={sendingBroadcast} style={{ padding: "12px 24px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
            {sendingBroadcast ? "Sending..." : `📨 Send to ${selectedRecipients.length} Recipient${selectedRecipients.length !== 1 ? "s" : ""}`}
          </button>
        </>
      ) : (
        <div>
          {loadingSent ? <p style={{ color: "#888" }}>Loading...</p> : sentMessages.length === 0 ? <p style={{ color: "#888" }}>No sent messages yet.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sentMessages.map(msg => (
                <div key={msg.id} style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                    <p style={{ margin: 0, fontWeight: "bold", fontSize: 13 }}>To: {msg.recipient?.business_name || msg.recipient?.organizer_name || msg.recipient?.handle || "Unknown"}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{new Date(msg.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: "#444" }}>{msg.content}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => replyToRecipient(msg)} style={{ padding: "5px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>↩️ Reply</button>
                    <button onClick={() => resendMessage(msg)} style={{ padding: "5px 12px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>🔁 Resend</button>
                    <button onClick={() => deleteSentMessage(msg.id)} style={{ padding: "5px 12px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
