// pages/settings.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import DashboardLayout from "../components/DashboardLayout";

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifUpgrades, setNotifUpgrades] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const u = userData?.user;
      if (!u) { router.replace("/"); return; }
      setUser(u);
      const { data: p } = await supabase.from("profiles").select("notification_preferences").eq("id", u.id).single();
      if (p?.notification_preferences) {
        setNotifMessages(p.notification_preferences.messages ?? true);
        setNotifUpgrades(p.notification_preferences.upgrades ?? true);
        setNotifMarketing(p.notification_preferences.marketing ?? false);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleChangePassword = async () => {
    if (!newPassword) { setPasswordMsg("❌ Please enter a new password."); return; }
    if (newPassword.length < 6) { setPasswordMsg("❌ Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg("❌ Passwords don't match."); return; }
    setSavingPassword(true); setPasswordMsg("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordMsg(error ? "❌ " + error.message : "✅ Password updated successfully!");
    if (!error) { setNewPassword(""); setConfirmPassword(""); }
    setSavingPassword(false);
  };

  const handleChangeEmail = async () => {
    if (!newEmail) { setEmailMsg("❌ Please enter a new email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setEmailMsg("❌ Please enter a valid email address."); return; }
    if (newEmail === user?.email) { setEmailMsg("❌ That's already your current email."); return; }
    setSavingEmail(true); setEmailMsg("");
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailMsg(error ? "❌ " + error.message : "✅ Confirmation sent to " + newEmail + ". Check your inbox to verify.");
    if (!error) setNewEmail("");
    setSavingEmail(false);
  };

  const handleSaveNotifications = async () => {
    setSavingNotif(true); setNotifMsg("");
    const { error } = await supabase.from("profiles").update({
      notification_preferences: { messages: notifMessages, upgrades: notifUpgrades, marketing: notifMarketing }
    }).eq("id", user.id);
    setNotifMsg(error ? "❌ " + error.message : "✅ Notification preferences saved!");
    setSavingNotif(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") { alert("Type DELETE to confirm."); return; }
    setDeletingAccount(true);
    try {
      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
      router.replace("/");
    } catch (err) { alert("Error: " + err.message); setDeletingAccount(false); }
  };

  if (loading) return <DashboardLayout><div style={{ padding: 20 }}>Loading...</div></DashboardLayout>;

  const card = { backgroundColor: "white", border: "1px solid #eee", borderRadius: 12, padding: 24, marginBottom: 20 };
  const inp = { display: "block", width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 15, boxSizing: "border-box", marginBottom: 12 };
  const msgBox = (m) => ({ padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: "bold", marginBottom: 12, backgroundColor: m.startsWith("✅") ? "#f0fdf4" : "#fef2f2", color: m.startsWith("✅") ? "#166534" : "#991b1b", border: `1px solid ${m.startsWith("✅") ? "#86efac" : "#fca5a5"}` });
  const saveBtn = (text, onClick, loading, color = "#701890") => (
    <button onClick={onClick} disabled={loading} style={{ padding: "12px 24px", backgroundColor: color, color: "white", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 14, cursor: "pointer", width: "100%", opacity: loading ? 0.7 : 1 }}>
      {loading ? "Saving..." : text}
    </button>
  );

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "10px 0 60px", fontFamily: "sans-serif" }}>
        <h1 style={{ marginBottom: 6 }}>⚙️ Settings</h1>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Logged in as <strong>{user?.email}</strong></p>

        {/* CHANGE PASSWORD */}
        <div style={card}>
          <h3 style={{ margin: "0 0 6px" }}>🔒 Change Password</h3>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 16, marginTop: 0 }}>Minimum 6 characters.</p>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input type={showPassword ? "text" : "password"} placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ ...inp, marginBottom: 0 }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: 11, background: "none", border: "none", color: "#701890", fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>{showPassword ? "HIDE" : "SHOW"}</button>
          </div>
          <input type={showPassword ? "text" : "password"} placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inp} />
          {passwordMsg && <div style={msgBox(passwordMsg)}>{passwordMsg}</div>}
          {saveBtn(savingPassword ? "Saving..." : "Update Password", handleChangePassword, savingPassword)}
        </div>

        {/* CHANGE EMAIL */}
        <div style={card}>
          <h3 style={{ margin: "0 0 6px" }}>✉️ Change Email</h3>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 16, marginTop: 0 }}>Current: <strong>{user?.email}</strong></p>
          <input type="email" placeholder="New email address" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inp} />
          {emailMsg && <div style={msgBox(emailMsg)}>{emailMsg}</div>}
          {saveBtn(savingEmail ? "Sending..." : "Update Email", handleChangeEmail, savingEmail)}
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 10, marginBottom: 0 }}>⚠️ Your email won't change until you click the confirmation link sent to your new address.</p>
        </div>

        {/* NOTIFICATIONS */}
        <div style={card}>
          <h3 style={{ margin: "0 0 6px" }}>🔔 Notification Preferences</h3>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 20, marginTop: 0 }}>Choose which emails you receive.</p>
          {[
            { label: "New Messages", desc: "Get notified when someone sends you a message.", value: notifMessages, set: setNotifMessages },
            { label: "Account & Plan Updates", desc: "Billing, upgrades, downgrades and account changes.", value: notifUpgrades, set: setNotifUpgrades },
            { label: "Marketing & Announcements", desc: "Platform news, tips and promotional emails.", value: notifMarketing, set: setNotifMarketing },
          ].map(({ label, desc, value, set }) => (
            <div key={label} onClick={() => set(!value)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}>
              <div>
                <p style={{ margin: 0, fontWeight: "bold", fontSize: 14 }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{desc}</p>
              </div>
              <div style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: value ? "#701890" : "#ccc", position: "relative", transition: "background 0.2s", flexShrink: 0, marginLeft: 16 }}>
                <div style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 20, height: 20, borderRadius: "50%", backgroundColor: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
          ))}
          {notifMsg && <div style={{ ...msgBox(notifMsg), marginTop: 16 }}>{notifMsg}</div>}
          <div style={{ marginTop: 20 }}>{saveBtn("Save Preferences", handleSaveNotifications, savingNotif, "#AABB23")}</div>
        </div>

        {/* DELETE ACCOUNT */}
        <div style={{ ...card, border: "1px solid #fca5a5", backgroundColor: "#fff8f8" }}>
          <h3 style={{ margin: "0 0 6px", color: "#cc0000" }}>🗑️ Delete Account</h3>
          <p style={{ color: "#666", fontSize: 13, marginBottom: 16, marginTop: 0 }}>Permanently deletes your profile and all data. Cannot be undone.</p>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: "12px 24px", backgroundColor: "white", color: "#cc0000", border: "2px solid #cc0000", borderRadius: 8, fontWeight: "bold", fontSize: 14, cursor: "pointer", width: "100%" }}>Delete My Account</button>
          ) : (
            <>
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: "#991b1b" }}>
                ⚠️ Type <strong>DELETE</strong> to confirm. Cancel your Stripe subscription first if you have one.
              </div>
              <input placeholder="Type DELETE to confirm" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} style={{ ...inp, borderColor: "#fca5a5" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(""); }} style={{ flex: 1, padding: "12px", backgroundColor: "#ccc", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleDeleteAccount} disabled={deletingAccount || deleteConfirm !== "DELETE"} style={{ flex: 1, padding: "12px", backgroundColor: deleteConfirm === "DELETE" ? "#cc0000" : "#f9a8a8", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", cursor: deleteConfirm === "DELETE" ? "pointer" : "default" }}>
                  {deletingAccount ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
