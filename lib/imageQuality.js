// lib/imageQuality.js
// Shared image-quality helpers used wherever we export a cropped/resized
// image to canvas (the crop editor, and any downstream compression step).

// A mild unsharp-mask style sharpen. Downscaling and cropping-then-scaling
// both soften detail slightly — this brings back perceived crispness
// without introducing halos if kept subtle (default amount 0.25).
export function sharpenCanvas(ctx, width, height, amount = 0.25) {
  if (width * height > 4000000) return; // skip on very large canvases to avoid jank
  const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  const src = ctx.getImageData(0, 0, width, height);
  const srcData = src.data;
  const out = ctx.createImageData(width, height);
  const dst = out.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dstOff = (y * width + x) * 4;
      let r = 0, g = 0, b = 0;
      for (let cy = 0; cy < 3; cy++) {
        for (let cx = 0; cx < 3; cx++) {
          const sy = Math.min(height - 1, Math.max(0, y + cy - 1));
          const sx = Math.min(width - 1, Math.max(0, x + cx - 1));
          const srcOff = (sy * width + sx) * 4;
          const wt = weights[cy * 3 + cx];
          r += srcData[srcOff] * wt;
          g += srcData[srcOff + 1] * wt;
          b += srcData[srcOff + 2] * wt;
        }
      }
      dst[dstOff] = srcData[dstOff] * (1 - amount) + Math.min(255, Math.max(0, r)) * amount;
      dst[dstOff + 1] = srcData[dstOff + 1] * (1 - amount) + Math.min(255, Math.max(0, g)) * amount;
      dst[dstOff + 2] = srcData[dstOff + 2] * (1 - amount) + Math.min(255, Math.max(0, b)) * amount;
      dst[dstOff + 3] = srcData[dstOff + 3];
    }
  }
  ctx.putImageData(out, 0, 0);
}

// Always use the browser's best (slowest) resampling filter when scaling —
// the default can look noticeably soft/blocky on mobile.
export function useHighQualitySmoothing(ctx) {
  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";
}
