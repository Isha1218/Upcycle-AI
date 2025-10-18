import React, { useState, useEffect } from "react";
import { Button, Image, Text, View, ActivityIndicator } from "react-native";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
// @ts-ignore
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5"
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
export default function HomeScreen() {
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
