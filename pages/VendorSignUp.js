import React, { useState } from "react";
import { View, Text, TextInput, Button, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../supabaseClient"; // your Supabase client file

export default function VendorSignUp({ navigation }) {
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Pick an image from device
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (uri, handle) => {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `${handle}/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from("vendor-portfolio")
        .upload(fileName, blob, { upsert: true });
      if (error) throw error;

      const { publicURL, error: urlError } = supabase.storage
        .from("vendor-portfolio")
        .getPublicUrl(fileName);
      if (urlError) throw urlError;

      return publicURL;
    } catch (err) {
      Alert.alert("Image Upload Error", err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSignUp = async () => {
    if (!businessName || !category || !handle || !email || !password) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    // Step 1: Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) {
      Alert.alert("Sign-Up Error", authError.message);
      return;
    }

    const userId = authData.user.id;

    // Step 2: Upload image if selected
    let profile_image = null;
    if (image) {
      profile_image = await uploadImage(image, handle);
    }

    // Step 3: Insert vendor record
    const { data, error } = await supabase
      .from("vendors")
      .insert([
        {
          id: userId,
          business_name: businessName,
          category,
          handle,
          profile_image,
        },
      ]);

    if (error) {
      Alert.alert("Database Error", error.message);
      return;
    }

    Alert.alert("Success", "Vendor account created!");
    navigation.navigate("VendorDashboard"); // adjust to your dashboard route
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Business Name</Text>
      <TextInput value={businessName} onChangeText={setBusinessName} style={{ borderWidth: 1, marginBottom: 10, padding: 5 }} />
      
      <Text>Category</Text>
      <TextInput value={category} onChangeText={setCategory} style={{ borderWidth: 1, marginBottom: 10, padding: 5 }} />

      <Text>Handle</Text>
      <TextInput value={handle} onChangeText={setHandle} style={{ borderWidth: 1, marginBottom: 10, padding: 5 }} />

      <Text>Email</Text>
      <TextInput value={email} onChangeText={setEmail} style={{ borderWidth: 1, marginBottom: 10, padding: 5 }} keyboardType="email-address" />

      <Text>Password</Text>
      <TextInput value={password} onChangeText={setPassword} style={{ borderWidth: 1, marginBottom: 10, padding: 5 }} secureTextEntry />

      <Button title={image ? "Change Profile Image" : "Pick Profile Image"} onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={{ width: 100, height: 100, marginVertical: 10 }} />}

      <Button title={uploading ? "Uploading..." : "Sign Up"} onPress={handleSignUp} disabled={uploading} />
    </View>
  );
}
