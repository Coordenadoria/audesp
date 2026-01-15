#!/bin/bash

# OCR Backend Startup Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Advanced PDF OCR Backend...${NC}"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install/update dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install --upgrade pip setuptools wheel > /dev/null 2>&1
pip install -q -r requirements.txt

# Check system dependencies
echo -e "${YELLOW}Checking system dependencies...${NC}"

if ! command -v tesseract &> /dev/null; then
    echo -e "${YELLOW}Warning: Tesseract not found. Installing...${NC}"
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update > /dev/null 2>&1
        sudo apt-get install -y tesseract-ocr > /dev/null 2>&1
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install tesseract > /dev/null 2>&1
    else
        echo -e "${RED}Please install Tesseract manually: https://github.com/UB-Mannheim/tesseract/wiki${NC}"
    fi
fi

# Pre-download EasyOCR models
echo -e "${YELLOW}Downloading OCR models (this may take a few minutes on first run)...${NC}"
python -c "import easyocr; easyocr.Reader(['pt', 'en'], gpu=False)" 2>/dev/null || echo "Models cached"

# Start the application
echo -e "${GREEN}Starting FastAPI server on http://localhost:8000${NC}"
echo -e "${GREEN}API Docs: http://localhost:8000/docs${NC}"
echo -e "${GREEN}Press Ctrl+C to stop${NC}"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Cleanup
deactivate
