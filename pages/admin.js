// pages/admin.js
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

const TABS = ["Overview", "Plans & Pricing", "Public Users", "Free Vendors", "Premium Vendors", "Featured Vendors", "Basic Organizers", "Pro Organizers", "Elite Organizers", "Ads", "EPM Events", "Community & News", "Messaging", "Business Email", "Reports", "Exports", "Settings"];
const BUSINESS_MAILBOXES = ["noreply", "support", "events", "shop", "services"];
const EVENT_CATEGORIES = ["Music Event","Pop Up Shop","Business Expo","Fashion Show","Spoken Word","Meet & Greet","Art Show","Dance Event","Party","Classes","Paint & Sip","Festival","Corporate Event","Wedding","Birthday","Fundraiser","Community Event","Sports Event","Recording Studio","Venue","Other"];
const FLYER_PLACEHOLDERS = ["/default-logos/EPM-PH1.png", "/default-logos/EPM-PH2.png", "/default-logos/EPM-PH3.png"];
const BLANK_EPM_EVENT = { event_name: "", event_date: "", event_end_date: "", event_start_time: "", event_end_time: "", venue: "", venue_address: "", event_type: "", category: "", description: "", info_url: "", flyer_url: "", price: "" };
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
function formatEpmUrl(v) { if (!v || !v.trim()) return ""; const s = v.trim(); return s.startsWith("https://") || s.startsWith("http://") ? s : `https://${s}`; }
function formatEventTime(t) { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; }
const SEARCHABLE_TABS = ["Public Users", "Free Vendors", "Premium Vendors", "Featured Vendors", "Basic Organizers", "Pro Organizers", "Elite Organizers"];
// ── Cover images use this exact aspect ratio everywhere (editor preview, homepage
// card, and full article header) so the crop position/zoom you set always matches
// what actually displays — no more preview-vs-final mismatch. ──
const COVER_ASPECT_RATIO = "8 / 5";

function PositionableImage({ src, position, zoom = 1, onChange, onZoomChange, aspectRatio, height }) {
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
        style={{ width: "100%", aspectRatio: aspectRatio || undefined, height: aspectRatio ? undefined : height, borderRadius: 8, overflow: "hidden", border: "2px solid #701890", cursor: "grab", touchAction: "none", position: "relative", backgroundColor: "#eee" }}>
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

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  // stats is now computed live from `users` below (see const stats = ... near render) so it never goes stale after in-session upgrades/downgrades
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [ads, setAds] = useState([]);
  const [reports, setReports] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [adminId, setAdminId] = useState(null);
  const [downgradeModal, setDowngradeModal] = useState(null);
  const [downgradeReason, setDowngradeReason] = useState("");
  const [downgrading, setDowngrading] = useState(false);
  const [userInfoModal, setUserInfoModal] = useState(null);
  const [exportLoading, setExportLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rolePicks, setRolePicks] = useState({});
  const [epmEvents, setEpmEvents] = useState([]);
  const [editingEpmEvent, setEditingEpmEvent] = useState(null);
  const [epmEventForm, setEpmEventForm] = useState(BLANK_EPM_EVENT);
  const [savingEpmEvent, setSavingEpmEvent] = useState(false);
  const [epmFlyerFile, setEpmFlyerFile] = useState(null);
  const [showEpmFlyerPicker, setShowEpmFlyerPicker] = useState(false);
  const [epmFlyerFullscreen, setEpmFlyerFullscreen] = useState(false);
  const [epmFlyerPosition, setEpmFlyerPosition] = useState({ x: 50, y: 50 });
  const [broadcastSearch, setBroadcastSearch] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [messagingView, setMessagingView] = useState("compose"); // "compose" | "sent"
  const [sentMessages, setSentMessages] = useState([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [activeMailbox, setActiveMailbox] = useState("support");
  const [businessEmails, setBusinessEmails] = useState([]);
  const [loadingBusinessEmails, setLoadingBusinessEmails] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeReplyId, setComposeReplyId] = useState(null);
  const [sendingBusinessEmail, setSendingBusinessEmail] = useState(false);
  const [newsArticles, setNewsArticles] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleCoverUrl, setArticleCoverUrl] = useState("");
  const [articleCoverFile, setArticleCoverFile] = useState(null);
  const [articleCoverPosition, setArticleCoverPosition] = useState({ x: 50, y: 50 });
  const [articleCoverZoom, setArticleCoverZoom] = useState(1);
  const [articleBlocks, setArticleBlocks] = useState([{ type: "paragraph", text: "" }]);
  const [savingArticle, setSavingArticle] = useState(false);
  const [composingArticle, setComposingArticle] = useState(false);
  const [limits, setLimits] = useState({
    vendor_free_photos: "5", vendor_premium_photos: "20", vendor_featured_photos: "40",
    vendor_free_videos: "0", vendor_premium_videos: "5", vendor_featured_videos: "10",
    organizer_basic_photos: "10", organizer_pro_photos: "20", organizer_elite_photos: "40",
  });

  useEffect(() => {
    checkAdmin();
    const freezeBack = () => { window.history.pushState(null, document.title, window.location.href); };
    freezeBack();
    window.addEventListener("popstate", freezeBack);
    return () => window.removeEventListener("popstate", freezeBack);
  }, []);

  useEffect(() => {
    if (router.query.tab && TABS.includes(router.query.tab)) setActiveTab(router.query.tab);
  }, [router.query.tab]);

  useEffect(() => {
    if (activeTab === "Business Email") loadBusinessEmails(activeMailbox);
    if (activeTab === "Community & News") loadNewsArticles();
  }, [activeTab]);

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) { router.replace("/"); return; }
    setAdminId(user.id);
    const { data: profile } = await supabase.from("profiles").select("is_admin, role").eq("id", user.id).single();
    if (profile && profile.is_admin !== true) {
      if (profile.role === "organizer") router.replace("/organizer-dashboard");
      else if (profile.role === "vendor") router.replace("/vendor-dashboard");
      else router.replace("/");
      return;
    }
    await loadAllData();
    setLoading(false);
  };

  const loadAllData = async () => {
    const { data: plansData } = await supabase.from("plans").select("*").order("role", { ascending: true }).order("sort_order", { ascending: true });
    setPlans(plansData || []);
    const { data: usersData } = await supabase.rpc("get_all_profiles");
    const dedupedUsers = Array.from(new Map((usersData || []).map(u => [u.id, u])).values());
    setUsers(dedupedUsers);
    const { data: adsData } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
    setAds(adsData || []);
    const { data: reportsData } = await supabase.from("reports").select("*, reporter:reporter_id(business_name, organizer_name, handle), message:message_id(content, sender_id, recipient_id)").order("created_at", { ascending: false });
    setReports(reportsData || []);
    const { data: epmData } = await supabase.from("epm_events").select("*").order("event_date", { ascending: true });
    setEpmEvents(epmData || []);
    const { data: settingsData } = await supabase.from("app_settings").select("*");
    if (settingsData?.length) { const m = {}; settingsData.forEach(s => { m[s.key] = s.value; }); setLimits(prev => ({ ...prev, ...m })); }
  };

  // ── SEARCH ──
  const matchesSearch = (u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return [u.business_name, u.organizer_name, u.handle, u.category, u.city, u.state].some(f => f && f.toLowerCase().includes(q));
  };

  const PAID_TIERS = ["premium", "featured", "pro", "elite"];
  const handleTierChange = (user, newTier) => {
    if (user.account_type === newTier) return;
    const isDowngrade = PAID_TIERS.includes(user.account_type) && !PAID_TIERS.includes(newTier);
    if (isDowngrade) { setDowngradeModal({ userId: user.id, userName: user.business_name || user.organizer_name || user.handle, fromTier: user.account_type, toTier: newTier }); setDowngradeReason(""); }
    else updateUserTier(user.id, newTier);
  };

  const confirmDowngrade = async () => {
    if (!downgradeModal) return;
    setDowngrading(true);
    try {
      const res = await fetch("/api/admin-downgrade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: downgradeModal.userId, newTier: downgradeModal.toTier, reason: downgradeReason, adminId }) });
      const data = await res.json();
      if (data.success) { setUsers(users.map(u => u.id === downgradeModal.userId ? { ...u, account_type: downgradeModal.toTier } : u)); setMessage(`✅ ${downgradeModal.userName} downgraded → ${downgradeModal.toTier}${data.stripeCancelled ? " · Stripe cancelled" : ""}`); }
      else setMessage("❌ Error: " + data.error);
    } catch (err) { setMessage("❌ Error: " + err.message); }
    setDowngrading(false); setDowngradeModal(null); setDowngradeReason("");
  };

  const updateUserTier = async (userId, newAccountType) => {
    try {
      const res = await fetch("/api/admin-update-tier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, newTier: newAccountType }) });
      const data = await res.json();
      if (data.success) { setUsers(users.map(u => u.id === userId ? { ...u, account_type: newAccountType } : u)); setMessage("✅ Tier updated!"); }
      else setMessage("❌ Error: " + data.error);
    } catch (err) { setMessage("❌ Error: " + err.message); }
  };

  // ── SET ROLE + TIER (for Public Users → Vendor/Organizer) ──
  const setUserRoleTier = async (userId, role, tier) => {
    try {
      const res = await fetch("/api/admin-set-role-tier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, role, tier }) });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role, account_type: tier } : u));
        setMessage(`✅ Upgraded to ${role === "vendor" ? "Vendor" : "Organizer"} (${tier})`);
      } else setMessage("❌ Error: " + data.error);
    } catch (err) { setMessage("❌ Error: " + err.message); }
  };

  // ── DEMOTE TO PUBLIC USER (for Free Vendors / Basic Organizers, and reversing accidental upgrades) ──
  const demoteToPublic = async (user) => {
    const name = user.business_name || user.organizer_name || user.handle || "this user";
    if (!confirm(`Demote ${name} back to a Public User? This removes their vendor/organizer profile role and tier. This cannot be undone from here.`)) return;
    try {
      const res = await fetch("/api/admin-demote-to-public", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === user.id ? { ...u, role: null, account_type: null } : u));
        setMessage(`✅ ${name} demoted to Public User`);
      } else setMessage("❌ Error: " + data.error);
    } catch (err) { setMessage("❌ Error: " + err.message); }
  };

  // ── FILE UPLOAD (for EPM event flyers) ──
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
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 1500 * attempt));
        return uploadFile(file, bucket, attempt + 1);
      }
      setMessage("❌ Upload error: " + err.message);
      return null;
    }
  };

