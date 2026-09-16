// components/LoadTimeoutFallback.js
export default function LoadTimeoutFallback({ label = "this page" }) {
  return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
      <p style={{ fontSize: 40, margin: "0 0 12px" }}>📡</p>
      <p style={{ fontWeight: "bold", fontSize: 16, color: "#333", margin: "0 0 8px" }}>Couldn't load {label}</p>
      <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px", maxWidth: 320, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
        This is taking longer than expected — check your connection and try again.
      </p>
      <button onClick={() => window.location.reload()}
        style={{ padding: "10px 22px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>
        Try Again
      </button>
    </div>
  );
}
