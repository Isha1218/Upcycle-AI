import styles from "./app/drafts/AppStyles";

import React, { useState, useEffect } from "react";
import { Button, Image, Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
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