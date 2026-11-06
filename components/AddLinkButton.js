// components/AddLinkButton.js
import { useRef, useState } from "react";
import HelpTip from "./HelpTip";
import LinkDialog from "./LinkDialog";
import { PURCHASE_CONTACT_DAYS } from "../lib/linkRules";

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

// "🔗 Add link" button: opens the small window, then writes the link into the text box at the cursor
// (or over the words you had selected).
export default function AddLinkButton({ textareaRef, value, onChange, infoMode = "editor" }) {
  const [open, setOpen] = useState(false);
  const [initialLabel, setInitialLabel] = useState("");
  const sel = useRef({ start: 0, end: 0 });

  const openDialog = () => {
    const el = textareaRef && textareaRef.current;
    const v = value || "";
    const start = el && typeof el.selectionStart === "number" ? el.selectionStart : v.length;
    const end = el && typeof el.selectionEnd === "number" ? el.selectionEnd : start;
    sel.current = { start, end };
    setInitialLabel(v.slice(start, end));
    setOpen(true);
  };

  const insert = (md) => {
    const v = value || "";
    onChange(v.slice(0, sel.current.start) + md + v.slice(sel.current.end));
    setOpen(false);
    const el = textareaRef && textareaRef.current;
    if (el) setTimeout(() => el.focus(), 0);
  };

  return (
    <>
      <button type="button" onClick={openDialog} style={{ padding: "7px 14px", backgroundColor: "white", color: "#701890", border: "2px solid #701890", borderRadius: 20, fontSize: 12, fontWeight: "bold", cursor: "pointer" }}>🔗 Add link</button>
      <LinksInfoTip mode={infoMode} />
      <LinkDialog open={open} initialLabel={initialLabel} onInsert={insert} onClose={() => setOpen(false)} />
    </>
  );
}
