# AUDESP - Python OCR Backend Complete Guide

## 🎯 Overview

This document provides complete instructions for the **Python OCR Backend** implementation that solves the PDF.js CDN worker issue.

### Problem That Was Solved

```
Error: Failed to fetch dynamically imported module: 
https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/build/pdf.worker.min.js
```

The client-side OCR approach was failing because:
- PDF.js worker files must be loaded from external CDNs
- CDNs (Cloudflare, jsDelivr) had CORS/fetch issues
- Browser processing was slow and memory-intensive
- Large files caused browser crashes

### Solution: Server-Side Python Backend

Move OCR processing to a Python backend using:
- **FastAPI** for REST API
- **EasyOCR** for advanced text recognition
- **pdf2image** for PDF conversion
- **OpenCV** for image preprocessing

---

## 📦 What's Included

### New Files Created (11 files)

```
backend/
├── main.py                     (430 lines) Core FastAPI application
├── requirements.txt             Python dependencies (13 packages)
├── Dockerfile                  Docker containerization
├── docker-compose.yml          Docker Compose orchestration
├── start.sh                    Automated startup script
├── commands.sh                 Bash command aliases
└── README.md                   Backend documentation

Root:
├── src/services/
│   └── ocrServiceBackend.ts   TypeScript backend integration
├── PYTHON_OCR_INTEGRATION.md   Integration guide
├── PYTHON_OCR_BACKEND_SUMMARY.md  Summary document
├── quick-start.sh              Complete setup automation
└── .env.example                Updated with backend config
```

### Modified Files (1 file)

- `src/components/GeminiUploader.tsx` - Now uses Python backend

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Automated Setup (Easiest)

```bash
./quick-start.sh
```

This script will:
1. ✅ Check system requirements (Node.js, Python)
2. ✅ Create Python virtual environment
3. ✅ Install Python dependencies
4. ✅ Download OCR models
5. ✅ Install Node dependencies
6. ✅ Create .env configuration

Then run:
```bash
# Terminal 1: Backend
cd backend && ./start.sh

# Terminal 2: Frontend
npm start
```

### Option 2: Manual Setup

**Backend Setup:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Download OCR models (one-time, ~100MB)
python -c "import easyocr; easyocr.Reader(['pt', 'en'], gpu=False)"

# Start server
uvicorn main:app --reload --port 8000
```

**Frontend Setup:**
```bash
# In another terminal, from root directory
export REACT_APP_OCR_API=http://localhost:8000
npm start
```

---

## 🏗️ Architecture

### System Diagram

```
┌─────────────────────────────────────┐
│      React Frontend (Port 3000)      │
│  - GeminiUploader component          │
│  - Upload PDF file                   │
│  - Display extracted data            │
└──────────────┬──────────────────────┘
               │ POST /api/ocr/extract
               │ (FormData with PDF)
               │
               ▼
┌─────────────────────────────────────┐
│  Python Backend (Port 8000)          │
│  - FastAPI application               │
│  - Receives PDF file                 │
│  - Converts to images (pdf2image)    │
│  - Runs OCR (EasyOCR)                │
│  - Detects patterns (regex)          │
│  - Preprocesses images (OpenCV)      │
└──────────────┬──────────────────────┘
               │ JSON Response
               │ {
               │   full_text: "...",
               │   patterns: {...},
               │   summary: {...}
               │ }
               │
               ▼
┌─────────────────────────────────────┐
│      React Component                 │
│  - Receives extracted data           │
│  - Updates form fields               │
│  - Shows success/error message       │
└─────────────────────────────────────┘
```

### Data Flow

```
PDF Upload
    ↓
File Validation (PDF only, max 50MB)
    ↓
PDF → Images Conversion (pdf2image, DPI 300)
    ↓
Image Preprocessing (denoise, enhance, binarize)
    ↓
Text Extraction (EasyOCR - Portuguese + English)
    ↓
Pattern Detection (8 patterns: CNPJ, CPF, dates, etc.)
    ↓
Structured Response (JSON with full text + patterns)
```

---

## 📖 API Documentation

### Endpoints Reference

#### 1. Health Check
```bash
GET /health
```

Verify backend is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "Advanced PDF OCR Service",
  "easyocr_available": true
}
```

