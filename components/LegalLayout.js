// components/LegalLayout.js
import { useRouter } from "next/router";
import { LEGAL } from "../lib/legalConfig";
import LegalLinks from "./LegalLinks";

// {{token}} in the text is replaced with the matching value from lib/legalConfig.js
const fill = (s) => String(s).replace(/\{\{(\w+)\}\}/g, (m, k) => (LEGAL[k] !== undefined ? LEGAL[k] : m));

// Shows a legal document. sections = [{ h: "1. Heading", p: ["paragraph", ...], ul: ["bullet", ...] }]
export default function LegalLayout({ title, intro, sections }) {
  const router = useRouter();
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 18px 60px", fontFamily: "Roboto, Arial, sans-serif", color: "#222", lineHeight: 1.65 }}>
      <button onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))} style={{ padding: "9px 16px", backgroundColor: "#ccc", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", marginBottom: 18 }}>← Back</button>
      <h1 style={{ margin: "0 0 6px", color: "#701890", fontSize: 30 }}>{title}</h1>
      <p style={{ margin: "0 0 20px", color: "#777", fontSize: 14 }}>Effective date: {fill("{{effectiveDate}}")}</p>
      {intro && <p style={{ background: "#f7f0fa", border: "1px solid #e2cdea", borderRadius: 10, padding: "12px 14px", fontSize: 15 }}>{fill(intro)}</p>}
      {sections.map((s, i) => (
        <section key={i} style={{ marginTop: 26 }}>
          <h2 style={{ fontSize: 19, margin: "0 0 8px", color: "#333" }}>{fill(s.h)}</h2>
          {(s.p || []).map((t, j) => <p key={j} style={{ margin: "0 0 10px", fontSize: 15 }}>{fill(t)}</p>)}
          {s.ul && <ul style={{ margin: "0 0 10px", paddingLeft: 22, fontSize: 15 }}>{s.ul.map((t, j) => <li key={j} style={{ marginBottom: 5 }}>{fill(t)}</li>)}</ul>}
        </section>
      ))}
      <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #ddd" }}><LegalLinks /></div>
    </div>
  );
}
