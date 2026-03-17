import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        textAlign: "center",
      }}
    >
      {/* LOGO */}
      <img
        src="/logo.png.jpg"
        alt="Entre PRO Market Logo"
        style={{
          width: 140,
          height: 140,
          objectFit: "contain",
          marginBottom: 20,
        }}
      />

      {/* TITLE */}
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>
        Entre PRO Market
      </h1>

      {/* SUBTEXT */}
      <p style={{ marginBottom: 30 }}>
        Connect Vendors with Event Organizers
      </p>

      {/* LOGIN BUTTON */}
      <button
        onClick={() => router.push("/login")}
        style={{
          padding: 14,
          width: "100%",
          maxWidth: 300,
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 8,
          marginBottom: 15,
          fontSize: 16,
        }}
      >
        Login
      </button>

      {/* VENDOR SIGN UP */}
      <button
        onClick={() => router.push("/vendor-signup")}
        style={{
          padding: 14,
          width: "100%",
          maxWidth: 300,
          backgroundColor: "#9333ea",
          color: "white",
          border: "none",
          borderRadius: 8,
          marginBottom: 10,
          fontSize: 16,
        }}
      >
        Become a Vendor
      </button>

      {/* ORGANIZER SIGN UP (placeholder for later) */}
      <button
        onClick={() => router.push("/organizer-signup")}
        style={{
          padding: 14,
          width: "100%",
          maxWidth: 300,
          backgroundColor: "#10b
