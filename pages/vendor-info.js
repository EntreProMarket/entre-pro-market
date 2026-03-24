import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function VendorInfo() {
  const router = useRouter();

  const upgradeVendor = async (plan) => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      router.push("/");
      return;
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      role: "vendor",
      account_type: plan,
    });

    router.push("/vendor-dashboard");
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, textAlign: "center" }}>
      
      <h1>Become a Vendor</h1>
      <p>Sell products & services. Get discovered by customers and event organizers.</p>

      {/* TIERS */}
      <div style={{ marginTop: 30 }}>

        <div style={{ border: "1px solid #ccc", padding: 15, borderRadius: 8, marginBottom: 15 }}>
          <h3>Free Vendor</h3>
          <p>Basic listing. Limited exposure.</p>
          <button onClick={() => upgradeVendor("free")}>Start Free</button>
        </div>

        <div style={{ border: "2px solid #AABB23", padding: 15, borderRadius: 8, marginBottom: 15 }}>
          <h3>Pro Vendor</h3>
          <p>More visibility. Access to organizers.</p>
          <button onClick={() => upgradeVendor("pro")}>Go Pro</button>
        </div>

        <div style={{ border: "2px solid #701890", padding: 15, borderRadius: 8 }}>
          <h3>Premium Vendor</h3>
          <p>Max exposure. Featured listings + priority placement.</p>
          <button onClick={() => upgradeVendor("premium")}>Go Premium</button>
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
