// components/ReviewsSection.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { StarRating, StarRatingInput, RatingBreakdown } from "./StarRating";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Reusable reviews block for both products and events.
 *
 * Props:
 * - tableName: "product_reviews" | "event_reviews"
 * - idField: "product_id" | "event_id"
 * - idValue: the product/event id
 * - extraMatch: {} — additional eq filters (e.g. { event_source: "elite" })
 * - replyField / replyAtField: "vendor_reply"/"vendor_reply_at" or "organizer_reply"/"organizer_reply_at"
 * - ownerUserId: the vendor's or organizer's user id who may reply (null if none, e.g. admin-only EPM events)
 * - currentUser: the logged-in user object (or null)
 * - isAdmin: boolean — admin override, can always reply
 * - eligibility: { checking: bool, allowed: bool, reason: string }
 */
export default function ReviewsSection({ tableName, idField, idValue, extraMatch = {}, replyField, replyAtField, ownerUserId, currentUser, isAdmin, eligibility }) {
  const [reviews, setReviews] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [myReview, setMyReview] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState("");
  const [saving, setSaving] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [savingReply, setSavingReply] = useState(null);
  const [message, setMessage] = useState("");

  const canReply = (r) => isAdmin || (ownerUserId && currentUser && currentUser.id === ownerUserId);

  const load = async () => {
    setLoading(true);
    let query = supabase.from(tableName).select("*").eq(idField, idValue);
    Object.entries(extraMatch).forEach(([k, v]) => { query = query.eq(k, v); });
    const { data } = await query.order("created_at", { ascending: false });
    const list = data || [];
    setReviews(list);

    if (list.length > 0) {
      const userIds = [...new Set(list.map(r => r.user_id))];
      const { data: profs } = await supabase.from("profiles").select("id, business_name, organizer_name, handle, logo_url").in("id", userIds);
      const map = {};
      (profs || []).forEach(p => { map[p.id] = p; });
      setProfiles(map);
    }

    if (currentUser) {
      const mine = list.find(r => r.user_id === currentUser.id);
      setMyReview(mine || null);
      if (mine) { setFormRating(mine.rating); setFormText(mine.review_text || ""); }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [idValue]); // eslint-disable-line

  const submitReview = async () => {
    if (!currentUser) return;
    setSaving(true); setMessage("");
    try {
      const row = { [idField]: idValue, ...extraMatch, user_id: currentUser.id, rating: formRating, review_text: formText.trim() || null, updated_at: new Date().toISOString() };
      if (myReview) {
        const { error } = await supabase.from(tableName).update(row).eq("id", myReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(tableName).insert([row]);
        if (error) throw error;
      }
      setEditing(false);
      await load();
    } catch (err) {
      setMessage("❌ " + err.message);
    }
    setSaving(false);
  };

  const deleteReview = async () => {
    if (!myReview) return;
    if (!confirm("Delete your review?")) return;
    await supabase.from(tableName).delete().eq("id", myReview.id);
    setMyReview(null); setEditing(false); setFormRating(5); setFormText("");
    await load();
  };

  const submitReply = async (reviewId) => {
    const text = (replyDrafts[reviewId] || "").trim();
    if (!text) return;
    setSavingReply(reviewId);
    try {
      await supabase.from(tableName).update({ [replyField]: text, [replyAtField]: new Date().toISOString() }).eq("id", reviewId);
      await load();
      setReplyDrafts(prev => ({ ...prev, [reviewId]: "" }));
    } catch (err) {
      setMessage("❌ " + err.message);
    }
    setSavingReply(null);
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div style={{ marginTop: 28 }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>⭐ Reviews</h3>

      {reviews.length > 0 ? (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 28, fontWeight: "bold", color: "#333" }}>{avgRating.toFixed(1)}</span>
            <div>
              <StarRating value={avgRating} size={18} />
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <RatingBreakdown reviews={reviews} />
        </div>
      ) : !loading && (
        <p style={{ color: "#aaa", fontSize: 13, marginBottom: 16 }}>No reviews yet.</p>
      )}

      {message && <p style={{ color: "#cc0000", fontSize: 13, marginBottom: 10 }}>{message}</p>}

      {/* WRITE / EDIT REVIEW */}
      {currentUser && eligibility && !eligibility.checking && (
        eligibility.allowed ? (
          (editing || !myReview) ? (
            <div style={{ backgroundColor: "#faf5ff", border: "1px solid #e5d5f5", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <p style={{ margin: "0 0 8px", fontWeight: "bold", fontSize: 14 }}>{myReview ? "Edit your review" : "Write a review"}</p>
              <div style={{ marginBottom: 10 }}>
                <StarRatingInput value={formRating} onChange={setFormRating} />
              </div>
              <textarea value={formText} onChange={e => setFormText(e.target.value)} placeholder="Share your experience (optional)..." rows={3}
                style={{ display: "block", width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", marginBottom: 10, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={submitReview} disabled={saving} style={{ padding: "9px 18px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>{saving ? "Saving..." : myReview ? "Update Review" : "Submit Review"}</button>
                {myReview && <button onClick={() => { setEditing(false); setFormRating(myReview.rating); setFormText(myReview.review_text || ""); }} style={{ padding: "9px 18px", backgroundColor: "#eee", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>}
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: "#f9f9f9", border: "1px solid #eee", borderRadius: 10, padding: 14, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#555" }}>You reviewed this — <strong>{myReview.rating}★</strong></span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditing(true)} style={{ padding: "6px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Edit</button>
                <button onClick={deleteReview} style={{ padding: "6px 14px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Delete</button>
              </div>
            </div>
          )
        ) : (
          <div style={{ backgroundColor: "#f5f5f5", border: "1px solid #eee", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#888" }}>{eligibility.reason}</p>
          </div>
        )
      )}

      {/* REVIEW LIST */}
      {loading ? <p style={{ color: "#aaa", fontSize: 13 }}>Loading reviews...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {reviews.map(r => {
            const p = profiles[r.user_id];
            const name = p?.business_name || p?.organizer_name || (p?.handle ? `@${p.handle}` : "User");
            return (
              <div key={r.id} style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {p?.logo_url && <img src={p.logo_url} alt="" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }} />}
                  <span style={{ fontWeight: "bold", fontSize: 13 }}>{name}</span>
                  <StarRating value={r.rating} size={13} />
                  <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>{formatDate(r.created_at)}</span>
                </div>
                {r.review_text && <p style={{ margin: "4px 0 0", fontSize: 14, color: "#444", lineHeight: 1.5 }}>{r.review_text}</p>}

                {r[replyField] && (
                  <div style={{ marginTop: 8, marginLeft: 16, paddingLeft: 12, borderLeft: "3px solid #AABB23" }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: "bold", color: "#701890" }}>Reply:</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#555" }}>{r[replyField]}</p>
                  </div>
                )}

                {canReply(r) && !r[replyField] && (
                  <div style={{ marginTop: 8, marginLeft: 16, display: "flex", gap: 8 }}>
                    <input value={replyDrafts[r.id] || ""} onChange={e => setReplyDrafts(prev => ({ ...prev, [r.id]: e.target.value }))} placeholder="Write a reply..."
                      style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }} />
                    <button onClick={() => submitReply(r.id)} disabled={savingReply === r.id} style={{ padding: "7px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>{savingReply === r.id ? "..." : "Reply"}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
