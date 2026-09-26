// components/AdminNewsTab.js
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const COVER_ASPECT_RATIO = "8 / 5";
const inputStyle = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };
const BLANK_ARTICLE_BLOCKS = [{ type: "paragraph", text: "" }];

function parsePos(url) {
  if (!url) return { src: url, position: { x: 50, y: 50 }, zoom: 1 };
  const [base, frag] = url.split("#pos=");
  if (!frag) return { src: base, position: { x: 50, y: 50 }, zoom: 1 };
  const [x, y, z] = frag.split(",").map(Number);
  return { src: base, position: { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y }, zoom: isNaN(z) || z < 1 ? 1 : z };
}
function withPos(url, pos, zoom = 1) {
  if (!url) return url;
  const base = url.split("#")[0];
  if (!pos) return base;
  return `${base}#pos=${pos.x.toFixed(1)},${pos.y.toFixed(1)},${zoom.toFixed(2)}`;
}

function PositionableImage({ src, position, zoom = 1, onChange, onZoomChange, aspectRatio }) {
  const ref = useRef(null);
  const dragState = useRef(null);
  const handlePointerDown = (e) => { dragState.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y }; e.target.setPointerCapture?.(e.pointerId); };
  const handlePointerMove = (e) => {
    if (!dragState.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - dragState.current.x, dy = e.clientY - dragState.current.y;
    onChange({ x: Math.min(100, Math.max(0, dragState.current.posX - (dx / rect.width) * 100)), y: Math.min(100, Math.max(0, dragState.current.posY - (dy / rect.height) * 100)) });
  };
  const handlePointerUp = () => { dragState.current = null; };
  return (
    <div>
      <div ref={ref} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
        style={{ width: "100%", aspectRatio: aspectRatio || undefined, borderRadius: 8, overflow: "hidden", border: "2px solid #701890", cursor: "grab", touchAction: "none", position: "relative", backgroundColor: "#eee" }}>
        <img src={src} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${position.x}% ${position.y}%`, transform: `scale(${zoom})`, transformOrigin: "center", display: "block", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 6, right: 8, backgroundColor: "rgba(0,0,0,0.55)", color: "white", fontSize: 10, padding: "3px 8px", borderRadius: 10 }}>✋ Drag to reposition</div>
      </div>
      {onZoomChange && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => onZoomChange(parseFloat(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "#888", minWidth: 32, textAlign: "right" }}>{zoom.toFixed(1)}x</span>
        </div>
      )}
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
  const [articleBlocks, setArticleBlocks] = useState(BLANK_ARTICLE_BLOCKS);
  const [savingArticle, setSavingArticle] = useState(false);
  const [composingArticle, setComposingArticle] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { loadNewsArticles(); }, []);

  const loadNewsArticles = async () => {
    setLoadingNews(true);
    const { data } = await supabase.from("community_news").select("*").order("created_at", { ascending: false });
    setNewsArticles(data || []);
    setLoadingNews(false);
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
    setEditingArticleId(null); setArticleTitle(""); setArticleCoverUrl(""); setArticleCoverFile(null);
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
        coverUrl = up;
      }
      coverUrl = coverUrl ? withPos(coverUrl.split("#")[0], articleCoverPosition, articleCoverZoom) : "";

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
                src={articleCoverFile ? URL.createObjectURL(articleCoverFile) : articleCoverUrl}
                position={articleCoverPosition}
                onChange={setArticleCoverPosition}
                zoom={articleCoverZoom}
                onZoomChange={setArticleCoverZoom}
                aspectRatio={COVER_ASPECT_RATIO}
              />
              <p style={{ fontSize: 11, color: "#888", margin: "6px 0 0" }}>This exact crop is what shows on the homepage card and article header — drag to reposition, use the slider to zoom in.</p>
              <button onClick={() => { setArticleCoverFile(null); setArticleCoverUrl(""); }} style={{ fontSize: 12, color: "#cc0000", background: "none", border: "none", cursor: "pointer", marginTop: 6 }}>✕ Remove cover</button>
            </div>
          ) : (
            <input type="file" accept="image/*" onChange={e => { setArticleCoverFile(e.target.files[0]); setArticleCoverPosition({ x: 50, y: 50 }); }} style={{ display: "block", marginBottom: 16 }} />
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

      {loadingNews ? <p style={{ color: "#888" }}>Loading...</p> : newsArticles.length === 0 ? (
        <p style={{ color: "#888", fontSize: 13 }}>No articles yet. Write your first one above!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {newsArticles.map(article => {
            const cover = parsePos(article.cover_image_url || "");
            return (
              <div key={article.id} style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
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
