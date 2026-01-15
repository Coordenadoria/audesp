from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import io
import re
import logging
from pathlib import Path
import tempfile
import json

try:
    from PIL import Image
except ImportError:
    Image = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Advanced PDF OCR Service",
    description="Backend service for PDF text extraction with advanced OCR",
    version="1.0.0"
)

# Add CORS middleware to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional: Initialize EasyOCR reader (PT for Portuguese)
reader = None
try:
    import easyocr
    reader = easyocr.Reader(['pt', 'en'], gpu=False)
    logger.info("EasyOCR reader initialized successfully")
except ImportError:
    logger.warning("EasyOCR not available - using lightweight mode")
except Exception as e:
    logger.warning(f"EasyOCR initialization warning: {e}")


# ==================== PATTERN DETECTION ====================

class PatternDetector:
    """Detects structured patterns in extracted text"""
    
    @staticmethod
    def detect_cnpj(text: str) -> List[str]:
        """Detect CNPJ patterns (XX.XXX.XXX/XXXX-XX)"""
        pattern = r'\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}'
        return re.findall(pattern, text)
    
    @staticmethod
    def detect_cpf(text: str) -> List[str]:
        """Detect CPF patterns (XXX.XXX.XXX-XX)"""
        pattern = r'\d{3}\.\d{3}\.\d{3}-\d{2}'
        return re.findall(pattern, text)
    
    @staticmethod
    def detect_dates(text: str) -> List[str]:
        """Detect dates (DD/MM/YYYY or DD-MM-YYYY)"""
        pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{4}'
        return re.findall(pattern, text)
    
    @staticmethod
    def detect_currency_values(text: str) -> List[str]:
        """Detect currency values (R$ XXX,XX)"""
        pattern = r'R\$\s*[\d.,]+'
        return re.findall(pattern, text)
    
    @staticmethod
    def detect_percentages(text: str) -> List[str]:
        """Detect percentage values (XX%)"""
        pattern = r'\d+(?:,\d+)?\s*%'
        return re.findall(pattern, text)
    
    @staticmethod
    def detect_phone_numbers(text: str) -> List[str]:
        """Detect phone numbers"""
        pattern = r'(?:\+?\d{2})?\s*(?:\(?\d{2}\)?)?\s*\d{4,5}-?\d{4}'
        return re.findall(pattern, text)
    
    @staticmethod
    def detect_emails(text: str) -> List[str]:
        """Detect email addresses"""
        pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        return re.findall(pattern, text)
    
    @staticmethod
    def detect_urls(text: str) -> List[str]:
        """Detect URLs"""
        pattern = r'https?://[^\s]+'
        return re.findall(pattern, text)


# ==================== IMAGE PREPROCESSING ====================

class ImagePreprocessor:
    """Preprocessing techniques to improve OCR accuracy"""
    
    @staticmethod
    def denoise(image):
        """Remove noise from image"""
        try:
            import cv2
            import numpy as np
            img_array = np.array(image)
            denoised = cv2.fastNlMeansDenoising(img_array, h=10)
            if Image:
                return Image.fromarray(denoised)
            return denoised
        except:
            return image
    
    @staticmethod
    def enhance_contrast(image):
        """Enhance contrast"""
        try:
            import cv2
            import numpy as np
            img_array = np.array(image)
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            if Image:
                return Image.fromarray(enhanced)
            return enhanced
        except:
            return image


# ==================== OCR ENGINES ====================

class OCREngine:
    """Abstract base for OCR engines"""
    
    async def extract_text(self, image: Image.Image) -> str:
        raise NotImplementedError


class TesseractOCR:
    """Tesseract OCR engine"""
    
    async def extract_text(self, image) -> str:
        try:
            try:
                import pytesseract
                text = pytesseract.image_to_string(image, lang='por')
                logger.info(f"Tesseract extracted {len(text)} characters")
                return text
            except ImportError:
                logger.warning("Tesseract not available")
                return ""
        except Exception as e:
            logger.error(f"Tesseract error: {e}")
            return ""


class EasyOCREngine:
    """EasyOCR engine (more accurate for Portuguese)"""
    
    async def extract_text(self, image) -> str:
        global reader
        if reader is None:
            logger.warning("EasyOCR not available")
            return ""
        
        try:
            import numpy as np
            image_np = np.array(image)
            results = reader.readtext(image_np)
            text = '\n'.join([line[1] for line in results])
            logger.info(f"EasyOCR extracted {len(text)} characters from image")
            return text
        except Exception as e:
            logger.error(f"EasyOCR error: {e}")
            return ""


# ==================== PDF PROCESSOR ====================

