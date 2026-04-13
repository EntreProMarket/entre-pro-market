// pages/messages.js

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import DashboardLayout from "../components/DashboardLayout";

// ── MESSAGING RULES BY TIER ──
function getMessagingRules(role, tier) {
  if (role === "vendor") {
    if (tier === "premium") return {
      canMessage: true,
      canMessageVendors: true,
      canMessageOrganizers: false, // can only REPLY to organizers
      canInitiateOrganizer: false,
      canSaveContacts: true,
      label: "Premium Vendor",
    };
    if (tier === "featured") return {
      canMessage: true,
      canMessageVendors: true,
      canMessageOrganizers: true,
      canInitiateOrganizer: true,
      canSaveContacts: true,
      label: "Featured Vendor",
    };
    return { canMessage: false, label: "Free Vendor" };
  }

  if (role === "organizer") {
    if (tier === "basic") return {
      canMessage: true,
      canMessageVendors: true,
      vendorLimit: 5,
      canMessageOrganizers: true,
      canSaveContacts: false,
      label: "Basic Organizer",
    };
    if (tier === "pro") return {
      canMessage: true,
      canMessageVendors: true,
      vendorLimit: 20,
      canMessageOrganizers: true,
      canSaveContacts: false,
      label: "Pro Organizer",
    };
    if (tier === "elite") return {
      canMessage: true,
      canMessageVendors: true,
      vendorLimit: null, // unlimited
      canMessageOrganizers: true,
      canSaveContacts: true,
      label: "Elite Organizer",
    };
    // legacy premium organizer
    if (tier === "premium") return {
      canMessage: true,
      canMessageVendors: true,
      vendorLimit: 20,
      canMessageOrganizers: true,
      canSaveContacts: false,
      label: "Pro Organizer",
    };
  }

  return { canMessage: false, label: "Free" };
}

