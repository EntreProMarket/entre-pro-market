import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function VendorSignUp() {
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) setProfileImage(e.target.files[0]);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!businessName || !category || !handle || !email || !password) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;
      const userId = authData.user.id;

      // 2️⃣ Upload profile image if selected
      let profileImageUrl = null;
      if (profileImage) {
        const fileExt = profileImage.name.split(".").pop();
        const fileName = `${handle}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("vendor-portfolio")
          .upload(fileName, profileImage);
        if (uploadError) throw uploadError;

        const { publicURL, error: urlError } = supabase.storage
          .from("vendor-portfolio")
          .getPublicUrl(fileName);
        if (urlError) throw urlError;

        profileImageUrl = publicURL;
      }

      // 3️⃣ Insert vendor record
      const { error: insertError } = await supabase.from("vendors").insert([
        {
          id: userId,
          business_name: businessName,
          category,
          handle,
          profile_image: profileImageUrl,
        },
      ]);
      if (insertError) throw insertError;

      alert("Vendor account created successfully!");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "50px auto",
        padding: 20,
        border: "1px solid #ccc",
        borderRadius: 8,
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>Vendor Sign-Up</h1>
      <form
        onSubmit={handleSignUp}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <label htmlFor="businessName">Business Name</label>
        <input
          id="businessName"
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
        />

        <label htmlFor="category">Category</label>
        <input
          id="category"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />

        <label htmlFor="handle">Handle</label>
        <input
          id="handle"
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label htmlFor="profileImage">Profile Image (optional)</label>
        <input id="profileImage" type="file" onChange={handleFileChange} />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 10,
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
