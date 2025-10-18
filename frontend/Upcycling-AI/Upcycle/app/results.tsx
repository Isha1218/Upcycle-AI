import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { UpcyclingResult } from '../services/api';

export default function ResultsScreen() {
  const { result: resultString, imageUri } = useLocalSearchParams<{
    result: string;
    imageUri: string;
  }>();

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
          </View>
        ))}
      </View>
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
});
