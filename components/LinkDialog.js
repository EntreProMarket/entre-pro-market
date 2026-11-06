// components/LinkDialog.js
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { buildMarkdownLink } from "../lib/linkRules";

// Small window (like Microsoft Word's "Insert link"): type the words people will see + the address.
export default function LinkDialog({ open, initialLabel = "", initialUrl = "", onInsert, onClose }) {
  const [label, setLabel] = useState(initialLabel);
  const [url, setUrl] = useState(initialUrl);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) { setLabel(initialLabel); setUrl(initialUrl); setErr(""); }
  }, [open]); // eslint-disable-line

  if (!open || typeof document === "undefined") return null;

  const insert = () => {
    const md = buildMarkdownLink(label, url);
    if (!md) { setErr("Please enter a web address, like mystore.com"); return; }
    onInsert(md);
  };
  const field = { display: "block", width: "100%", padding: "11px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", marginBottom: 12 };

  return createPortal(
    <div onPointerDown={(e) => e.stopPropagation()} onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100002, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: 14, padding: 18, maxWidth: 420, width: "100%", boxSizing: "border-box", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#701890" }}>🔗 Turn into a link</h3>
        <label style={{ fontSize: 13, fontWeight: "bold", color: "#333", display: "block", marginBottom: 6 }}>Words to show</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Shop my store" style={field} />
        <label style={{ fontSize: 13, fontWeight: "bold", color: "#333", display: "block", marginBottom: 6 }}>Web address</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="e.g. mystore.com or https://mystore.com" style={field} inputMode="url" autoCapitalize="none" autoCorrect="off" />
        {err && <p style={{ margin: "-4px 0 10px", fontSize: 12, color: "#cc0000" }}>{err}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ padding: "11px 18px", backgroundColor: "#ccc", color: "#222", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={insert} style={{ padding: "11px 18px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Add link</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
