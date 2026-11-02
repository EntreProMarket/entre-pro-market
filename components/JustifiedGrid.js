// components/JustifiedGrid.js
import { useEffect, useRef, useState } from "react";

// Lays cards out in rows where every picture in a row is the SAME HEIGHT and the whole picture
// still shows (nothing is cropped). Each picture is scaled up or down just for this display, so
// the rows line up evenly. On phones (narrow screens) it stays a simple one-column list.
export default function JustifiedGrid({ items, renderItem, targetHeight = 300, gap = 16, minWidth = 640, maxPerRow = 4 }) {
  const wrapRef = useRef(null);
  const requested = useRef(new Set());
  const [width, setWidth] = useState(0);
  const [aspects, setAspects] = useState({});

  useEffect(() => {
    const measure = () => { if (wrapRef.current) setWidth(wrapRef.current.clientWidth); };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // learn each picture's real shape (width / height)
  useEffect(() => {
    items.forEach((it) => {
      if (!it.src || requested.current.has(it.src)) return;
      requested.current.add(it.src);
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) setAspects((prev) => ({ ...prev, [it.src]: img.naturalWidth / img.naturalHeight }));
      };
      img.src = it.src;
    });
  });

  if (width < minWidth) {
    return (
      <div ref={wrapRef} style={{ display: "grid", gridTemplateColumns: "1fr", gap }}>
        {items.map((it) => renderItem(it, null))}
      </div>
    );
  }

  const aspectOf = (it) => (it.src ? (aspects[it.src] || 1) : 1.4);
  const maxH = targetHeight * 1.45;
  const rows = [];
  let cur = [];
  let sumA = 0;
  items.forEach((it) => {
    const a = aspectOf(it);
    cur.push({ it, a });
    sumA += a;
    const fillH = (width - gap * (cur.length - 1)) / sumA; // the height this row would need to fill the full width
    if (fillH <= targetHeight || cur.length >= maxPerRow) {
      rows.push({ items: cur, height: Math.min(fillH, maxH), last: false });
      cur = [];
      sumA = 0;
    }
  });
  if (cur.length) {
    const fillH = (width - gap * (cur.length - 1)) / sumA;
    rows.push({ items: cur, height: Math.min(fillH, targetHeight), last: true });
  }

  return (
    <div ref={wrapRef}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: "flex", gap, alignItems: "flex-start", justifyContent: row.last ? "flex-start" : "center", marginBottom: gap }}>
          {row.items.map(({ it, a }) => renderItem(it, { width: Math.floor(a * row.height), imgHeight: Math.round(row.height) }))}
        </div>
      ))}
    </div>
  );
}
