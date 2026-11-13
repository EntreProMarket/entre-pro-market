// components/LegalLinks.js
// A row of links to the legal pages. Put <LegalLinks /> in your page footer (and next to the signup button).
export default function LegalLinks({ color = "#701890", size = 13, center = false }) {
  const links = [["Terms of Service", "/terms"], ["Privacy Policy", "/privacy"], ["Community Guidelines", "/community-guidelines"], ["Payments & Refunds", "/payments-policy"]];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", justifyContent: center ? "center" : "flex-start" }}>
      {links.map(([label, href]) => <a key={href} href={href} style={{ color, fontSize: size, fontWeight: "bold", textDecoration: "underline" }}>{label}</a>)}
    </div>
  );
}
