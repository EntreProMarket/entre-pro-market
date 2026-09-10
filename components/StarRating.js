// components/StarRating.js

// ── Display-only stars (e.g. "4.3 ★★★★☆ (12)") ──
export function StarRating({ value = 0, size = 16, showValue = false, count = null }) {
  const rounded = Math.round(value * 2) / 2; // nearest half star
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: size, lineHeight: 1, letterSpacing: 1 }}>
        {[1, 2, 3, 4, 5].map(i => {
          const filled = rounded >= i;
          const half = !filled && rounded >= i - 0.5;
          return (
            <span key={i} style={{ color: filled || half ? "#AABB23" : "#ddd", position: "relative" }}>
              {half ? (
                <span style={{ position: "relative", display: "inline-block" }}>
                  <span style={{ color: "#ddd" }}>★</span>
                  <span style={{ position: "absolute", left: 0, top: 0, width: "50%", overflow: "hidden", color: "#AABB23" }}>★</span>
                </span>
              ) : "★"}
            </span>
          );
        })}
      </span>
      {showValue && <span style={{ fontSize: size * 0.75, color: "#666", fontWeight: "bold" }}>{value.toFixed(1)}</span>}
      {count !== null && <span style={{ fontSize: size * 0.7, color: "#999" }}>({count})</span>}
    </span>
  );
}

// ── Interactive star picker for writing a review ──
export function StarRatingInput({ value, onChange, size = 28 }) {
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          onClick={() => onChange(i)}
          style={{ fontSize: size, cursor: "pointer", color: i <= value ? "#AABB23" : "#ddd", lineHeight: 1, userSelect: "none" }}
        >★</span>
      ))}
    </span>
  );
}

// ── Percentage breakdown bars (5★ 60%, 4★ 20%, etc.) ──
export function RatingBreakdown({ reviews }) {
  const total = reviews.length;
  if (total === 0) return null;
  const counts = [5, 4, 3, 2, 1].map(star => reviews.filter(r => r.rating === star).length);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
      {[5, 4, 3, 2, 1].map((star, idx) => {
        const count = counts[idx];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 28, color: "#666" }}>{star}★</span>
            <div style={{ flex: 1, height: 8, backgroundColor: "#eee", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "#AABB23" }} />
            </div>
            <span style={{ width: 34, color: "#888", textAlign: "right" }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
