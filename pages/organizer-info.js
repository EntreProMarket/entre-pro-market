import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function OrganizerInfo() {
  const router = useRouter();

  const upgradeOrganizer = async (plan) => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      router.push("/");
      return;
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      role: "organizer",
      account_type: plan,
    });

    router.push("/organizer-dashboard");
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, textAlign: "center" }}>
      
      <h1>Become an Organizer</h1>
      <p>Create events. Connect with vendors. Build experiences.</p>

      {/* TIERS */}
      <div style={{ marginTop: 30 }}>

        <div style={{ border: "1px solid #ccc", padding: 15, borderRadius: 8, marginBottom: 15 }}>
          <h3>Basic Organizer</h3>
          <p>Limited vendor access.</p>
          <button onClick={() => upgradeOrganizer("basic")}>Start Basic</button>
        </div>

        <div style={{ border: "2px solid #AABB23", padding: 15, borderRadius: 8, marginBottom: 15 }}>
          <h3>Pro Organizer</h3>
          <p>More vendor connections.</p>
          <button onClick={() => upgradeOrganizer("pro")}>Go Pro</button>
        </div>

        <div style={{ border: "2px solid #701890", padding: 15, borderRadius: 8 }}>
          <h3>Premium Organizer</h3>
          <p>Unlimited access + create events.</p>
          <button onClick={() => upgradeOrganizer("premium")}>Go Premium</button>
        </div>

      </div>

      {/* BACK */}
      <button
        onClick={() => router.push("/")}
        style={{
          marginTop: 30,
          padding: "10px 20px",
          backgroundColor: "#ccc",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        ← Back
      </button>
    </div>
  );
}
