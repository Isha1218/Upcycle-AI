#!/usr/bin/env python3
"""
Test script to help you test your upcycling API with curl
This script will help you create the proper curl command for testing
"""

import os
import sys

def create_curl_command(image_path, api_url="http://localhost:8000"):
    """Create a curl command to test the API with an image"""
    
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return None
    
    curl_command = f'''curl -X POST "{api_url}/analyze-image" \\
     -H "accept: application/json" \\
     -H "Content-Type: multipart/form-data" \\
     -F "file=@{image_path}"'''
    
    return curl_command

def main():
    print("🧪 Upcycling AI Backend Test Helper")
    print("=" * 50)
    
    # Check if images directory exists
    images_dir = "images"
    if not os.path.exists(images_dir):
        print(f"❌ Images directory not found: {images_dir}")
        print("Please create an 'images' folder and add a test image.")
        return
    
    # List available images
    image_files = []
    for file in os.listdir(images_dir):
        if file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp')):
            image_files.append(file)
    
    if not image_files:
        print(f"❌ No image files found in {images_dir}/")
        print("Please add an image file (jpg, png, etc.) to the images folder.")
        return
    
    print(f"📁 Found {len(image_files)} image(s) in {images_dir}/:")
    for i, img in enumerate(image_files, 1):
        print(f"  {i}. {img}")
    
    print("\n🔧 To test your API:")
    print("1. Start your backend server:")
    print("   cd backend")
    print("   source ../.venv/bin/activate")
    print("   export GEMINI_API_KEY='your_api_key_here'")
    print("   python main.py")
    
    print("\n2. In another terminal, run one of these curl commands:")
    print("   (Replace 'your_api_key_here' with your actual Gemini API key)")
    
    for img in image_files:
        image_path = os.path.join(images_dir, img)
        curl_cmd = create_curl_command(image_path)
        print(f"\n📸 Test with {img}:")
        print(curl_cmd)
    
    print("\n3. Expected response format:")
    print("""
{
  "analysis": {
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
  },
  "upcycling_ideas": {
    "ideas": [
      {
        "title": "Project Name",
        "description": "Detailed description",
        "difficulty": "beginner/intermediate/advanced",
        "time_estimate": "2-3 hours",
        "required_tools": ["tool1", "tool2"],
        "additional_materials": ["material1", "material2"],
        "steps": ["Step 1", "Step 2"],
        "parts_used": ["part name 1"]
      }
    ]
  },
  "status": "success"
}
    """)

if __name__ == "__main__":
    main()
