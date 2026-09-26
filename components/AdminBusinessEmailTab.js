// components/AdminBusinessEmailTab.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const BUSINESS_MAILBOXES = ["noreply", "support", "events", "shop", "services"];
const inputStyle = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };

export default function AdminBusinessEmailTab({ adminId }) {
  const [activeMailbox, setActiveMailbox] = useState("support");
  const [businessEmails, setBusinessEmails] = useState([]);
  const [loadingBusinessEmails, setLoadingBusinessEmails] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeReplyId, setComposeReplyId] = useState(null);
  const [sendingBusinessEmail, setSendingBusinessEmail] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { loadBusinessEmails(activeMailbox); }, []); // eslint-disable-line

  const loadBusinessEmails = async (mailbox) => {
    setLoadingBusinessEmails(true);
    const { data } = await supabase.from("business_emails").select("*").eq("mailbox", mailbox).order("created_at", { ascending: false }).limit(200);
    setBusinessEmails(data || []);
    setLoadingBusinessEmails(false);
  };

  const openCompose = (prefill) => {
    setComposeTo(prefill?.to || "");
    setComposeSubject(prefill?.subject || "");
    setComposeBody("");
    setComposeReplyId(prefill?.replyId || null);
    setComposeOpen(true);
  };

  const sendBusinessEmail = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      setMessage("⚠️ To, subject, and message are all required.");
      return;
    }
    setSendingBusinessEmail(true); setMessage("");
    try {
      const res = await fetch("/api/send-business-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailbox: activeMailbox, to: composeTo.trim(), subject: composeSubject.trim(), body: composeBody.trim(), adminId, replyToEmailId: composeReplyId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to send");
      setMessage("✅ Email sent!");
      setComposeOpen(false); setComposeTo(""); setComposeSubject(""); setComposeBody(""); setComposeReplyId(null);
      loadBusinessEmails(activeMailbox);
    } catch (err) {
      setMessage("❌ Error sending email: " + err.message);
    }
    setSendingBusinessEmail(false);
  };

  const markEmailRead = async (id) => {
    await supabase.from("business_emails").update({ read: true }).eq("id", id);
    setBusinessEmails(businessEmails.map(e => e.id === id ? { ...e, read: true } : e));
  };

  const deleteBusinessEmail = async (id) => {
    if (!confirm("Delete this email from your records? This cannot be undone.")) return;
    await supabase.from("business_emails").delete().eq("id", id);
    setBusinessEmails(businessEmails.filter(e => e.id !== id));
  };

  return (
    <div>
      <h2 style={{ marginBottom: 6 }}>📧 Business Email</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>Send and receive email from your @entrepromarket.com addresses — no Gmail involved, so your personal address is never exposed.</p>

      {message && (
        <div style={{ marginBottom: 16, padding: "12px 16px", backgroundColor: message.startsWith("✅") ? "#f0fdf4" : message.startsWith("⚠️") ? "#fffbeb" : "#fef2f2", border: `1px solid ${message.startsWith("✅") ? "#86efac" : message.startsWith("⚠️") ? "#fcd34d" : "#fca5a5"}`, borderRadius: 8, color: message.startsWith("✅") ? "#166534" : message.startsWith("⚠️") ? "#92400e" : "#991b1b", fontWeight: "bold" }}>
          {message}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {BUSINESS_MAILBOXES.map(mb => (
          <button key={mb} onClick={() => { setActiveMailbox(mb); loadBusinessEmails(mb); }}
            style={{ padding: "8px 16px", backgroundColor: activeMailbox === mb ? "#701890" : "white", color: activeMailbox === mb ? "white" : "#701890", border: "1px solid #701890", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
            {mb}@
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#888" }}>{activeMailbox}@entrepromarket.com</p>
        <button onClick={() => openCompose({ to: "", subject: "" })} style={{ padding: "8px 16px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>✏️ Compose</button>
      </div>

      {composeOpen && (
        <div style={{ backgroundColor: "white", border: "2px solid #701890", borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <p style={{ fontWeight: "bold", marginBottom: 12, fontSize: 14 }}>{composeReplyId ? "↩️ Reply" : "✏️ New Email"} — from {activeMailbox}@entrepromarket.com</p>
          <input placeholder="To (email address)" value={composeTo} onChange={e => setComposeTo(e.target.value)} style={inputStyle} />
          <input placeholder="Subject" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} style={inputStyle} />
          <textarea placeholder="Message" value={composeBody} onChange={e => setComposeBody(e.target.value)} rows={6} style={{ ...inputStyle, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => { setComposeOpen(false); setComposeReplyId(null); }} style={{ padding: "10px 20px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
            <button onClick={sendBusinessEmail} disabled={sendingBusinessEmail} style={{ padding: "10px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>{sendingBusinessEmail ? "Sending..." : "📨 Send"}</button>
          </div>
        </div>
      )}

      {loadingBusinessEmails ? <p style={{ color: "#888" }}>Loading...</p> : businessEmails.length === 0 ? (
        <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 32, textAlign: "center", color: "#aaa" }}>
          <p style={{ fontSize: 36, margin: 0 }}>📧</p>
          <p style={{ fontSize: 14, marginTop: 12 }}>No emails yet for {activeMailbox}@. Tap "🔍 refresh" by switching tabs, or Compose to send your first one.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {businessEmails.map(em => (
            <div key={em.id} style={{ backgroundColor: em.direction === "inbound" && !em.read ? "#faf5ff" : "white", border: `1px solid ${em.direction === "inbound" && !em.read ? "#701890" : "#eee"}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                <p style={{ margin: 0, fontWeight: "bold", fontSize: 13 }}>
                  {em.direction === "inbound" ? "📥 From: " : "📤 To: "}
                  {em.direction === "inbound" ? em.from_address : em.to_address}
                  {em.direction === "inbound" && !em.read && <span style={{ marginLeft: 8, fontSize: 10, backgroundColor: "#701890", color: "white", padding: "1px 6px", borderRadius: 8, fontWeight: "bold" }}>NEW</span>}
                  {em.status === "failed" && <span style={{ marginLeft: 8, fontSize: 10, backgroundColor: "#cc0000", color: "white", padding: "1px 6px", borderRadius: 8, fontWeight: "bold" }}>FAILED</span>}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{new Date(em.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</p>
              </div>
              <p style={{ margin: "0 0 6px", fontWeight: "bold", fontSize: 14 }}>{em.subject}</p>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#444", whiteSpace: "pre-wrap" }}>{em.body}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {em.direction === "inbound" && (
                  <button onClick={() => openCompose({ to: em.from_address, subject: em.subject?.startsWith("Re:") ? em.subject : `Re: ${em.subject}`, replyId: em.id })} style={{ padding: "5px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>↩️ Reply</button>
                )}
                {em.direction === "inbound" && !em.read && (
                  <button onClick={() => markEmailRead(em.id)} style={{ padding: "5px 12px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>✓ Mark Read</button>
                )}
                <button onClick={() => deleteBusinessEmail(em.id)} style={{ padding: "5px 12px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
