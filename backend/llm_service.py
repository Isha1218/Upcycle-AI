import os
import json
import base64
from typing import Dict, List, Optional
import google.generativeai as genai
from pydantic import BaseModel, Field


class ImagePart(BaseModel):
    """Represents a reusable part from an image"""
    name: str = Field(description="Name/description of the part")
    material: str = Field(description="Material type (wood, metal, plastic, fabric, etc.)")
    dimensions: Dict[str, float] = Field(description="Dimensions in cm (length, width, height)")
    condition: str = Field(description="Condition assessment (good, fair, poor)")
    quantity: int = Field(description="Number of this part available")
    notes: Optional[str] = Field(description="Additional notes about the part")


class ImageAnalysis(BaseModel):
    """Complete analysis of an image for upcycling"""
    main_object: str = Field(description="Primary object in the image")
    parts: List[ImagePart] = Field(description="List of reusable parts found")
    overall_condition: str = Field(description="Overall condition of the object")
    difficulty_level: str = Field(description="Estimated difficulty to disassemble (easy, medium, hard)")


class UpcyclingIdea(BaseModel):
    """An upcycling project idea"""
    title: str = Field(description="Name of the upcycling project")
    description: str = Field(description="Detailed description of the project")
    difficulty: str = Field(description="Difficulty level (beginner, intermediate, advanced)")
    time_estimate: str = Field(description="Estimated time to complete")
    required_tools: List[str] = Field(description="Tools needed for the project")
    additional_materials: List[str] = Field(description="Additional materials needed")
    steps: List[str] = Field(description="Step-by-step instructions")
    parts_used: List[str] = Field(description="Which parts from the analysis are used")


class UpcyclingSuggestions(BaseModel):
    """Collection of upcycling ideas"""
    ideas: List[UpcyclingIdea] = Field(description="List of upcycling project ideas")


