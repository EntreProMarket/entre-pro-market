// components/SelectedLinkChip.js
import { useEffect, useState } from "react";
import LinkDialog from "./LinkDialog";
import { findLinks } from "../lib/linkRules";

// When someone highlights a full web address inside a text box, a small button appears:
// "Turn into clickable words". It opens the same little window as Microsoft Word.
export default function SelectedLinkChip({ textareaRef, value, onChange }) {
  const [sel, setSel] = useState(null); // { start, end, text }
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = textareaRef && textareaRef.current;
    if (!el) return undefined;
    const check = () => {
      const start = el.selectionStart, end = el.selectionEnd;
      if (typeof start !== "number" || end - start < 4) { setSel(null); return; }
      const raw = (el.value || "").slice(start, end).trim();
      const links = findLinks(raw);
      if (links.length === 1 && links[0].start === 0 && links[0].end === raw.length && raw[0] !== "[" && !raw.startsWith("mailto:")) setSel({ start, end, text: raw });
      else setSel(null);
    };
    const events = ["select", "keyup", "mouseup", "touchend"];
    events.forEach((e) => el.addEventListener(e, check));
    document.addEventListener("selectionchange", check);
    return () => { events.forEach((e) => el.removeEventListener(e, check)); document.removeEventListener("selectionchange", check); };
  }, [textareaRef]);

  const insert = (md) => {
    if (!sel) return;
    const v = value || "";
    onChange(v.slice(0, sel.start) + md + v.slice(sel.end));
    setSel(null);
    setOpen(false);
  };

  return (
    <>
      {sel && !open && (
        <button type="button" onClick={() => setOpen(true)} style={{ padding: "7px 14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, fontSize: 12, fontWeight: "bold", cursor: "pointer" }}>✨ Turn this address into clickable words</button>
      )}
      <LinkDialog open={open} initialLabel="" initialUrl={sel ? sel.text : ""} onInsert={insert} onClose={() => setOpen(false)} />
    </>
  );
}