// pages/admin.js
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

const TABS = ["Overview", "Plans & Pricing", "Public Users", "Free Vendors", "Premium Vendors", "Featured Vendors", "Basic Organizers", "Pro Organizers", "Elite Organizers", "Ads", "EPM Events", "Community & News", "Messaging", "Business Email", "Reports", "Exports", "Settings"];
const BUSINESS_MAILBOXES = ["noreply", "support", "events", "shop", "services"];
const EVENT_CATEGORIES = ["Music Event","Pop Up Shop","Business Expo","Fashion Show","Spoken Word","Meet & Greet","Art Show","Dance Event","Party","Classes","Paint & Sip","Festival","Corporate Event","Wedding","Birthday","Fundraiser","Community Event","Sports Event","Recording Studio","Venue","Other"];
const FLYER_PLACEHOLDERS = ["/default-logos/EPM-PH1.png", "/default-logos/EPM-PH2.png", "/default-logos/EPM-PH3.png"];
const BLANK_EPM_EVENT = { event_name: "", event_date: "", event_end_date: "", event_start_time: "", event_end_time: "", venue: "", venue_address: "", event_type: "", category: "", description: "", info_url: "", flyer_url: "", price: "" };
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
function formatEpmUrl(v) { if (!v || !v.trim()) return ""; const s = v.trim(); return s.startsWith("https://") || s.startsWith("http://") ? s : `https://${s}`; }
function formatEventTime(t) { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; }
const SEARCHABLE_TABS = ["Public Users", "Free Vendors", "Premium Vendors", "Featured Vendors", "Basic Organizers", "Pro Organizers", "Elite Organizers"];
// ── Cover images use this exact aspect ratio everywhere (editor preview, homepage
// card, and full article header) so the crop position/zoom you set always matches
// what actually displays — no more preview-vs-final mismatch. ──
const COVER_ASPECT_RATIO = "8 / 5";

