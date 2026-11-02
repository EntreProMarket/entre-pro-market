// components/AdminNewsTab.js
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import useDragReorder from "./useDragReorder";
import HelpTip from "./HelpTip";
import CropModal from "./CropModal";
import { getOrigUrl, baseUrl, tagOrig } from "./cropTags";

const COVER_ASPECT_RATIO = "8 / 5";
const inputStyle = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };
const BLANK_ARTICLE_BLOCKS = [{ type: "paragraph", text: "" }];

// One stable preview URL per file (a new one every render made photos reload while dragging).
const previewUrlCache = new WeakMap();
function previewUrl(file) {
  let u = previewUrlCache.get(file);
  if (!u) { u = URL.createObjectURL(file); previewUrlCache.set(file, u); }
  return u;
}

function parsePos(url) {
  if (!url) return { src: url, position: { x: 50, y: 50 }, zoom: 1 };
  const [base, frag] = url.split("#pos=");
  if (!frag) return { src: base, position: { x: 50, y: 50 }, zoom: 1 };
  const [x, y, z] = frag.split(",").map(Number);
  return { src: base, position: { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y }, zoom: isNaN(z) || z < 1 ? 1 : z };
}
function withPos(url, pos, zoom = 1) {
  if (!url) return url;
  const base = url.split("#pos=")[0];
  if (!pos) return base;
  return `${base}#pos=${pos.x.toFixed(1)},${pos.y.toFixed(1)},${zoom.toFixed(2)}`;
}

