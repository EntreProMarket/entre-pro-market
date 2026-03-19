import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        router.replace("/");
        return;
      }

      setUser(data.user);
      setLoading(false);
    };

    getUser();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 30 }}>Loading...</div>;
  }

  return (
    <div style={{ textAlign: "center", padding: 30, fontFamily: "sans-serif" }}>
      <h1>Dashboard</h1>

      <p>
        Logged in as: <strong>{user?.email}</strong>
      </p>

      <button
        onClick={logout}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          backgroundColor: "#701890",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Log Out
      </button>
    </div>
  );
}