export default function Messages() {
  const router = useRouter();
  const { to } = router.query;
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

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => { if (activeConvo) loadMessages(activeConvo); }, [activeConvo]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (to && profile) { setActiveConvo(to); loadPartner(to); } }, [to, profile]);

  const loadProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) { router.replace("/"); return; }

    const { data: profileData } = await supabase
      .from("profiles").select("*").eq("id", user.id).single();

    setProfile(profileData);
    const msgRules = getMessagingRules(profileData?.role, profileData?.account_type);
    setRules(msgRules);

    if (msgRules.canMessage) {
      await loadConversations(user.id);
      // Count vendor contacts this month for organizers
      if (profileData?.role === "organizer" && msgRules.vendorLimit) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("sender_id", user.id)
          .gte("created_at", startOfMonth.toISOString());
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
      if (!convos[partnerId]) {
        convos[partnerId] = { partnerId, partner, lastMessage: msg, unread: 0 };
      }
      if (!msg.read && msg.recipient_id === userId) convos[partnerId].unread++;
    });
    setConversations(Object.values(convos));
  };

  const loadMessages = async (partnerId) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`)
      .order("created_at", { ascending: true });

    setMessages(data || []);
    await supabase.from("messages").update({ read: true })
      .eq("sender_id", partnerId).eq("recipient_id", userId);
  };

  const loadPartner = async (partnerId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", partnerId).single();
    setActivePartner(data);
  };

  const canMessagePartner = (partner) => {
    if (!rules || !partner) return false;
    const partnerRole = partner.role;

    if (profile?.role === "vendor") {
      if (partnerRole === "vendor") return rules.canMessageVendors;
      if (partnerRole === "organizer") {
        // Premium can only REPLY (check if organizer messaged first)
        if (rules.canInitiateOrganizer) return true;
        // Check if organizer sent first message
        const organizerInitiated = messages.some(m => m.sender_id === partner.id);
        return organizerInitiated;
      }
    }

    if (profile?.role === "organizer") {
      if (partnerRole === "organizer") return rules.canMessageOrganizers;
      if (partnerRole === "vendor") {
        if (!rules.vendorLimit) return true; // unlimited
        return vendorContactCount < rules.vendorLimit;
      }
    }
    return false;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvo) return;
    if (!canMessagePartner(activePartner)) return;

    setSending(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { error } = await supabase.from("messages").insert([{
      sender_id: userId,
      recipient_id: activeConvo,
      content: newMessage.trim(),
      read: false,
    }]);

    if (!error) {
      setNewMessage("");
      await loadMessages(activeConvo);
      await loadConversations(userId);
      if (profile?.role === "organizer") setVendorContactCount(c => c + 1);
    }
    setSending(false);
  };

  const reportMessage = async () => {
    if (!reportReason.trim() || !reportMsgId) return;
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("reports").insert([{
      reporter_id: userData?.user?.id,
      message_id: reportMsgId,
      reason: reportReason,
      status: "pending",
    }]);
    setReportModal(false);
    setReportReason("");
    setReportMsgId(null);
    alert("✅ Report submitted. Our team will review it shortly.");
  };

  const getName = (p) => p?.business_name || p?.organizer_name || "Unknown";

  if (loading) return <DashboardLayout><div style={{ padding: 20 }}>Loading...</div></DashboardLayout>;

  // Locked screen
  if (!rules?.canMessage) {
    return (
      <DashboardLayout>
        <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", padding: 40 }}>
          <p style={{ fontSize: 48 }}>🔒</p>
          <h2>Messaging Locked</h2>
          <p style={{ color: "#666", marginBottom: 24 }}>
            {profile?.role === "vendor"
              ? "Upgrade to Premium or Featured to unlock messaging."
              : "Choose an Organizer plan to start messaging Vendors."}
          </p>
          <button
            onClick={() => router.push(profile?.role === "vendor" ? "/vendor-info" : "/organizer-info")}
            style={{ padding: "12px 24px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 15 }}
          >
            View Plans
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, fontFamily: "sans-serif" }}>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => router.push(profile?.role === "organizer" ? "/organizer-dashboard" : "/vendor-dashboard")}
              style={{ padding: "8px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}
            >
              ← Dashboard
            </button>
            <h1 style={{ margin: 0 }}>✉️ Messages</h1>
          </div>
          {/* Contact limit badge for organizers */}
          {rules.vendorLimit && (
            <div style={{
              backgroundColor: vendorContactCount >= rules.vendorLimit ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${vendorContactCount >= rules.vendorLimit ? "#fca5a5" : "#86efac"}`,
              borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: "bold",
              color: vendorContactCount >= rules.vendorLimit ? "#991b1b" : "#166534",
            }}>
              {vendorContactCount}/{rules.vendorLimit} vendor contacts this month
            </div>
          )}
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minHeight: 500,
        }}>

          {/* CONVERSATIONS LIST — hide when convo open on mobile */}
          <div style={{
            backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, overflow: "hidden",
            display: activeConvo ? "none" : "block",
          }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #eee", fontWeight: "bold", fontSize: 14 }}>
              Conversations
            </div>
            {conversations.length === 0 ? (
              <p style={{ padding: 20, color: "#888", fontSize: 13, textAlign: "center" }}>
                No messages yet.{"\n"}Visit a profile to start a conversation.
              </p>
            ) : (
              conversations.map(convo => (
                <div key={convo.partnerId}
                  onClick={() => { setActiveConvo(convo.partnerId); loadPartner(convo.partnerId); }}
                  style={{
                    padding: "12px 16px", borderBottom: "1px solid #f5f5f5",
                    cursor: "pointer",
                    backgroundColor: activeConvo === convo.partnerId ? "#f3e8ff" : "white",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  {convo.partner?.logo_url ? (
                    <img src={convo.partner.logo_url} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👤</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: "bold", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {getName(convo.partner)}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {convo.lastMessage?.content}
                    </p>
                  </div>
                  {convo.unread > 0 && (
                    <span style={{ backgroundColor: "#701890", color: "white", borderRadius: "50%", width: 20, height: 20, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                      {convo.unread}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* MESSAGE THREAD */}
          {activeConvo && (
            <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {/* THREAD HEADER */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => { setActiveConvo(null); setActivePartner(null); setMessages([]); }}
                  style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#701890", padding: "0 4px" }}
                >
                  ←
                </button>
                {activePartner?.logo_url && (
                  <img src={activePartner.logo_url} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
                )}
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 14 }}>{getName(activePartner)}</strong>
                  <p style={{ margin: 0, fontSize: 11, color: "#888" }}>@{activePartner?.handle}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {activePartner?.handle && (
                    <button
                      onClick={() => router.push(`/${activePartner.role}/${activePartner.handle}`)}
                      style={{ padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}
                    >
                      View Profile
                    </button>
                  )}
                  {rules.canSaveContacts && (
                    <button
                      onClick={async () => {
                        const { data: userData } = await supabase.auth.getUser();
                        const { error } = await supabase.from("saved_contacts").upsert({ 
                          user_id: userData?.user?.id, 
                          contact_id: activeConvo 
                        });
                        if (!error) alert("✅ Contact saved!");
                        else alert("❌ Could not save: " + error.message);
                      }}
                      style={{ padding: "6px 12px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}
                    >
                      💾 Save Contact
                    </button>
                  )}
                </div>
              </div>

              {/* MESSAGES */}
              <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10, minHeight: 300, maxHeight: 420 }}>
                {messages.length === 0 ? (
                  <p style={{ color: "#888", fontSize: 13, textAlign: "center", marginTop: 40 }}>No messages yet. Say hello! 👋</p>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_id === profile?.id;
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
                        <div style={{
                          maxWidth: "75%",
                          padding: "10px 14px",
                          borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          backgroundColor: isMine ? "#701890" : "#f0f0f0",
                          color: isMine ? "white" : "#333",
                          fontSize: 13, lineHeight: 1.5, position: "relative",
                        }}>
                          {msg.content}
                          <p style={{ margin: "4px 0 0", fontSize: 10, color: isMine ? "rgba(255,255,255,0.7)" : "#999", textAlign: "right" }}>
                            {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                        {/* REPORT BUTTON */}
                        {!isMine && (
                          <button
                            onClick={() => { setReportMsgId(msg.id); setReportModal(true); }}
                            title="Report message"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 14, padding: 2 }}
                          >
                            🚩
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT */}
              {canMessagePartner(activePartner) ? (
                <div style={{ padding: "12px 16px", borderTop: "1px solid #eee", display: "flex", gap: 10 }}>
                  <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Type a message... (Enter to send)"
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1px solid #ddd", fontSize: 13, outline: "none" }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    style={{ padding: "10px 18px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13, opacity: !newMessage.trim() ? 0.5 : 1 }}
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              ) : (
                <div style={{ padding: "12px 16px", borderTop: "1px solid #eee", textAlign: "center" }}>
                  <p style={{ color: "#888", fontSize: 13, margin: 0 }}>
                    {rules.vendorLimit && vendorContactCount >= rules.vendorLimit
                      ? `Monthly vendor contact limit reached (${rules.vendorLimit}). Upgrade to send more.`
                      : "You cannot initiate messages with this user on your current plan."}
                  </p>
                  <button onClick={() => router.push(profile?.role === "vendor" ? "/vendor-info" : "/organizer-info")}
                    style={{ marginTop: 8, padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>
                    Upgrade Plan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* REPORT MODAL */}
        {reportModal && (
          <div onClick={() => setReportModal(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: 12, padding: 24, maxWidth: 400, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
              <h3 style={{ marginTop: 0 }}>🚩 Report Message</h3>
              <p style={{ color: "#666", fontSize: 13 }}>Tell us why you're reporting this message. Our team will review it within 24 hours.</p>
              <select
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, marginBottom: 12, boxSizing: "border-box" }}
              >
                <option value="">Select a reason...</option>
                <option value="spam">Spam or unwanted messages</option>
                <option value="harassment">Harassment or bullying</option>
                <option value="inappropriate">Inappropriate or offensive content</option>
                <option value="illegal">Illegal activity</option>
                <option value="nudity">Nudity or sexual content</option>
                <option value="scam">Scam or fraud</option>
                <option value="other">Other</option>
              </select>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setReportModal(false)} style={{ padding: "10px 18px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>
                  Cancel
                </button>
                <button onClick={reportMessage} disabled={!reportReason} style={{ padding: "10px 18px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", opacity: !reportReason ? 0.5 : 1 }}>
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
