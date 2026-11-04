// components/LinkedText.js
import { toSegments } from "../lib/linkRules";

// Shows text with clickable links. Pass allowLinks={false} (a free account's text) and any link or
// phone number is hidden instead.
export default function LinkedText({ text, allowLinks = false, linkStyle, style }) {
  if (!text) return null;
  const segs = toSegments(text, allowLinks);
  return (
    <span style={style}>
      {segs.map((s, i) =>
        s.type === "link" ? (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer nofollow ugc" onClick={(e) => e.stopPropagation()} style={{ color: "#701890", textDecoration: "underline", wordBreak: "break-word", ...linkStyle }}>{s.text}</a>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </span>
  );
}
