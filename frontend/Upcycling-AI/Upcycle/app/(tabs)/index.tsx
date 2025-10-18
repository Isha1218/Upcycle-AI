import React from "react";
import { useRouter } from 'expo-router';
import HomePage from "../HomePage";

export default function HomeScreen() {
  const router = useRouter();
  
  return <HomePage navigation={router} />;
}
