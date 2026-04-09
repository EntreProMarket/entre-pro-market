// pages/messages.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import DashboardLayout from "../components/DashboardLayout";

export default function Messages() {
  const router = useRouter();
  const { to } = router.query;

  const [profile, setProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [canMessage, setCanMessage] = useState(false);
  const [recipientProfile, setRecipientProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (activeConvo) loadMessages(activeConvo);
  }, [activeConvo]);

  // If redirected with ?to=userId, open that conversation
  useEffect(() => {
    if (to && profile) {
      setActiveConvo(to);
      loadRecipient(to);
    }
  }, [to, profile]);

  const loadProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) { router.replace("/"); return; }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    // Check if user can send messages based on tier
    const tier = profileData?.account_type;
    const role = profileData?.role;

    // Vendors: premium and featured can message
    // Organizers: all tiers can message (limited by plan)
    // Also allow if no account_type set yet (fallback)
    if (role === "vendor" && (tier === "premium" || tier === "featured" || tier === "pro")) {
      setCanMessage(true);
    } else if (role === "organizer" && (tier === "basic" || tier === "pro" || tier === "elite" || tier === "premium")) {
      setCanMessage(true);
    } else {
      setCanMessage(false);
    }

    await loadConversations(user.id);
    setLoading(false);
  };

  const loadConversations = async (userId) => {
    const { data } = await supabase
      .from("messages")
      .select("*, sender:sender_id(id, business_name, organizer_name, logo_url, role, handle), recipient:recipient_id(id, business_name, organizer_name, logo_url, role, handle)")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (!data) return;

    // Group by conversation partner
    const convos = {};
    data.forEach(msg => {
      const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      const partner = msg.sender_id === userId ? msg.recipient : msg.sender;
      if (!convos[partnerId]) {
        convos[partnerId] = { partnerId, partner, lastMessage: msg, unread: 0 };
      }
      if (!msg.read && msg.recipient_id === userId) {
        convos[partnerId].unread++;
      }
    });

    setConversations(Object.values(convos));
  };

  const loadMessages = async (partnerId) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`
      )
      .order("created_at", { ascending: true });

    setMessages(data || []);

    // Mark as read
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", partnerId)
      .eq("recipient_id", userId);
  };

  const loadRecipient = async (recipientId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", recipientId)
      .single();
    setRecipientProfile(data);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvo) return;
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
    }

    setSending(false);
  };

  const getPartnerName = (partner) => {
    if (!partner) return "Unknown";
    return partner.business_name || partner.organizer_name || "Unknown";
  };

  if (loading) return <DashboardLayout><div style={{ padding: 20 }}>Loading messages...</div></DashboardLayout>;

  // If user can't message — show upgrade prompt
  if (!canMessage) {
    return (
      <DashboardLayout>
        <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", padding: 40 }}>
          <p style={{ fontSize: 40 }}>🔒</p>
          <h2>Messaging Locked</h2>
          <p style={{ color: "#666", marginBottom: 24 }}>
            {profile?.role === "vendor"
              ? "Upgrade to Premium or Featured to send and receive messages from Organizers."
              : "Choose an Organizer plan to start messaging Vendors."}
          </p>
          <button
            onClick={() => router.push(profile?.role === "vendor" ? "/vendor-info" : "/organizer-info")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#701890",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 15,
            }}
          >
            View Upgrade Options
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, fontFamily: "sans-serif" }}>
        <h1 style={{ marginBottom: 20 }}>✉️ Messages</h1>

        <div style={{
          display: "grid",
          gridTemplateColumns: activeConvo ? "1fr 2fr" : "1fr",
          gap: 16,
          minHeight: 500,
        }}>

          {/* CONVERSATIONS LIST */}
          <div style={{
            backgroundColor: "white",
            border: "1px solid #eee",
            borderRadius: 10,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid #eee",
              fontWeight: "bold",
              fontSize: 14,
              color: "#333",
            }}>
              Conversations
            </div>

            {conversations.length === 0 ? (
              <p style={{ padding: 20, color: "#888", fontSize: 13, textAlign: "center" }}>
                No messages yet.{"\n"}
                Visit a vendor or organizer profile to start a conversation.
              </p>
            ) : (
              conversations.map(convo => (
                <div
                  key={convo.partnerId}
                  onClick={() => {
                    setActiveConvo(convo.partnerId);
                    loadRecipient(convo.partnerId);
                  }}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f5f5f5",
                    cursor: "pointer",
                    backgroundColor: activeConvo === convo.partnerId ? "#f3e8ff" : "white",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {convo.partner?.logo_url ? (
                    <img src={convo.partner.logo_url} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      👤
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: "bold", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {getPartnerName(convo.partner)}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {convo.lastMessage?.content}
                    </p>
                  </div>
                  {convo.unread > 0 && (
                    <span style={{
                      backgroundColor: "#701890",
                      color: "white",
                      borderRadius: "50%",
                      width: 20, height: 20,
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}>
                      {convo.unread}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* MESSAGE THREAD */}
          {activeConvo && (
            <div style={{
              backgroundColor: "white",
              border: "1px solid #eee",
              borderRadius: 10,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}>
              {/* THREAD HEADER */}
              <div style={{
                padding: "14px 16px",
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                {recipientProfile?.logo_url && (
                  <img src={recipientProfile.logo_url} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                )}
                <div>
                  <strong style={{ fontSize: 14 }}>
                    {getPartnerName(recipientProfile)}
                  </strong>
                  {recipientProfile?.handle && (
                    <p style={{ margin: 0, fontSize: 11, color: "#888" }}>@{recipientProfile.handle}</p>
                  )}
                </div>
                {recipientProfile?.handle && (
                  <button
                    onClick={() => router.push(`/${recipientProfile.role}/${recipientProfile.handle}`)}
                    style={{
                      marginLeft: "auto",
                      padding: "6px 12px",
                      backgroundColor: "#701890",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    View Profile
                  </button>
                )}
              </div>

              {/* MESSAGES */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minHeight: 300,
                maxHeight: 400,
              }}>
                {messages.length === 0 ? (
                  <p style={{ color: "#888", fontSize: 13, textAlign: "center", marginTop: 40 }}>
                    No messages yet. Say hello! 👋
                  </p>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_id === profile?.id;
                    return (
                      <div key={msg.id} style={{
                        display: "flex",
                        justifyContent: isMine ? "flex-end" : "flex-start",
                      }}>
                        <div style={{
                          maxWidth: "75%",
                          padding: "10px 14px",
                          borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          backgroundColor: isMine ? "#701890" : "#f0f0f0",
                          color: isMine ? "white" : "#333",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}>
                          {msg.content}
                          <p style={{
                            margin: "4px 0 0",
                            fontSize: 10,
                            color: isMine ? "rgba(255,255,255,0.7)" : "#999",
                            textAlign: "right",
                          }}>
                            {new Date(msg.created_at).toLocaleTimeString("en-US", {
                              hour: "numeric", minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* INPUT */}
              <div style={{
                padding: "12px 16px",
                borderTop: "1px solid #eee",
                display: "flex",
                gap: 10,
              }}>
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 20,
                    border: "1px solid #ddd",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  style={{
                    padding: "10px 18px",
                    backgroundColor: "#701890",
                    color: "white",
                    border: "none",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: 13,
                    opacity: !newMessage.trim() ? 0.5 : 1,
                  }}
                >
                  {sending ? "..." : "Send"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
