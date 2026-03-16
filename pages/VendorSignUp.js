import { useState } from "react";
import { supabase } from "../lib/supabaseClient"; // adjust path to your client

export default function VendorSignUp() {
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setProfileImage(e.target.files[0]);
    }
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
      // Optional: redirect to dashboard
      // window.location.href = "/vendor-dashboard";
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h1>Vendor Sign-Up</h1>
      <form onSubmit={handleSignUp}>
        <label>Business Name</label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />

        <label>Category</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <label>Handle</label>
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label>Profile Image (optional)</label>
        <input type="file" onChange={handleFileChange} />

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
