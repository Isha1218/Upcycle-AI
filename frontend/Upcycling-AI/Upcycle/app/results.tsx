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
  const [expandedIdeas, setExpandedIdeas] = useState<{ [key: number]: boolean }>({});

  if (!resultString || !imageUri) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No data available</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
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

  const handleShowInAR = async (idea: UpcyclingIdea, ideaIndex: number) => {
    // If already generated, open AR directly
    const existing = generatedImages[ideaIndex];
    if (existing) {
      openARView(existing);
      return;
    }

    // Otherwise, generate then open AR
    setGeneratingImages(prev => ({ ...prev, [ideaIndex]: true }));
    try {
      const imageResult = await upcyclingAPI.generateUpcycledImage(imageUri, idea);
      if (imageResult.status === 'success' && imageResult.upcycled_image) {
        const composedUri = `data:image/jpeg;base64,${imageResult.upcycled_image}`;
        setGeneratedImages(prev => ({ ...prev, [ideaIndex]: composedUri }));
        openARView(composedUri);
      } else {
        throw new Error('Failed to generate image');
      }
    } catch (error) {
      console.error(`❌ Error preparing AR for ${idea.title}:`, error);
      Alert.alert(
        'Show in AR Failed',
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

      {/* Analysis Section (simplified) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Object Analysis</Text>
        <View style={styles.analysisCard}>
          <Text style={styles.objectName}>{analysis.main_object}</Text>
          <View style={styles.chipRow}>
            <View style={[styles.chip, styles.chipPrimary]}>
              <Text style={styles.chipText}>Condition: {analysis.overall_condition}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Parts: {analysis.parts.length}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Parts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reusable Parts</Text>
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
                {part.notes}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Upcycling Ideas Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcycling Ideas</Text>
        {upcycling_ideas.ideas.map((idea, index) => (
          <View key={index} style={styles.ideaCard}>
            <Text style={styles.ideaTitle}>{idea.title}</Text>
            <Text style={styles.ideaDescription}>{idea.description}</Text>
            
            <View style={styles.chipRow}>
              <View style={[styles.chip, styles.chipPrimary]}>
                <Text style={styles.chipText}>Difficulty: {idea.difficulty}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>Time: {idea.time_estimate}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.collapseHeader}
              onPress={() => setExpandedIdeas(prev => ({ ...prev, [index]: !prev[index] }))}
            >
              <Text style={styles.collapseHeaderText}>
                {expandedIdeas[index] ? 'Hide details ▲' : 'Show details ▼'}
              </Text>
            </TouchableOpacity>

            {expandedIdeas[index] && (
              <View>
                <View style={styles.ideaSection}>
                <Text style={styles.ideaSectionTitle}>Tools Needed</Text>
                  <Text style={styles.ideaSectionContent}>
                    {idea.required_tools.join(', ')}
                  </Text>
                </View>

                <View style={styles.ideaSection}>
                <Text style={styles.ideaSectionTitle}>Materials</Text>
                  <Text style={styles.ideaSectionContent}>
                    {idea.additional_materials.join(', ')}
                  </Text>
                </View>

                <View style={styles.ideaSection}>
                <Text style={styles.ideaSectionTitle}>Parts Used</Text>
                  <Text style={styles.ideaSectionContent}>
                    {idea.parts_used.join(', ')}
                  </Text>
                </View>

                <View style={styles.ideaSection}>
                <Text style={styles.ideaSectionTitle}>Steps</Text>
                  {idea.steps.map((step, stepIndex) => (
                    <Text key={stepIndex} style={styles.stepText}>
                      {stepIndex + 1}. {step}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Image Generation Section */}
            <View style={styles.ideaSection}>
              <Text style={styles.ideaSectionTitle}>Preview</Text>
              {generatedImages[index] && (
                <View style={styles.generatedImageContainer}>
                  <Image 
                    source={{ uri: generatedImages[index] }} 
                    style={styles.generatedImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.generatedImageLabel}>
                    Generated upcycled result for "{idea.title}"
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  generatingImages[index] && styles.ctaButtonDisabled
                ]}
                onPress={() => handleShowInAR(idea, index)}
                disabled={generatingImages[index]}
              >
                {generatingImages[index] ? (
                  <View style={styles.generateButtonContent}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.ctaButtonText}>Preparing AR...</Text>
                  </View>
                ) : (
                  <Text style={styles.ctaButtonText}>Show in AR</Text>
                )}
              </TouchableOpacity>
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
    paddingTop: 56,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#166534',
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'transparent',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#166534',
  },
  chipPrimary: {
    backgroundColor: 'transparent',
  },
  chipText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
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
    color: '#166534',
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
  collapseHeader: {
    paddingVertical: 8,
  },
  collapseHeaderText: {
    color: '#166534',
    fontWeight: '600',
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
    backgroundColor: '#166534',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  ctaButton: {
    backgroundColor: '#166534',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  ctaButtonDisabled: {
    backgroundColor: '#166534',
    opacity: 0.6,
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
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
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
