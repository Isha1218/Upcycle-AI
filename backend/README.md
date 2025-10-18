# Upcycling AI Backend

An AI-powered service that analyzes images of objects and generates creative upcycling project ideas using Google's Gemini API.

## Features

- **Image Analysis**: Uses Gemini Vision to identify reusable parts, materials, dimensions, and condition
- **Upcycling Ideas**: Generates creative project suggestions with difficulty levels, tools needed, and step-by-step instructions
- **Structured Output**: Returns data in JSON format for easy integration
- **REST API**: FastAPI-based endpoints for image upload and analysis

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Set it as an environment variable:

```bash
export GEMINI_API_KEY="your_api_key_here"
```

### 3. Run the Service

#### Option A: Run the API Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`

#### Option B: Test the Service Directly

```bash
python test_service.py
```

## API Endpoints

### POST `/analyze-image`

Upload an image for upcycling analysis.

**Request**: Multipart form data with image file
**Response**: JSON with analysis and upcycling ideas

Example response:

```json
{
  "analysis": {
    "main_object": "wooden chair",
    "parts": [
      {
        "name": "chair legs",
        "material": "wood",
        "dimensions": { "length": 45.0, "width": 4.0, "height": 4.0 },
        "condition": "good",
        "quantity": 4,
        "notes": "solid oak legs"
      }
    ],
    "overall_condition": "good",
    "difficulty_level": "easy"
  },
  "upcycling_ideas": {
    "ideas": [
      {
        "title": "Plant Stand",
        "description": "Convert chair legs into a decorative plant stand",
        "difficulty": "beginner",
        "time_estimate": "2-3 hours",
        "required_tools": ["drill", "saw", "sandpaper"],
        "additional_materials": ["wooden top", "wood glue"],
        "steps": ["Cut legs to desired height", "Sand smooth", "Attach top"],
        "parts_used": ["chair legs"]
      }
    ]
  },
  "status": "success"
}
```

### GET `/health`

Check service health and configuration status.

## Usage Examples

### Python Client

```python
import requests

# Upload and analyze an image
with open('chair.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/analyze-image',
        files={'file': f}
    )

result = response.json()
print(result['analysis']['main_object'])
```

### cURL

```bash
curl -X POST "http://localhost:8000/analyze-image" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@chair.jpg"
```

## Data Models

### ImagePart

- `name`: Description of the part
- `material`: Material type (wood, metal, plastic, etc.)
- `dimensions`: Length, width, height in cm
- `condition`: good/fair/poor
- `quantity`: Number available
- `notes`: Additional information

### UpcyclingIdea

- `title`: Project name
- `description`: Detailed description
- `difficulty`: beginner/intermediate/advanced
- `time_estimate`: Estimated completion time
- `required_tools`: List of needed tools
- `additional_materials`: Extra materials needed
- `steps`: Step-by-step instructions
- `parts_used`: Which parts are utilized

## Development

### Testing

```bash
# Test the service directly
python test_service.py

# Test the API
python -m pytest  # (if you add pytest)
```

### Adding New Features

1. Extend the Pydantic models in `llm_service.py`
2. Update the prompts for better analysis
3. Add new API endpoints in `main.py`

## Troubleshooting

- **API Key Error**: Make sure `GEMINI_API_KEY` is set correctly
- **Image Upload Issues**: Check file format (JPEG, PNG supported)
- **Analysis Errors**: Try with clearer, well-lit images
- **Rate Limits**: Gemini API has usage limits; check your quota

## License

MIT License
