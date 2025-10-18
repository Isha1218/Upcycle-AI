#!/usr/bin/env python3
"""
Test script for the Upcycling LLM Service
Run this to test the service with a sample image
"""

import os
import json
from llm_service import UpcyclingLLMService

def test_service():
    """Test the upcycling service with a sample image"""
    
    # Check if API key is set
    if not os.getenv('GEMINI_API_KEY'):
        print("❌ GEMINI_API_KEY environment variable not set!")
        print("Please set it with: export GEMINI_API_KEY='your_api_key_here'")
        return
    
    try:
        # Initialize the service
        print("🚀 Initializing Upcycling LLM Service...")
        service = UpcyclingLLMService()
        print("✅ Service initialized successfully!")
        
        # Test with a sample image (you'll need to provide one)
        sample_image_path = input("Enter path to a test image (or press Enter to skip): ").strip()
        
        if sample_image_path and os.path.exists(sample_image_path):
            print(f"📸 Analyzing image: {sample_image_path}")
            result = service.process_image_for_upcycling(sample_image_path)
            
            if result["status"] == "success":
                print("✅ Analysis completed successfully!")
                print("\n" + "="*50)
                print("IMAGE ANALYSIS:")
                print("="*50)
                
                analysis = result["analysis"]
                print(f"Main Object: {analysis['main_object']}")
                print(f"Overall Condition: {analysis['overall_condition']}")
                print(f"Disassembly Difficulty: {analysis['difficulty_level']}")
                print(f"Parts Found: {len(analysis['parts'])}")
                
                print("\nPARTS:")
                for i, part in enumerate(analysis['parts'], 1):
                    print(f"{i}. {part['name']} ({part['material']})")
                    print(f"   Dimensions: {part['dimensions']}")
                    print(f"   Condition: {part['condition']}")
                    print(f"   Quantity: {part['quantity']}")
                    if part.get('notes'):
                        print(f"   Notes: {part['notes']}")
                    print()
                
                print("="*50)
                print("UPCYCLING IDEAS:")
                print("="*50)
                
                ideas = result["upcycling_ideas"]["ideas"]
                for i, idea in enumerate(ideas, 1):
                    print(f"{i}. {idea['title']}")
                    print(f"   Difficulty: {idea['difficulty']}")
                    print(f"   Time: {idea['time_estimate']}")
                    print(f"   Description: {idea['description']}")
                    print(f"   Tools needed: {', '.join(idea['required_tools'])}")
                    print(f"   Parts used: {', '.join(idea['parts_used'])}")
                    print()
                
                # Save results to file
                with open("test_results.json", "w") as f:
                    json.dump(result, f, indent=2)
                print("💾 Results saved to test_results.json")
                
            else:
                print(f"❌ Error: {result['error']}")
        else:
            print("⏭️  Skipping image test")
            print("To test with an image, run this script again and provide a valid image path")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_service()