function PositionableImage({ src, position, zoom = 1, onChange, onZoomChange, aspectRatio, height }) {
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
        style={{ width: "100%", aspectRatio: aspectRatio || undefined, height: aspectRatio ? undefined : height, borderRadius: 8, overflow: "hidden", border: "2px solid #701890", cursor: "grab", touchAction: "none", position: "relative", backgroundColor: "#eee" }}>
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

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  // stats is now computed live from `users` below (see const stats = ... near render) so it never goes stale after in-session upgrades/downgrades
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [ads, setAds] = useState([]);
  const [reports, setReports] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [adminId, setAdminId] = useState(null);
  const [downgradeModal, setDowngradeModal] = useState(null);
  const [downgradeReason, setDowngradeReason] = useState("");
  const [downgrading, setDowngrading] = useState(false);
  const [userInfoModal, setUserInfoModal] = useState(null);
  const [exportLoading, setExportLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rolePicks, setRolePicks] = useState({});
  const [epmEvents, setEpmEvents] = useState([]);
  const [editingEpmEvent, setEditingEpmEvent] = useState(null);
  const [epmEventForm, setEpmEventForm] = useState(BLANK_EPM_EVENT);
  const [savingEpmEvent, setSavingEpmEvent] = useState(false);
  const [epmFlyerFile, setEpmFlyerFile] = useState(null);
  const [showEpmFlyerPicker, setShowEpmFlyerPicker] = useState(false);
  const [epmFlyerFullscreen, setEpmFlyerFullscreen] = useState(false);
  const [epmFlyerPosition, setEpmFlyerPosition] = useState({ x: 50, y: 50 });
  const [broadcastSearch, setBroadcastSearch] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [messagingView, setMessagingView] = useState("compose"); // "compose" | "sent"
  const [sentMessages, setSentMessages] = useState([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [activeMailbox, setActiveMailbox] = useState("support");
  const [businessEmails, setBusinessEmails] = useState([]);
  const [loadingBusinessEmails, setLoadingBusinessEmails] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeReplyId, setComposeReplyId] = useState(null);
  const [sendingBusinessEmail, setSendingBusinessEmail] = useState(false);
  const [newsArticles, setNewsArticles] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleCoverUrl, setArticleCoverUrl] = useState("");
  const [articleCoverFile, setArticleCoverFile] = useState(null);
  const [articleCoverPosition, setArticleCoverPosition] = useState({ x: 50, y: 50 });
  const [articleCoverZoom, setArticleCoverZoom] = useState(1);
  const [articleBlocks, setArticleBlocks] = useState([{ type: "paragraph", text: "" }]);
  const [savingArticle, setSavingArticle] = useState(false);
  const [composingArticle, setComposingArticle] = useState(false);
  const [limits, setLimits] = useState({
    vendor_free_photos: "5", vendor_premium_photos: "20", vendor_featured_photos: "40",
    vendor_free_videos: "0", vendor_premium_videos: "5", vendor_featured_videos: "10",
    organizer_basic_photos: "10", organizer_pro_photos: "20", organizer_elite_photos: "40",
  });

  useEffect(() => {
    checkAdmin();
    const freezeBack = () => { window.history.pushState(null, document.title, window.location.href); };
    freezeBack();
    window.addEventListener("popstate", freezeBack);
    return () => window.removeEventListener("popstate", freezeBack);
  }, []);

  useEffect(() => {
    if (router.query.tab && TABS.includes(router.query.tab)) setActiveTab(router.query.tab);
  }, [router.query.tab]);

  useEffect(() => {
    if (activeTab === "Business Email") loadBusinessEmails(activeMailbox);
    if (activeTab === "Community & News") loadNewsArticles();
  }, [activeTab]);

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) { router.replace("/"); return; }
    setAdminId(user.id);
    const { data: profile } = await supabase.from("profiles").select("is_admin, role").eq("id", user.id).single();
    if (profile && profile.is_admin !== true) {
      if (profile.role === "organizer") router.replace("/organizer-dashboard");
      else if (profile.role === "vendor") router.replace("/vendor-dashboard");
      else router.replace("/");
      return;
    }
    await loadAllData();
    setLoading(false);
  };

  const loadAllData = async () => {
    const { data: plansData } = await supabase.from("plans").select("*").order("role", { ascending: true }).order("sort_order", { ascending: true });
    setPlans(plansData || []);
    const { data: usersData } = await supabase.rpc("get_all_profiles");
    const dedupedUsers = Array.from(new Map((usersData || []).map(u => [u.id, u])).values());
    setUsers(dedupedUsers);
    const { data: adsData } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
    setAds(adsData || []);
    const { data: reportsData } = await supabase.from("reports").select("*, reporter:reporter_id(business_name, organizer_name, handle), message:message_id(content, sender_id, recipient_id)").order("created_at", { ascending: false });
    setReports(reportsData || []);
    const { data: epmData } = await supabase.from("epm_events").select("*").order("event_date", { ascending: true });
    setEpmEvents(epmData || []);
    const { data: settingsData } = await supabase.from("app_settings").select("*");
    if (settingsData?.length) { const m = {}; settingsData.forEach(s => { m[s.key] = s.value; }); setLimits(prev => ({ ...prev, ...m })); }
  };

  // ── SEARCH ──
  const matchesSearch = (u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return [u.business_name, u.organizer_name, u.handle, u.category, u.city, u.state].some(f => f && f.toLowerCase().includes(q));
  };

  const PAID_TIERS = ["premium", "featured", "pro", "elite"];
  const handleTierChange = (user, newTier) => {
    if (user.account_type === newTier) return;
    const isDowngrade = PAID_TIERS.includes(user.account_type) && !PAID_TIERS.includes(newTier);
    if (isDowngrade) { setDowngradeModal({ userId: user.id, userName: user.business_name || user.organizer_name || user.handle, fromTier: user.account_type, toTier: newTier }); setDowngradeReason(""); }
    else updateUserTier(user.id, newTier);
  };

  const confirmDowngrade = async () => {
    if (!downgradeModal) return;
    setDowngrading(true);
    try {
      const res = await fetch("/api/admin-downgrade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: downgradeModal.userId, newTier: downgradeModal.toTier, reason: downgradeReason, adminId }) });
      const data = await res.json();
      if (data.success) { setUsers(users.map(u => u.id === downgradeModal.userId ? { ...u, account_type: downgradeModal.toTier } : u)); setMessage(`✅ ${downgradeModal.userName} downgraded → ${downgradeModal.toTier}${data.stripeCancelled ? " · Stripe cancelled" : ""}`); }
      else setMessage("❌ Error: " + data.error);
    } catch (err) { setMessage("❌ Error: " + err.message); }
    setDowngrading(false); setDowngradeModal(null); setDowngradeReason("");
  };

  const updateUserTier = async (userId, newAccountType) => {
    try {
      const res = await fetch("/api/admin-update-tier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, newTier: newAccountType }) });
      const data = await res.json();
      if (data.success) { setUsers(users.map(u => u.id === userId ? { ...u, account_type: newAccountType } : u)); setMessage("✅ Tier updated!"); }
      else setMessage("❌ Error: " + data.error);
    } catch (err) { setMessage("❌ Error: " + err.message); }
  };

  // ── SET ROLE + TIER (for Public Users → Vendor/Organizer) ──
  const setUserRoleTier = async (userId, role, tier) => {
    try {
      const res = await fetch("/api/admin-set-role-tier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, role, tier }) });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role, account_type: tier } : u));
        setMessage(`✅ Upgraded to ${role === "vendor" ? "Vendor" : "Organizer"} (${tier})`);
      } else setMessage("❌ Error: " + data.error);
    } catch (err) { setMessage("❌ Error: " + err.message); }
  };

  // ── DEMOTE TO PUBLIC USER (for Free Vendors / Basic Organizers, and reversing accidental upgrades) ──
  const demoteToPublic = async (user) => {
    const name = user.business_name || user.organizer_name || user.handle || "this user";
    if (!confirm(`Demote ${name} back to a Public User? This removes their vendor/organizer profile role and tier. This cannot be undone from here.`)) return;
    try {
      const res = await fetch("/api/admin-demote-to-public", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === user.id ? { ...u, role: null, account_type: null } : u));
        setMessage(`✅ ${name} demoted to Public User`);
      } else setMessage("❌ Error: " + data.error);
    } catch (err) { setMessage("❌ Error: " + err.message); }
  };

  // ── FILE UPLOAD (for EPM event flyers) ──
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
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 1500 * attempt));
        return uploadFile(file, bucket, attempt + 1);
      }
      setMessage("❌ Upload error: " + err.message);
      return null;

      
    }{/* DOWNGRADE MODAL */}
      {downgradeModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ backgroundColor: "white", borderRadius: 16, padding: 28, maxWidth: 420, width: "100%" }}>
            <h3 style={{ margin: "0 0 8px", color: "#cc0000" }}>⚠️ Confirm Downgrade</h3>
            <p style={{ color: "#555", fontSize: 14, margin: "0 0 16px" }}>Downgrading <strong>{downgradeModal.userName}</strong> from <strong style={{ color: tierColor(downgradeModal.fromTier) }}>{downgradeModal.fromTier}</strong> to <strong style={{ color: tierColor(downgradeModal.toTier) }}>{downgradeModal.toTier}</strong>.</p>
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#991b1b" }}>🔴 This will <strong>cancel their Stripe subscription</strong> and send them a notification email.</div>
            <label style={{ display: "block", fontWeight: "bold", fontSize: 13, marginBottom: 6 }}>Reason <span style={{ color: "#888", fontWeight: "normal" }}>(optional)</span></label>
            <textarea value={downgradeReason} onChange={e => setDowngradeReason(e.target.value)} placeholder="e.g. Chargeback, terms violation..." rows={3} style={{ display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box", resize: "vertical", marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setDowngradeModal(null); setDowngradeReason(""); }} style={{ padding: "10px 20px", backgroundColor: "#ccc", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
              <button onClick={confirmDowngrade} disabled={downgrading} style={{ padding: "10px 20px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", opacity: downgrading ? 0.7 : 1 }}>{downgrading ? "Processing..." : "⬇️ Confirm Downgrade"}</button>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{ backgroundColor: "#111", color: "white", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => window.location.replace('/home')} style={{ background: "none", border: "1px solid #555", color: "white", padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12 }}>← Home</button>
          <span style={{ fontWeight: "bold", fontSize: 16 }}>Entre PRO Market</span>
          <span style={{ backgroundColor: "#701890", color: "white", fontSize: 10, padding: "3px 8px", borderRadius: 10, fontWeight: "bold" }}>ADMIN</span>
        </div>
        <button onClick={logout} style={{ padding: "6px 14px", backgroundColor: "#ff6b6b", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Log Out</button>
      </div>

      {/* TABS */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #eee", display: "flex", overflowX: "auto", padding: "0 24px" }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "14px 16px", border: "none", borderBottom: activeTab === tab ? "3px solid #701890" : "3px solid transparent", backgroundColor: "transparent", color: activeTab === tab ? "#701890" : "#666", fontWeight: activeTab === tab ? "bold" : "normal", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
            {tab}
          </button>
        ))}
      </div>

      {message && (
        <div style={{ margin: "16px 24px 0", padding: "12px 16px", backgroundColor: message.startsWith("✅") ? "#f0fdf4" : message.startsWith("⚠️") ? "#fffbeb" : "#fef2f2", border: `1px solid ${message.startsWith("✅") ? "#86efac" : message.startsWith("⚠️") ? "#fcd34d" : "#fca5a5"}`, borderRadius: 8, color: message.startsWith("✅") ? "#166534" : message.startsWith("⚠️") ? "#92400e" : "#991b1b", fontWeight: "bold" }}>
          {message}
        </div>
      )}

      <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>

        {SEARCHABLE_TABS.includes(activeTab) && (
          <div style={{ marginBottom: 18 }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Search by name, handle, city, category..."
              style={{ display: "block", width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
        )}

        {activeTab === "Overview" && (
          <div>
            <h2 style={{ marginBottom: 20 }}>📊 Overview</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
              {[{ label: "Total Vendors", value: stats.totalVendors, color: "#701890" }, { label: "Total Organizers", value: stats.totalOrganizers, color: "#AABB23" }, { label: "Public Users", value: stats.publicUsers, color: "#555" }, { label: "Free Vendors", value: stats.freeVendors, color: "#701890" }, { label: "Premium Vendors", value: stats.premiumVendors, color: "#701890" }, { label: "Featured Vendors", value: stats.featuredVendors, color: "#AABB23" }, { label: "Basic Organizers", value: stats.basicOrganizers, color: "#555" }, { label: "Pro Organizers", value: stats.proOrganizers, color: "#701890" }, { label: "Elite Organizers", value: stats.eliteOrganizers, color: "#AABB23" }].map(stat => (
                <div key={stat.label} style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: "20px 16px", textAlign: "center" }}>
                  <p style={{ fontSize: 32, fontWeight: "bold", color: stat.color, margin: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Plans & Pricing" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>💰 Plans & Pricing</h2>
            {plans.length === 0 ? <p style={{ color: "#888" }}>No plans found.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {plans.map((plan, i) => (
                  <div key={plan.id} style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 20 }}>
                    <div style={{ marginBottom: 14 }}>
                      <span style={{ fontSize: 11, backgroundColor: plan.role === "vendor" ? "#f3e8ff" : "#f9ffe8", color: plan.role === "vendor" ? "#701890" : "#888B00", padding: "3px 8px", borderRadius: 10, fontWeight: "bold", marginRight: 8 }}>{plan.role?.toUpperCase()}</span>
                      <strong style={{ fontSize: 16 }}>{plan.name}</strong>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div><label style={labelStyle}>Plan Name</label><input value={plan.name || ""} onChange={e => setPlans(plans.map((p, idx) => idx === i ? { ...p, name: e.target.value } : p))} style={inputStyle} /></div>
                      <div><label style={labelStyle}>Price ($/month)</label><input type="number" value={plan.price || ""} onChange={e => setPlans(plans.map((p, idx) => idx === i ? { ...p, price: e.target.value } : p))} style={inputStyle} /></div>
                    </div>
                    <label style={labelStyle}>Description</label>
                    <input value={plan.description || ""} onChange={e => setPlans(plans.map((p, idx) => idx === i ? { ...p, description: e.target.value } : p))} style={inputStyle} />
                    <label style={labelStyle}>Features (one per line)</label>
                    <textarea value={Array.isArray(plan.features) ? plan.features.join("\n") : plan.features || ""} onChange={e => setPlans(plans.map((p, idx) => idx === i ? { ...p, features: e.target.value.split("\n") } : p))} rows={6} style={{ ...inputStyle, resize: "vertical" }} />
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button onClick={() => savePlan(plan)} disabled={saving} style={{ padding: "10px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>{saving ? "Saving..." : "Save Plan"}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Public Users" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>👤 Public Users</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>Accounts with no vendor/organizer role yet. Pick a role + tier and tap Upgrade to promote them directly (useful for free test accounts).</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: "#111", color: "white" }}>
                    <th style={thStyle}>Account</th><th style={thStyle}>Last Login</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => !u.role && matchesSearch(u)).map((user, i) => {
                    const pick = getPick(user.id);
                    return (
                      <tr key={user.id} style={{ backgroundColor: i % 2 === 0 ? "#f9f9f9" : "white" }}>
                        <td style={tdStyle}><strong>Public User</strong></td>
                        <td style={tdStyle}>{formatLastLogin(user.last_sign_in_at)}</td>
                        <td style={tdStyle}><span style={{ color: user.suspended ? "#cc0000" : "#16a34a", fontWeight: "bold", fontSize: 12 }}>{user.suspended ? "Suspended" : "Active"}</span></td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                            <button onClick={() => viewUserInfo(user.id)} style={{ ...smallBtnStyle, backgroundColor: "#f3e8ff", color: "#701890", border: "1px solid #701890" }}>ℹ️</button>
                            <select value={pick.role} onChange={e => updatePick(user.id, "role", e.target.value)} style={smallSelectStyle}>
                              <option value="vendor">Vendor</option>
                              <option value="organizer">Organizer</option>
                            </select>
                            <select value={pick.tier} onChange={e => updatePick(user.id, "tier", e.target.value)} style={smallSelectStyle}>
                              {pick.role === "vendor" ? (
                                <>
                                  <option value="free">Free</option>
                                  <option value="premium">Premium</option>
                                  <option value="featured">Featured</option>
                                </>
                              ) : (
                                <>
                                  <option value="basic">Basic</option>
                                  <option value="pro">Pro</option>
                                  <option value="elite">Elite</option>
                                </>
                              )}
                            </select>
                            <button onClick={() => setUserRoleTier(user.id, pick.role, pick.tier)} style={{ ...smallBtnStyle, backgroundColor: "#16a34a" }}>⬆️ Upgrade</button>
                            <button onClick={() => suspendUser(user.id, !user.suspended)} style={{ ...smallBtnStyle, backgroundColor: user.suspended ? "#16a34a" : "#cc0000" }}>{user.suspended ? "Reinstate" : "Suspend"}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Free Vendors" && (
          <div>
            <h2 style={{ marginBottom: 16 }}>🆓 Free Vendors</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {users.filter(u => u.role === "vendor" && (!u.account_type || u.account_type === "free") && matchesSearch(u)).map(user => (
                <div key={user.id} style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {user.logo_url && <div onClick={() => window.open(`/vendor/${user.handle}?from=admin`, "_blank")} style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", cursor: "pointer" }} title="Open profile"><img src={user.logo_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
                    <div><strong>{user.business_name || "—"}</strong><p style={{ margin: 0, fontSize: 12, color: "#888" }}>{user.category} · {user.city}</p><p style={{ margin: "2px 0 0", fontSize: 11, color: "#aaa" }}>Last login: {formatLastLogin(user.last_sign_in_at)}</p></div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => viewUserInfo(user.id)} style={{ ...smallBtnStyle, backgroundColor: "#f3e8ff", color: "#701890", border: "1px solid #701890" }}>ℹ️</button>
                    <button onClick={() => handleTierChange(user, "premium")} style={{ padding: "8px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>💜 Make Premium</button>
                    <button onClick={() => handleTierChange(user, "featured")} style={{ padding: "8px 14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>🔥 Make Featured</button>
                    <button onClick={() => demoteToPublic(user)} style={{ padding: "8px 14px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>⬇️ Downgrade to Public</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Premium Vendors" && (
          <div>
            <h2 style={{ marginBottom: 16 }}>💜 Premium Vendors</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {users.filter(u => u.role === "vendor" && u.account_type === "premium" && matchesSearch(u)).map(user => (
                <div key={user.id} style={{ backgroundColor: "white", border: "1px solid #701890", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {user.logo_url && <div onClick={() => window.open(`/vendor/${user.handle}?from=admin`, "_blank")} style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", cursor: "pointer" }} title="Open profile"><img src={user.logo_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
                    <div><strong>{user.business_name || "—"}</strong><p style={{ margin: 0, fontSize: 12, color: "#888" }}>{user.category} · {user.city}</p><p style={{ margin: "2px 0 0", fontSize: 11, color: "#aaa" }}>Last login: {formatLastLogin(user.last_sign_in_at)}</p></div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => viewUserInfo(user.id)} style={{ ...smallBtnStyle, backgroundColor: "#f3e8ff", color: "#701890", border: "1px solid #701890" }}>ℹ️</button>
                    <button onClick={() => handleTierChange(user, "featured")} style={{ padding: "8px 14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>🔥 Make Featured</button>
                    <button onClick={() => handleTierChange(user, "free")} style={{ padding: "8px 14px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>⬇️ Downgrade</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Featured Vendors" && (
          <div>
            <h2 style={{ marginBottom: 16 }}>🔥 Featured Vendors</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {users.filter(u => u.role === "vendor" && u.account_type === "featured" && matchesSearch(u)).map(user => (
                <div key={user.id} style={{ backgroundColor: "white", border: "1px solid #AABB23", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {user.logo_url && <div onClick={() => window.open(`/vendor/${user.handle}?from=admin`, "_blank")} style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", cursor: "pointer" }} title="Open profile"><img src={user.logo_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
                    <div><strong>{user.business_name}</strong><p style={{ margin: 0, fontSize: 12, color: "#888" }}>{user.category} · {user.city}</p><p style={{ margin: "2px 0 0", fontSize: 11, color: "#aaa" }}>Last login: {formatLastLogin(user.last_sign_in_at)}</p></div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => viewUserInfo(user.id)} style={{ ...smallBtnStyle, backgroundColor: "#f3e8ff", color: "#701890", border: "1px solid #701890" }}>ℹ️</button>
                    <button onClick={() => handleTierChange(user, "premium")} style={{ padding: "8px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>💜 Move to Premium</button>
                    <button onClick={() => handleTierChange(user, "free")} style={{ padding: "8px 14px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>⬇️ Downgrade</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


{activeTab === "Basic Organizers" && (
          <div>
            <h2 style={{ marginBottom: 16 }}>💼 Basic Organizers</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {users.filter(u => u.role === "organizer" && (!u.account_type || u.account_type === "basic") && matchesSearch(u)).map(user => (
                <div key={user.id} style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {user.logo_url && <div onClick={() => window.open(`/organizer/${user.handle}?from=admin`, "_blank")} style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", cursor: "pointer" }} title="Open profile"><img src={user.logo_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
                    <div><strong>{user.organizer_name || "—"}</strong><p style={{ margin: 0, fontSize: 12, color: "#888" }}>@{user.handle} · {user.category} · {user.city}</p><p style={{ margin: "2px 0 0", fontSize: 11, color: "#aaa" }}>Last login: {formatLastLogin(user.last_sign_in_at)}</p></div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => viewUserInfo(user.id)} style={{ ...smallBtnStyle, backgroundColor: "#f3e8ff", color: "#701890", border: "1px solid #701890" }}>ℹ️</button>
                    <button onClick={() => handleTierChange(user, "pro")} style={{ padding: "8px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>🚀 Make Pro</button>
                    <button onClick={() => handleTierChange(user, "elite")} style={{ padding: "8px 14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>👑 Make Elite</button>
                    <button onClick={() => demoteToPublic(user)} style={{ padding: "8px 14px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>⬇️ Downgrade to Public</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Pro Organizers" && (
          <div>
            <h2 style={{ marginBottom: 16 }}>🚀 Pro Organizers</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {users.filter(u => u.role === "organizer" && (u.account_type === "pro" || u.account_type === "premium") && matchesSearch(u)).map(user => (
                <div key={user.id} style={{ backgroundColor: "white", border: "1px solid #701890", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {user.logo_url && <div onClick={() => window.open(`/organizer/${user.handle}?from=admin`, "_blank")} style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", cursor: "pointer" }} title="Open profile"><img src={user.logo_url} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
                    <div>
                      <strong>{user.organizer_name || user.business_name || "—"}</strong>
                      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>@{user.handle} · {user.category} · {user.city}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#aaa" }}>Last login: {formatLastLogin(user.last_sign_in_at)}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => viewUserInfo(user.id)} style={{ ...smallBtnStyle, backgroundColor: "#f3e8ff", color: "#701890", border: "1px solid #701890" }}>ℹ️</button>
                    <button onClick={() => handleTierChange(user, "elite")} style={{ padding: "8px 14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>👑 Make Elite</button>
                    <button onClick={() => handleTierChange(user, "basic")} style={{ padding: "8px 14px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>⬇️ Downgrade to Basic</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Elite Organizers" && (
          <div>
            <h2 style={{ marginBottom: 16 }}>👑 Elite Organizers</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {users.filter(u => u.role === "organizer" && u.account_type === "elite" && matchesSearch(u)).map(user => (
                <div key={user.id} style={{ backgroundColor: "white", border: "1px solid #AABB23", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {user.logo_url && <div onClick={() => window.open(`/organizer/${user.handle}?from=admin`, "_blank")} style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", cursor: "pointer" }} title="Open profile"><img src={user.logo_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
                    <div><strong>{user.organizer_name || "—"}</strong><p style={{ margin: 0, fontSize: 12, color: "#888" }}>@{user.handle} · {user.category} · {user.city}</p><p style={{ margin: "2px 0 0", fontSize: 11, color: "#aaa" }}>Last login: {formatLastLogin(user.last_sign_in_at)}</p></div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => viewUserInfo(user.id)} style={{ ...smallBtnStyle, backgroundColor: "#f3e8ff", color: "#701890", border: "1px solid #701890" }}>ℹ️</button>
                    <button onClick={() => handleTierChange(user, "basic")} style={{ padding: "8px 14px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>⬇️ Downgrade</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Ads" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>📢 Ad Management</h2>
            {ads.length === 0 ? <p style={{ color: "#888" }}>No ads found.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {ads.map((ad, i) => (
                  <div key={ad.id} style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                      <strong>Ad Slot: {ad.slot || `#${i + 1}`}</strong>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><input type="checkbox" checked={ad.active || false} onChange={e => setAds(ads.map((a, idx) => idx === i ? { ...a, active: e.target.checked } : a))} />Active</label>
                    </div>
                    <label style={labelStyle}>Headline</label><input value={ad.title || ""} onChange={e => setAds(ads.map((a, idx) => idx === i ? { ...a, title: e.target.value } : a))} style={inputStyle} />
                    <label style={labelStyle}>Body Text</label><input value={ad.body || ""} onChange={e => setAds(ads.map((a, idx) => idx === i ? { ...a, body: e.target.value } : a))} style={inputStyle} />
                    <label style={labelStyle}>Link URL</label><input value={ad.link || ""} onChange={e => setAds(ads.map((a, idx) => idx === i ? { ...a, link: e.target.value } : a))} style={inputStyle} />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                      <button onClick={() => saveAd(ad)} disabled={saving} style={{ padding: "10px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>{saving ? "Saving..." : "Save Ad"}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EPM EVENTS TAB ── */}
        {activeTab === "EPM Events" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>🏢 EPM Events</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Events created here are hosted by Entre PRO Market itself and appear mixed in with Elite Organizer events on the Homepage's Upcoming Events section, sorted by date.</p>

            <div style={{ backgroundColor: "white", borderRadius: 10, padding: 20, marginBottom: 20, border: "1px solid #eee" }}>
              <p style={{ fontWeight: "bold", marginBottom: 12, fontSize: 15 }}>{editingEpmEvent ? "✏️ Edit EPM Event" : "➕ Add New EPM Event"}</p>
              <input placeholder="Event Name *" value={epmEventForm.event_name} onChange={e => setEpmEventForm({ ...epmEventForm, event_name: e.target.value })} style={inputStyle} />
              <label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Event Category</label>
              <select value={epmEventForm.category} onChange={e => setEpmEventForm({ ...epmEventForm, category: e.target.value })} style={inputStyle}>
                <option value="">Select a Category...</option>
                {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Start Date</label><input type="date" value={epmEventForm.event_date} onChange={e => setEpmEventForm({ ...epmEventForm, event_date: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }} /></div>
                <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>End Date</label><input type="date" value={epmEventForm.event_end_date} onChange={e => setEpmEventForm({ ...epmEventForm, event_end_date: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>Start Time</label><input type="time" value={epmEventForm.event_start_time} onChange={e => setEpmEventForm({ ...epmEventForm, event_start_time: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }} /></div>
                <div><label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4, color: "#555" }}>End Time</label><input type="time" value={epmEventForm.event_end_time} onChange={e => setEpmEventForm({ ...epmEventForm, event_end_time: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }} /></div>
              </div>
              <input placeholder="Venue Name" value={epmEventForm.venue} onChange={e => setEpmEventForm({ ...epmEventForm, venue: e.target.value })} style={inputStyle} />
              <textarea placeholder="Address (street, city, state)" value={epmEventForm.venue_address || ""} onChange={e => setEpmEventForm({ ...epmEventForm, venue_address: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              <input placeholder="Event Type" value={epmEventForm.event_type} onChange={e => setEpmEventForm({ ...epmEventForm, event_type: e.target.value })} style={inputStyle} />
              <textarea placeholder="Event Description" value={epmEventForm.description} onChange={e => setEpmEventForm({ ...epmEventForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>💵 Ticket Price</label>
              <textarea placeholder={"One price per line, e.g.:\nGeneral: $25\nVIP: $50\nKids: Free"} value={epmEventForm.price || ""} onChange={e => setEpmEventForm({ ...epmEventForm, price: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              <div style={{ backgroundColor: "#f3e8ff", border: "1px solid #701890", borderRadius: 6, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#701890" }}>💳 Add an Eventbrite, CashApp, Venmo, Google Pay, or any payment link here to collect ticket payments — not limited to Eventbrite.</div>
              <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>🎟️ Tickets / Info URL</label>
              <input placeholder="e.g. eventbrite.com/your-event, cash.app/$you, venmo.com/you" value={epmEventForm.info_url} onChange={e => setEpmEventForm({ ...epmEventForm, info_url: e.target.value })} style={inputStyle} />
              <label style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4, display: "block" }}>📸 Event Flyer <span style={{ color: "#cc0000" }}>*</span></label>
              {(epmFlyerFile || epmEventForm.flyer_url) ? (
                <div style={{ marginBottom: 10, maxWidth: 300 }}>
                  <PositionableImage
                    src={epmFlyerFile ? URL.createObjectURL(epmFlyerFile) : parsePos(epmEventForm.flyer_url).src}
                    position={epmFlyerFile ? epmFlyerPosition : parsePos(epmEventForm.flyer_url).position}
                    onChange={pos => { setEpmFlyerPosition(pos); if (!epmFlyerFile) setEpmEventForm(prev => ({ ...prev, flyer_url: withPos(parsePos(prev.flyer_url).src, pos) })); }}
                    height={200}
                  />
                  <button onClick={() => { setEpmFlyerFile(null); setEpmEventForm({ ...epmEventForm, flyer_url: "" }); setEpmFlyerPosition({ x: 50, y: 50 }); }} style={{ fontSize: 12, color: "#cc0000", background: "none", border: "none", cursor: "pointer", marginTop: 6 }}>✕ Remove flyer</button>
                </div>
              ) : (
                <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#991b1b", fontWeight: "bold" }}>⚠️ A flyer image is required.</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={e => { setEpmFlyerFile(e.target.files[0]); setEpmFlyerPosition({ x: 50, y: 50 }); setShowEpmFlyerPicker(false); }} style={{ display: "block", marginBottom: 10 }} />
              <button onClick={() => setShowEpmFlyerPicker(!showEpmFlyerPicker)} style={{ padding: "4px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, marginBottom: 8 }}>{showEpmFlyerPicker ? "Hide" : "Browse Placeholders"}</button>
              {showEpmFlyerPicker && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10, marginBottom: 14, padding: 12, backgroundColor: "#f9f9f9", borderRadius: 8 }}>
                  {FLYER_PLACEHOLDERS.map((src, i) => (
                    <div key={i} onClick={() => { setEpmEventForm({ ...epmEventForm, flyer_url: src }); setEpmFlyerFile(null); setEpmFlyerPosition({ x: 50, y: 50 }); setShowEpmFlyerPicker(false); }}
                      style={{ height: 80, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: epmEventForm.flyer_url === src ? "3px solid #701890" : "2px solid transparent" }}>
                      <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                {editingEpmEvent && <button onClick={() => { setEditingEpmEvent(null); setEpmEventForm(BLANK_EPM_EVENT); setEpmFlyerFile(null); setShowEpmFlyerPicker(false); }} style={{ padding: "8px 16px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>Cancel</button>}
                <button onClick={saveEpmEvent} disabled={savingEpmEvent} style={{ padding: "8px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>{savingEpmEvent ? "Saving..." : editingEpmEvent ? "Update Event" : "Add Event"}</button>
              </div>
            </div>

            {epmEvents.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {epmEvents.map(ev => (
                  <div key={ev.id} style={{ backgroundColor: "white", borderRadius: 8, padding: "12px 16px", border: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      {ev.flyer_url && (() => { const p = parsePos(ev.flyer_url); return <div style={{ width: 56, height: 56, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0 }}><img src={p.src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${p.position.x}% ${p.position.y}%`, display: "block" }} /></div>; })()}
                      <div>
                        <p style={{ margin: 0, fontWeight: "bold", fontSize: 14 }}>{ev.event_name}</p>
                        {ev.category && <p style={{ margin: "1px 0 0", fontSize: 11, color: "#701890", fontWeight: "bold" }}>{ev.category}</p>}
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{ev.event_date ? new Date(ev.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date TBD"}{ev.event_start_time && ` · ${formatEventTime(ev.event_start_time)}`}</p>
                        {ev.venue && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#aaa" }}>{ev.venue}</p>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => { setEditingEpmEvent(ev.id); setEpmEventForm({ event_name: ev.event_name, event_date: ev.event_date || "", event_end_date: ev.event_end_date || "", event_start_time: ev.event_start_time || "", event_end_time: ev.event_end_time || "", venue: ev.venue || "", venue_address: ev.venue_address || "", event_type: ev.event_type || "", category: ev.category || "", description: ev.description || "", info_url: ev.info_url || "", flyer_url: ev.flyer_url || "", price: ev.price || "" }); setEpmFlyerFile(null); setEpmFlyerPosition({ x: 50, y: 50 }); }} style={{ padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Edit</button>
                      <button onClick={() => deleteEpmEvent(ev.id)} style={{ padding: "6px 12px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p style={{ fontSize: 13, color: "#888", margin: 0 }}>No EPM events yet. Add your first one above!</p>}

            {epmFlyerFullscreen && (
              <div onClick={() => setEpmFlyerFullscreen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, cursor: "zoom-out" }}>
                <img src={epmFlyerFile ? URL.createObjectURL(epmFlyerFile) : epmEventForm.flyer_url} style={{ maxWidth: "95%", maxHeight: "95vh", borderRadius: 8, objectFit: "contain" }} />
              </div>
            )}
          </div>
        )}

        {/* ── MESSAGING TAB ── */}
        {/* ── COMMUNITY & NEWS TAB ── */}
        {activeTab === "Community & News" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>📰 Community & News</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>Articles published here appear on the Homepage's Community & News section.</p>

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
        )}

        {activeTab === "Messaging" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>✉️ Message Vendors & Organizers</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <button onClick={() => setMessagingView("compose")} style={{ padding: "8px 16px", backgroundColor: messagingView === "compose" ? "#701890" : "white", color: messagingView === "compose" ? "white" : "#701890", border: "1px solid #701890", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>✏️ Compose</button>
              <button onClick={() => { setMessagingView("sent"); loadSentMessages(); }} style={{ padding: "8px 16px", backgroundColor: messagingView === "sent" ? "#701890" : "white", color: messagingView === "sent" ? "white" : "#701890", border: "1px solid #701890", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>📤 Sent Messages</button>
            </div>

            {messagingView === "compose" ? (
              <>
                <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>Select one or more recipients below and send them a message directly from Admin. Users see your messages as coming from "Entre PRO Market" and cannot reply to this inbox — they're auto-redirected to email instead.</p>
                <input value={broadcastSearch} onChange={e => setBroadcastSearch(e.target.value)} placeholder="🔍 Search recipients by name, handle, city..." style={{ ...inputStyle, marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                  <button onClick={selectAllFiltered} style={{ padding: "6px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Select All Shown ({filteredRecipients.length})</button>
                  <button onClick={() => setSelectedRecipients([])} style={{ padding: "6px 14px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Clear Selection</button>
                  <span style={{ fontSize: 13, color: "#701890", fontWeight: "bold" }}>{selectedRecipients.length} selected</span>
                </div>
                <div style={{ maxHeight: 380, overflowY: "auto", border: "1px solid #eee", borderRadius: 8, marginBottom: 16 }}>
                  {filteredRecipients.length === 0 ? <p style={{ padding: 16, color: "#888", margin: 0 }}>No matching vendors or organizers.</p> : filteredRecipients.map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid #f0f0f0" }}>
                      <input type="checkbox" checked={selectedRecipients.includes(u.id)} onChange={() => toggleRecipient(u.id)} />
                      {u.logo_url && <div onClick={() => window.open(`/${u.role}/${u.handle}?from=admin`, "_blank")} style={{ width: 34, height: 34, borderRadius: 6, overflow: "hidden", cursor: "pointer", flexShrink: 0, border: "1px solid #e5e7eb" }}><img src={u.logo_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: "bold", fontSize: 13 }}>{u.business_name || u.organizer_name || u.handle}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{u.role === "vendor" ? "🛒" : "🎪"} {u.role} · {u.account_type || "—"} · {u.city || ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="Write your message..." rows={4} style={{ ...inputStyle, resize: "vertical" }} />
                <button onClick={sendBroadcastMessage} disabled={sendingBroadcast} style={{ padding: "12px 24px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
                  {sendingBroadcast ? "Sending..." : `📨 Send to ${selectedRecipients.length} Recipient${selectedRecipients.length !== 1 ? "s" : ""}`}
                </button>
              </>
            ) : (
              <div>
                {loadingSent ? <p style={{ color: "#888" }}>Loading...</p> : sentMessages.length === 0 ? <p style={{ color: "#888" }}>No sent messages yet.</p> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {sentMessages.map(msg => (
                      <div key={msg.id} style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 8, padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                          <p style={{ margin: 0, fontWeight: "bold", fontSize: 13 }}>To: {msg.recipient?.business_name || msg.recipient?.organizer_name || msg.recipient?.handle || "Unknown"}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{new Date(msg.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                        </div>
                        <p style={{ margin: "0 0 10px", fontSize: 13, color: "#444" }}>{msg.content}</p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => replyToRecipient(msg)} style={{ padding: "5px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>↩️ Reply</button>
                          <button onClick={() => resendMessage(msg)} style={{ padding: "5px 12px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>🔁 Resend</button>
                          <button onClick={() => deleteSentMessage(msg.id)} style={{ padding: "5px 12px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>🗑️ Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

{/* ── BUSINESS EMAIL TAB ── */}
        {activeTab === "Business Email" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>📧 Business Email</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>Send and receive email from your @entrepromarket.com addresses — no Gmail involved, so your personal address is never exposed.</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              {BUSINESS_MAILBOXES.map(mb => (
                <button key={mb} onClick={() => { setActiveMailbox(mb); loadBusinessEmails(mb); }}
                  style={{ padding: "8px 16px", backgroundColor: activeMailbox === mb ? "#701890" : "white", color: activeMailbox === mb ? "white" : "#701890", border: "1px solid #701890", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>
                  {mb}@
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#888" }}>{activeMailbox}@entrepromarket.com</p>
              <button onClick={() => openCompose({ to: "", subject: "" })} style={{ padding: "8px 16px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>✏️ Compose</button>
            </div>

            {composeOpen && (
              <div style={{ backgroundColor: "white", border: "2px solid #701890", borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <p style={{ fontWeight: "bold", marginBottom: 12, fontSize: 14 }}>{composeReplyId ? "↩️ Reply" : "✏️ New Email"} — from {activeMailbox}@entrepromarket.com</p>
                <input placeholder="To (email address)" value={composeTo} onChange={e => setComposeTo(e.target.value)} style={inputStyle} />
                <input placeholder="Subject" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} style={inputStyle} />
                <textarea placeholder="Message" value={composeBody} onChange={e => setComposeBody(e.target.value)} rows={6} style={{ ...inputStyle, resize: "vertical" }} />
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => { setComposeOpen(false); setComposeReplyId(null); }} style={{ padding: "10px 20px", backgroundColor: "#ccc", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
                  <button onClick={sendBusinessEmail} disabled={sendingBusinessEmail} style={{ padding: "10px 20px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 20, cursor: "pointer", fontWeight: "bold" }}>{sendingBusinessEmail ? "Sending..." : "📨 Send"}</button>
                </div>
              </div>
            )}

            {loadingBusinessEmails ? <p style={{ color: "#888" }}>Loading...</p> : businessEmails.length === 0 ? (
              <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 32, textAlign: "center", color: "#aaa" }}>
                <p style={{ fontSize: 36, margin: 0 }}>📧</p>
                <p style={{ fontSize: 14, marginTop: 12 }}>No emails yet for {activeMailbox}@. Tap "🔍 refresh" by switching tabs, or Compose to send your first one.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {businessEmails.map(em => (
                  <div key={em.id} style={{ backgroundColor: em.direction === "inbound" && !em.read ? "#faf5ff" : "white", border: `1px solid ${em.direction === "inbound" && !em.read ? "#701890" : "#eee"}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                      <p style={{ margin: 0, fontWeight: "bold", fontSize: 13 }}>
                        {em.direction === "inbound" ? "📥 From: " : "📤 To: "}
                        {em.direction === "inbound" ? em.from_address : em.to_address}
                        {em.direction === "inbound" && !em.read && <span style={{ marginLeft: 8, fontSize: 10, backgroundColor: "#701890", color: "white", padding: "1px 6px", borderRadius: 8, fontWeight: "bold" }}>NEW</span>}
                        {em.status === "failed" && <span style={{ marginLeft: 8, fontSize: 10, backgroundColor: "#cc0000", color: "white", padding: "1px 6px", borderRadius: 8, fontWeight: "bold" }}>FAILED</span>}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{new Date(em.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                    </div>
                    <p style={{ margin: "0 0 6px", fontWeight: "bold", fontSize: 14 }}>{em.subject}</p>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "#444", whiteSpace: "pre-wrap" }}>{em.body}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {em.direction === "inbound" && (
                        <button onClick={() => openCompose({ to: em.from_address, subject: em.subject?.startsWith("Re:") ? em.subject : `Re: ${em.subject}`, replyId: em.id })} style={{ padding: "5px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>↩️ Reply</button>
                      )}
                      {em.direction === "inbound" && !em.read && (
                        <button onClick={() => markEmailRead(em.id)} style={{ padding: "5px 12px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>✓ Mark Read</button>
                      )}
                      <button onClick={() => deleteBusinessEmail(em.id)} style={{ padding: "5px 12px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Reports" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>🚩 Reports</h2>
            {reports.length === 0 ? <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 30, textAlign: "center", color: "#888" }}><p>No reports yet. 🎉</p></div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reports.map(report => (
                  <div key={report.id} style={{ backgroundColor: "white", border: `1px solid ${report.status === "pending" ? "#fca5a5" : "#eee"}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <div><strong style={{ fontSize: 14 }}>{report.reporter?.business_name || report.reporter?.organizer_name || "Unknown"} reported a message</strong><p style={{ margin: 0, fontSize: 12, color: "#888" }}>{new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p></div>
                      <span style={{ padding: "4px 10px", borderRadius: 10, fontSize: 11, fontWeight: "bold", backgroundColor: report.status === "pending" ? "#fef2f2" : report.status === "resolved" ? "#f0fdf4" : "#f9ffe8", color: report.status === "pending" ? "#991b1b" : report.status === "resolved" ? "#166534" : "#888B00" }}>{report.status?.toUpperCase()}</span>
                    </div>
                    <div style={{ backgroundColor: "#f9f9f9", borderRadius: 6, padding: "10px 14px", marginBottom: 12 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#666" }}><strong>Reason:</strong> {report.reason}</p>
                      {report.message?.content && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#444", fontStyle: "italic" }}>"{report.message.content}"</p>}
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={async () => { await supabase.from("reports").update({ status: "reviewed" }).eq("id", report.id); setReports(reports.map(r => r.id === report.id ? { ...r, status: "reviewed" } : r)); setMessage("✅ Marked as reviewed"); }} style={{ padding: "7px 14px", backgroundColor: "#AABB23", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Mark Reviewed</button>
                      <button onClick={async () => { await supabase.from("reports").update({ status: "resolved" }).eq("id", report.id); setReports(reports.map(r => r.id === report.id ? { ...r, status: "resolved" } : r)); setMessage("✅ Resolved"); }} style={{ padding: "7px 14px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Resolve</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EXPORTS TAB ── */}
        {activeTab === "Exports" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>📥 Export User Data</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 28 }}>Download spreadsheets (.csv) directly to your phone or computer. Opens in Excel, Google Sheets, or any spreadsheet app.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {[
                { type: "vendors", label: "Vendors", icon: "🛒", color: "#701890", bg: "#f3e8ff", desc: "All vendors — name, handle, email, tier, city, state, category, signup date" },
                { type: "organizers", label: "Organizers", icon: "🎪", color: "#AABB23", bg: "#f9ffe8", desc: "All organizers — name, handle, email, tier, city, state, category, signup date" },
                { type: "public", label: "Public Users", icon: "👤", color: "#555", bg: "#f5f5f5", desc: "Public accounts with no role — email and signup date" },
              ].map(({ type, label, icon, color, bg, desc }) => (
                <div key={type} style={{ backgroundColor: "white", border: `1px solid ${color}30`, borderRadius: 12, padding: 24 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: bg, borderRadius: 20, padding: "5px 14px", marginBottom: 14 }}>
                    <span>{icon}</span>
                    <span style={{ color, fontWeight: "bold", fontSize: 14 }}>{label}</span>
                  </div>
                  <p style={{ color: "#666", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>{desc}</p>
                  <button
                    onClick={() => downloadCSV(type, `entrepromarket-${type}-${new Date().toISOString().split("T")[0]}.csv`)}
                    disabled={exportLoading === type}
                    style={{ width: "100%", padding: "12px", backgroundColor: color, color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 14, opacity: exportLoading === type ? 0.7 : 1 }}
                  >
                    {exportLoading === type ? "Preparing..." : `⬇️ Download ${label} CSV`}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "14px 20px", marginTop: 24 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#166534" }}>
                ✅ Files download directly to your device. On mobile they save to your Downloads folder. On desktop they save to your Downloads folder automatically.
              </p>
            </div>
          </div>
        )}

        {activeTab === "Settings" && (
          <div>
            <h2 style={{ marginBottom: 6 }}>⚙️ Settings</h2>
            <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 24, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0, marginBottom: 4 }}>📸 Photo & Video Upload Limits</h3>
              <h4 style={{ color: "#701890", marginBottom: 12, marginTop: 16 }}>💜 Vendor Limits</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
                {[{ key: "vendor_free_photos", label: "Free Photos" }, { key: "vendor_premium_photos", label: "Premium Photos" }, { key: "vendor_featured_photos", label: "Featured Photos" }, { key: "vendor_free_videos", label: "Free Videos" }, { key: "vendor_premium_videos", label: "Premium Videos" }, { key: "vendor_featured_videos", label: "Featured Videos" }].map(({ key, label }) => (
                  <div key={key}><label style={labelStyle}>{label}</label><input type="number" min="0" value={limits[key]} onChange={e => setLimits(prev => ({ ...prev, [key]: e.target.value }))} style={inputStyle} /></div>
                ))}
              </div>
              <h4 style={{ color: "#AABB23", marginBottom: 12, marginTop: 0 }}>🏆 Organizer Limits</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
                {[{ key: "organizer_basic_photos", label: "Basic Photos" }, { key: "organizer_pro_photos", label: "Pro Photos" }, { key: "organizer_elite_photos", label: "Elite Photos" }].map(({ key, label }) => (
                  <div key={key}><label style={labelStyle}>{label}</label><input type="number" min="0" value={limits[key]} onChange={e => setLimits(prev => ({ ...prev, [key]: e.target.value }))} style={inputStyle} /></div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={saveLimits} disabled={saving} style={{ padding: "12px 28px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 15 }}>{saving ? "Saving..." : "💾 Save All Limits"}</button>
              </div>
            </div>
            <div style={{ backgroundColor: "white", border: "1px solid #eee", borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>App Links</h3>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Opens in a new tab so the Admin panel stays open.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => window.open('/home', '_blank')} style={smallBtnStyle}>Homepage</button>
                <button onClick={() => window.open('/marketplace', '_blank')} style={smallBtnStyle}>Marketplace</button>
                <button onClick={() => window.open('/vendor-info', '_blank')} style={smallBtnStyle}>Vendor Info</button>
                <button onClick={() => window.open('/organizer-info', '_blank')} style={smallBtnStyle}>Organizer Info</button>
              </div>
            </div>
            <div style={{ backgroundColor: "#fff8e1", border: "1px solid #f0c040", borderRadius: 10, padding: 20 }}>
              <h3 style={{ marginTop: 0, color: "#856404" }}>⚠️ Danger Zone</h3>
              <button onClick={async () => { if (confirm("Delete all NULL profiles? Cannot be undone.")) { await supabase.from("profiles").delete().is("business_name", null).eq("role", "vendor"); setMessage("✅ Null profiles deleted"); await loadAllData(); } }} style={{ padding: "10px 18px", backgroundColor: "#cc0000", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>🗑️ Delete Incomplete Profiles</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const inputStyle = { display: "block", width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" };
const labelStyle = { display: "block", fontWeight: "bold", marginBottom: 5, fontSize: 13, color: "#333" };
const thStyle = { padding: "12px 14px", textAlign: "left", fontWeight: "bold", whiteSpace: "nowrap" };
const tdStyle = { padding: "12px 14px", borderBottom: "1px solid #eee", verticalAlign: "middle" };
const smallBtnStyle = { padding: "6px 12px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 };
const smallSelectStyle = { padding: "6px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, backgroundColor: "white" };







  };

