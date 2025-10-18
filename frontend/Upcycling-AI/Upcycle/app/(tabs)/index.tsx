import React, { useState, useEffect } from "react";
import { Button, Image, Text, View, ActivityIndicator, Alert } from "react-native";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
// @ts-ignore
import { StyleSheet } from "react-native";
import upcyclingAPI, { UpcyclingResult } from "../../services/api";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5"
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusConnected: {
    color: "#4CAF50",
  },
  statusDisconnected: {
    color: "#F44336",
  },
  preview: {
    width: 250,
    height: 250,
    marginTop: 20,
    borderRadius: 10,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});
export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted" ? true : false);
      
      // Check backend connection
      const isConnected = await upcyclingAPI.healthCheck();
      setBackendConnected(isConnected);
    })();
  }, []);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async () => {
    if (!photo) return;
    
    if (!backendConnected) {
      Alert.alert(
        "Backend Not Connected",
        "Please make sure the backend server is running on http://localhost:8000",
        [{ text: "OK" }]
      );
      return;
    }

    setLoading(true);
    
    try {
      console.log("🔄 Starting image analysis...");
      const result: UpcyclingResult = await upcyclingAPI.analyzeImage(photo);
      console.log("✅ Analysis result:", result);
      
      // Navigate to results screen with the data
      router.push({
        pathname: "/results",
        params: {
          result: JSON.stringify(result),
          imageUri: photo,
        },
      });
    } catch (error) {
      console.error("❌ Analysis error:", error);
      Alert.alert(
        "Analysis Failed",
        error instanceof Error ? error.message : "Unknown error occurred",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return <View><Text>Requesting camera permission...</Text></View>;
  }

  if (hasPermission === false) {
    return <View><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔄 Upcycle AI</Text>
      <Text style={styles.subtitle}>Capture an item to get upcycling ideas!</Text>
      
      {/* Backend Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Backend Status:</Text>
        <Text style={[
          styles.statusText, 
          backendConnected ? styles.statusConnected : styles.statusDisconnected
        ]}>
          {backendConnected === null ? "Checking..." : 
           backendConnected ? "✅ Connected" : "❌ Disconnected"}
        </Text>
      </View>

      <Button 
        title="📸 Take a Picture" 
        onPress={takePhoto}
        disabled={!hasPermission}
      />
      
      {photo && (
        <>
          <Image source={{ uri: photo }} style={styles.preview} />
          <Button 
            title="🔍 Analyze Item" 
            onPress={uploadPhoto}
            disabled={!backendConnected || loading}
          />
        </>
      )}
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Analyzing your item...</Text>
        </View>
      )}
    </View>
  );
}
