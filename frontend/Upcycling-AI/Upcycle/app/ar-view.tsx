import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import MotionAR from '../components/MotionAR';

export default function ARViewScreen() {
  const { upcycledImageUri } = useLocalSearchParams<{ upcycledImageUri: string }>();

  const handleClose = () => {
    router.back();
  };

  if (!upcycledImageUri) {
    return null;
  }

  return (
    <MotionAR
      upcycledImageUri={upcycledImageUri}
      onClose={handleClose}
    />
  );
}
