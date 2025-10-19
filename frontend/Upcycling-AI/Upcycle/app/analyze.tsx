import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { UpcyclingResult, UpcyclingIdea } from '../services/api';
import upcyclingAPI from '../services/api';

const { width, height } = Dimensions.get('window');

export default function AnalyzeScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [result, setResult] = useState<UpcyclingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState<{ [key: number]: boolean }>({});
  const [generatedImages, setGeneratedImages] = useState<{ [key: number]: string }>({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
    if (imageUri) {
      analyzeImage();
    }
  }, [imageUri]);

  const analyzeImage = async () => {
    if (!imageUri) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting image analysis...');
      const analysisResult = await upcyclingAPI.analyzeImage(imageUri);
      setResult(analysisResult);
      console.log('✅ Analysis completed successfully');
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const generateUpcycledImage = async (idea: UpcyclingIdea, ideaIndex: number) => {
    setGeneratingImages(prev => ({ ...prev, [ideaIndex]: true }));
    
    try {
      console.log(`🎨 Generating upcycled image for: ${idea.title}`);
      const imageResult = await upcyclingAPI.generateUpcycledImage(imageUri!, idea);
      
      if (imageResult.status === 'success' && imageResult.upcycled_image) {
        setGeneratedImages(prev => ({ 
          ...prev, 
          [ideaIndex]: `data:image/png;base64,${imageResult.upcycled_image}` 
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
    router.push({
      pathname: '/ar-view',
      params: { upcycledImageUri: imageUri }
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FF9800';
      case 'advanced':
        return '#F44336';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing your item...</Text>
        <Text style={styles.loadingSubtext}>Finding upcycling possibilities</Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ {error || 'Analysis failed'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={analyzeImage}>
          <Text style={styles.retryButtonText}>🔄 Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { analysis, upcycling_ideas } = result;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upcycling Ideas</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Original Image */}
      <View style={styles.originalImageContainer}>
        <Image source={{ uri: imageUri }} style={styles.originalImage} />
        <View style={styles.imageOverlay}>
          <Text style={styles.objectName}>{analysis.main_object}</Text>
          <Text style={styles.objectCondition}>Condition: {analysis.overall_condition}</Text>
        </View>
      </View>

      {/* Ideas Carousel */}
      <View style={styles.carouselContainer}>
        <Text style={styles.carouselTitle}>Your Upcycling Ideas</Text>
        
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentCardIndex(index);
          }}
        >
          {upcycling_ideas.ideas.map((idea, index) => (
            <View key={index} style={styles.ideaCard}>
              <ScrollView 
                style={styles.cardContent} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.cardContentContainer}
              >
                {/* Idea Header */}
                <View style={styles.ideaHeader}>
                  <Text style={styles.ideaTitle}>{idea.title}</Text>
                  <View style={styles.ideaMeta}>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(idea.difficulty) }]}>
                      <Text style={styles.difficultyText}>{idea.difficulty}</Text>
                    </View>
                    <Text style={styles.timeEstimate}>⏱️ {idea.time_estimate}</Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.ideaDescription}>{idea.description}</Text>

                {/* Tools & Materials */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tools Needed</Text>
                  <Text style={styles.sectionContent}>{idea.required_tools.join(', ')}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Materials</Text>
                  <Text style={styles.sectionContent}>{idea.additional_materials.join(', ')}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Parts Used</Text>
                  <Text style={styles.sectionContent}>{idea.parts_used.join(', ')}</Text>
                </View>

                {/* Steps */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Instructions</Text>
                  {idea.steps.map((step, stepIndex) => (
                    <Text key={stepIndex} style={styles.stepText}>
                      {stepIndex + 1}. {step}
                    </Text>
                  ))}
                </View>

                {/* Generated Image Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Preview Result</Text>
                  
                  {generatedImages[index] ? (
                    <View style={styles.generatedImageContainer}>
                      <Image 
                        source={{ uri: generatedImages[index] }} 
                        style={styles.generatedImage}
                        resizeMode="contain"
                      />
                      <TouchableOpacity
                        style={styles.arButton}
                        onPress={() => openARView(generatedImages[index])}
                      >
                        <Text style={styles.arButtonText}>View in AR</Text>
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
                        <Text style={styles.generateButtonText}>Generate Image</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          ))}
        </ScrollView>

        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          {upcycling_ideas.ideas.map((_, index) => (
            <View
              key={index}
              style={[
                styles.pageIndicator,
                index === currentCardIndex && styles.pageIndicatorActive
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  placeholder: {
    width: 40,
  },
  originalImageContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  originalImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  imageOverlay: {
    alignItems: 'center',
  },
  objectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  objectCondition: {
    fontSize: 14,
    color: '#6c757d',
  },
  carouselContainer: {
    flex: 1,
  },
  carouselTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  carousel: {
    flex: 1,
  },
  carouselContent: {
    paddingHorizontal: 20,
  },
  ideaCard: {
    width: width - 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginRight: 20,
  },
  cardContent: {
    flex: 1,
  },
  cardContentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  ideaHeader: {
    marginBottom: 16,
  },
  ideaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  ideaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeEstimate: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  ideaDescription: {
    fontSize: 17,
    color: '#4a4a4a',
    lineHeight: 26,
    marginBottom: 24,
    fontWeight: '400',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  sectionContent: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    fontWeight: '400',
  },
  stepText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    lineHeight: 22,
    fontWeight: '400',
  },
  generatedImageContainer: {
    alignItems: 'center',
  },
  generatedImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  arButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  arButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dee2e6',
  },
  pageIndicatorActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
});
