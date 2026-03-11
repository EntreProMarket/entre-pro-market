import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Get the current user session
  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      if (!data?.session?.user) {
        router.push("/login"); // redirect to login if not logged in
      } else {
        setUser(data.session.user);
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ padding: 40 }}>
        <p style={{ color: "red" }}>{errorMsg}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>

      {user ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <p>This is a safe, working dashboard page.</p>
          <p>You can now test vendor portfolio and uploads without crashing.</p>
        </div>
      ) : (
        <p>No user session found. Redirecting to login...</p>
      )}
    </div>
  );
}
