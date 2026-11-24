// components/InstallSteps.js
// Shows the exact steps to put the app on the home screen, for the device the person is using.
import { useEffect, useState } from "react";

export default function InstallSteps() {
  const [env, setEnv] = useState({ platform: "desktop", iosSafari: true });

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document);
    const isAndroid = /Android/i.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA|FBAN|FBAV|Instagram/.test(ua);
    setEnv({ platform: isIOS ? "ios" : isAndroid ? "android" : "desktop", iosSafari: isIOS && isSafari });
  }, []);

  let steps;
  let note = null;
  if (env.platform === "ios") {
    steps = [
      <span key="1">Tap the <strong>Share</strong> button <span style={{ fontSize: 16 }}>⬆️</span> in Safari</span>,
      <span key="2">Scroll down and tap <strong>"Add to Home Screen"</strong></span>,
      <span key="3">Tap <strong>"Add"</strong> — the app icon appears on your home screen</span>,
    ];
    if (!env.iosSafari) note = "Opened this from an email or another app? Tap the Safari (compass) icon to open this page in Safari first, then follow the steps.";
  } else if (env.platform === "android") {
    steps = [
      <span key="1">Tap the <strong>⋮</strong> menu (top right of your browser)</span>,
      <span key="2">Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>,
      <span key="3">Tap <strong>"Install"</strong> — the app icon appears on your home screen</span>,
    ];
    note = "Don't see it? You may be inside Gmail or another app's browser. Tap ⋮ then \"Open in Chrome\", and try again.";
  } else {
    steps = [
      <span key="1">Look for the <strong>install icon</strong> at the right end of your browser's address bar</span>,
      <span key="2">Click it, then click <strong>"Install"</strong> — the app opens in its own window</span>,
    ];
    note = "Using Chrome or Edge? You can also open the ⋮ menu and choose \"Install Entre PRO Market\".";
  }

  return (
    <div style={{ textAlign: "left", backgroundColor: "#f3e8ff", border: "1px solid #d8b4fe", borderRadius: 12, padding: "14px 14px 10px", marginBottom: 14, fontFamily: "sans-serif" }}>
      <p style={{ margin: "0 0 8px", fontWeight: "bold", color: "#701890", fontSize: 14 }}>How to install:</p>
      <ol style={{ margin: 0, paddingLeft: 20, color: "#333", fontSize: 14, lineHeight: 1.5 }}>
        {steps.map((st, i) => <li key={i} style={{ marginBottom: 8 }}>{st}</li>)}
      </ol>
      {note && <p style={{ margin: "4px 0 4px", color: "#666", fontSize: 12, lineHeight: 1.4 }}>{note}</p>}
      <p style={{ margin: "4px 0 4px", color: "#666", fontSize: 12, lineHeight: 1.4 }}>The first time you open the app from your home screen, you may be asked to log in once.</p>
    </div>
  );
}
