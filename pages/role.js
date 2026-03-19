import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function RolePage() {
  const router = useRouter();

  const setRole = async (role) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", user.id);

    if (error) {
      alert(error.message);
      return;
    }

    if (role === "vendor") {
      router.replace("/vendor-dashboard");
    } else {
      router.replace("/organizer-dashboard");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: 30 }}>
      <h1>Select Your Role</h1>

      <button onClick={() => setRole("vendor")}>Vendor</button>

      <button
        onClick={() => setRole("organizer")}
        style={{ marginLeft: 10 }}
      >
        Organizer
      </button>
    </div>
  );
}
