// components/ImageEditor.js
import { useEffect, useRef, useState } from "react";

const MIN_FRAME = 60;
const MIN_SCALE = 0.25;
const MAX_SCALE = 6;

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

// The crop box can never be bigger than the photo currently on screen —
// so shrink/reposition it to stay fully inside the photo's bounds
// whenever the photo's size or position changes. This is what makes a
// gap (white space) structurally impossible: the box is always a
// sub-rectangle of the photo, never independent of it.
function clampFrameToImage(frame, imgLeft, imgTop, imgW, imgH, aspect) {
  let w = frame.w, h = frame.h;
  if (aspect) {
    const shrink = Math.min(1, imgW / w, imgH / h);
    w = w * shrink; h = h * shrink;
  } else {
    w = Math.min(w, imgW);
    h = Math.min(h, imgH);
  }
  w = Math.max(w, Math.min(MIN_FRAME, imgW));
  h = Math.max(h, Math.min(MIN_FRAME, imgH));
  const x = clamp(frame.x, imgLeft, imgLeft + imgW - w);
  const y = clamp(frame.y, imgTop, imgTop + imgH - h);
  return { x, y, w, h };
}

export default function ImageEditor({ src, aspect = null, outputAspect = null, outputMaxSize = 1600, onDone, onCancel }) {
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const imgRef = useRef(null);
  const liveRef = useRef({});
  const gesture = useRef(null);

  const [availW, setAvailW] = useState(320);
  const [natural, setNatural] = useState(null);
  const [fitScale, setFitScale] = useState(1);
  const [stageW, setStageW] = useState(320);
  const [stageH, setStageH] = useState(320);
  const [scale, setScale] = useState(1);
  const [frame, setFrame] = useState(null);

  useEffect(() => {
    const measure = () => { if (wrapRef.current) setAvailW(wrapRef.current.clientWidth || 320); };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const effScale = fitScale * scale;
  const imgW = natural ? natural.w * effScale : 0;
  const imgH = natural ? natural.h * effScale : 0;
  const imgLeft = stageW / 2 - imgW / 2;
  const imgTop = stageH / 2 - imgH / 2;

  liveRef.current = { natural, fitScale, stageW, stageH, scale, frame, effScale, imgW, imgH, imgLeft, imgTop };

  const handleImgLoad = (e) => {
    const el = e.target;
    if (!el.naturalWidth || !el.naturalHeight) return;
    const w = el.naturalWidth, h = el.naturalHeight;
    const sw = availW;
    const sh = clamp(sw, 240, 460);
    const fit = Math.min(sw / w, sh / h);
    const iw = w * fit, ih = h * fit;
    const imgLeft0 = sw / 2 - iw / 2, imgTop0 = sh / 2 - ih / 2;
    let fw = iw, fh = ih;
    if (aspect) {
      if (iw / ih > aspect) { fh = ih; fw = ih * aspect; } else { fw = iw; fh = iw / aspect; }
    }
    setNatural({ w, h });
    setFitScale(fit);
    setStageW(sw); setStageH(sh);
    setScale(1);
    setFrame({ x: imgLeft0 + (iw - fw) / 2, y: imgTop0 + (ih - fh) / 2, w: fw, h: fh });
  };

  const toStagePoint = (clientX, clientY) => {
    const r = stageRef.current.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const startFramePan = (pt) => {
    const s = liveRef.current;
    gesture.current = { mode: "pan", startX: pt.x, startY: pt.y, fx: s.frame.x, fy: s.frame.y };
  };
  const startPinch = (t0, t1) => {
    const s = liveRef.current;
    gesture.current = { mode: "pinch", startDist: dist(t0, t1), startScale: s.scale };
  };
  const startHandle = (corner) => {
    const s = liveRef.current;
    const f = s.frame;
    const anchor = {
      x: corner.includes("w") ? f.x + f.w : f.x,
      y: corner.includes("n") ? f.y + f.h : f.y,
    };
    gesture.current = { mode: "handle", corner, anchor };
  };
  const startEdge = (edge) => {
    const s = liveRef.current;
    const f = s.frame;
    const anchor = {};
    if (edge === "w") anchor.x = f.x + f.w;
    if (edge === "e") anchor.x = f.x;
    if (edge === "n") anchor.y = f.y + f.h;
    if (edge === "s") anchor.y = f.y;
    gesture.current = { mode: "edge", edge, anchor };
  };

  const applyFramePan = (pt) => {
    const g = gesture.current, s = liveRef.current;
    const raw = { x: g.fx + (pt.x - g.startX), y: g.fy + (pt.y - g.startY), w: s.frame.w, h: s.frame.h };
    setFrame(clampFrameToImage(raw, s.imgLeft, s.imgTop, s.imgW, s.imgH, aspect));
  };

  const applyPinch = (t0, t1) => {
    const g = gesture.current, s = liveRef.current;
    const raw = g.startScale * (dist(t0, t1) / g.startDist);
    const next = clamp(raw, MIN_SCALE, MAX_SCALE);
    const es2 = s.fitScale * next;
    const iw2 = s.natural.w * es2, ih2 = s.natural.h * es2;
    const left2 = s.stageW / 2 - iw2 / 2, top2 = s.stageH / 2 - ih2 / 2;
    setScale(next);
    setFrame(clampFrameToImage(s.frame, left2, top2, iw2, ih2, aspect));
  };

  const applyHandle = (pt) => {
    const g = gesture.current, s = liveRef.current;
    const px = clamp(pt.x, s.imgLeft, s.imgLeft + s.imgW);
    const py = clamp(pt.y, s.imgTop, s.imgTop + s.imgH);
    const { anchor } = g;
    const signX = px >= anchor.x ? 1 : -1;
    const signY = py >= anchor.y ? 1 : -1;
    let w, h;
    if (aspect) {
      const wFromX = Math.abs(px - anchor.x);
      const wFromY = Math.abs(py - anchor.y) * aspect;
      w = Math.max(MIN_FRAME, (wFromX + wFromY) / 2);
      const maxW = signX > 0 ? (s.imgLeft + s.imgW - anchor.x) : (anchor.x - s.imgLeft);
      const maxH = signY > 0 ? (s.imgTop + s.imgH - anchor.y) : (anchor.y - s.imgTop);
      w = Math.min(w, maxW, maxH * aspect);
      h = w / aspect;
    } else {
      const maxW = signX > 0 ? (s.imgLeft + s.imgW - anchor.x) : (anchor.x - s.imgLeft);
      const maxH = signY > 0 ? (s.imgTop + s.imgH - anchor.y) : (anchor.y - s.imgTop);
      w = Math.max(MIN_FRAME, Math.min(Math.abs(px - anchor.x), maxW));
      h = Math.max(MIN_FRAME, Math.min(Math.abs(py - anchor.y), maxH));
    }
    const x = signX > 0 ? anchor.x : anchor.x - w;
    const y = signY > 0 ? anchor.y : anchor.y - h;
    setFrame({ x, y, w, h });
  };

  const applyEdge = (pt) => {
    const g = gesture.current, s = liveRef.current;
    const { edge, anchor } = g;
    const next = { ...s.frame };
    if (edge === "w") {
      const minX = s.imgLeft, maxX = anchor.x - MIN_FRAME;
      const newX = clamp(pt.x, minX, Math.max(minX, maxX));
      next.x = newX;
      next.w = anchor.x - newX;
    } else if (edge === "e") {
      const minRight = anchor.x + MIN_FRAME, maxRight = s.imgLeft + s.imgW;
      const newRight = clamp(pt.x, Math.min(minRight, maxRight), maxRight);
      next.x = anchor.x;
      next.w = newRight - anchor.x;
    } else if (edge === "n") {
      const minY = s.imgTop, maxY = anchor.y - MIN_FRAME;
      const newY = clamp(pt.y, minY, Math.max(minY, maxY));
      next.y = newY;
      next.h = anchor.y - newY;
    } else if (edge === "s") {
      const minBottom = anchor.y + MIN_FRAME, maxBottom = s.imgTop + s.imgH;
      const newBottom = clamp(pt.y, Math.min(minBottom, maxBottom), maxBottom);
      next.y = anchor.y;
      next.h = newBottom - anchor.y;
    }
    setFrame(next);
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onTouchStart = (e) => {
      const t = e.touches;
      if (t.length === 1 && e.target.closest && e.target.closest("[data-handle]")) return;
      if (t.length === 2) startPinch({ x: t[0].clientX, y: t[0].clientY }, { x: t[1].clientX, y: t[1].clientY });
      else if (t.length === 1) startFramePan(toStagePoint(t[0].clientX, t[0].clientY));
    };
    const onTouchMove = (e) => {
      if (!liveRef.current.natural || !gesture.current) return;
      const t = e.touches;
      if (t.length === 2 && gesture.current.mode === "pinch") { e.preventDefault(); applyPinch({ x: t[0].clientX, y: t[0].clientY }, { x: t[1].clientX, y: t[1].clientY }); }
      else if (t.length === 1 && gesture.current.mode === "pan") { e.preventDefault(); applyFramePan(toStagePoint(t[0].clientX, t[0].clientY)); }
    };
    const onTouchEnd = (e) => { if (e.touches.length === 0) gesture.current = null; };
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

  const onStageMouseDown = (e) => {
    if (e.target.closest && e.target.closest("[data-handle]")) return;
    startFramePan(toStagePoint(e.clientX, e.clientY));
    const onMove = (ev) => applyFramePan(toStagePoint(ev.clientX, ev.clientY));
    const onUp = () => { gesture.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const s = liveRef.current;
    const next = clamp(scale * (e.deltaY < 0 ? 1.05 : 0.95), MIN_SCALE, MAX_SCALE);
    const es2 = s.fitScale * next;
    const iw2 = s.natural.w * es2, ih2 = s.natural.h * es2;
    const left2 = s.stageW / 2 - iw2 / 2, top2 = s.stageH / 2 - ih2 / 2;
    setScale(next);
    setFrame(clampFrameToImage(s.frame, left2, top2, iw2, ih2, aspect));
  };

  const attachDrag = (e, startFn, applyFn) => {
    e.stopPropagation();
    startFn();
    const isTouch = e.type === "touchstart";
    const move = (ev) => {
      if (isTouch && (!ev.touches || !ev.touches[0])) return;
      const pt = isTouch ? toStagePoint(ev.touches[0].clientX, ev.touches[0].clientY) : toStagePoint(ev.clientX, ev.clientY);
      if (isTouch) ev.preventDefault();
      applyFn(pt);
    };
    const end = () => {
      gesture.current = null;
      if (isTouch) { window.removeEventListener("touchmove", move); window.removeEventListener("touchend", end); }
      else { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", end); }
    };
    if (isTouch) { window.addEventListener("touchmove", move, { passive: false }); window.addEventListener("touchend", end); }
    else { window.addEventListener("mousemove", move); window.addEventListener("mouseup", end); }
  };
  const handleGrabCorner = (corner) => (e) => attachDrag(e, () => startHandle(corner), applyHandle);
  const handleGrabEdge = (edge) => (e) => attachDrag(e, () => startEdge(edge), applyEdge);

  const handleUse = () => {
    const s = liveRef.current;
    if (!s.natural || !imgRef.current || !s.frame) return;
    const { effScale: es, imgLeft: il, imgTop: it, frame: f } = s;
    const srcX = (f.x - il) / es, srcY = (f.y - it) / es;
    const srcW = f.w / es, srcH = f.h / es;
    const longSide = Math.min(outputMaxSize, Math.round(Math.max(srcW, srcH)));
    let outW, outH;
    if (outputAspect) {
      // Fixed target shape (e.g. a square logo slot): stretch the chosen
      // crop to exactly fill it, however the crop itself is shaped.
      if (outputAspect >= 1) { outW = longSide; outH = Math.round(longSide / outputAspect); }
      else { outH = longSide; outW = Math.round(longSide * outputAspect); }
    } else if (f.w >= f.h) { outW = longSide; outH = Math.round(longSide * f.h / f.w); }
    else { outH = longSide; outW = Math.round(longSide * f.w / f.h); }
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, outW); canvas.height = Math.max(1, outH);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });
      onDone(file, URL.createObjectURL(blob));
    }, "image/jpeg", 0.9);
  };

  const edgeHandles = frame ? [
    { id: "n", left: frame.x + frame.w / 2 - 16, top: frame.y - 10, w: 32, h: 20, cursor: "ns-resize", barW: 20, barH: 4 },
    { id: "s", left: frame.x + frame.w / 2 - 16, top: frame.y + frame.h - 10, w: 32, h: 20, cursor: "ns-resize", barW: 20, barH: 4 },
    { id: "w", left: frame.x - 10, top: frame.y + frame.h / 2 - 16, w: 20, h: 32, cursor: "ew-resize", barW: 4, barH: 20 },
    { id: "e", left: frame.x + frame.w - 10, top: frame.y + frame.h / 2 - 16, w: 20, h: 32, cursor: "ew-resize", barW: 4, barH: 20 },
  ] : [];

  return (
    <div style={{ padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8, border: "1px solid #eee" }}>
      <div ref={wrapRef}>
        <div
          ref={stageRef}
          onMouseDown={onStageMouseDown}
          onWheel={onWheel}
          style={{ width: stageW, height: stageH, maxWidth: "100%", margin: "0 auto", position: "relative", overflow: "hidden", borderRadius: 8, border: "1px solid #ddd", backgroundColor: "#111", touchAction: "none", cursor: "grab" }}
        >
          <img
            ref={imgRef}
            src={src}
            crossOrigin="anonymous"
            onLoad={handleImgLoad}
            draggable={false}
            style={{ position: "absolute", left: imgLeft, top: imgTop, width: imgW, height: imgH, display: "block", pointerEvents: "none" }}
          />
          {frame && (
            <>
              <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: frame.y, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: 0, top: frame.y + frame.h, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: 0, top: frame.y, width: frame.x, height: frame.h, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: frame.x + frame.w, top: frame.y, right: 0, height: frame.h, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: frame.x, top: frame.y, width: frame.w, height: frame.h, border: "2px solid #fff", boxSizing: "border-box", pointerEvents: "none" }} />
              {["nw", "ne", "sw", "se"].map((c) => {
                const hx = c.includes("w") ? frame.x : frame.x + frame.w;
                const hy = c.includes("n") ? frame.y : frame.y + frame.h;
                return (
                  <div
                    key={c}
                    data-handle={c}
                    onMouseDown={handleGrabCorner(c)}
                    onTouchStart={handleGrabCorner(c)}
                    style={{ position: "absolute", left: hx - 14, top: hy - 14, width: 28, height: 28, cursor: "nwse-resize", touchAction: "none" }}
                  >
                    <div style={{ width: 16, height: 16, margin: 6, border: "3px solid #fff", background: "rgba(255,255,255,0.25)", borderRadius: 2 }} />
                  </div>
                );
              })}
              {!aspect && edgeHandles.map((h) => (
                <div
                  key={h.id}
                  data-handle={h.id}
                  onMouseDown={handleGrabEdge(h.id)}
                  onTouchStart={handleGrabEdge(h.id)}
                  style={{ position: "absolute", left: h.left, top: h.top, width: h.w, height: h.h, cursor: h.cursor, touchAction: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <div style={{ width: h.barW, height: h.barH, background: "#fff", borderRadius: 2, boxShadow: "0 0 0 1px rgba(0,0,0,0.4)" }} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#888", margin: "8px 0" }}>
        {aspect
          ? "Drag a corner to resize the crop box, or pinch/scroll to zoom the photo — including smaller, to fit more of it in. The box can never go past the photo's edges, so the save always comes out fully filled."
          : "Drag a corner to resize both sides at once, or a side handle to pull in just that edge. Pinch/scroll to zoom the photo, drag inside to move the box. It can never go past the photo's edges, so the save always comes out fully filled."}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={{ padding: "6px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Cancel</button>
        <button type="button" onClick={handleUse} style={{ padding: "6px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>✅ Use This Crop</button>
      </div>
    </div>
  );
}
