# Python OCR Backend - Setup Guide

Advanced PDF OCR processing service using FastAPI and EasyOCR.

## Features

- **Advanced OCR**: Portuguese and English language support
- **Pattern Detection**: CNPJ, CPF, dates, currency, percentages, phones, emails, URLs
- **Image Preprocessing**: Denoising, binarization, contrast enhancement
- **Multiple OCR Engines**: EasyOCR (high accuracy) and Tesseract (fallback)
- **RESTful API**: Easy integration with React frontend
- **Production Ready**: CORS support, error handling, logging

## Installation

### 1. System Dependencies

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y \
    python3.10 \
    python3.10-venv \
    python3-pip \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libopenblas-dev \
    liblapack-dev \
    tesseract-ocr \
    libtesseract-dev
```

#### macOS (with Homebrew)
```bash
brew install python@3.10 tesseract
```

### 2. Python Virtual Environment

```bash
cd /workspaces/audesp/backend

# Create virtual environment
python3.10 -m venv venv

# Activate it
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Python Dependencies

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

## Running the Backend

### Development Mode

```bash
cd /workspaces/audesp/backend
source venv/bin/activate

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/redoc

### Production Mode

```bash
# Using gunicorn for production
pip install gunicorn

gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

## API Endpoints

### 1. Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "Advanced PDF OCR Service",
  "easyocr_available": true
}
```

### 2. Extract Text from PDF
```bash
POST /api/ocr/extract
Content-Type: multipart/form-data

Parameters:
- file: PDF file (required)

Response:
{
  "success": true,
  "total_pages": 5,
  "full_text": "...",
  "patterns": {
    "cnpj": ["12.345.678/0001-90"],
    "cpf": ["123.456.789-10"],
    "dates": ["01/01/2024"],
    "currency": ["R$ 1.000,00"],
    "percentages": ["50%"],
    "phones": ["11999999999"],
    "emails": ["email@example.com"],
    "urls": ["https://example.com"]
  },
  "summary": {
    "total_characters": 5000,
    "total_lines": 150,
    "unique_patterns": 8
  }
}
```

### 3. Extract Block Data (Structured)
```bash
POST /api/ocr/extract-block?block_type=general
Content-Type: multipart/form-data

Parameters:
- file: PDF file (required)
- block_type: "general" | "finance" | "all" (optional, default: "general")

Block Types:
- general: CNPJ, CPF, dates, phones, emails
- finance: Currency, percentages
- all: All detected patterns
```

### 4. Get OCR Info
```bash
GET /api/ocr/info
```

Response:
```json
{
  "engines": {
    "easyocr": {
      "available": true,
      "languages": ["Portuguese", "English"],
      "accuracy": "high"
    }
  },
  "features": {
    "pattern_detection": [...],
    "image_preprocessing": [...],
    "max_file_size": "50MB"
  }
}
```

## Configuration

### Environment Variables

Create `.env` file in backend directory:

```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=false

# OCR Configuration
OCR_PREPROCESS=true
OCR_DPI=300
OCR_TIMEOUT=60

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Load environment variables in `main.py`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    ocr_dpi: int = 300
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## Integrating with React Frontend

### 1. Set API endpoint

In React `.env` file:
```
REACT_APP_OCR_API=http://localhost:8000
```

For Vercel deployment:
```
REACT_APP_OCR_API=https://ocr-api.yourdomain.com
```

### 2. Use the OCR service

```typescript
import { extractBlockData } from '../services/ocrServiceBackend';

// In your component
const handlePDFUpload = async (file: File) => {
  try {
    const data = await extractBlockData(file, 'general');
    console.log('Extracted data:', data);
  } catch (error) {
    console.error('OCR error:', error);
  }
};
```

## Performance Tips

1. **DPI Setting**: Higher DPI (300+) improves accuracy but increases processing time
2. **Image Preprocessing**: Enable for low-quality PDFs
3. **Worker Processes**: Run multiple workers for high-traffic scenarios
4. **GPU Support**: EasyOCR supports GPU acceleration:
   ```bash
   pip install torch torchvision  # For GPU support
   ```

5. **Caching**: Consider caching OCR results for duplicate PDFs

## Troubleshooting

### ImportError: No module named 'pytesseract'

```bash
pip install pytesseract
```

### Tesseract not found

Make sure Tesseract is installed system-wide:
- Ubuntu: `sudo apt-get install tesseract-ocr`
- macOS: `brew install tesseract`
- Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki

### EasyOCR Model Download Issues

First run will download language models (~100MB+). Ensure:
```bash
# Pre-download models
python -c "import easyocr; reader = easyocr.Reader(['pt', 'en'])"
```

### High Memory Usage

EasyOCR loads models in memory. For production:
- Use a machine with at least 4GB RAM
- Consider GPU support for faster processing
- Implement request queuing for high loads

### CORS Issues

If frontend gets CORS errors:

1. Update `CORS_ORIGINS` in main.py
2. Verify backend is running on correct address
3. Check browser console for specific error

## Deployment Options

### Heroku
```bash
# Add Procfile
echo "web: gunicorn -w 1 -k uvicorn.workers.UvicornWorker main:app --timeout 300" > Procfile
heroku create your-app-name
git push heroku main
```

### Docker
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

### Railway/Render
Both platforms support Python and will auto-detect `requirements.txt`

## Testing

### Using curl

```bash
# Test health
curl http://localhost:8000/health

# Upload PDF
curl -X POST http://localhost:8000/api/ocr/extract \
  -F "file=@/path/to/sample.pdf"

# Test with specific block type
curl -X POST "http://localhost:8000/api/ocr/extract-block?block_type=finance" \
  -F "file=@/path/to/financial.pdf"
```

### Using Python requests

```python
import requests

# Upload and process
with open('sample.pdf', 'rb') as f:
    files = {'file': f}
    response = requests.post(
        'http://localhost:8000/api/ocr/extract',
        files=files
    )
    print(response.json())
```

## Monitoring & Logging

The application logs to console by default. For production, configure logging:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ocr_service.log'),
        logging.StreamHandler()
    ]
)
```

## Support & Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com
- **EasyOCR GitHub**: https://github.com/JaidedAI/EasyOCR
- **Tesseract Documentation**: https://github.com/tesseract-ocr/tesseract/wiki

## License

Same as main project
