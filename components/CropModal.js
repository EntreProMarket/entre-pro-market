// components/CropModal.js
import { createPortal } from "react-dom";
import ImageEditor from "./ImageEditor";

// Full-screen crop window. Shows the whole editor (box handles, pinch/scroll zoom, Cancel and
// "Use This Crop" buttons) no matter where on the page it was opened from.
export default function CropModal({ src, onDone, onCancel }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100000, backgroundColor: "rgba(0,0,0,0.78)", overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: "12px 10px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 520, width: "100%", margin: "0 auto", backgroundColor: "white", borderRadius: 12, padding: 12, boxSizing: "border-box" }}>
        <p style={{ margin: "0 0 8px", fontWeight: "bold", color: "#701890", fontSize: 14 }}>✂️ Crop your photo</p>
        <ImageEditor src={src} aspect={null} onCancel={onCancel} onDone={(file, preview) => onDone(file, preview)} />
      </div>
    </div>,
    document.body
  );
}
