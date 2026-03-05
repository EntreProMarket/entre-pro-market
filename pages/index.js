import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      
      <Image
        source={require("../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Entre PRO Market</Text>

      <TouchableOpacity
        style={styles.vendorButton}
        onPress={() => router.push("/vendor/login")}
      >
        <Text style={styles.buttonText}>Vendor Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.organizerButton}
        onPress={() => router.push("/organizer/login")}
      >
        <Text style={styles.buttonText}>Event Organizer Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signupButton}
        onPress={() => router.push("/signup")}
      >
        <Text style={styles.signupText}>Create Account</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },

  logo: {
    width: 180,
    height: 180,
    marginBottom: 20
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40
  },

  vendorButton: {
    width: "80%",
    padding: 15,
    backgroundColor: "#1E90FF",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15
  },

  organizerButton: {
    width: "80%",
    padding: 15,
    backgroundColor: "#6A5ACD",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20
  },

  signupButton: {
    marginTop: 10
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },

  signupText: {
    fontSize: 16,
    color: "#333"
  }
});
