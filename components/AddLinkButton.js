// components/AddLinkButton.js
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import HelpTip from "./HelpTip";
import { buildMarkdownLink, PURCHASE_CONTACT_DAYS } from "../lib/linkRules";

// The ⓘ popup that explains the link rules. mode: "editor" | "free" | "message-ok" | "message-blocked"
export function LinksInfoTip({ mode = "editor", size = 26 }) {
  const p = { margin: "0 0 8px" };
  return (
    <HelpTip title="Links & phone numbers" size={size}>
      {mode === "free" && (
        <>
          <p style={p}>Free accounts can't use links or phone numbers in text fields. If you type one, it is erased automatically and is never saved.</p>
          <p style={p}>Upgrade to a paid plan to add clickable links.</p>
          <p style={{ margin: 0 }}>After you make a purchase, you and the seller can share contact info with each other for {PURCHASE_CONTACT_DAYS} days.</p>
        </>
      )}
      {mode === "editor" && (
        <>
          <p style={p}><strong>🔗 Add link</strong> — type the words people will see (like “Shop my store”) and the web address. Visitors see your words, not the long address.</p>
          <p style={p}>You can also paste a full web address and it becomes clickable by itself.</p>
          <p style={p}><strong>Contacts:</strong> on plans with a monthly contact limit (Basic and Pro Organizers), every link you send in a message counts as 1 contact, on top of the message itself. Elite Organizers and Vendors have no contact limit.</p>
          <p style={{ margin: 0 }}>Links and phone numbers can only be sent in messages between two paid accounts.</p>
        </>
      )}
      {mode === "message-ok" && (
        <>
          <p style={p}><strong>🔗 Add link</strong> — type the words the other person will see and the web address.</p>
          <p style={p}><strong>Contacts:</strong> on plans with a monthly contact limit (Basic and Pro Organizers), each link in a message counts as 1 contact, on top of the message itself. Elite Organizers and Vendors have no contact limit.</p>
          <p style={{ margin: 0 }}>Links and phone numbers can only be sent between two paid accounts. They are erased automatically in messages to or from a free account.</p>
        </>
      )}
      {mode === "message-blocked" && (
        <>
          <p style={p}>Links and phone numbers can't be sent to or from a free account. If you type one, it is erased automatically.</p>
          <p style={{ margin: 0 }}>Exception: for {PURCHASE_CONTACT_DAYS} days after a purchase, the buyer and the seller can share links and phone numbers with each other.</p>
        </>
      )}
    </HelpTip>
  );
}

// "🔗 Add link" button: opens a small window where you type the words to show + the web address,
// then writes it into the text box at the cursor.
export default function AddLinkButton({ textareaRef, value, onChange, infoMode = "editor" }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const sel = useRef({ start: 0, end: 0 });

  const openDialog = () => {
    const el = textareaRef && textareaRef.current;
    const v = value || "";
    const start = el && typeof el.selectionStart === "number" ? el.selectionStart : v.length;
    const end = el && typeof el.selectionEnd === "number" ? el.selectionEnd : start;
    sel.current = { start, end };
    setLabel(v.slice(start, end));
    setUrl("");
    setErr("");
    setOpen(true);
  };

  const insert = () => {
    const md = buildMarkdownLink(label, url);
    if (!md) { setErr("Please enter a web address, like mystore.com"); return; }
    const v = value || "";
    onChange(v.slice(0, sel.current.start) + md + v.slice(sel.current.end));
    setOpen(false);
    const el = textareaRef && textareaRef.current;
    if (el) setTimeout(() => el.focus(), 0);
  };

  const field = { display: "block", width: "100%", padding: "11px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", marginBottom: 12 };

  return (
    <>
      <button type="button" onClick={openDialog} style={{ padding: "7px 14px", backgroundColor: "white", color: "#701890", border: "2px solid #701890", borderRadius: 20, fontSize: 12, fontWeight: "bold", cursor: "pointer" }}>🔗 Add link</button>
      <LinksInfoTip mode={infoMode} />
      {open && typeof document !== "undefined" && createPortal(
        <div onPointerDown={(e) => e.stopPropagation()} onClick={() => setOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100002, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: 14, padding: 18, maxWidth: 420, width: "100%", boxSizing: "border-box", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#701890" }}>🔗 Add a link</h3>
            <label style={{ fontSize: 13, fontWeight: "bold", color: "#333", display: "block", marginBottom: 6 }}>Words to show</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Shop my store" style={field} />
            <label style={{ fontSize: 13, fontWeight: "bold", color: "#333", display: "block", marginBottom: 6 }}>Web address</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="e.g. mystore.com or https://mystore.com" style={field} inputMode="url" autoCapitalize="none" autoCorrect="off" />
            {err && <p style={{ margin: "-4px 0 10px", fontSize: 12, color: "#cc0000" }}>{err}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setOpen(false)} style={{ padding: "11px 18px", backgroundColor: "#ccc", color: "#222", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={insert} style={{ padding: "11px 18px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Add link</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
