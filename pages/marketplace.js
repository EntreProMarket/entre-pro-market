// pages/marketplace.js — DEBUG VERSION

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Marketplace() {
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugMsg, setDebugMsg] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setDebugMsg("Fetching...");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "vendor");

    if (error) {
      setDebugMsg("❌ Error: " + JSON.stringify(error));
      setLoading(false);
      return;
    }

    setDebugMsg(`✅ Got ${data?.length || 0} rows. First: ${JSON.stringify(data?.[0]?.business_name)}`);
    setVendors(data || []);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Marketplace Debug</h1>
      <p style={{ background: "#f0f0f0", padding: 10, borderRadius: 6, fontSize: 13 }}>
        {debugMsg || "Loading..."}
      </p>
      <p>Vendors count: {vendors.length}</p>
      {vendors.map(v => (
        <div key={v.id} style={{ border: "1px solid #ddd", padding: 10, marginBottom: 10, borderRadius: 6 }}>
          <p><strong>{v.business_name || "NULL name"}</strong></p>
          <p>Role: {v.role} | Category: {v.category} | Account: {v.account_type}</p>
        </div>
      ))}
    </div>
  );
}
