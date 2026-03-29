import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function OrganizerPublicProfile() {
  const router = useRouter();
  const { handle } = router.query;

  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) return;

    const fetchOrganizer = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("handle", handle)
        .single();

      if (error) {
        console.log(error);
        setLoading(false);
        return;
      }

      setOrganizer(data);
      setLoading(false);
    };

    fetchOrganizer();
  }, [handle]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!organizer) return <div style={{ padding: 20 }}>Organizer not found</div>;

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>

      <h1>{organizer.organizer_name}</h1>
      <p>@{organizer.handle}</p>

      {organizer.logo_url && (
        <img
          src={organizer.logo_url}
          alt="logo"
          style={{ width: 140, borderRadius: 10, marginTop: 10 }}
        />
      )}

      <p><strong>Event Type:</strong> {organizer.event_type}</p>
      <p><strong>Location:</strong> {organizer.city}, {organizer.state}</p>

      <p style={{ marginTop: 20 }}>{organizer.description}</p>

      <div style={{ marginTop: 20 }}>
        {organizer.website && (
          <p><a href={organizer.website} target="_blank">Website</a></p>
        )}
        {organizer.instagram && (
          <p><a href={organizer.instagram} target="_blank">Instagram</a></p>
        )}
        {organizer.facebook && (
          <p><a href={organizer.facebook} target="_blank">Facebook</a></p>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40 }}>
        <button onClick={() => router.back()}>← Back</button>
      </div>

    </div>
  );
}
