const handleSignUp = async () => {
  setLoading(true);
  setMessage("");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    setMessage(error.message);
    setLoading(false);
    return;
  }

  // 🚨 STOP HERE if email confirmation is ON
  if (!data.session) {
    setMessage("Check your email to confirm your account.");
    setLoading(false);
    return;
  }

  const user = data.user;

  const { error: profileError } = await supabase.from("profiles").insert([
    {
      id: user.id,
      email: user.email,
      role: null,
    },
  ]);

  if (profileError) {
    setMessage("Profile error: " + profileError.message);
    setLoading(false);
    return;
  }

  setMessage("Account created!");
  setLoading(false);
};
