// --- Old code below (for reference, do not remove) ---
/*
import React, { useState, useEffect } from "react";
import { Button, Image, Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

export default function ScanPage({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted" ? true : false);
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
    setLoading(true);
    setResult("");
    // Simulate analysis without backend
    setTimeout(() => {
      setResult("Test result: This is a simulated analysis of your photo.");
      setLoading(false);
    }, 1500);
  };

  if (hasPermission === null) {
    return <View><Text>Requesting camera permission...</Text></View>;
  }

  if (hasPermission === false) {
    return <View><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Upcycle-AI Image Scanner</Text>
      <Text style={styles.instructions}>
        Snap a photo of your item and tap "Analyze Item" to get instant feedback!
      </Text>
      <Button title="Take a Picture" onPress={takePhoto} />
      {photo && (
        <>
          <Image source={{ uri: photo }} style={styles.preview} />
          <Button title="Analyze Item" onPress={uploadPhoto} />
        </>
      )}
      {loading && <ActivityIndicator size="large" color="#00f" />}
      {result !== "" && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5"
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 10,
    textAlign: "center",
  },
  instructions: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  preview: {
    width: 250,
    height: 250,
    marginTop: 20,
    borderRadius: 10,
  },
  resultBox: {
    marginTop: 20,
    backgroundColor: "#e6f7ff",
    padding: 15,
    borderRadius: 10,
  },
  resultText: {
    fontSize: 16,
    textAlign: "center",
  },
});
*/

// --- Modern, user-friendly ScanPage below ---
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform } from "react-native";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

export default function ScanPage({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted" ? true : false);
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
    setLoading(true);
    setResult("");
    setTimeout(() => {
      setResult("Test result: This is a simulated analysis of your photo.");
      setLoading(false);
    }, 1500);
  };

  if (hasPermission === null) {
    return <View style={modernStyles.centered}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={modernStyles.centered}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={modernStyles.gradientBg}>
      <View style={modernStyles.card}>
        <Text style={modernStyles.header}>Upcycle-AI Image Scanner</Text>
        <Text style={modernStyles.instructions}>
          Snap a photo of your item and tap <Text style={{fontWeight:'bold'}}>Analyze Item</Text> to get instant feedback!
        </Text>
        <TouchableOpacity style={modernStyles.photoButton} onPress={takePhoto}>
          <Text style={modernStyles.photoButtonText}>📷 Take a Picture</Text>
        </TouchableOpacity>
        {!photo && (
          <View style={modernStyles.placeholderBox}>
            <Text style={modernStyles.placeholderIcon}>🖼️</Text>
            <Text style={modernStyles.placeholderText}>No image selected</Text>
          </View>
        )}
        {photo && (
          <>
            <Image source={{ uri: photo }} style={modernStyles.preview} />
            <TouchableOpacity style={modernStyles.analyzeButton} onPress={uploadPhoto}>
              <Text style={modernStyles.analyzeButtonText}>🔎 Analyze Item</Text>
            </TouchableOpacity>
          </>
        )}
        {loading && <ActivityIndicator size="large" color="#2e7d32" style={{marginTop: 20}} />}
        {result !== "" && (
          <View style={modernStyles.resultBox}>
            <Text style={modernStyles.resultText}>{result}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const modernStyles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 370,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#555',
    marginBottom: 18,
    textAlign: 'center',
  },
  photoButton: {
    backgroundColor: '#43a047',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginBottom: 18,
    marginTop: 4,
    shadowColor: '#43a047',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bdbdbd',
    borderRadius: 12,
    width: 220,
    height: 180,
    marginBottom: 18,
    backgroundColor: '#f9fbe7',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    color: '#888',
    fontSize: 15,
  },
  preview: {
    width: 220,
    height: 180,
    borderRadius: 12,
    marginBottom: 18,
    marginTop: 4,
    borderWidth: 2,
    borderColor: '#c8e6c9',
  },
  analyzeButton: {
    backgroundColor: '#1976d2',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginBottom: 8,
    shadowColor: '#1976d2',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  resultBox: {
    marginTop: 18,
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  resultText: {
    fontSize: 16,
    color: '#1976d2',
    textAlign: 'center',
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
  },
});