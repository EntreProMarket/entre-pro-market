// pages/saved-contacts-locked.js

import { useRouter } from "next/router";

export default function SavedContactsLocked() {
  const router = useRouter();
  const { role } = router.query;

  // Message and button config based on who's viewing
  const config = {
    organizer: {
      description: "Save and manage your contacts by upgrading your account to a Pro or Elite Organizer plan.",
      primaryLabel: "View Organizer Plans",
      primaryPath: "/organizer-info",
      primaryColor: "#AABB23",
      showSecondary: false,
    },
    vendor: {
      description: "Save and manage your contacts by upgrading your account to a Premium or Featured Vendor plan.",
      primaryLabel: "View Vendor Plans",
      primaryPath: "/vendor-info",
      primaryColor: "#701890",
      showSecondary: false,
    },
    // Public user (no role param)
    public: {
      description: "Save and manage your contacts by upgrading your account to either a Premium or Featured Vendor plan or a Pro or Elite Organizer plan.",
      primaryLabel: "View Vendor Plans",
      primaryPath: "/vendor-info",
      primaryColor: "#701890",
      showSecondary: true,
    },
  };

  const view = role === "organizer" ? "organizer" : role === "vendor" ? "vendor" : "public";
  const { description, primaryLabel, primaryPath, primaryColor, showSecondary } = config[view];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "80vh",
      fontFamily: "sans-serif",
      textAlign: "center",
      padding: 30,
    }}>

      {/* LOCK ICON */}
      <div style={{ fontSize: 72, marginBottom: 24 }}>🔒</div>

      {/* TITLE */}
      <h1 style={{ fontSize: 26, fontWeight: "bold", marginBottom: 12, color: "#111" }}>
        Saved Contacts Locked
      </h1>

      {/* DESCRIPTION */}
      <p style={{ color: "#666", fontSize: 15, maxWidth: 320, lineHeight: 1.6, marginBottom: 32 }}>
        {description}
      </p>

      {/* PRIMARY BUTTON */}
      <button
        onClick={() => router.push(primaryPath)}
        style={{
          padding: "14px 32px",
          backgroundColor: primaryColor,
          color: "white",
          border: "none",
          borderRadius: 30,
          fontWeight: "bold",
          fontSize: 16,
          cursor: "pointer",
          marginBottom: 16,
          width: "100%",
          maxWidth: 280,
        }}
      >
        {primaryLabel}
      </button>

      {/* SECONDARY BUTTON — only for public users */}
      {showSecondary && (
        <button
          onClick={() => router.push("/organizer-info")}
          style={{
            padding: "14px 32px",
            backgroundColor: "#AABB23",
            color: "white",
            border: "none",
            borderRadius: 30,
            fontWeight: "bold",
            fontSize: 16,
            cursor: "pointer",
            marginBottom: 24,
            width: "100%",
            maxWidth: 280,
          }}
        >
          View Organizer Plans
        </button>
      )}

      {/* BACK LINK */}
      <p
        onClick={() => router.back()}
        style={{ color: "#701890", cursor: "pointer", fontSize: 14, textDecoration: "underline", marginTop: showSecondary ? 0 : 8 }}
      >
        ← Go Back
      </p>

    </div>
  );
}
