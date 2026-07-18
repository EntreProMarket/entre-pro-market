// pages/messages.js
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import DashboardLayout from "../components/DashboardLayout";

function getMessagingRules(role, tier) {
  if (role === "vendor") {
    if (tier === "premium") return { canMessage: true, canSaveContacts: true };
    if (tier === "featured") return { canMessage: true, canSaveContacts: true };
    return { canMessage: false };
  }
  if (role === "organizer") {
    if (tier === "basic") return { canMessage: true, vendorLimit: 5, canSaveContacts: false };
    if (tier === "pro" || tier === "premium") return { canMessage: true, vendorLimit: 20, canSaveContacts: true };
    if (tier === "elite") return { canMessage: true, vendorLimit: null, canSaveContacts: true };
    return { canMessage: false };
  }
  return { canMessage: false };
}

export default function Messages() {
  const router = useRouter();
  const { to, from: fromPage } = router.query;
  const messagesEndRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [rules, setRules] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportMsgId, setReportMsgId] = useState(null);
  const [vendorContactCount, setVendorContactCount] = useState(0);
  const [deletedMsgIds, setDeletedMsgIds] = useState(new Set());

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => { if (activeConvo) { loadMessages(activeConvo); loadPartner(activeConvo); } }, [activeConvo]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (to && profile) setActiveConvo(to); }, [to, profile]);

  const loadProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) { router.replace("/"); return; }
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(profileData);
    const msgRules = getMessagingRules(profileData?.role, profileData?.account_type);
    setRules(msgRules);
    if (msgRules.canMessage) {
      await loadConversations(user.id);
      if (profileData?.role === "organizer" && msgRules.vendorLimit) {
        const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
        const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("sender_id", user.id).gte("created_at", startOfMonth.toISOString());
        setVendorContactCount(count || 0);
      }
    }
    setLoading(false);
  };

  const loadConversations = async (userId) => {
    const { data } = await supabase
      .from("messages")
      .select("*, sender:sender_id(id, business_name, organizer_name, logo_url, role, handle, account_type), recipient:recipient_id(id, business_name, organizer_name, logo_url, role, handle, account_type)")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (!data) return;
    const convos = {};
    data.forEach(msg => {
      const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      const partner = msg.sender_id === userId ? msg.recipient : msg.sender;
      if (!convos[partnerId]) convos[partnerId] = { partnerId, partner, lastMessage: msg, unread: 0 };
      if (!msg.read && msg.recipient_id === userId) convos[partnerId].unread++;
    });
    setConversations(Object.values(convos));
  };

  const loadMessages = async (partnerId) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { data } = await supabase.from("messages").select("*")
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`)
      .order("created_at", { ascending: true });
    setMessages((data || []).filter(m => !deletedMsgIds.has(m.id)));
    await supabase.from("messages").update({ read: true }).eq("sender_id", partnerId).eq("recipient_id", userId);
    setConversations(prev => prev.map(c => c.partnerId === partnerId ? { ...c, unread: 0 } : c));
    // ── Load draft for this conversation ──
    const draft = localStorage.getItem(`draft_${partnerId}`) || "";
    setNewMessage(draft);
  };

  const loadPartner = async (partnerId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", partnerId).single();
    setActivePartner(data);
  };

  const canMessagePartner = (partner) => {
    if (!rules || !partner) return false;
    if (profile?.role === "vendor") return rules.canMessage;
    if (profile?.role === "organizer") {
      if (!rules.vendorLimit) return true;
      return vendorContactCount < rules.vendorLimit;
    }
    return false;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvo || !canMessagePartner(activePartner)) return;
    setSending(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { error } = await supabase.from("messages").insert([{ sender_id: userId, recipient_id: activeConvo, content: newMessage.trim(), read: false }]);
    if (!error) {
      // ── Clear draft on send ──
      localStorage.removeItem(`draft_${activeConvo}`);
      setNewMessage("");
      await loadMessages(activeConvo);
      await loadConversations(userId);
      if (profile?.role === "organizer") setVendorContactCount(c => c + 1);
    }
    setSending(false);
  };

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
    // ── Save draft ──
    if (activeConvo) localStorage.setItem(`draft_${activeConvo}`, e.target.value);
  };

  const handleKeyDown = (e) => {
    // ── Shift+Enter sends; Enter alone = new line ──
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reportMessage = async () => {
    if (!reportReason.trim() || !reportMsgId) return;
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("reports").insert([{ reporter_id: userData?.user?.id, message_id: reportMsgId, reason: reportReason, status: "pending" }]);
    setReportModal(false); setReportReason(""); setReportMsgId(null);
    alert("✅ Report submitted.");
  };

  const getName = (p) => p?.business_name || p?.organizer_name || "Unknown";

  if (loading) return <DashboardLayout><div style={{ padding: 20 }}>Loading...</div></DashboardLayout>;

  if (!rules?.canMessage) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 72, marginBottom: 24 }}>🔒</div>
          <h1 style={{ fontSize: 26, fontWeight: "bold", marginBottom: 12 }}>Messaging Locked</h1>
          <p style={{ color: "#666", fontSize: 15, maxWidth: 320, lineHeight: 1.6, marginBottom: 32 }}>Messaging is available to Premium & Featured Vendors and all Organizer plans.</p>
          <button onClick={() => router.push("/vendor-info")} style={{ padding: "14px 32px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 30, fontWeight: "bold", fontSize: 16, cursor: "pointer", marginBottom: 16, width: "100%", maxWidth: 280 }}>View Vendor Plans</button>
          <button onClick={() => router.push("/organizer-info")} style={{ padding: "14px 32px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 30, fontWeight: "bold", fontSize: 16, cursor: "pointer", width: "100%", maxWidth: 280 }}>View Organizer Plans</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.push(profile?.role === "organizer" ? "/organizer-dashboard" : "/vendor-dashboard")} style={{ padding: "8px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>← Dashboard</button>
            <h1 style={{ margin: 0 }}>✉️ Messages</h1>
          </div>
          {rules.vendorLimit && (
            <div style={{ backgroundColor: vendorContactCount >= rules.vendorLimit ? "#fef2f2" : "#f0fdf4", border: `1px solid ${vendorContactCount >= rules.vendorLimit ? "#fca5a5" : "#86efac"}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: "bold", color: vendorContactCount >= rules.vendorLimit ? "#991b1b" : "#166534" }}>
              {vendorContactCount}/{rules.vendorLimit} vendor contacts this month
            </div>
          )}
        </div>

        {/* CONVERSATIONS LIST */}
        {!activeConvo && (
          <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #eee", fontWeight: "bold", fontSize: 14 }}>Conversations</div>
            {conversations.length === 0 ? (
              <p style={{ padding: 20, color: "#888", fontSize: 13, textAlign: "center" }}>No messages yet. Visit a profile to start a conversation.</p>
            ) : (
              conversations.map(convo => {
                const hasUnread = convo.unread > 0;
                const hasDraft = typeof window !== "undefined" && localStorage.getItem(`draft_${convo.partnerId}`);
                return (
                  <div key={convo.partnerId} style={{ borderBottom: "1px solid #f5f5f5", backgroundColor: hasUnread ? "#faf5ff" : "white", display: "flex", alignItems: "center", position: "relative" }}>
                    <div onClick={() => setActiveConvo(convo.partnerId)} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer", padding: "14px 36px 14px 16px" }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        {convo.partner?.logo_url ? <img src={convo.partner.logo_url} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", border: hasUnread ? "2px solid #701890" : "2px solid transparent" }} /> : <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>}
                        {hasUnread && <span style={{ position: "absolute", top: -2, right: -2, backgroundColor: "#AABB23", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", border: "2px solid white" }}>{convo.unread > 9 ? "9+" : convo.unread}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: hasUnread ? "900" : "bold", fontSize: 14, color: hasUnread ? "#701890" : "#222" }}>{getName(convo.partner)}</p>
                        <p style={{ margin: 0, fontSize: 12, color: hasDraft ? "#701890" : hasUnread ? "#333" : "#888", fontWeight: hasUnread ? "bold" : "normal", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontStyle: hasDraft ? "italic" : "normal" }}>
                          {hasDraft ? `✏️ Draft: ${localStorage.getItem(`draft_${convo.partnerId}`)}` : convo.lastMessage?.content}
                        </p>
                      </div>
                      {hasUnread && <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#701890", flexShrink: 0 }} />}
                    </div>
                    <button onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm("Delete this conversation?")) return;
                      const { data: ud } = await supabase.auth.getUser();
                      const uid = ud?.user?.id;
                      await supabase.from("messages").delete().or(`and(sender_id.eq.${uid},recipient_id.eq.${convo.partnerId}),and(sender_id.eq.${convo.partnerId},recipient_id.eq.${uid})`);
                      localStorage.removeItem(`draft_${convo.partnerId}`);
                      setConversations(prev => prev.filter(c => c.partnerId !== convo.partnerId));
                    }} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: 16, padding: 4 }}>✕</button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* MESSAGE THREAD */}
        {activeConvo && (
          <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <button onClick={() => {
                  if (fromPage === "saved-contacts") router.replace("/saved-contacts");
                  else if (fromPage && (fromPage.startsWith("vendor/") || fromPage.startsWith("organizer/"))) router.replace("/" + fromPage);
                  else { setActiveConvo(null); setActivePartner(null); setMessages([]); }
                }} style={{ background: "none", border: "1px solid #ddd", fontSize: 16, cursor: "pointer", color: "#701890", padding: "4px 10px", borderRadius: 6, fontWeight: "bold" }}>←</button>
                {activePartner?.logo_url && <img src={activePartner.logo_url} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />}
                <div>
                  <strong style={{ fontSize: 14 }}>{getName(activePartner)}</strong>
                  <p style={{ margin: 0, fontSize: 11, color: "#888" }}>@{activePartner?.handle}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {activePartner?.handle && <button onClick={() => router.push(`/${activePartner.role}/${activePartner.handle}`)} style={{ padding: "8px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>View Profile</button>}
                {rules.canSaveContacts && <button onClick={async () => {
                  const { data: userData } = await supabase.auth.getUser();
                  const { error } = await supabase.from("saved_contacts").upsert({ user_id: userData?.user?.id, contact_id: activeConvo });
                  if (!error) alert("✅ Contact saved!"); else alert("❌ Could not save: " + error.message);
                }} style={{ padding: "8px 20px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>💾 Save Contact</button>}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10, minHeight: 300, maxHeight: 420 }}>
              {messages.length === 0 ? <p style={{ color: "#888", fontSize: 13, textAlign: "center", marginTop: 40 }}>No messages yet. Say hello! 👋</p> :
                messages.map(msg => {
                  const isMine = msg.sender_id === profile?.id;
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
                      <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", backgroundColor: isMine ? "#701890" : "#f0f0f0", color: isMine ? "white" : "#333", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {msg.content}
                        <p style={{ margin: "4px 0 0", fontSize: 10, color: isMine ? "rgba(255,255,255,0.7)" : "#999", textAlign: "right" }}>
                          {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {!isMine && <button onClick={() => { setReportMsgId(msg.id); setReportModal(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 14, padding: 2 }}>🚩</button>}
                        <button onClick={async () => {
                          if (!confirm("Delete this message?")) return;
                          const { error } = await supabase.from("messages").delete().eq("id", msg.id);
                          if (!error) { setDeletedMsgIds(prev => new Set([...prev, msg.id])); setMessages(prev => prev.filter(m => m.id !== msg.id)); }
                        }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 12, padding: 2 }}>🗑️</button>
                      </div>
                    </div>
                  );
                })
              }
              <div ref={messagesEndRef} />
            </div>

            {canMessagePartner(activePartner) ? (
              <div style={{ padding: "12px 16px", borderTop: "1px solid #eee" }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, color: "#aaa" }}>Enter = new line · Shift+Enter = send</p>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  {/* ── TEXTAREA: Enter=new line, Shift+Enter=send ── */}
                  <textarea
                    value={newMessage}
                    onChange={handleMessageChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={2}
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 16, border: "1px solid #ddd", fontSize: 13, outline: "none", resize: "none", fontFamily: "sans-serif", lineHeight: 1.5, boxSizing: "border-box" }}
                  />
                  <button onClick={sendMessage} disabled={sending || !newMessage.trim()} style={{ padding: "10px 18px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13, opacity: !newMessage.trim() ? 0.5 : 1, flexShrink: 0 }}>
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: "12px 16px", borderTop: "1px solid #eee", textAlign: "center" }}>
                <p style={{ color: "#888", fontSize: 13, margin: 0 }}>{rules.vendorLimit && vendorContactCount >= rules.vendorLimit ? `Monthly limit reached. Upgrade to send more.` : "You cannot message this user on your current plan."}</p>
                <button onClick={() => router.push(profile?.role === "organizer" ? "/organizer-info" : "/vendor-info")} style={{ marginTop: 8, padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Upgrade Plan</button>
              </div>
            )}
          </div>
        )}

        {reportModal && (
          <div onClick={() => setReportModal(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: 12, padding: 24, maxWidth: 400, width: "90%" }}>
              <h3 style={{ marginTop: 0 }}>🚩 Report Message</h3>
              <select value={reportReason} onChange={e => setReportReason(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, marginBottom: 12, boxSizing: "border-box" }}>
                <option value="">Select a reason...</option>
                <option value="spam">Spam or unwanted messages</option>
                <option value="harassment">Harassment or bullying</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="scam">Scam or fraud</option>
                <option value="other">Other</option>
              </select>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setReportModal(false)} style={{ padding: "10px 18px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
                <button onClick={reportMessage} disabled={!reportReason} style={{ padding: "10px 18px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", opacity: !reportReason ? 0.5 : 1 }}>Submit</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
