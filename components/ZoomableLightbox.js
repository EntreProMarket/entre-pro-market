// components/ZoomableLightbox.js
import { useEffect, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_MS = 320;
const TAP_MOVE_TOLERANCE = 10;

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

export default function ZoomableLightbox({ src, onClose, footer }) {
  const stageRef = useRef(null);
  const liveRef = useRef({ scale: 1, pos: { x: 0, y: 0 } });
  const gesture = useRef(null);
  const tapInfo = useRef(null);
  const lastTapTime = useRef(0);

  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [interacting, setInteracting] = useState(false);

  useEffect(() => { setScale(1); setPos({ x: 0, y: 0 }); }, [src]);
  useEffect(() => { liveRef.current = { scale, pos }; }, [scale, pos]);

  const toggleZoom = () => {
    if (liveRef.current.scale > 1) { setScale(1); setPos({ x: 0, y: 0 }); }
    else { setScale(2.5); }
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      const t = e.touches;
      const s = liveRef.current;
      if (t.length === 2) {
        setInteracting(true);
        gesture.current = {
          mode: "pinch",
          startDist: dist({ x: t[0].clientX, y: t[0].clientY }, { x: t[1].clientX, y: t[1].clientY }),
          startScale: s.scale,
          startPos: s.pos,
        };
        tapInfo.current = null;
      } else if (t.length === 1) {
        setInteracting(true);
        gesture.current = { mode: "pan", startX: t[0].clientX, startY: t[0].clientY, startPos: s.pos };
        tapInfo.current = { x: t[0].clientX, y: t[0].clientY, moved: false };
      }
    };

    const onTouchMove = (e) => {
      const g = gesture.current;
      if (!g) return;
      const t = e.touches;
      if (t.length === 2 && g.mode === "pinch") {
        e.preventDefault();
        const d = dist({ x: t[0].clientX, y: t[0].clientY }, { x: t[1].clientX, y: t[1].clientY });
        const next = clamp(g.startScale * (d / g.startDist), MIN_SCALE, MAX_SCALE);
        setScale(next);
        if (next <= MIN_SCALE) setPos({ x: 0, y: 0 });
      } else if (t.length === 1 && g.mode === "pan") {
        const dx = t[0].clientX - g.startX, dy = t[0].clientY - g.startY;
        if (tapInfo.current && Math.hypot(dx, dy) > TAP_MOVE_TOLERANCE) tapInfo.current.moved = true;
        if (liveRef.current.scale > 1) {
          e.preventDefault();
          setPos({ x: g.startPos.x + dx, y: g.startPos.y + dy });
        }
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length > 0) return;
      gesture.current = null;
      setInteracting(false);
      const info = tapInfo.current;
      tapInfo.current = null;
      if (info && !info.moved) {
        const now = Date.now();
        if (now - lastTapTime.current < DOUBLE_TAP_MS) { toggleZoom(); lastTapTime.current = 0; }
        else { lastTapTime.current = now; }
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []); // eslint-disable-line

  const onWheel = (e) => {
    e.preventDefault();
    const next = clamp(scale * (e.deltaY < 0 ? 1.15 : 0.87), MIN_SCALE, MAX_SCALE);
    setScale(next);
    if (next <= MIN_SCALE) setPos({ x: 0, y: 0 });
  };

  return (
    <div
      ref={stageRef}
      onWheel={onWheel}
      onDoubleClick={toggleZoom}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.92)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, overflow: "hidden", touchAction: "none" }}
    >
      <img
        src={src}
        alt="enlarged"
        draggable={false}
        style={{
          maxWidth: "95%", maxHeight: "90vh", objectFit: "contain", borderRadius: 10,
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transformOrigin: "center center",
          transition: interacting ? "none" : "transform 0.15s ease-out",
          pointerEvents: "none",
        }}
      />
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.18)", color: "white", border: "none", borderRadius: "50%", width: 38, height: 38, fontSize: 18, cursor: "pointer", zIndex: 1 }}
      >✕</button>
      {footer && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          {footer}
        </div>
      )}
      {scale > 1 && !footer && (
        <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.75)", fontSize: 12, background: "rgba(0,0,0,0.45)", padding: "5px 12px", borderRadius: 12, pointerEvents: "none" }}>
          Pinch or double-tap to reset
        </div>
      )}
    </div>
  );
}