function PositionableImage({ src, position, zoom = 1, onChange, onZoomChange, aspectRatio, height, onReplace, onRestore, canRestore, cropSrc }) {
  const ref = useRef(null);
  const dragState = useRef(null);
  const pinchState = useRef(null);
  const [adjusting, setAdjusting] = useState(false);
  const [cropping, setCropping] = useState(false);
  const shown = baseUrl(src);
  const origUrl = getOrigUrl(src);
  const cropFrom = cropSrc || origUrl || shown;
  const restorable = !!onRestore && (canRestore !== undefined ? canRestore : !!origUrl);
  const btn = { flex: 1, padding: "10px 4px", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.3)", whiteSpace: "nowrap" };
  const handlePointerDown = (e) => { if (!adjusting) return; dragState.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } };
  const handlePointerMove = (e) => {
    if (!adjusting || !dragState.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - dragState.current.x, dy = e.clientY - dragState.current.y;
    onChange({ x: Math.min(100, Math.max(0, dragState.current.posX - (dx / rect.width) * 100)), y: Math.min(100, Math.max(0, dragState.current.posY - (dy / rect.height) * 100)) });
  };
  const handlePointerUp = () => { dragState.current = null; };
  const handleTouchStart = (e) => { if (adjusting && onZoomChange && e.touches.length === 2) { const [t0, t1] = e.touches; pinchState.current = { dist: Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY), startZoom: zoom }; } };
  const handleTouchMove = (e) => {
    if (adjusting && onZoomChange && e.touches.length === 2 && pinchState.current) {
      const [t0, t1] = e.touches;
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      onZoomChange(Math.min(3, Math.max(1, pinchState.current.startZoom * (dist / pinchState.current.dist))));
    }
  };
  const handleTouchEnd = () => { pinchState.current = null; };
  return (
    <div>
      <div ref={ref} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        style={{ width: "100%", height: height || undefined, aspectRatio: height ? undefined : (aspectRatio || undefined), borderRadius: 8, overflow: "hidden", border: adjusting ? "3px solid #701890" : "2px solid #701890", cursor: adjusting ? "grab" : "default", touchAction: adjusting ? "none" : "pan-y", position: "relative", backgroundColor: "#eee" }}>
        <img src={shown} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${position.x}% ${position.y}%`, transform: `scale(${zoom})`, transformOrigin: "center", display: "block", pointerEvents: "none" }} />
        {adjusting && <div style={{ position: "absolute", bottom: 6, left: 6, right: 6, textAlign: "center", backgroundColor: "rgba(112,24,144,0.9)", color: "white", fontSize: 11, fontWeight: "bold", padding: "4px 6px", borderRadius: 8, pointerEvents: "none" }}>{onZoomChange ? "Pinch to zoom, then drag" : "Drag to move"}</div>}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {onReplace && <button type="button" onClick={() => setCropping(true)} style={{ ...btn, backgroundColor: "#701890" }}>✂️ Crop</button>}
        <button type="button" onClick={() => setAdjusting((a) => !a)} style={{ ...btn, backgroundColor: adjusting ? "#222" : "#8a9a10" }}>{adjusting ? `✓ Done${zoom > 1 ? ` ${zoom.toFixed(1)}x` : ""}` : "✋ Adjust"}</button>
      </div>
      {restorable && <button type="button" onClick={onRestore} style={{ width: "100%", marginTop: 6, padding: "9px 4px", border: "2px solid #701890", borderRadius: 8, backgroundColor: "white", color: "#701890", fontSize: 12, fontWeight: "bold", cursor: "pointer" }}>↩ Restore original</button>}
      {cropping && <CropModal src={cropFrom} onCancel={() => setCropping(false)} onDone={(file) => { setCropping(false); if (onReplace) onReplace(file); }} />}
    </div>
  );
}

export default function AdminNewsTab() {
  const [newsArticles, setNewsArticles] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleCoverUrl, setArticleCoverUrl] = useState("");
  const [articleCoverFile, setArticleCoverFile] = useState(null);
  const [articleCoverPosition, setArticleCoverPosition] = useState({ x: 50, y: 50 });
  const [articleCoverZoom, setArticleCoverZoom] = useState(1);
  const [articleCoverOrigFile, setArticleCoverOrigFile] = useState(null);
  const [articleCoverOrigUrl, setArticleCoverOrigUrl] = useState(undefined);
  const [articleBlocks, setArticleBlocks] = useState(BLANK_ARTICLE_BLOCKS);
  const [savingArticle, setSavingArticle] = useState(false);
  const [composingArticle, setComposingArticle] = useState(false);
  const [message, setMessage] = useState("");
  const [newsOrder, setNewsOrder] = useState([]);
  const newsDrag = useDragReorder((from, to) => reorderNews(from, to));

  useEffect(() => { loadNewsArticles(); }, []);

  const loadNewsArticles = async () => {
    setLoadingNews(true);
    const { data } = await supabase.from("community_news").select("*").order("created_at", { ascending: false });
    setNewsArticles(data || []);
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const { data: me } = await supabase.from("profiles").select("news_order").eq("id", authData.user.id).single();
      setNewsOrder(me?.news_order || []);
    }
    setLoadingNews(false);
  };

  // ── Order of Community News: your dragged order. The first 4 PUBLISHED articles stay
  // pinned at the top of the homepage; everything after them stays newest-first. ──
  const orderedNews = (() => {
    const byId = new Map(newsArticles.map(a => [a.id, a]));
    const inOrder = newsOrder.map(id => byId.get(id)).filter(Boolean);
    const seen = new Set(inOrder.map(a => a.id));
    return [...inOrder, ...newsArticles.filter(a => !seen.has(a.id))];
  })();
  const featuredNewsIds = new Set(orderedNews.filter(a => a.published).slice(0, 4).map(a => a.id));
  const reorderNews = async (from, to) => {
    const ids = orderedNews.map(a => a.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    setNewsOrder(ids);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;
    const { error } = await supabase.from("profiles").update({ news_order: ids }).eq("id", authData.user.id);
    if (error) setMessage("❌ Couldn't save the article order: " + error.message);
  };

  const uploadFile = async (file, bucket, attempt = 1) => {
    const fileName = `${Date.now()}-${file.name}`;
    try {
      const { error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) {
        if (attempt < 3 && /fetch|network|timeout/i.test(error.message || "")) {
          await new Promise(r => setTimeout(r, 1500 * attempt));
          return uploadFile(file, bucket, attempt + 1);
        }
        setMessage("❌ Upload error: " + error.message);
        return null;
      }
      return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
    } catch (err) {
      if (attempt < 3) { await new Promise(r => setTimeout(r, 1500 * attempt)); return uploadFile(file, bucket, attempt + 1); }
      setMessage("❌ Upload error: " + err.message);
      return null;
    }
  };

  const resetArticleForm = () => {
    setEditingArticleId(null); setArticleTitle(""); setArticleCoverUrl(""); setArticleCoverFile(null); setArticleCoverOrigFile(null); setArticleCoverOrigUrl(undefined);
    setArticleCoverPosition({ x: 50, y: 50 }); setArticleCoverZoom(1); setArticleBlocks(BLANK_ARTICLE_BLOCKS); setComposingArticle(false);
  };

  const startNewArticle = () => { resetArticleForm(); setComposingArticle(true); };

  const startEditArticle = (article) => {
    setEditingArticleId(article.id);
    setArticleTitle(article.title || "");
    const cover = parsePos(article.cover_image_url || "");
    setArticleCoverUrl(cover.src || ""); setArticleCoverPosition(cover.position); setArticleCoverZoom(cover.zoom);
    setArticleCoverFile(null);
    setArticleBlocks((article.content_blocks?.length ? article.content_blocks : BLANK_ARTICLE_BLOCKS).map(b =>
      b.type === "image" ? { ...b, file: null, _displaySrc: parsePos(b.url).src } : b
    ));
    setComposingArticle(true);
  };

  const addParagraphBlock = () => setArticleBlocks([...articleBlocks, { type: "paragraph", text: "" }]);
  const addImageBlock = () => setArticleBlocks([...articleBlocks, { type: "image", url: "", file: null, caption: "" }]);
  const updateBlock = (index, updates) => setArticleBlocks(articleBlocks.map((b, i) => i === index ? { ...b, ...updates } : b));
  const removeBlock = (index) => setArticleBlocks(articleBlocks.filter((_, i) => i !== index));
  const moveBlock = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= articleBlocks.length) return;
    const copy = [...articleBlocks];
    [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
    setArticleBlocks(copy);
  };

  // ✂️ Crop the cover: the original is kept, so ↩ Restore original always brings it back.
  const cropCover = async (file) => {
    let origUrl = articleCoverOrigUrl;
    let origFile = articleCoverOrigFile;
    if (!origUrl) {
      if (articleCoverFile) {
        origFile = articleCoverOrigFile || articleCoverFile;
        setMessage("⏳ Saving the original photo...");
        origUrl = (await uploadFile(origFile, "organizer-portfolio")) || undefined;
        setMessage("");
      } else if (articleCoverUrl) {
        origUrl = getOrigUrl(articleCoverUrl) || baseUrl(articleCoverUrl);
      }
    }
    setArticleCoverOrigFile(origFile || null);
    setArticleCoverOrigUrl(origUrl);
    setArticleCoverFile(file);
    setArticleCoverPosition({ x: 50, y: 50 });
    setArticleCoverZoom(1);
  };
  const restoreCover = () => {
    const tagged = getOrigUrl(articleCoverUrl);
    if (articleCoverOrigFile) { setArticleCoverFile(articleCoverOrigFile); }
    else if (articleCoverOrigUrl) { setArticleCoverFile(null); setArticleCoverUrl(articleCoverOrigUrl); }
    else if (!articleCoverFile && tagged) { setArticleCoverUrl(tagged); }
    setArticleCoverOrigFile(null);
    setArticleCoverOrigUrl(undefined);
    setArticleCoverPosition({ x: 50, y: 50 });
    setArticleCoverZoom(1);
  };

  const saveArticle = async () => {
    if (!articleTitle.trim()) { setMessage("⚠️ Article title is required."); return; }
    const hasContent = articleBlocks.some(b => (b.type === "paragraph" && b.text.trim()) || (b.type === "image" && (b.url || b.file)));
    if (!hasContent) { setMessage("⚠️ Add at least one paragraph or image to the article."); return; }
    setSavingArticle(true); setMessage("");
    try {
      let coverUrl = articleCoverUrl;
      if (articleCoverFile) {
        const up = await uploadFile(articleCoverFile, "organizer-portfolio");
        if (!up) { setSavingArticle(false); return; }
        coverUrl = tagOrig(up, articleCoverOrigUrl);
      }
      coverUrl = coverUrl ? withPos(coverUrl.split("#pos=")[0], articleCoverPosition, articleCoverZoom) : "";

      const finalBlocks = [];
      for (const block of articleBlocks) {
        if (block.type === "paragraph") {
          if (block.text.trim()) finalBlocks.push({ type: "paragraph", text: block.text.trim() });
        } else if (block.type === "image") {
          let url = block.url;
          if (block.file) {
            const up = await uploadFile(block.file, "organizer-portfolio");
            if (!up) { setSavingArticle(false); return; }
            url = up;
          }
          if (url) finalBlocks.push({ type: "image", url: url.split("#")[0], caption: block.caption || "" });
        }
      }

      const articleData = { title: articleTitle.trim(), cover_image_url: coverUrl, content_blocks: finalBlocks, updated_at: new Date().toISOString() };

      if (editingArticleId) {
        const { error } = await supabase.from("community_news").update(articleData).eq("id", editingArticleId);
        if (error) throw error;
        setNewsArticles(newsArticles.map(a => a.id === editingArticleId ? { ...a, ...articleData } : a));
      } else {
        const { data, error } = await supabase.from("community_news").insert([{ ...articleData, published: true }]).select().single();
        if (error) throw error;
        if (data) setNewsArticles([data, ...newsArticles]);
      }
      resetArticleForm();
      setMessage("✅ Article saved!");
    } catch (err) {
      setMessage("❌ Error saving article: " + err.message);
    }
    setSavingArticle(false);
  };

  const togglePublished = async (article) => {
    const { error } = await supabase.from("community_news").update({ published: !article.published }).eq("id", article.id);
    if (!error) setNewsArticles(newsArticles.map(a => a.id === article.id ? { ...a, published: !a.published } : a));
  };

  const deleteArticle = async (id) => {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    await supabase.from("community_news").delete().eq("id", id);
    setNewsArticles(newsArticles.filter(a => a.id !== id));
  };

  return (
    <div>
      <h2 style={{ marginBottom: 6 }}>📰 Community & News</h2>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>Articles published here appear on the Homepage's Community & News section.</p>

      {message && (
        <div style={{ marginBottom: 16, padding: "12px 16px", backgroundColor: message.startsWith("✅") ? "#f0fdf4" : message.startsWith("⚠️") ? "#fffbeb" : "#fef2f2", border: `1px solid ${message.startsWith("✅") ? "#86efac" : message.startsWith("⚠️") ? "#fcd34d" : "#fca5a5"}`, borderRadius: 8, color: message.startsWith("✅") ? "#166534" : message.startsWith("⚠️") ? "#92400e" : "#991b1b", fontWeight: "bold" }}>
          {message}
        </div>
      )}

      {!composingArticle && (
        <button onClick={startNewArticle} style={{ padding: "10px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 14, marginBottom: 20 }}>✏️ Write New Article</button>
      )}

      {composingArticle && (
        <div style={{ backgroundColor: "white", border: "2px solid #701890", borderRadius: 10, padding: 20, marginBottom: 24 }}>
          <p style={{ fontWeight: "bold", marginBottom: 12, fontSize: 15 }}>{editingArticleId ? "✏️ Edit Article" : "📝 New Article"}</p>
          <input placeholder="Article Title *" value={articleTitle} onChange={e => setArticleTitle(e.target.value)} style={inputStyle} />

          <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>Cover Image</label>
          {(articleCoverFile || articleCoverUrl) ? (
            <div style={{ marginBottom: 10, maxWidth: 320 }}>
              <PositionableImage
                src={articleCoverFile ? previewUrl(articleCoverFile) : articleCoverUrl}
                position={articleCoverPosition}
                onChange={setArticleCoverPosition}
                zoom={articleCoverZoom}
                onZoomChange={setArticleCoverZoom}
                aspectRatio={COVER_ASPECT_RATIO}
                onReplace={cropCover}
                onRestore={restoreCover}
                canRestore={!!(articleCoverOrigFile || articleCoverOrigUrl || getOrigUrl(articleCoverUrl))}
                cropSrc={articleCoverOrigFile ? previewUrl(articleCoverOrigFile) : (articleCoverOrigUrl || undefined)}
              />
              <div style={{ marginTop: 8 }}><HelpTip title="Cover image" size={26}><p style={{ margin: "0 0 8px" }}>This exact framing is what shows on the homepage card and the article header.</p><p style={{ margin: "0 0 8px" }}><strong>✂️ Crop</strong> cuts the photo down. <strong>↩ Restore original</strong> undoes a crop, any time.</p><p style={{ margin: 0 }}><strong>✋ Adjust</strong> — tap it, then pinch to zoom and drag to move the photo. Tap <strong>✓ Done</strong> when finished.</p></HelpTip></div>
              <button onClick={() => { setArticleCoverFile(null); setArticleCoverUrl(""); setArticleCoverOrigFile(null); setArticleCoverOrigUrl(undefined); }} style={{ fontSize: 12, color: "#cc0000", background: "none", border: "none", cursor: "pointer", marginTop: 6 }}>✕ Remove cover</button>
            </div>
          ) : (
            <input type="file" accept="image/*" onChange={e => { setArticleCoverFile(e.target.files[0]); setArticleCoverPosition({ x: 50, y: 50 }); setArticleCoverOrigFile(null); setArticleCoverOrigUrl(undefined); }} style={{ display: "block", marginBottom: 16 }} />
          )}

          <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8, display: "block", marginTop: 8 }}>Story Content</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
            {articleBlocks.map((block, i) => (
              <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, backgroundColor: "#fafafa" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: "bold", color: "#888", textTransform: "uppercase" }}>{block.type === "paragraph" ? "📝 Paragraph" : "🖼️ Image"} #{i + 1}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => moveBlock(i, -1)} disabled={i === 0} style={{ padding: "3px 8px", backgroundColor: "#eee", border: "none", borderRadius: 6, cursor: i === 0 ? "default" : "pointer", fontSize: 11, opacity: i === 0 ? 0.4 : 1 }}>↑</button>
                    <button onClick={() => moveBlock(i, 1)} disabled={i === articleBlocks.length - 1} style={{ padding: "3px 8px", backgroundColor: "#eee", border: "none", borderRadius: 6, cursor: i === articleBlocks.length - 1 ? "default" : "pointer", fontSize: 11, opacity: i === articleBlocks.length - 1 ? 0.4 : 1 }}>↓</button>
                    <button onClick={() => removeBlock(i)} style={{ padding: "3px 8px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>✕</button>
                  </div>
                </div>
                {block.type === "paragraph" ? (
                  <textarea value={block.text} onChange={e => updateBlock(i, { text: e.target.value })} placeholder="Write a paragraph..." rows={4} style={{ ...inputStyle, marginBottom: 0, resize: "vertical" }} />
                ) : (
                  <div>
                    {(block.file || block.url || block._displaySrc) ? (
                      <div style={{ maxWidth: 400, marginBottom: 8 }}>
                        <img
                          src={block.file ? URL.createObjectURL(block.file) : (block._displaySrc || block.url)}
                          style={{ width: "100%", height: "auto", borderRadius: 8, objectFit: "contain", display: "block", border: "2px solid #701890" }}
                        />
                        <p style={{ fontSize: 11, color: "#888", margin: "6px 0 0" }}>Shown exactly like this in the article — full image, no cropping.</p>
                        <button onClick={() => updateBlock(i, { file: null, url: "", _displaySrc: null })} style={{ fontSize: 12, color: "#cc0000", background: "none", border: "none", cursor: "pointer", marginTop: 6 }}>✕ Remove image</button>
                      </div>
                    ) : (
                      <input type="file" accept="image/*" onChange={e => updateBlock(i, { file: e.target.files[0], position: { x: 50, y: 50 } })} style={{ display: "block", marginBottom: 8 }} />
                    )}
                    <input placeholder="Caption (optional)" value={block.caption || ""} onChange={e => updateBlock(i, { caption: e.target.value })} style={{ ...inputStyle, marginBottom: 0, fontSize: 13 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button onClick={addParagraphBlock} style={{ padding: "8px 16px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>+ Paragraph</button>
            <button onClick={addImageBlock} style={{ padding: "8px 16px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>+ Image</button>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={resetArticleForm} style={{ padding: "10px 20px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
            <button onClick={saveArticle} disabled={savingArticle} style={{ padding: "10px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>{savingArticle ? "Saving..." : editingArticleId ? "Update Article" : "Publish Article"}</button>
          </div>
        </div>
      )}

      {newsArticles.length > 0 && <div style={{ margin: "0 0 12px" }}><HelpTip title="Reordering"><p style={{ margin: 0 }}>Hold and drag the ⠿ handle to reorder. The first 4 published articles are pinned to the top of Community News; the rest stay newest-first.</p></HelpTip></div>}
      {loadingNews ? <p style={{ color: "#888" }}>Loading...</p> : newsArticles.length === 0 ? (
        <p style={{ color: "#888", fontSize: 13 }}>No articles yet. Write your first one above!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orderedNews.map((article, nIdx) => {
            const cover = parsePos(article.cover_image_url || "");
            return (
              <div key={article.id} ref={newsDrag.setItemRef(nIdx)} style={{ position: "relative", backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 14, display: "flex", gap: 12, alignItems: "center", ...newsDrag.itemStyle(nIdx) }}>
                {orderedNews.length > 0 && (
                  <div {...newsDrag.handleProps(nIdx)} title="Hold and drag to reorder" style={{ flexShrink: 0, ...newsDrag.handleBaseStyle, background: featuredNewsIds.has(article.id) ? "#AABB23" : "rgba(0,0,0,0.55)", color: "white", borderRadius: 10, padding: "4px 9px", fontSize: 13, fontWeight: "bold" }}>⠿ {nIdx + 1}</div>
                )}
                {cover.src && <div style={{ width: 60, height: 60, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid #e5e7eb" }}><img src={cover.src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${cover.position.x}% ${cover.position.y}%` }} /></div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: "bold", fontSize: 14 }}>{article.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: article.published ? "#166534" : "#991b1b", fontWeight: "bold" }}>{article.published ? "✅ Published" : "⏸️ Hidden"} · {article.content_blocks?.length || 0} blocks</p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                  <button onClick={() => startEditArticle(article)} style={{ padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>Edit</button>
                  <button onClick={() => togglePublished(article)} style={{ padding: "6px 12px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>{article.published ? "Hide" : "Publish"}</button>
                  <button onClick={() => deleteArticle(article.id)} style={{ padding: "6px 12px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
