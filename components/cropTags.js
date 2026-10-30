// components/cropTags.js
// A cropped photo keeps a pointer to its ORIGINAL so it can always be restored:
//   <cropped url>#orig=<encoded original url>#pos=x,y,zoom
export function getOrigUrl(src) {
  if (!src) return null;
  const m = src.match(/#orig=([^#]*)/);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch (e) { return null; }
}
export function baseUrl(src) {
  return src ? src.split("#")[0] : src;
}
export function tagOrig(url, orig) {
  if (!url) return url;
  return orig ? `${url.split("#")[0]}#orig=${encodeURIComponent(orig)}` : url;
}
