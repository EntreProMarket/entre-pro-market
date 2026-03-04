import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Get current session user
    const sessionUser = supabase.auth.user();
    if (!sessionUser) {
      setMessage("You are not logged in.");
      setLoading(false);
      return;
    }
    setUser(sessionUser);

    // Fetch profiles from Supabase
    const fetchProfiles = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) {
        setMessage(error.message);
      } else {
        setProfiles(data);
      }
      setLoading(false);
    };

    fetchProfiles();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(error.message);
    } else {
      setUser(null);
      setProfiles([]);
      setMessage("Logged out successfully.");
    }
  };

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading...</p>;
  }

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        <img
          src="/logo.png.jpg" // <-- Replace with your filename if needed
          alt="Entre PRO Market"
          style={{ width: 180, marginBottom: 20 }}
        />
        <p>{message || "Please log in first."}</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      {/* Logo */}
      <img
        src="/logo.png.jpg" // <-- Replace with your filename if needed
        alt="Entre PRO Market"
        style={{ width: 180, marginBottom: 20 }}
      />

      <h1>Welcome, {user.email}</h1>
      <button
        onClick={handleLogout}
        style={{ padding: "10px 20px", marginBottom: 20 }}
      >
        Log Out
      </button>

      <h2>All Profiles</h2>
      {profiles.length === 0 ? (
        <p>No profiles found.</p>
      ) : (
        <table
          style={{
            margin: "0 auto",
            borderCollapse: "collapse",
            width: "80%",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>ID</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Email</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Role</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>
                Created At
              </th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{p.id}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{p.email}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{p.role}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>
                  {p.created_at}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </div>
  );
}
