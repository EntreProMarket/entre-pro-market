// pages/auth/confirm.js
// The email's confirmation link opens this page. It confirms the email, signs the person in on THIS browser
// (so it works even when the link opens inside Gmail's own browser), then sends them to the welcome screen.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function ConfirmEmail() {
  const router = useRouter();
  const ran = useRef(false);
  const [failed, setFailed] = useState(false);
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type") || "email";
    if (!tokenHash) {
      setFailed(true);
      setDetail("This confirmation link is incomplete.");
      return;
    }
    const run = async () => {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) {
        setFailed(true);
        setDetail(error.message);
        return;
      }
      router.replace("/?welcome=1");
    };
    run();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ backgroundColor: "white", borderRadius: 16, padding: "36px 28px", maxWidth: 420, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <img src="/logo-circle.png" alt="EntreProMarket" style={{ width: 110, height: 110, objectFit: "contain", borderRadius: "50%", marginBottom: 12 }} />
        {!failed ? (
          <>
            <h1 style={{ margin: "0 0 8px", fontSize: 20, color: "#111" }}>Confirming your email...</h1>
            <p style={{ margin: 0, color: "#666", fontSize: 14 }}>One moment — we're getting your account ready.</p>
          </>
        ) : (
          <>
            <h1 style={{ margin: "0 0 8px", fontSize: 20, color: "#111" }}>This link didn't work</h1>
            <p style={{ margin: "0 0 6px", color: "#666", fontSize: 14 }}>It may have expired or already been used. If you already confirmed your email, just log in.</p>
            {detail && <p style={{ margin: "0 0 16px", color: "#999", fontSize: 12 }}>{detail}</p>}
            <button onClick={() => router.push("/")} style={{ display: "block", width: "100%", padding: "13px", backgroundColor: "#701890", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: "pointer" }}>
              Go to Log In
            </button>
          </>
        )}
      </div>
    </div>
  );
}
