// components/ImageEditor.js
import { useEffect, useRef, useState } from "react";
import { sharpenCanvas, useHighQualitySmoothing as setHighQualitySmoothing } from "../lib/imageQuality";

const PAD = 36;          // black margin around the photo so the box handles are never hidden or clipped
const HIT = 32;          // touch radius around the corners — big, forgiving targets
const SIDE_HIT = 26;     // touch distance from a side edge
const MIN_BOX = 48;
const MAX_ZOOM_FACTOR = 8;
const MAX_OUTPUT = 1600;

export default function ImageEditor({ src, aspect = null, onCancel, onDone }) {
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const [stageW, setStageW] = useState(0);
  const [stageH, setStageH] = useState(440);
  const [imgInfo, setImgInfo] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [view, setViewState] = useState(null); // { s, ox, oy } — photo scale + position inside the stage
  const [box, setBoxState] = useState(null);   // { x, y, w, h } — crop box inside the stage
  const [mode, setMode] = useState("photo");   // what dragging INSIDE the box does: move the photo, or move the box
  const [working, setWorking] = useState(false);

  const viewRef = useRef(null);
  const boxRef = useRef(null);
  const infoRef = useRef(null);
  const baseScale = useRef(1);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const modeRef = useRef("photo");
  const sizeRef = useRef({ w: 0, h: 0 });
  modeRef.current = mode;
  infoRef.current = imgInfo;
  sizeRef.current = { w: stageW, h: stageH };

  const commit = (v, b) => { viewRef.current = v; boxRef.current = b; setViewState(v); setBoxState(b); };

  // size the stage to the available width
  useEffect(() => {
    const measure = () => {
      if (!wrapRef.current) return;
      setStageW(wrapRef.current.clientWidth);
      setStageH(Math.round(Math.min(Math.max(window.innerHeight * 0.58, 330), 560)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // load the photo
  useEffect(() => {
    let cancelled = false;
    setImgInfo(null); setLoadError("");
    const el = new Image();
    const clean = (src || "").split("#")[0];
    const isHttp = /^https?:/i.test(clean);
    if (isHttp) el.crossOrigin = "anonymous";
    el.onload = () => { if (!cancelled) setImgInfo({ el, nw: el.naturalWidth, nh: el.naturalHeight }); };
    el.onerror = () => { if (!cancelled) setLoadError("Couldn't load this photo for cropping."); };
    el.src = isHttp ? clean + (clean.includes("?") ? "&" : "?") + "cb=" + Date.now() : clean;
    return () => { cancelled = true; };
  }, [src]);

  const resetAll = () => {
    const info = infoRef.current;
    const { w: sw, h: sh } = sizeRef.current;
    if (!info || !sw) return;
    const s = Math.min((sw - PAD * 2) / info.nw, (sh - PAD * 2) / info.nh);
    baseScale.current = s;
    const iw = info.nw * s, ih = info.nh * s;
    const ox = (sw - iw) / 2, oy = (sh - ih) / 2;
    const b = { x: ox, y: oy, w: iw, h: ih };
    if (aspect) {
      if (iw / ih > aspect) { b.h = ih; b.w = ih * aspect; } else { b.w = iw; b.h = iw / aspect; }
      b.x = ox + (iw - b.w) / 2; b.y = oy + (ih - b.h) / 2;
    }
    commit({ s, ox, oy }, b);
  };
  useEffect(() => { resetAll(); }, [imgInfo, stageW, stageH]); // eslint-disable-line

  // ---- geometry helpers ----
  const clampView = (v, b, info) => {
    const minS = Math.max(b.w / info.nw, b.h / info.nh);
    const s = Math.max(minS, Math.min(v.s, Math.max(minS, baseScale.current * MAX_ZOOM_FACTOR)));
    const ox = Math.min(b.x, Math.max(b.x + b.w - info.nw * s, v.ox));
    const oy = Math.min(b.y, Math.max(b.y + b.h - info.nh * s, v.oy));
    return { s, ox, oy };
  };
  const clampBox = (b, v, info) => {
    const { w: sw, h: sh } = sizeRef.current;
    const iw = info.nw * v.s, ih = info.nh * v.s;
    const w = Math.max(MIN_BOX, Math.min(b.w, iw, sw - PAD * 2));
    const h = Math.max(MIN_BOX, Math.min(b.h, ih, sh - PAD * 2));
    const minX = Math.max(v.ox, PAD), maxX = Math.min(v.ox + iw, sw - PAD) - w;
    const minY = Math.max(v.oy, PAD), maxY = Math.min(v.oy + ih, sh - PAD) - h;
    return { x: Math.min(Math.max(b.x, minX), Math.max(minX, maxX)), y: Math.min(Math.max(b.y, minY), Math.max(minY, maxY)), w, h };
  };
  const resizeBox = (sb, handle, dx, dy, v, info) => {
    const { w: sw, h: sh } = sizeRef.current;
    let x = sb.x, y = sb.y, x2 = sb.x + sb.w, y2 = sb.y + sb.h;
    if (handle.includes("l")) x += dx;
    if (handle.includes("r")) x2 += dx;
    if (handle.includes("t")) y += dy;
    if (handle.includes("b")) y2 += dy;
    const iw = info.nw * v.s, ih = info.nh * v.s;
    const minX = Math.max(v.ox, PAD), maxX = Math.min(v.ox + iw, sw - PAD);
    const minY = Math.max(v.oy, PAD), maxY = Math.min(v.oy + ih, sh - PAD);
    x = Math.max(minX, x); y = Math.max(minY, y); x2 = Math.min(maxX, x2); y2 = Math.min(maxY, y2);
    if (x2 - x < MIN_BOX) { if (handle.includes("l")) x = x2 - MIN_BOX; else x2 = x + MIN_BOX; }
    if (y2 - y < MIN_BOX) { if (handle.includes("t")) y = y2 - MIN_BOX; else y2 = y + MIN_BOX; }
    let nb = { x, y, w: x2 - x, h: y2 - y };
    if (aspect && handle.length === 2) {
      let w2 = nb.w, h2 = nb.h;
      if (w2 / h2 > aspect) w2 = h2 * aspect; else h2 = w2 / aspect;
      const ax = handle.includes("l") ? sb.x + sb.w : sb.x;
      const ay = handle.includes("t") ? sb.y + sb.h : sb.y;
      nb = { x: handle.includes("l") ? ax - w2 : ax, y: handle.includes("t") ? ay - h2 : ay, w: w2, h: h2 };
    }
    return nb;
  };
  const hitTest = (px, py, b) => {
    const corners = { tl: [b.x, b.y], tr: [b.x + b.w, b.y], bl: [b.x, b.y + b.h], br: [b.x + b.w, b.y + b.h] };
    let best = null, bestD = HIT;
    Object.keys(corners).forEach((k) => { const d = Math.hypot(px - corners[k][0], py - corners[k][1]); if (d < bestD) { best = k; bestD = d; } });
    if (best) return best;
    if (!aspect) {
      const inX = px >= b.x - SIDE_HIT / 2 && px <= b.x + b.w + SIDE_HIT / 2;
      const inY = py >= b.y - SIDE_HIT / 2 && py <= b.y + b.h + SIDE_HIT / 2;
      const cand = [];
      if (inX) { cand.push(["t", Math.abs(py - b.y)]); cand.push(["b", Math.abs(py - (b.y + b.h))]); }
      if (inY) { cand.push(["l", Math.abs(px - b.x)]); cand.push(["r", Math.abs(px - (b.x + b.w))]); }
      cand.sort((a, c) => a[1] - c[1]);
      if (cand.length && cand[0][1] < SIDE_HIT) return cand[0][0];
    }
    return null;
  };

  // ---- touch / mouse ----
  const rel = (e) => { const r = stageRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const startSingle = (p) => {
    const b = boxRef.current, v = viewRef.current;
    const h = hitTest(p.x, p.y, b);
    if (h) gesture.current = { type: "resize", handle: h, start: p, sb: { ...b } };
    else if (modeRef.current === "box" && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) gesture.current = { type: "moveBox", start: p, sb: { ...b } };
    else gesture.current = { type: "pan", start: p, sv: { ...v } };
  };
  const onPointerDown = (e) => {
    if (!infoRef.current || !viewRef.current) return;
    e.preventDefault();
    try { stageRef.current.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    pointers.current.set(e.pointerId, rel(e));
    if (pointers.current.size === 1) startSingle(rel(e));
    else if (pointers.current.size === 2) {
      const [a, c] = Array.from(pointers.current.values());
      gesture.current = { type: "pinch", d0: Math.hypot(a.x - c.x, a.y - c.y) || 1, mid0: { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 }, sv: { ...viewRef.current } };
    }
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    const p = rel(e);
    pointers.current.set(e.pointerId, p);
    const g = gesture.current, info = infoRef.current, v = viewRef.current, b = boxRef.current;
    if (!info) return;
    if (g.type === "pinch" && pointers.current.size >= 2) {
      const [a, c] = Array.from(pointers.current.values());
      const d = Math.hypot(a.x - c.x, a.y - c.y) || 1;
      const mid = { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 };
      const s = g.sv.s * (d / g.d0);
      const ox = mid.x - (g.mid0.x - g.sv.ox) * (s / g.sv.s);
      const oy = mid.y - (g.mid0.y - g.sv.oy) * (s / g.sv.s);
      commit(clampView({ s, ox, oy }, b, info), b);
    } else if (g.type === "pan") {
      commit(clampView({ s: g.sv.s, ox: g.sv.ox + (p.x - g.start.x), oy: g.sv.oy + (p.y - g.start.y) }, b, info), b);
    } else if (g.type === "moveBox") {
      commit(v, clampBox({ ...g.sb, x: g.sb.x + (p.x - g.start.x), y: g.sb.y + (p.y - g.start.y) }, v, info));
    } else if (g.type === "resize") {
      const nb = resizeBox(g.sb, g.handle, p.x - g.start.x, p.y - g.start.y, v, info);
      commit(clampView(v, nb, info), nb);
    }
  };
  const endPointer = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) gesture.current = null;
    else if (pointers.current.size === 1) {
      const only = Array.from(pointers.current.values())[0];
      gesture.current = { type: "pan", start: only, sv: { ...viewRef.current } };
    }
  };

  const zoomAt = (cx, cy, factor) => {
    const info = infoRef.current, v = viewRef.current, b = boxRef.current;
    if (!info || !v || !b) return;
    const s = v.s * factor;
    commit(clampView({ s, ox: cx - (cx - v.ox) * (s / v.s), oy: cy - (cy - v.oy) * (s / v.s) }, b, info), b);
  };
  const zoomButton = (factor) => { const b = boxRef.current; if (b) zoomAt(b.x + b.w / 2, b.y + b.h / 2, factor); };

  // mouse wheel zoom (needs a non-passive listener to stop the page scrolling)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []); // eslint-disable-line

  const doCrop = async () => {
    const info = infoRef.current, v = viewRef.current, b = boxRef.current;
    if (!info || !v || !b) return;
    setWorking(true);
    try {
      const sx = Math.max(0, (b.x - v.ox) / v.s), sy = Math.max(0, (b.y - v.oy) / v.s);
      const sw = Math.min(info.nw - sx, b.w / v.s), sh = Math.min(info.nh - sy, b.h / v.s);
      const scale = Math.min(1, MAX_OUTPUT / Math.max(sw, sh));
      const ow = Math.max(1, Math.round(sw * scale)), oh = Math.max(1, Math.round(sh * scale));
      const canvas = document.createElement("canvas");
      canvas.width = ow; canvas.height = oh;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, ow, oh);
      setHighQualitySmoothing(ctx);
      ctx.drawImage(info.el, sx, sy, sw, sh, 0, 0, ow, oh);
      if (scale < 1) sharpenCanvas(ctx, ow, oh, 0.25);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("no image");
      const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: "image/jpeg" });
      onDone(file, URL.createObjectURL(file));
    } catch (err) {
      alert("Couldn't crop this photo — the browser wouldn't let the app read it. Please try again.");
    }
    setWorking(false);
  };

  const tool = { padding: "9px 12px", border: "none", borderRadius: 8, fontSize: 13, fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" };
  const handleDot = { position: "absolute", width: 22, height: 22, backgroundColor: "white", border: "3px solid #701890", borderRadius: 6, boxSizing: "border-box", pointerEvents: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.5)" };
  const sideBar = { position: "absolute", backgroundColor: "white", border: "2px solid #701890", borderRadius: 6, boxSizing: "border-box", pointerEvents: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.5)" };

  return (
    <div ref={wrapRef} style={{ width: "100%", boxSizing: "border-box" }}>
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        style={{ position: "relative", width: "100%", height: stageH, backgroundColor: "#0b0b0b", borderRadius: 10, overflow: "hidden", touchAction: "none", userSelect: "none", WebkitUserSelect: "none", cursor: "grab" }}
      >
        {!imgInfo && !loadError && <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 13 }}>Loading photo…</div>}
        {loadError && <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#f88", fontSize: 13, padding: 16, textAlign: "center" }}>{loadError}</div>}
        {imgInfo && view && (
          <img src={imgInfo.el.src} alt="" draggable={false} style={{ position: "absolute", left: view.ox, top: view.oy, width: imgInfo.nw * view.s, height: imgInfo.nh * view.s, maxWidth: "none", pointerEvents: "none", userSelect: "none" }} />
        )}
        {box && (
          <>
            <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, border: "2px solid white", boxSizing: "border-box", boxShadow: "0 0 0 9999px rgba(0,0,0,0.58)", pointerEvents: "none" }}>
              <div style={{ position: "absolute", left: "33.33%", top: 0, bottom: 0, borderLeft: "1px solid rgba(255,255,255,0.35)" }} />
              <div style={{ position: "absolute", left: "66.66%", top: 0, bottom: 0, borderLeft: "1px solid rgba(255,255,255,0.35)" }} />
              <div style={{ position: "absolute", top: "33.33%", left: 0, right: 0, borderTop: "1px solid rgba(255,255,255,0.35)" }} />
              <div style={{ position: "absolute", top: "66.66%", left: 0, right: 0, borderTop: "1px solid rgba(255,255,255,0.35)" }} />
            </div>
            <div style={{ ...handleDot, left: box.x - 11, top: box.y - 11 }} />
            <div style={{ ...handleDot, left: box.x + box.w - 11, top: box.y - 11 }} />
            <div style={{ ...handleDot, left: box.x - 11, top: box.y + box.h - 11 }} />
            <div style={{ ...handleDot, left: box.x + box.w - 11, top: box.y + box.h - 11 }} />
            {!aspect && (
              <>
                <div style={{ ...sideBar, left: box.x + box.w / 2 - 20, top: box.y - 6, width: 40, height: 12 }} />
                <div style={{ ...sideBar, left: box.x + box.w / 2 - 20, top: box.y + box.h - 6, width: 40, height: 12 }} />
                <div style={{ ...sideBar, left: box.x - 6, top: box.y + box.h / 2 - 20, width: 12, height: 40 }} />
                <div style={{ ...sideBar, left: box.x + box.w - 6, top: box.y + box.h / 2 - 20, width: 12, height: 40 }} />
              </>
            )}
          </>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        <button type="button" onClick={() => setMode("photo")} style={{ ...tool, backgroundColor: mode === "photo" ? "#701890" : "#e5e7eb", color: mode === "photo" ? "white" : "#333" }}>✋ Move photo</button>
        <button type="button" onClick={() => setMode("box")} style={{ ...tool, backgroundColor: mode === "box" ? "#701890" : "#e5e7eb", color: mode === "box" ? "white" : "#333" }}>⬚ Move box</button>
        <button type="button" onClick={() => zoomButton(1 / 1.25)} style={{ ...tool, backgroundColor: "#e5e7eb", color: "#333", minWidth: 44 }}>－</button>
        <button type="button" onClick={() => zoomButton(1.25)} style={{ ...tool, backgroundColor: "#e5e7eb", color: "#333", minWidth: 44 }}>＋</button>
        <button type="button" onClick={resetAll} style={{ ...tool, backgroundColor: "#e5e7eb", color: "#333" }}>↺ Reset</button>
      </div>
      <p style={{ fontSize: 12, color: "#666", margin: "8px 0 10px", lineHeight: 1.5 }}>
        Drag to move the photo · pinch (or ＋ －) to zoom · drag the white corners and edges to resize the crop box. Tap <strong>⬚ Move box</strong> to drag the box itself.
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={{ ...tool, padding: "11px 20px", backgroundColor: "#ccc", color: "#222" }}>Cancel</button>
        <button type="button" onClick={doCrop} disabled={!imgInfo || working} style={{ ...tool, padding: "11px 20px", backgroundColor: "#701890", color: "white", opacity: !imgInfo || working ? 0.6 : 1 }}>{working ? "Cropping…" : "✅ Use This Crop"}</button>
      </div>
    </div>
  );
}
