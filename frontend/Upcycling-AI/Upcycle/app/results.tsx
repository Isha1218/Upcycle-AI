import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { UpcyclingResult, UpcyclingIdea } from '../services/api';
import upcyclingAPI from '../services/api';
import MotionAR from '../components/MotionAR';

export default function ResultsScreen() {
  const { result: resultString, imageUri } = useLocalSearchParams<{
    result: string;
    imageUri: string;
  }>();

  const [generatingImages, setGeneratingImages] = useState<{ [key: number]: boolean }>({});
  const [generatedImages, setGeneratedImages] = useState<{ [key: number]: string }>({});
  const [showAR, setShowAR] = useState(false);
  const [arImageUri, setArImageUri] = useState<string>('');

  if (!resultString || !imageUri) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No data available</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const result: UpcyclingResult = JSON.parse(resultString);
  const { analysis, upcycling_ideas } = result;

  const generateUpcycledImage = async (idea: UpcyclingIdea, ideaIndex: number) => {
    setGeneratingImages(prev => ({ ...prev, [ideaIndex]: true }));
    
    try {
      console.log(`🎨 Generating upcycled image for: ${idea.title}`);
      const imageResult = await upcyclingAPI.generateUpcycledImage(imageUri, idea);
      
      if (imageResult.status === 'success' && imageResult.upcycled_image) {
        setGeneratedImages(prev => ({ 
          ...prev, 
          [ideaIndex]: `data:image/jpeg;base64,${imageResult.upcycled_image}` 
        }));
        console.log(`✅ Successfully generated upcycled image for: ${idea.title}`);
      } else {
        throw new Error('Failed to generate image');
      }
    } catch (error) {
      console.error(`❌ Error generating image for ${idea.title}:`, error);
      Alert.alert(
        'Image Generation Failed',
        error instanceof Error ? error.message : 'Unknown error occurred',
        [{ text: 'OK' }]
      );
    } finally {
      setGeneratingImages(prev => ({ ...prev, [ideaIndex]: false }));
    }
  };

  const openARView = (imageUri: string) => {
    setArImageUri(imageUri);
    setShowAR(true);
  };

  const closeARView = () => {
    setShowAR(false);
    setArImageUri('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Upcycling Analysis</Text>
      </View>

      {/* Image Preview */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />
      </View>

      {/* Analysis Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Object Analysis</Text>
        <View style={styles.analysisCard}>
          <Text style={styles.objectName}>{analysis.main_object}</Text>
          <View style={styles.analysisRow}>
            <Text style={styles.analysisLabel}>Condition:</Text>
            <Text style={styles.analysisValue}>{analysis.overall_condition}</Text>
          </View>
          <View style={styles.analysisRow}>
            <Text style={styles.analysisLabel}>Difficulty:</Text>
            <Text style={styles.analysisValue}>{analysis.difficulty_level}</Text>
          </View>
          <View style={styles.analysisRow}>
            <Text style={styles.analysisLabel}>Parts Found:</Text>
            <Text style={styles.analysisValue}>{analysis.parts.length}</Text>
          </View>
        </View>
      </View>

      {/* Parts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Reusable Parts</Text>
        {analysis.parts.map((part, index) => (
          <View key={index} style={styles.partCard}>
            <Text style={styles.partName}>{part.name}</Text>
            <View style={styles.partDetails}>
              <Text style={styles.partDetail}>Material: {part.material}</Text>
              <Text style={styles.partDetail}>
                Size: {part.dimensions.length || 0}cm × {part.dimensions.width || 0}cm × {part.dimensions.height || 0}cm
              </Text>
              <Text style={styles.partDetail}>Qty: {part.quantity}</Text>
              <Text style={styles.partDetail}>Condition: {part.condition}</Text>
            </View>
            {part.notes && (
              <Text style={styles.disassemblyNotes}>
                💡 {part.notes}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Upcycling Ideas Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Upcycling Ideas</Text>
        {upcycling_ideas.ideas.map((idea, index) => (
          <View key={index} style={styles.ideaCard}>
            <Text style={styles.ideaTitle}>{idea.title}</Text>
            <Text style={styles.ideaDescription}>{idea.description}</Text>
            
            <View style={styles.ideaMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Difficulty:</Text>
                <Text style={[styles.metaValue, getDifficultyColor(idea.difficulty)]}>
                  {idea.difficulty}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Time:</Text>
                <Text style={styles.metaValue}>{idea.time_estimate}</Text>
              </View>
            </View>

            <View style={styles.ideaSection}>
              <Text style={styles.ideaSectionTitle}>🛠️ Tools Needed:</Text>
              <Text style={styles.ideaSectionContent}>
                {idea.required_tools.join(', ')}
              </Text>
            </View>

            <View style={styles.ideaSection}>
              <Text style={styles.ideaSectionTitle}>📦 Materials:</Text>
              <Text style={styles.ideaSectionContent}>
                {idea.additional_materials.join(', ')}
              </Text>
            </View>

            <View style={styles.ideaSection}>
              <Text style={styles.ideaSectionTitle}>🔧 Parts Used:</Text>
              <Text style={styles.ideaSectionContent}>
                {idea.parts_used.join(', ')}
              </Text>
            </View>

            <View style={styles.ideaSection}>
              <Text style={styles.ideaSectionTitle}>📋 Steps:</Text>
              {idea.steps.map((step, stepIndex) => (
                <Text key={stepIndex} style={styles.stepText}>
                  {stepIndex + 1}. {step}
                </Text>
              ))}
            </View>

            {/* Image Generation Section */}
            <View style={styles.ideaSection}>
              <Text style={styles.ideaSectionTitle}>🎨 See the Result:</Text>
              
                  {generatedImages[index] ? (
                    <View style={styles.generatedImageContainer}>
                      <Image 
                        source={{ uri: generatedImages[index] }} 
                        style={styles.generatedImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.generatedImageLabel}>
                        Generated upcycled result for "{idea.title}"
                      </Text>
                      <TouchableOpacity
                        style={styles.arButton}
                        onPress={() => openARView(generatedImages[index])}
                      >
                        <Text style={styles.arButtonText}>🥽 View in AR</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                <TouchableOpacity
                  style={[
                    styles.generateButton,
                    generatingImages[index] && styles.generateButtonDisabled
                  ]}
                  onPress={() => generateUpcycledImage(idea, index)}
                  disabled={generatingImages[index]}
                >
                  {generatingImages[index] ? (
                    <View style={styles.generateButtonContent}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.generateButtonText}>Generating...</Text>
                    </View>
                  ) : (
                    <Text style={styles.generateButtonText}>🎨 Generate Upcycled Image</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* AR Modal */}
      <Modal
        visible={showAR}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <MotionAR
          upcycledImageUri={arImageUri}
          onClose={closeARView}
        />
      </Modal>
    </ScrollView>
  );
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty.toLowerCase()) {
    case 'beginner':
      return { color: '#4CAF50' };
    case 'intermediate':
      return { color: '#FF9800' };
    case 'advanced':
      return { color: '#F44336' };
    default:
      return { color: '#666' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  imageContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  analysisCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  objectName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 16,
    color: '#666',
  },
  analysisValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  partCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  partName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  partDetails: {
    marginBottom: 8,
  },
  partDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  disassemblyNotes: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  ideaCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ideaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ideaDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    lineHeight: 22,
  },
  ideaMeta: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  ideaSection: {
    marginBottom: 15,
  },
  ideaSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  ideaSectionContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  generatedImageContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  generatedImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  generatedImageLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  arButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  arButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
