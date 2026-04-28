// pages/saved-contacts-locked.js

import { useRouter } from "next/router";

export default function SavedContactsLocked() {
  const router = useRouter();

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
        Save and manage your vendor and organizer contacts by upgrading your account. Available on all Vendor and Organizer plans.
      </p>

      {/* VENDOR PLANS BUTTON */}
      <button
        onClick={() => router.push("/vendor-info")}
        style={{
          padding: "14px 32px",
          backgroundColor: "#701890",
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
        View Vendor Plans
      </button>

      {/* ORGANIZER PLANS BUTTON */}
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

      {/* BACK LINK */}
      <p
        onClick={() => router.back()}
        style={{ color: "#701890", cursor: "pointer", fontSize: 14, textDecoration: "underline" }}
      >
        ← Go Back
      </p>

    </div>
  );
}
