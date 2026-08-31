// components/ImageEditor.js
import { useEffect, useRef, useState } from "react";

const MIN_FRAME = 60;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

export default function ImageEditor({ src, aspect = null, outputMaxSize = 1600, onDone, onCancel }) {
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
  const [imgCenter, setImgCenter] = useState(null);
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

  liveRef.current = { natural, fitScale, stageW, stageH, imgCenter, scale, frame, effScale, imgW, imgH };

  const handleImgLoad = (e) => {
    const el = e.target;
    if (!el.naturalWidth || !el.naturalHeight) return;
    const w = el.naturalWidth, h = el.naturalHeight;
    const sw = availW;
    const sh = clamp(sw, 240, 460);
    const fit = Math.min(sw / w, sh / h);
    const iw = w * fit, ih = h * fit;
    let fw = iw, fh = ih;
    if (aspect) {
      if (iw / ih > aspect) { fh = ih; fw = ih * aspect; } else { fw = iw; fh = iw / aspect; }
    }
    setNatural({ w, h });
    setFitScale(fit);
    setStageW(sw); setStageH(sh);
    setScale(1);
    setImgCenter({ x: sw / 2, y: sh / 2 });
    setFrame({ x: sw / 2 - fw / 2, y: sh / 2 - fh / 2, w: fw, h: fh });
  };

  const toStagePoint = (clientX, clientY) => {
    const r = stageRef.current.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const startPan = (pt) => {
    const s = liveRef.current;
    gesture.current = { mode: "pan", startX: pt.x, startY: pt.y, cx: s.imgCenter.x, cy: s.imgCenter.y };
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

  const applyPan = (pt) => {
    const g = gesture.current;
    setImgCenter({ x: g.cx + (pt.x - g.startX), y: g.cy + (pt.y - g.startY) });
  };
  const applyPinch = (t0, t1) => {
    const g = gesture.current;
    const d = dist(t0, t1);
    setScale(clamp(g.startScale * (d / g.startDist), MIN_SCALE, MAX_SCALE));
  };
  const applyHandle = (pt) => {
    const g = gesture.current, s = liveRef.current;
    const px = clamp(pt.x, 0, s.stageW), py = clamp(pt.y, 0, s.stageH);
    const { anchor } = g;
    const signX = px >= anchor.x ? 1 : -1;
    const signY = py >= anchor.y ? 1 : -1;
    let w, h;
    if (aspect) {
      const wFromX = Math.abs(px - anchor.x);
      const wFromY = Math.abs(py - anchor.y) * aspect;
      w = Math.max(MIN_FRAME, (wFromX + wFromY) / 2);
      const maxW = signX > 0 ? s.stageW - anchor.x : anchor.x;
      const maxH = signY > 0 ? s.stageH - anchor.y : anchor.y;
      w = Math.min(w, maxW, maxH * aspect);
      h = w / aspect;
    } else {
      w = Math.max(MIN_FRAME, Math.min(Math.abs(px - anchor.x), signX > 0 ? s.stageW - anchor.x : anchor.x));
      h = Math.max(MIN_FRAME, Math.min(Math.abs(py - anchor.y), signY > 0 ? s.stageH - anchor.y : anchor.y));
    }
    const x = signX > 0 ? anchor.x : anchor.x - w;
    const y = signY > 0 ? anchor.y : anchor.y - h;
    setFrame({ x, y, w, h });
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onTouchStart = (e) => {
      if (e.target.closest && e.target.closest("[data-handle]")) return;
      const t = e.touches;
      if (t.length === 2) startPinch({ x: t[0].clientX, y: t[0].clientY }, { x: t[1].clientX, y: t[1].clientY });
      else if (t.length === 1) startPan(toStagePoint(t[0].clientX, t[0].clientY));
    };
    const onTouchMove = (e) => {
      if (!liveRef.current.natural || !gesture.current) return;
      const t = e.touches;
      if (t.length === 2 && gesture.current.mode === "pinch") { e.preventDefault(); applyPinch({ x: t[0].clientX, y: t[0].clientY }, { x: t[1].clientX, y: t[1].clientY }); }
      else if (t.length === 1 && gesture.current.mode === "pan") { e.preventDefault(); applyPan(toStagePoint(t[0].clientX, t[0].clientY)); }
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
    startPan(toStagePoint(e.clientX, e.clientY));
    const onMove = (ev) => applyPan(toStagePoint(ev.clientX, ev.clientY));
    const onUp = () => { gesture.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };
  const onWheel = (e) => {
    e.preventDefault();
    setScale(clamp(scale * (e.deltaY < 0 ? 1.05 : 0.95), MIN_SCALE, MAX_SCALE));
  };

  const handleGrab = (corner) => (e) => {
    e.stopPropagation();
    startHandle(corner);
    const isTouch = e.type === "touchstart";
    const move = (ev) => {
      if (isTouch && (!ev.touches || !ev.touches[0])) return;
      const pt = isTouch ? toStagePoint(ev.touches[0].clientX, ev.touches[0].clientY) : toStagePoint(ev.clientX, ev.clientY);
      if (isTouch) ev.preventDefault();
      applyHandle(pt);
    };
    const end = () => {
      gesture.current = null;
      if (isTouch) { window.removeEventListener("touchmove", move); window.removeEventListener("touchend", end); }
      else { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", end); }
    };
    if (isTouch) { window.addEventListener("touchmove", move, { passive: false }); window.addEventListener("touchend", end); }
    else { window.addEventListener("mousemove", move); window.addEventListener("mouseup", end); }
  };

  const handleUse = () => {
    const s = liveRef.current;
    if (!s.natural || !imgRef.current || !s.frame) return;
    const { natural: nat, effScale: es, imgCenter: c, frame: f } = s;
    const imgLeft = c.x - (nat.w * es) / 2, imgTop = c.y - (nat.h * es) / 2;
    const srcX = (f.x - imgLeft) / es, srcY = (f.y - imgTop) / es;
    const srcW = f.w / es, srcH = f.h / es;
    const longSide = Math.min(outputMaxSize, Math.round(Math.max(srcW, srcH)));
    let outW, outH;
    if (f.w >= f.h) { outW = longSide; outH = Math.round(longSide * f.h / f.w); }
    else { outH = longSide; outW = Math.round(longSide * f.w / f.h); }
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, outW); canvas.height = Math.max(1, outH);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });
      onDone(file, URL.createObjectURL(blob));
    }, "image/jpeg", 0.9);
  };

  const effCenter = imgCenter || { x: stageW / 2, y: stageH / 2 };

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
            style={{ position: "absolute", left: effCenter.x, top: effCenter.y, width: imgW || stageW, height: imgH || stageH, transform: "translate(-50%, -50%)", display: "block", pointerEvents: "none" }}
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
                    onMouseDown={handleGrab(c)}
                    onTouchStart={handleGrab(c)}
                    style={{ position: "absolute", left: hx - 14, top: hy - 14, width: 28, height: 28, cursor: "nwse-resize", touchAction: "none" }}
                  >
                    <div style={{ width: 16, height: 16, margin: 6, border: "3px solid #fff", background: "rgba(255,255,255,0.25)", borderRadius: 2 }} />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#888", margin: "8px 0" }}>Drag a corner to resize the crop. Pinch or drag inside to zoom/move the photo — nothing outside the box gets cut, and zooming out never forces a crop.</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={{ padding: "6px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Cancel</button>
        <button type="button" onClick={handleUse} style={{ padding: "6px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>✅ Use This Crop</button>
      </div>
    </div>
  );
}