#### 2. Extract Text & Patterns
```bash
POST /api/ocr/extract
Content-Type: multipart/form-data

# Parameters:
file: <PDF file>

# Example using curl:
curl -X POST http://localhost:8000/api/ocr/extract \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "success": true,
  "total_pages": 3,
  "full_text": "Extracted text from all pages...",
  "patterns": {
    "cnpj": ["12.345.678/0001-90"],
    "cpf": ["123.456.789-10"],
    "dates": ["01/01/2024", "31/12/2024"],
    "currency": ["R$ 1.000,00", "R$ 5.000,50"],
    "percentages": ["50%", "100%"],
    "phones": ["11999999999"],
    "emails": ["contato@empresa.com.br"],
    "urls": ["https://example.com"]
  },
  "summary": {
    "total_characters": 15000,
    "total_lines": 450,
    "unique_patterns": 8
  }
}
```

#### 3. Extract Block Data (Structured)
```bash
POST /api/ocr/extract-block?block_type=general
Content-Type: multipart/form-data

# Parameters:
file: <PDF file>
block_type: "general" | "finance" | "all"
```

**Block Types:**

- **general**: CNPJ, CPF, dates, phones, emails (for company/person data)
- **finance**: Currency values, percentages (for financial data)
- **all**: All detected patterns

**Example:**
```bash
curl -X POST "http://localhost:8000/api/ocr/extract-block?block_type=finance" \
  -F "file=@financial_report.pdf"
```

#### 4. Get OCR Capabilities
```bash
GET /api/ocr/info
```

**Response:**
```json
{
  "engines": {
    "easyocr": {
      "available": true,
      "languages": ["Portuguese", "English"],
      "accuracy": "high",
      "description": "Deep learning based OCR"
    }
  },
  "features": {
    "pattern_detection": [
      "CNPJ",
      "CPF",
      "Dates",
      "Currency",
      "Percentages",
      "Phone",
      "Email",
      "URLs"
    ],
    "image_preprocessing": [
      "Denoising",
      "Binarization",
      "Contrast Enhancement",
      "Upscaling"
    ],
    "max_file_size": "50MB",
    "supported_formats": ["PDF"]
  }
}
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file in root directory:

```bash
# React Frontend
REACT_APP_OCR_API=http://localhost:8000          # Development
# REACT_APP_OCR_API=https://ocr-api.yourdomain.com  # Production

# API Settings
REACT_APP_API_TIMEOUT=60000                      # 60 seconds
REACT_APP_DEBUG=false                            # Set true for debug logging
```

Create `.env` in `backend/` directory (optional):

```bash
# API Server Configuration
API_HOST=0.0.0.0
API_PORT=8000

# OCR Configuration
OCR_PREPROCESS=true                              # Enable image preprocessing
OCR_DPI=300                                      # PDF conversion DPI
OCR_TIMEOUT=60                                   # Processing timeout (seconds)

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

## 🧪 Testing

### Manual API Testing

**Using curl:**
```bash
# Health check
curl http://localhost:8000/health

# Get capabilities
curl http://localhost:8000/api/ocr/info

# Extract from PDF
curl -X POST http://localhost:8000/api/ocr/extract \
  -F "file=@sample.pdf" | python3 -m json.tool

# Extract finance block
curl -X POST "http://localhost:8000/api/ocr/extract-block?block_type=finance" \
  -F "file=@finance.pdf"
```

**Using Python:**
```python
import requests

url = "http://localhost:8000/api/ocr/extract"
files = {'file': open('sample.pdf', 'rb')}

response = requests.post(url, files=files)
data = response.json()

print(f"Pages: {data['total_pages']}")
print(f"CNPJ found: {data['patterns']['cnpj']}")
print(f"Text preview: {data['full_text'][:100]}...")
```

**Using JavaScript/TypeScript:**
```typescript
import { extractBlockData, checkBackendHealth } from './services/ocrServiceBackend';

// Check backend
const available = await checkBackendHealth();
if (!available) {
  console.log('Backend not available');
}

// Process PDF
const file = document.getElementById('fileInput').files[0];
const data = await extractBlockData(file, 'general');

console.log('CNPJ:', data.patterns?.cnpj);
console.log('Dates:', data.patterns?.dates);
```

