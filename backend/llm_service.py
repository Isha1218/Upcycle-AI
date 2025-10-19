import os
import json
import base64
from typing import Dict, List, Optional
import google.generativeai as genai
from pydantic import BaseModel, Field
import requests


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
        
        # Use Hugging Face free API for image generation
        self.hf_api_url = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
        self.hf_bg_removal_url = "https://api-inference.huggingface.co/models/silentlildev/rembg"
        self.hf_token = os.getenv('HUGGINGFACE_TOKEN')  # Optional, but recommended for higher limits
    
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

    def generate_upcycled_image(self, original_image_path: str, upcycling_idea: 'UpcyclingIdea') -> str:
        """
        Generate an image showing the upcycled result using Hugging Face Stable Diffusion (FREE!)
        """
        try:
            print(f"🎨 Generating upcycled image with Hugging Face Stable Diffusion (FREE)...")
            return self._generate_with_huggingface(upcycling_idea)
                
        except Exception as e:
            print(f"❌ Error generating upcycled image: {e}")
            return self._generate_fallback_image(upcycling_idea)
    
    def _generate_with_huggingface(self, upcycling_idea: 'UpcyclingIdea') -> str:
        """Generate image using Hugging Face Stable Diffusion (FREE)"""
        try:
            # Create a detailed prompt for Stable Diffusion
            sd_prompt = f"""
            A photorealistic image of a completed upcycling project: {upcycling_idea.title}. 
            {upcycling_idea.description}. 
            The finished item should be well-lit, high quality detailed photorealistic style, realistic materials and textures, 
            professional product photography style
            """
            
            # Prepare headers
            headers = {}
            if self.hf_token:
                headers["Authorization"] = f"Bearer {self.hf_token}"
            
            # Prepare payload
            payload = {
                "inputs": sd_prompt,
                "parameters": {
                    "num_inference_steps": 20,
                    "guidance_scale": 7.5,
                    "width": 512,
                    "height": 512
                }
            }
            
            # Make request to Hugging Face API
            response = requests.post(
                self.hf_api_url,
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                # Get the image data
                image_data = response.content
                print("✅ Successfully generated upcycled image with Hugging Face!")
                
                # Process image to remove background (make it more transparent)
                processed_image_data = self._simple_background_removal(image_data)
                return base64.b64encode(processed_image_data).decode('utf-8')
            else:
                print(f"❌ Hugging Face API error: {response.status_code} - {response.text}")
                return self._generate_fallback_image(upcycling_idea)
            
        except Exception as e:
            print(f"❌ Hugging Face generation failed: {e}")
            return self._generate_fallback_image(upcycling_idea)
    
    def _process_image_background(self, image_data: bytes) -> bytes:
        """Process image to make background more transparent using advanced techniques"""
        try:
            from PIL import Image, ImageFilter, ImageEnhance
            import io
            import numpy as np
            from scipy import ndimage
            
            # Open the image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGBA if not already
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
            
            # Convert to numpy array
            img_array = np.array(image)
            height, width = img_array.shape[:2]
            
            # Method 1: Edge-based background removal
            # Convert to grayscale for edge detection
            gray = np.dot(img_array[...,:3], [0.299, 0.587, 0.114])
            
            # Apply Gaussian blur to reduce noise
            blurred = ndimage.gaussian_filter(gray, sigma=1)
            
            # Edge detection using Sobel operator
            sobel_x = ndimage.sobel(blurred, axis=1)
            sobel_y = ndimage.sobel(blurred, axis=0)
            edges = np.sqrt(sobel_x**2 + sobel_y**2)
            
            # Create a mask from edges
            edge_mask = edges > np.percentile(edges, 85)  # Top 15% of edge strength
            
            # Dilate the edge mask to create a thicker boundary
            edge_mask = ndimage.binary_dilation(edge_mask, iterations=3)
            
            # Method 2: Color-based background removal (improved)
            # Look for very light/white pixels but be more conservative
            white_mask = (img_array[:, :, 0] > 245) & (img_array[:, :, 1] > 245) & (img_array[:, :, 2] > 245)
            
            # Look for light gray pixels in corners and edges (likely background)
            corner_size = min(width, height) // 8
            corner_mask = np.zeros((height, width), dtype=bool)
            
            # Check corners for light colors
            corners = [
                (0, 0, corner_size, corner_size),  # Top-left
                (width-corner_size, 0, width, corner_size),  # Top-right
                (0, height-corner_size, corner_size, height),  # Bottom-left
                (width-corner_size, height-corner_size, width, height)  # Bottom-right
            ]
            
            for x1, y1, x2, y2 in corners:
                corner_region = img_array[y1:y2, x1:x2]
                if corner_region.size > 0:
                    corner_avg = np.mean(corner_region[:, :, :3], axis=(0, 1))
                    if np.all(corner_avg > 200):  # Light corner
                        corner_mask[y1:y2, x1:x2] = True
            
            # Method 3: Flood fill from corners
            # Start flood fill from corners to find background
            flood_mask = np.zeros((height, width), dtype=bool)
            
            # Try flood fill from each corner
            for x, y in [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]:
                if not flood_mask[y, x]:
                    # Get the color at this corner
                    corner_color = img_array[y, x, :3]
                    
                    # If it's light, flood fill
                    if np.all(corner_color > 200):
                        # Simple flood fill implementation
                        stack = [(x, y)]
                        visited = set()
                        
                        while stack:
                            cx, cy = stack.pop()
                            if (cx, cy) in visited or cx < 0 or cx >= width or cy < 0 or cy >= height:
                                continue
                            
                            visited.add((cx, cy))
                            pixel_color = img_array[cy, cx, :3]
                            
                            # If color is similar to corner color (within threshold)
                            if np.all(np.abs(pixel_color - corner_color) < 30):
                                flood_mask[cy, cx] = True
                                # Add neighbors
                                stack.extend([(cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)])
            
            # Combine all methods
            # Start with edge-based mask (preserve object boundaries)
            final_mask = edge_mask.copy()
            
            # Add flood fill areas that are likely background
            final_mask = final_mask | flood_mask
            
            # Add corner areas that are light
            final_mask = final_mask | corner_mask
            
            # Add very white pixels
            final_mask = final_mask | white_mask
            
            # Smooth the mask to avoid jagged edges
            final_mask = ndimage.binary_fill_holes(final_mask)
            final_mask = ndimage.binary_erosion(final_mask, iterations=1)
            final_mask = ndimage.binary_dilation(final_mask, iterations=1)
            
            # Create alpha channel
            alpha = np.ones((height, width), dtype=np.uint8) * 255
            alpha[final_mask] = 0  # Make background transparent
            
            # Apply alpha channel
            img_array[:, :, 3] = alpha
            
            # Convert back to PIL Image
            processed_image = Image.fromarray(img_array, 'RGBA')
            
            # Save to bytes
            img_buffer = io.BytesIO()
            processed_image.save(img_buffer, format='PNG')
            return img_buffer.getvalue()
            
        except Exception as e:
            print(f"❌ Advanced background processing failed: {e}")
            # Try AI-based background removal first
            try:
                return self._ai_background_removal(image_data)
            except:
                # Try API-based background removal
                try:
                    return self._api_background_removal(image_data)
                except:
                    # Final fallback to simple method
                    return self._simple_background_removal(image_data)
    
    def _simple_background_removal(self, image_data: bytes) -> bytes:
        """Simple fallback background removal"""
        try:
            from PIL import Image
            import io
            import numpy as np
            
            image = Image.open(io.BytesIO(image_data))
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
            
            img_array = np.array(image)
            
            # Simple white background removal
            white_mask = (img_array[:, :, 0] > 240) & (img_array[:, :, 1] > 240) & (img_array[:, :, 2] > 240)
            img_array[white_mask, 3] = 0
            
            processed_image = Image.fromarray(img_array, 'RGBA')
            img_buffer = io.BytesIO()
            processed_image.save(img_buffer, format='PNG')
            return img_buffer.getvalue()
            
        except Exception as e:
            print(f"❌ Simple background removal failed: {e}")
            return image_data
    
    def _api_background_removal(self, image_data: bytes) -> bytes:
        """Use remove.bg API for professional background removal"""
        try:
            import requests
            import base64
            
            # Use remove.bg API (free tier available)
            api_key = os.getenv('REMOVE_BG_API_KEY')  # Optional, can work without
            url = "https://api.remove.bg/v1.0/removebg"
            
            headers = {
                'X-Api-Key': api_key if api_key else 'free',  # Free tier
            }
            
            files = {
                'image_file': ('image.png', image_data, 'image/png'),
                'size': (None, 'auto'),
                'format': (None, 'png'),
            }
            
            response = requests.post(url, headers=headers, files=files, timeout=30)
            
            if response.status_code == 200:
                print("✅ Professional background removal successful!")
                return response.content
            else:
                print(f"❌ Remove.bg API error: {response.status_code}")
                raise Exception("API background removal failed")
                
        except Exception as e:
            print(f"❌ API background removal failed: {e}")
            raise
    
    def _ai_background_removal(self, image_data: bytes) -> bytes:
        """Use AI model for background removal"""
        try:
            import requests
            
            # Prepare headers
            headers = {}
            if self.hf_token:
                headers["Authorization"] = f"Bearer {self.hf_token}"
            
            # Make request to background removal model
            response = requests.post(
                self.hf_bg_removal_url,
                headers=headers,
                data=image_data,
                timeout=60
            )
            
            if response.status_code == 200:
                print("✅ AI background removal successful!")
                return response.content
            else:
                print(f"❌ AI background removal error: {response.status_code}")
                raise Exception("AI background removal failed")
                
        except Exception as e:
            print(f"❌ AI background removal failed: {e}")
            raise
    
    def _generate_fallback_image(self, upcycling_idea: 'UpcyclingIdea') -> str:
        """Generate a fallback image when other methods fail"""
        try:
            print("🔄 Generating fallback image...")
            
            # Create a simple colored placeholder image
            from PIL import Image, ImageDraw, ImageFont
            
            # Create a 400x400 image with a nice background
            img = Image.new('RGB', (400, 400), color='#f0f0f0')
            draw = ImageDraw.Draw(img)
            
            # Add a border
            draw.rectangle([10, 10, 390, 390], outline='#007AFF', width=3)
            
            # Add text
            try:
                # Try to use a default font
                font = ImageFont.load_default()
            except:
                font = None
            
            # Add project title
            title = upcycling_idea.title[:30] + "..." if len(upcycling_idea.title) > 30 else upcycling_idea.title
            draw.text((50, 150), title, fill='#333', font=font)
            
            # Add description
            desc = "Upcycled Project"
            draw.text((50, 200), desc, fill='#666', font=font)
            
            # Add a simple icon representation
            draw.rectangle([150, 250, 250, 350], fill='#007AFF', outline='#0056b3')
            draw.text((180, 290), "♻️", fill='white', font=font)
            
            # Convert to base64
            import io
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            img_data = img_buffer.getvalue()
            
            print("✅ Generated fallback image")
            return base64.b64encode(img_data).decode('utf-8')
            
        except Exception as e:
            print(f"❌ Fallback image generation failed: {e}")
            # Return a simple 1x1 pixel as last resort
            placeholder_image = base64.b64encode(
                b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
            ).decode('utf-8')
            return placeholder_image


# Example usage
if __name__ == "__main__":
    # Initialize the service
    service = UpcyclingLLMService()
    
    # Process an image (replace with actual image path)
    # result = service.process_image_for_upcycling("path/to/your/image.jpg")
    # print(json.dumps(result, indent=2))
    
    print("Upcycling LLM Service initialized successfully!")
    print("To use: service.process_image_for_upcycling('path/to/image.jpg')")