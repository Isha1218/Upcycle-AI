import axios from 'axios';

const API_BASE_URL = 'http://10.21.68.3:8000';

export interface ImagePart {
  name: string;
  material: string;
  dimensions: { [key: string]: number };
  quantity: number;
  condition: string;
  notes?: string;
}

export interface ImageAnalysis {
  main_object: string;
  overall_condition: string;
  difficulty_level: string;
  parts: ImagePart[];
}

export interface UpcyclingIdea {
  title: string;
  description: string;
  difficulty: string;
  time_estimate: string;
  required_tools: string[];
  additional_materials: string[];
  steps: string[];
  parts_used: string[];
}

export interface UpcyclingSuggestions {
  ideas: UpcyclingIdea[];
}

export interface UpcyclingResult {
  analysis: ImageAnalysis;
  upcycling_ideas: UpcyclingSuggestions;
  status: string;
}

class UpcyclingAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async analyzeImage(imageUri: string): Promise<UpcyclingResult> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add the image file to FormData
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);

      const response = await axios.post(
        `${this.baseURL}/analyze-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`Server error: ${error.response.status} - ${error.response.data?.detail || 'Unknown error'}`);
        } else if (error.request) {
          throw new Error('Network error: Could not connect to server. Make sure the backend is running.');
        }
      }
      throw new Error('Failed to analyze image');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default new UpcyclingAPI();
