from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
from llm_service import UpcyclingLLMService
import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Upcycling AI API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the LLM service
try:
    llm_service = UpcyclingLLMService()
except ValueError as e:
    print(f"Warning: {e}")
    print("Please set your GEMINI_API_KEY environment variable")
    llm_service = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Upcycling AI API is running!", "status": "healthy"}


@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze an uploaded image for upcycling potential
    
    Args:
        file: Image file (JPEG, PNG, etc.)
        
    Returns:
        JSON with image analysis and upcycling ideas
    """
    print(f"🔄 Received image upload request: {file.filename}")
    print(f"📁 File type: {file.content_type}")
    print(f"📏 File size: {file.size if hasattr(file, 'size') else 'Unknown'}")
    
    if not llm_service:
        print("❌ LLM service not initialized")
        raise HTTPException(
            status_code=500, 
            detail="LLM service not initialized. Please set GEMINI_API_KEY environment variable."
        )
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        print(f"❌ Invalid file type: {file.content_type}")
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        print("💾 Saving uploaded file temporarily...")
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        print(f"✅ File saved to: {temp_file_path}")
        print(f"📊 File size: {len(content)} bytes")
        
        print("🤖 Starting AI analysis...")
        # Process the image
        result = llm_service.process_image_for_upcycling(temp_file_path)
        
        print("🧹 Cleaning up temporary file...")
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        if result["status"] == "error":
            print(f"❌ Analysis failed: {result['error']}")
            raise HTTPException(status_code=500, detail=result["error"])
        
        print("✅ Analysis completed successfully!")
        print(f"📋 Found {len(result['analysis']['parts'])} reusable parts")
        print(f"💡 Generated {len(result['upcycling_ideas']['ideas'])} upcycling ideas")
        
        return result
        
    except Exception as e:
        print(f"❌ Error during processing: {str(e)}")
        # Clean up temporary file if it exists
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
                print("🧹 Cleaned up temporary file after error")
            except:
                pass
        
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.get("/health")
async def health_check():
    """Detailed health check"""
    print("🏥 Health check requested")
    health_status = {
        "status": "healthy",
        "llm_service_ready": llm_service is not None,
        "gemini_api_configured": os.getenv('GEMINI_API_KEY') is not None
    }
    print(f"✅ Health status: {health_status}")
    return health_status


if __name__ == "__main__":
    print("🚀 Starting Upcycling AI Backend Server...")
    print("🌐 Server will be available at: http://0.0.0.0:8000")
    print("📱 Frontend should connect to: http://10.21.68.3:8000")
    print("🔑 Gemini API Key configured:", "✅ Yes" if os.getenv('GEMINI_API_KEY') else "❌ No")
    print("🤖 LLM Service ready:", "✅ Yes" if llm_service else "❌ No")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