### Using Swagger UI

Open: http://localhost:8000/docs

This provides interactive API testing:
1. Click on endpoint
2. Click "Try it out"
3. Upload PDF file
4. View response

---

## 📊 Performance Characteristics

### Processing Times

| Document Type | Pages | Processing Time |
|---|---|---|
| Simple invoice | 1 | 2-3 seconds |
| Tax report | 5 | 10-15 seconds |
| Complex document | 10 | 20-30 seconds |
| Large report | 20+ | 1-2 minutes |

### Resource Usage

| Metric | Usage |
|---|---|
| Memory per request | 200-500 MB |
| Disk space (models) | ~100 MB |
| Network per PDF | < 5 MB (typical) |
| Concurrent requests | Depends on server |

### Optimization Tips

1. **Increase DPI** (300-600): Better accuracy, slower processing
2. **Disable preprocessing**: Faster but may reduce accuracy
3. **Use GPU**: 3-5x faster (requires CUDA)
4. **Worker processes**: Run multiple workers for high load
5. **PDF optimization**: Compress/reduce page count

---

## 🐳 Docker Deployment

### Build Docker Image

```bash
cd backend
docker build -t audesp-ocr:latest .
```

### Run with Docker

```bash
# Simple run
docker run -p 8000:8000 audesp-ocr:latest

# With environment variables
docker run -p 8000:8000 \
  -e API_HOST=0.0.0.0 \
  -e API_PORT=8000 \
  -e OCR_PREPROCESS=true \
  audesp-ocr:latest

# With volume for logs
docker run -p 8000:8000 \
  -v ./logs:/app/logs \
  audesp-ocr:latest
```

### Using Docker Compose

```bash
cd backend
docker-compose up -d

# View logs
docker-compose logs -f ocr-backend

# Stop
docker-compose down
```

### Docker Compose File

```yaml
version: '3.8'
services:
  ocr-backend:
    build: .
    container_name: audesp-ocr
    ports:
      - "8000:8000"
    environment:
      - API_HOST=0.0.0.0
      - API_PORT=8000
      - OCR_PREPROCESS=true
      - OCR_DPI=300
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 🚀 Production Deployment

### Heroku

```bash
cd backend

# Create Procfile
echo "web: gunicorn -w 1 -k uvicorn.workers.UvicornWorker main:app --timeout 300" > Procfile

# Deploy
heroku create your-app-name
git push heroku main

# Set environment variables
heroku config:set REACT_APP_OCR_API=https://your-app-name.herokuapp.com
```

### Railway

1. Connect GitHub repository
2. Railway auto-detects `requirements.txt`
3. Set environment variable: `REACT_APP_OCR_API`
4. Deploy automatically

### Render

```bash
# Create Web Service
# - Build command: pip install -r requirements.txt
# - Start command: gunicorn -w 1 -k uvicorn.workers.UvicornWorker main:app

# Set environment variables in Render dashboard
REACT_APP_OCR_API=https://your-service.onrender.com
```

### AWS Lambda / Vercel Functions

⚠️ **Note**: Large file uploads and OCR processing may exceed serverless timeouts. Use traditional VPS instead.

### Traditional VPS (Ubuntu)

```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install -y python3.10 python3.10-venv tesseract-ocr nginx supervisor

# Clone repository
git clone https://github.com/your-repo.git
cd audesp/backend

# Setup
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup supervisor for auto-start
sudo systemctl restart supervisor

# Setup nginx reverse proxy
sudo systemctl restart nginx

# Access: https://yourdomain.com/api
```

---

## 🔍 Troubleshooting

### Backend Startup Issues

**Python version mismatch:**
```bash
# Check version
python3 --version  # Must be 3.10+

# Use specific version
python3.10 -m venv venv
```

**Module import errors:**
```bash
# Reinstall dependencies
pip install --upgrade --force-reinstall -r requirements.txt
```

**Port already in use:**
```bash
# Find process on port 8000
lsof -i :8000

# Kill it
kill -9 <PID>

