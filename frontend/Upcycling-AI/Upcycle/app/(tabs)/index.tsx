import React, { useState, useEffect } from "react";
import { Image, Text, View, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from "react-native";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
// @ts-ignore
import { StyleSheet } from "react-native";
import upcyclingAPI, { UpcyclingResult } from "../../services/api";
import { IconSymbol } from "@/components/ui/icon-symbol";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
  },
  grid: {
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    margin: 10,
    flex: 1,
  },
  cardImage: {
    width: "100%",
  },
  cardFooter: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#166534",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#fff",
  },
});
export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const suggestions = [
    { id: '4', title: 'Tin → Wall Art', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop' },
    { id: '2', title: 'Bottle → Lamp', image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=800&auto=format&fit=crop' },
    { id: '1', title: 'Chair → Clothes Rack', image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=800&auto=format&fit=crop' },
    { id: '3', title: 'Pillow → Sofa', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop' },
    { id: '5', title: 'Chair → Shelf', image: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=800&auto=format&fit=crop' },
    { id: '6', title: 'Jar → Herb Planter', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800&auto=format&fit=crop' },
  ];

  // All cards use uniform image height for consistent footer spacing
  const leftColumn: Array<typeof suggestions[number] & { height: number }> = [];
  const rightColumn: Array<typeof suggestions[number] & { height: number }> = [];
  const uniformImageHeight = 180;
  suggestions.forEach((item, idx) => {
    // Alternate items between columns
    if (idx % 2 === 0) {
      leftColumn.push({ ...item, height: uniformImageHeight });
    } else {
      rightColumn.push({ ...item, height: uniformImageHeight });
    }
  });

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
      // Immediately analyze
      uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (imageUri?: string) => {
    const target = imageUri ?? photo;
    if (!target) return;

    if (!backendConnected) {
      Alert.alert(
        "Backend Not Connected",
        "Please make sure the backend server is running on http://localhost:8000",
        [{ text: "OK" }]
      );
      return;
    }

    setSubmitting(true);
    
    try {
      console.log("🔄 Starting image analysis...");
      const result: UpcyclingResult = await upcyclingAPI.analyzeImage(target);
      console.log("✅ Analysis result:", result);
      
      // Navigate to results screen with the data
      router.push({
        pathname: "/results",
        params: {
          result: JSON.stringify(result),
          imageUri: target,
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
      setSubmitting(false);
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
      <View style={styles.header}>
        <Text style={styles.title}>Discover Upcycling Ideas</Text>
        <Text style={styles.subtitle}>Community suggestions to spark creativity</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        <View style={styles.columns}>
          <View style={styles.column}>
            {leftColumn.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image source={{ uri: item.image }} style={[styles.cardImage, { height: item.height }]} />
                <View style={styles.cardFooter}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#166534' }}>@maker_{item.id}</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>{`#${((item.title.split('→')[0] || '').trim().toLowerCase().split(' ').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(''))}To${((item.title.split('→')[1] || '').trim().toLowerCase().split(' ').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(''))}`}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={[styles.column, { marginLeft: 10 }]}>
            {rightColumn.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image source={{ uri: item.image }} style={[styles.cardImage, { height: item.height }]} />
                <View style={styles.cardFooter}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#166534' }}>@maker_{item.id}</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>{`#${((item.title.split('→')[0] || '').trim().toLowerCase().split(' ').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(''))}To${((item.title.split('→')[1] || '').trim().toLowerCase().split(' ').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(''))}`}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={takePhoto} disabled={!hasPermission}>
        <IconSymbol size={24} name="camera.fill" color="#fff" />
      </TouchableOpacity>

      {submitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Analyzing...</Text>
        </View>
      )}
    </View>
  );
}
