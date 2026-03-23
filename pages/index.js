import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // SIGN UP (PUBLIC USER)
  const signUp = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage("Already registered or invalid credentials");
      setLoading(false);
      return;
    }

    const user = data?.user;

    if (user) {
      await supabase.from("profiles").insert([
        {
          id: user.id,
          role: "public",
        },
      ]);
    }

    setLoading(false);
    setMessage("Account created. You can now log in.");
  };

  // LOGIN (ROUTE BASED ON ROLE)
  const login = async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Invalid login");
      setLoading(false);
      return;
    }

    const user = data.user;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setLoading(false);

    if (profile?.role === "vendor") {
      router.push("/vendor-dashboard");
    } else if (profile?.role === "organizer") {
      router.push("/organizer-dashboard");
    } else {
      router.push("/vendors");
    }
  };

  // BECOME VENDOR
  const becomeVendor = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      setMessage("Please log in first.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile.role === "organizer") {
      setMessage("Already registered as Organizer");
      return;
    }

    if (profile.role === "vendor") {
      router.push("/vendor-dashboard");
      return;
    }

    const confirmUpgrade = confirm("Do you want to become a Vendor?");
    if (!confirmUpgrade) return;

    await supabase
      .from("profiles")
      .update({ role: "vendor" })
      .eq("id", user.id);

    router.push("/vendor-dashboard");
  };

  // BECOME ORGANIZER
  const becomeOrganizer = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      setMessage("Please log in first.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile.role === "vendor") {
      setMessage("Already registered as Vendor");
      return;
    }

    if (profile.role === "organizer") {
      router.push("/organizer-dashboard");
      return;
    }

    const confirmUpgrade = confirm("Do you want to become an Organizer?");
    if (!confirmUpgrade) return;

    await supabase
      .from("profiles")
      .update({ role: "organizer" })
      .eq("id", user.id);

    router.push("/organizer-dashboard");
  };

  return (
    <div
      style={{