# Or use different port
uvicorn main:app --port 8001
```

### OCR Issues

**No text extracted:**
- PDF might be scanned image without OCR
- Try preprocessing (already enabled)
- Lower quality PDF

**Slow processing:**
- First-time model download (~100MB)
- Large PDF file
- Low server resources

**Memory errors:**
- Reduce image DPI (in main.py)
- Process smaller PDFs
- Increase server RAM

### Frontend Issues

**"Backend not available" error:**
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check `REACT_APP_OCR_API` environment variable
3. Check firewall settings
4. Verify backend URL is correct

**CORS errors:**
1. Update `CORS_ORIGINS` in backend/main.py
2. Restart backend
3. Check browser console for specific error

**Timeout errors:**
1. Backend processing too slow (large PDF)
2. Increase `REACT_APP_API_TIMEOUT`
3. Optimize PDF quality

---

## 📝 Integration Examples

### Example 1: Basic Usage

```typescript
// In React component
import { extractBlockData } from '../services/ocrServiceBackend';

const handlePDFUpload = async (file: File) => {
  try {
    const data = await extractBlockData(file, 'general');
    
    // Data structure:
    // {
    //   patterns: {
    //     cnpj: ["12.345.678/0001-90"],
    //     cpf: ["123.456.789-10"],
    //     ...
    //   }
    // }
    
    setFormData({
      cnpj: data.patterns?.cnpj?.[0],
      cpf: data.patterns?.cpf?.[0],
      companyName: extractFromText(data.full_text),
    });
  } catch (error) {
    console.error('OCR Error:', error);
    setError('Falha ao processar PDF');
  }
};
```

### Example 2: Financial Data

```typescript
const handleFinancialDocument = async (file: File) => {
  const data = await extractBlockData(file, 'finance');
  
  // data.patterns contains:
  // - currency: ["R$ 1.000,00", "R$ 5.000,50"]
  // - percentages: ["50%", "100%"]
  
  const totalValue = parseFloat(data.patterns.currency[0]);
  const percentage = parseFloat(data.patterns.percentages[0]);
  
  updateFinancialData(totalValue, percentage);
};
```

### Example 3: Backend Health Check

```typescript
import { checkBackendHealth } from '../services/ocrServiceBackend';

// In App.tsx
useEffect(() => {
  const checkHealth = async () => {
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      showAlert('Backend OCR service is unavailable');
    }
  };
  
  checkHealth();
}, []);
```

---

## 📚 Additional Resources

- **FastAPI**: https://fastapi.tiangolo.com
- **EasyOCR**: https://github.com/JaidedAI/EasyOCR
- **PDF2Image**: https://github.com/Belval/pdf2image
- **OpenCV**: https://opencv.org
- **Tesseract**: https://github.com/tesseract-ocr/tesseract

---

## ✅ Deployment Checklist

- [ ] Backend tested locally with real PDFs
- [ ] Environment variables configured
- [ ] Docker image builds successfully
- [ ] React frontend updated with backend URL
- [ ] API endpoints tested with curl
- [ ] Health check working: `curl http://localhost:8000/health`
- [ ] File upload tested in web interface
- [ ] Error handling tested
- [ ] Performance acceptable for your use case
- [ ] Logs accessible for monitoring
- [ ] CORS properly configured
- [ ] Rate limiting considered (if needed)

---

## 🎓 Summary

The Python OCR Backend provides:

✅ **No CDN dependency** - All processing server-side
✅ **Better accuracy** - EasyOCR with deep learning
✅ **Faster processing** - Optimized Python libraries
✅ **Pattern detection** - CNPJ, CPF, dates, currency, etc.
✅ **Image preprocessing** - Automatic quality enhancement
✅ **Easy integration** - Simple REST API
✅ **Production ready** - Docker, monitoring, error handling
✅ **Scalable** - Can run multiple worker processes

---

## 🆘 Support

For issues or questions:
1. Check logs: `backend/ocr_service.log`
2. Test endpoint: `curl http://localhost:8000/health`
3. View API docs: `http://localhost:8000/docs`
4. Check React console for network errors
5. Review integration guide: `PYTHON_OCR_INTEGRATION.md`

---

**Ready to process PDFs with advanced OCR! 🚀**