class UpcyclingLLMService:
    """Service for analyzing images and generating upcycling ideas using LLMs"""
    
    def __init__(self, gemini_api_key: Optional[str] = None):
        """Initialize the service with API keys"""
        self.gemini_api_key = gemini_api_key or os.getenv('GEMINI_API_KEY')
        if not self.gemini_api_key:
            raise ValueError("Gemini API key is required. Set GEMINI_API_KEY environment variable.")
        
        # Configure Gemini
        genai.configure(api_key=self.gemini_api_key)
        self.image_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        self.text_model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    def analyze_image(self, image_path: str) -> ImageAnalysis:
        """
        Analyze an image to extract reusable parts and their properties
        
        Args:
            image_path: Path to the image file
            
        Returns:
            ImageAnalysis object with extracted parts and metadata
        """
        try:
            # Read the image file
            import PIL.Image
            image = PIL.Image.open(image_path)
            
            # Create the prompt for image analysis
            analysis_prompt = """
            Analyze this image for upcycling potential. Look for objects that can be disassembled or repurposed.
            
            For each reusable part you identify, provide:
            - Name/description of the part
            - Material type (wood, metal, plastic, fabric, glass, etc.)
            - Approximate dimensions in centimeters (length, width, height)
            - Condition assessment (good, fair, poor)
            - Quantity available
            - Any additional notes
            
            Also assess:
            - What is the main object in the image?
            - Overall condition of the object
            - How difficult would it be to disassemble? (easy, medium, hard)
            
            Return your analysis in this exact JSON format:
            {
                "main_object": "description of main object",
                "parts": [
                    {
                        "name": "part name",
                        "material": "material type",
                        "dimensions": {"length": 0.0, "width": 0.0, "height": 0.0},
                        "condition": "good/fair/poor",
                        "quantity": 1,
                        "notes": "additional notes"
                    }
                ],
                "overall_condition": "good/fair/poor",
                "difficulty_level": "easy/medium/hard"
            }
            
            Be thorough but realistic. Focus on parts that could actually be reused in creative projects.
            """
            
            # Generate analysis
            response = self.image_model.generate_content([
                analysis_prompt,
                image
            ])
            
            # Parse the JSON response
            analysis_text = response.text.strip()
            # Remove markdown code blocks if present
            if analysis_text.startswith('```json'):
                analysis_text = analysis_text[7:]
            if analysis_text.endswith('```'):
                analysis_text = analysis_text[:-3]
            
            analysis_data = json.loads(analysis_text)
            return ImageAnalysis(**analysis_data)
            
        except Exception as e:
            raise Exception(f"Error analyzing image: {str(e)}")
    
    def generate_upcycling_ideas(self, analysis: ImageAnalysis) -> UpcyclingSuggestions:
        """
        Generate upcycling ideas based on the image analysis
        
        Args:
            analysis: ImageAnalysis object from analyze_image()
            
        Returns:
            UpcyclingSuggestions object with creative project ideas
        """
        try:
            # Create the prompt for upcycling ideas
            ideas_prompt = f"""
            Based on this analysis of a {analysis.main_object}, generate creative upcycling project ideas.

            Analysis:
            - Main object: {analysis.main_object}
            - Overall condition: {analysis.overall_condition}
            - Disassembly difficulty: {analysis.difficulty_level}
            - Available parts: {len(analysis.parts)} parts

            Parts available:
            {json.dumps([part.dict() for part in analysis.parts], indent=2)}

            Generate 3-5 creative upcycling project ideas. Each idea should:
            - Use one or more of the available parts
            - Be practical and achievable
            - Include difficulty level, time estimate, and required tools
            - Provide step-by-step instructions
            - List any additional materials needed
            - Be **completely different** from the original object. 
            - Do NOT create another version, variant, or subtype of the original object.
            - For example:
                - If the main object is a "table," do NOT suggest anything that functions as a table, desk, or surface for placing items.
                - If the object is a "chair," do NOT suggest another form of seating.
                - If the object is a "lamp," do NOT suggest another light source.
            - Instead, repurpose the materials into something with a **different function, purpose, or context** (e.g., art, decor, organizers, planters, toys, furniture for pets, etc.).

            Consider different skill levels and project types (furniture, decor, storage, lighting, art, etc.).
            Be creative, functional, and realistic.

            Return your suggestions in this exact JSON format:
            {{
                "ideas": [
                    {{
                        "title": "Project Name",
                        "description": "Detailed description of what you'll create",
                        "difficulty": "beginner/intermediate/advanced",
                        "time_estimate": "e.g., 2-3 hours, 1 day, etc.",
                        "required_tools": ["tool1", "tool2"],
                        "additional_materials": ["material1", "material2"],
                        "steps": ["Step 1", "Step 2", "Step 3"],
                        "parts_used": ["part name 1", "part name 2"]
                    }}
                ]
            }}
            """

            # Generate ideas
            response = self.text_model.generate_content(ideas_prompt)
            
            # Parse the JSON response
            ideas_text = response.text.strip()
            # Remove markdown code blocks if present
            if ideas_text.startswith('```json'):
                ideas_text = ideas_text[7:]
            if ideas_text.endswith('```'):
                ideas_text = ideas_text[:-3]
            
            ideas_data = json.loads(ideas_text)
            return UpcyclingSuggestions(**ideas_data)
            
        except Exception as e:
            raise Exception(f"Error generating upcycling ideas: {str(e)}")
    
    def process_image_for_upcycling(self, image_path: str) -> Dict:
        """
        Complete pipeline: analyze image and generate upcycling ideas
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary containing both analysis and upcycling ideas
        """
        try:
            # Step 1: Analyze the image
            analysis = self.analyze_image(image_path)
            
            # Step 2: Generate upcycling ideas
            suggestions = self.generate_upcycling_ideas(analysis)
            
            return {
                "analysis": analysis.dict(),
                "upcycling_ideas": suggestions.dict(),
                "status": "success"
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "status": "error"
            }


# Example usage
if __name__ == "__main__":
    # Initialize the service
    service = UpcyclingLLMService()
    
    # Process an image (replace with actual image path)
    # result = service.process_image_for_upcycling("path/to/your/image.jpg")
    # print(json.dumps(result, indent=2))
    
    print("Upcycling LLM Service initialized successfully!")
    print("To use: service.process_image_for_upcycling('path/to/image.jpg')")