class PDFProcessor:
    """Processes PDF files and extracts text with OCR"""
    
    def __init__(self, ocr_engine=None, preprocess: bool = True):
        self.ocr_engine = ocr_engine or TesseractOCR()
        self.preprocess = preprocess
        self.pattern_detector = PatternDetector()
        self.preprocessor = ImagePreprocessor()
    
    async def process_pdf(self, pdf_bytes: bytes, extract_patterns: bool = True) -> Dict[str, Any]:
        """Process PDF file and extract text with patterns"""
        try:
            try:
                from pdf2image import convert_from_bytes
                logger.info("Converting PDF to images...")
                images = convert_from_bytes(pdf_bytes, dpi=200)
            except ImportError:
                logger.error("pdf2image not available")
                return {"success": False, "error": "PDF processing library not available"}
            
            if not images:
                return {"success": False, "error": "PDF appears to be empty or corrupted"}
            
            logger.info(f"Converted PDF to {len(images)} images")
            
            # Extract text from all pages
            extracted_pages = []
            all_text = ""
            
            for page_num, image in enumerate(images, 1):
                try:
                    # Extract text using OCR
                    page_text = await self.ocr_engine.extract_text(image)
                    if not page_text:
                        page_text = f"[Page {page_num}: Unable to extract text]"
                    
                    all_text += f"\n--- PAGE {page_num} ---\n{page_text}\n"
                    
                    extracted_pages.append({
                        "page": page_num,
                        "text": page_text,
                        "character_count": len(page_text),
                        "line_count": len(page_text.split('\n'))
                    })
                except Exception as e:
                    logger.error(f"Error processing page {page_num}: {e}")
                    extracted_pages.append({
                        "page": page_num,
                        "error": str(e)
                    })
            
            # Extract patterns
            patterns = {}
            if extract_patterns:
                logger.info("Extracting patterns...")
                patterns = {
                    "cnpj": self.pattern_detector.detect_cnpj(all_text),
                    "cpf": self.pattern_detector.detect_cpf(all_text),
                    "dates": self.pattern_detector.detect_dates(all_text),
                    "currency": self.pattern_detector.detect_currency_values(all_text),
                    "percentages": self.pattern_detector.detect_percentages(all_text),
                    "phones": self.pattern_detector.detect_phone_numbers(all_text),
                    "emails": self.pattern_detector.detect_emails(all_text),
                    "urls": self.pattern_detector.detect_urls(all_text),
                }
            
            return {
                "success": True,
                "total_pages": len(images),
                "pages": extracted_pages,
                "full_text": all_text.strip(),
                "patterns": patterns,
                "summary": {
                    "total_characters": len(all_text),
                    "total_lines": len(all_text.split('\n')),
                    "unique_patterns": sum(len(v) for v in patterns.values() if isinstance(v, list))
                }
            }
        except Exception as e:
            logger.error(f"PDF processing failed: {e}")
            return {"success": False, "error": str(e)}


# ==================== API MODELS ====================

class OCRResponse(BaseModel):
    success: bool
    total_pages: Optional[int] = None
    full_text: Optional[str] = None
    patterns: Optional[Dict[str, List[str]]] = None
    summary: Optional[Dict[str, int]] = None
    error: Optional[str] = None


# ==================== API ENDPOINTS ====================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Advanced PDF OCR Service",
        "easyocr_available": reader is not None
    }


@app.post("/api/ocr/extract", response_model=OCRResponse, tags=["OCR"])
async def extract_text_from_pdf(file: UploadFile = File(...)):
    """
    Extract text from PDF using advanced OCR
    
    Returns:
        - full_text: Complete extracted text
        - patterns: Detected CNPJ, CPF, dates, currency, etc.
        - summary: Statistics about extraction
    """
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        # Read PDF bytes
        pdf_bytes = await file.read()
        
        if len(pdf_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty PDF file")
        
        if len(pdf_bytes) > 50 * 1024 * 1024:  # 50MB limit
            raise HTTPException(status_code=413, detail="PDF file too large (max 50MB)")
        
        # Process PDF
        processor = PDFProcessor(preprocess=True)
        result = await processor.process_pdf(pdf_bytes, extract_patterns=True)
        
        logger.info(f"Successfully processed {file.filename}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing file {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@app.post("/api/ocr/extract-block", tags=["OCR"])
async def extract_block_data(file: UploadFile = File(...), block_type: str = "general"):
    """
    Extract and structure data for specific form blocks
    
    block_type options:
        - general: General info (CNPJ, CPF, dates)
        - finance: Financial data (currency, percentages)
        - all: All detected patterns
    """
    
    try:
        pdf_bytes = await file.read()
        processor = PDFProcessor(preprocess=True)
        result = await processor.process_pdf(pdf_bytes, extract_patterns=True)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        # Filter patterns based on block_type
        if block_type == "finance":
            filtered_patterns = {
                "currency": result["patterns"].get("currency", []),
                "percentages": result["patterns"].get("percentages", []),
            }
        elif block_type == "general":
            filtered_patterns = {
                "cnpj": result["patterns"].get("cnpj", []),
                "cpf": result["patterns"].get("cpf", []),
                "dates": result["patterns"].get("dates", []),
                "phones": result["patterns"].get("phones", []),
                "emails": result["patterns"].get("emails", []),
            }
        else:
            filtered_patterns = result["patterns"]
        
        return {
            "success": True,
            "full_text": result["full_text"],
            "patterns": filtered_patterns,
            "summary": result["summary"]
        }
        
    except Exception as e:
        logger.error(f"Block extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ocr/info", tags=["Info"])
async def get_ocr_info():
    """Get information about available OCR engines and capabilities"""
    return {
        "engines": {
            "easyocr": {
                "available": reader is not None,
                "languages": ["Portuguese", "English"],
                "accuracy": "high",
                "description": "Deep learning based OCR, best accuracy for Portuguese"
            },
            "tesseract": {
                "available": True,
                "languages": ["Portuguese", "English", "Multiple"],
                "accuracy": "medium",
                "description": "Traditional OCR engine"
            }
        },
        "features": {
            "pattern_detection": ["CNPJ", "CPF", "Dates", "Currency", "Percentages", "Phone", "Email", "URLs"],
            "image_preprocessing": ["Denoising", "Binarization", "Contrast Enhancement", "Upscaling"],
            "max_file_size": "50MB",
            "supported_formats": ["PDF"]
        }
    }


@app.get("/", tags=["Root"])
async def root():
    """API documentation"""
    return {
        "service": "Advanced PDF OCR Backend",
        "version": "1.0.0",
        "endpoints": {
            "health": "GET /health",
            "extract_pdf": "POST /api/ocr/extract",
            "extract_block": "POST /api/ocr/extract-block",
            "info": "GET /api/ocr/info"
        },
        "docs": "/docs",
        "openapi": "/openapi.json"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
