// pages/contact.js

import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Contact() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Advertising Inquiry");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !message) return;
    setSending(true);

    await supabase.from("contact_submissions").insert([{
      name, email, subject, message,
    }]);

    setSent(true);
    setSending(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <img src="/logo.png.jpg" alt="EntreProMarket" style={{ width: 80, marginBottom: 16 }} />
        <h1 style={{ marginBottom: 8 }}>Contact Us</h1>
        <p style={{ color: "#666", fontSize: 14 }}>
          Interested in advertising or have a question? We'd love to hear from you.
        </p>
      </div>

      {sent ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ fontSize: 48 }}>✅</p>
          <h2>Message Sent!</h2>
          <p style={{ color: "#666" }}>We'll get back to you within 24-48 hours.</p>
          <button
            onClick={() => router.push("/marketplace")}
            style={{ padding: "12px 24px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}
          >
            Back to Marketplace
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 12, padding: 24 }}>
          <label style={labelStyle}>Your Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="John Smith" />

          <label style={labelStyle}>Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="john@example.com" />

          <label style={labelStyle}>Subject</label>
          <select value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle}>
            <option>Advertising Inquiry</option>
            <option>General Question</option>
            <option>Partnership Opportunity</option>
            <option>Technical Support</option>
            <option>Other</option>
          </select>

          <label style={labelStyle}>Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Tell us about your advertising goals or ask us anything..." />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button onClick={() => router.back()}
              style={{ padding: "12px 20px", backgroundColor: "#ccc", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>
              ← Back
            </button>
            <button onClick={handleSubmit} disabled={sending || !name || !email || !message}
              style={{ padding: "12px 24px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", opacity: (!name || !email || !message) ? 0.6 : 1 }}>
              {sending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 16, boxSizing: "border-box" };
const labelStyle = { display: "block", fontWeight: "bold", marginBottom: 5, fontSize: 13, color: "#333" };
