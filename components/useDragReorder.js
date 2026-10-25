// components/useDragReorder.js
import { useRef, useState } from "react";

// Hold-and-drag reordering that NEVER reorders mid-drag.
// While you drag, the photo/product follows your finger and the spot it will
// land in is outlined. The order changes exactly once, when you let go.
// (The first version swapped items live while dragging. Because items are
// different sizes, that caused endless back-and-forth swapping — the freezing.)
export default function useDragReorder(onReorder) {
  const [drag, setDrag] = useState(null); // { index, over } — only changes when the target spot changes
  const dragRef = useRef(null);
  const itemRefs = useRef([]);
  const rects = useRef([]);
  const origin = useRef({ x: 0, y: 0 });
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder; // always call the latest version, never a stale one

  const setItemRef = (i) => (el) => { itemRefs.current[i] = el; };

  const resetTransform = (index) => {
    const el = itemRefs.current[index];
    if (el) el.style.transform = "";
  };

  const handleProps = (i) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      e.stopPropagation();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      rects.current = itemRefs.current.map((el) => (el ? el.getBoundingClientRect() : null));
      origin.current = { x: e.clientX, y: e.clientY };
      const next = { index: i, over: i };
      dragRef.current = next;
      setDrag(next);
    },
    onPointerMove: (e) => {
      const d = dragRef.current;
      if (!d) return;
      // Move the dragged item with the finger directly (no re-render per frame).
      const el = itemRefs.current[d.index];
      if (el) el.style.transform = `translate(${e.clientX - origin.current.x}px, ${e.clientY - origin.current.y}px) scale(1.04)`;
      // Work out which original slot the finger is over.
      let over = d.over;
      rects.current.forEach((r, idx) => {
        if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) over = idx;
      });
      if (over !== d.over) {
        const next = { index: d.index, over };
        dragRef.current = next;
        setDrag(next);
      }
    },
    onPointerUp: () => {
      const d = dragRef.current;
      dragRef.current = null;
      if (d) resetTransform(d.index);
      setDrag(null);
      if (d && d.over !== d.index) onReorderRef.current(d.index, d.over);
    },
    onPointerCancel: () => {
      const d = dragRef.current;
      dragRef.current = null;
      if (d) resetTransform(d.index);
      setDrag(null);
    },
    onContextMenu: (e) => e.preventDefault(),
  });

  // Style to merge onto each draggable item.
  const itemStyle = (i) => {
    if (!drag) return {};
    if (drag.index === i) return { zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.35)", opacity: 0.92, transition: "none", position: "relative" };
    if (drag.over === i) return { outline: "3px dashed #701890", outlineOffset: 2, borderRadius: 8 };
    return {};
  };

  const handleBaseStyle = { touchAction: "none", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none", cursor: "grab" };

  return { setItemRef, handleProps, itemStyle, handleBaseStyle, dragging: !!drag };
}
