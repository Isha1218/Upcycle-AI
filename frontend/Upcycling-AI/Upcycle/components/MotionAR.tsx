import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Accelerometer } from 'expo-sensors';

interface MotionARProps {
  upcycledImageUri: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export default function MotionAR({ upcycledImageUri, onClose }: MotionARProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(0.8);
  const [isPlaced, setIsPlaced] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    // Start accelerometer when component mounts
    Accelerometer.setUpdateInterval(100); // Update every 100ms
    
    const subscription = Accelerometer.addListener(accelerometerData => {
      if (!isPlaced) {
        // Use phone movement to place the object
        const { x, y, z } = accelerometerData;
        
        // Convert accelerometer data to screen position
        // More movement = more offset from center
        const sensitivity = 50;
        const newX = Math.max(-width/2 + 100, Math.min(width/2 - 100, x * sensitivity));
        const newY = Math.max(-height/2 + 100, Math.min(height/2 - 100, -y * sensitivity));
        
        setImagePosition({ x: newX, y: newY });
        
        // Auto-place when phone is relatively still
        const movement = Math.sqrt(x*x + y*y + z*z);
        if (movement < 0.1) {
          setTimeout(() => {
            setIsPlaced(true);
          }, 1000);
        }
      }
    });

    setSubscription(subscription);

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isPlaced]);

  const resetPlacement = () => {
    setIsPlaced(false);
    setImagePosition({ x: 0, y: 0 });
    setImageScale(0.8);
  };

  const adjustScale = (direction: 'in' | 'out') => {
    const step = 0.1;
    setImageScale(prev => {
      const newScale = direction === 'in' 
        ? Math.min(3, prev + step)
        : Math.max(0.5, prev - step);
      return newScale;
    });
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required for AR view</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera}>
        <View style={styles.overlay}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>AR Preview</Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetPlacement}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* AR Object Overlay */}
          <View style={styles.arObjectContainer}>
            <View 
              style={[
                styles.arObject,
                {
                  transform: [
                    { translateX: imagePosition.x },
                    { translateY: imagePosition.y },
                    { scale: imageScale },
                  ],
                  opacity: isPlaced ? 1 : 0.7, // Slightly transparent while placing
                }
              ]}
            >
              <Image
                source={{ uri: upcycledImageUri }}
                style={styles.arImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Status Indicator */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {isPlaced ? '✅ Object Placed!' : '📱 Move your phone to position the object'}
            </Text>
          </View>

          {/* Scale Controls (only show after placement) */}
          {isPlaced && (
            <View style={styles.scaleControls}>
              <TouchableOpacity 
                style={styles.scaleButton} 
                onPress={() => adjustScale('out')}
              >
                <Text style={styles.scaleButtonText}>🔍-</Text>
              </TouchableOpacity>
              <Text style={styles.scaleText}>{imageScale.toFixed(1)}x</Text>
              <TouchableOpacity 
                style={styles.scaleButton} 
                onPress={() => adjustScale('in')}
              >
                <Text style={styles.scaleButtonText}>🔍+</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionText}>
              {isPlaced 
                ? 'Use scale controls to adjust size' 
                : 'Move your phone around to position the upcycled item in your space'
              }
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  resetButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  arObjectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arObject: {
    width: 150,
    height: 150,
  },
  arImage: {
    width: '100%',
    height: '100%',
  },
  statusContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scaleControls: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 15,
  },
  scaleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  scaleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scaleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 15,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  message: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
