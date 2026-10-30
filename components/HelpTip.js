// components/HelpTip.js
import { useState } from "react";
import { createPortal } from "react-dom";

// A round purple "?" button. Tap it and a box opens with the instructions,
// so the page itself stays clean instead of showing big info boxes.
export default function HelpTip({ title = "How this works", label, children, size = 30 }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(true); }} aria-label="Help" title="Tap for help"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0, cursor: "pointer", verticalAlign: "middle" }}>
        <span style={{ width: size, height: size, borderRadius: "50%", border: "2px solid #701890", backgroundColor: "white", color: "#701890", fontWeight: "bold", fontSize: Math.round(size * 0.62), lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.25)", flexShrink: 0 }}>?</span>
        {label && <span style={{ fontSize: 12, fontWeight: "bold", color: "#701890", textAlign: "left" }}>{label}</span>}
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div onPointerDown={(e) => e.stopPropagation()} onClick={() => setOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100001, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "white", borderRadius: 14, padding: 18, maxWidth: 420, width: "100%", maxHeight: "80vh", overflowY: "auto", boxSizing: "border-box", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#701890", color: "white", fontWeight: "bold", fontSize: 17, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>?</span>
              <h3 style={{ margin: 0, fontSize: 16, color: "#701890" }}>{title}</h3>
            </div>
            <div style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>{children}</div>
            <button type="button" onClick={() => setOpen(false)} style={{ marginTop: 16, width: "100%", padding: 12, backgroundColor: "#701890", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}>Got it</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
