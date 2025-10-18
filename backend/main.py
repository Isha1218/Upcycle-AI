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
    if not llm_service:
        raise HTTPException(
            status_code=500, 
            detail="LLM service not initialized. Please set GEMINI_API_KEY environment variable."
        )
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Process the image
        result = llm_service.process_image_for_upcycling(temp_file_path)
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
        
    except Exception as e:
        # Clean up temporary file if it exists
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "llm_service_ready": llm_service is not None,
        "gemini_api_configured": os.getenv('GEMINI_API_KEY') is not None
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
