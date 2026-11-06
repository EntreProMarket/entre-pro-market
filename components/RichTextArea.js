// components/RichTextArea.js
import { useRef, useState } from "react";
import AddLinkButton, { LinksInfoTip } from "./AddLinkButton";
import SelectedLinkChip from "./SelectedLinkChip";
import { hasLink, hasPhone, stripLinks, stripPhones } from "../lib/linkRules";

// A text box that follows the link rules:
//  • canLink (paid accounts / admin): shows "🔗 Add link" + the ⓘ popup. Links become clickable.
//  • free accounts: any link or phone number is erased as it is typed, so it can never be saved.
export default function RichTextArea({ value, onChange, canLink, canPhone, placeholder, style, rows }) {
  const ref = useRef(null);
  const [notice, setNotice] = useState("");
  const phoneOk = canPhone === undefined ? canLink : canPhone;

  const handleChange = (e) => {
    let v = e.target.value;
    let removed = false;
    if (!canLink && hasLink(v)) { v = stripLinks(v); removed = true; }
    if (!phoneOk && hasPhone(v)) { v = stripPhones(v); removed = true; }
    if (removed) {
      setNotice("Links and phone numbers aren't allowed on free accounts, so they were removed.");
      setTimeout(() => setNotice(""), 5000);
    }
    onChange(v);
  };

  return (
    <div>
      <textarea ref={ref} value={value} onChange={handleChange} placeholder={placeholder} rows={rows} style={style} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "-4px 0 12px", flexWrap: "wrap" }}>
        {canLink ? <AddLinkButton textareaRef={ref} value={value} onChange={onChange} /> : <LinksInfoTip mode="free" />}
        {canLink && <SelectedLinkChip textareaRef={ref} value={value} onChange={onChange} />}
        {notice && <span style={{ fontSize: 12, color: "#cc0000" }}>{notice}</span>}
      </div>
    </div>
  );
}
