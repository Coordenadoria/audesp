#!/bin/bash

# Quick Start Script for AUDESP with Python OCR Backend
# This script sets up both the React frontend and Python backend

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  AUDESP - Quick Start (React + Python OCR Backend)  ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js não encontrado. Instale em: https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js encontrado: $(node -v)${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python3 não encontrado. Instale Python 3.10+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python encontrado: $(python3 --version)${NC}"

echo ""
echo -e "${YELLOW}━━━ Setup do Backend Python ━━━${NC}"

cd "$REPO_ROOT/backend"

# Create virtual environment if doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Criando ambiente virtual...${NC}"
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo -e "${YELLOW}Instalando dependências Python...${NC}"
pip install --upgrade pip setuptools wheel > /dev/null 2>&1
pip install -q -r requirements.txt

# Pre-download EasyOCR models
echo -e "${YELLOW}Fazendo download dos modelos OCR (primeira execução pode levar alguns minutos)...${NC}"
python -c "
import sys
try:
    import easyocr
    reader = easyocr.Reader(['pt', 'en'], gpu=False)
    print('✓ Modelos OCR prontos')
except Exception as e:
    print(f'⚠ Aviso ao baixar modelos: {e}')
    print('  Será feito no primeiro uso')
" || true

echo -e "${GREEN}✓ Backend Python configurado${NC}"

# Setup React Frontend
echo ""
echo -e "${YELLOW}━━━ Setup do Frontend React ━━━${NC}"

cd "$REPO_ROOT"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Instalando dependências Node.js...${NC}"
    npm install --legacy-peer-deps --silent
fi

# Create .env if doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Criando arquivo .env...${NC}"
    cat > .env << 'EOF'
REACT_APP_OCR_API=http://localhost:8000
REACT_APP_API_TIMEOUT=60000
EOF
    echo -e "${GREEN}✓ Arquivo .env criado${NC}"
    echo -e "${BLUE}  Configure REACT_APP_OCR_API conforme necessário${NC}"
else
    echo -e "${GREEN}✓ Arquivo .env já existe${NC}"
fi

echo -e "${GREEN}✓ Frontend React configurado${NC}"

# Success message
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup concluído com sucesso!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}Próximos passos:${NC}"
echo ""
echo -e "${YELLOW}1. Inicie o Backend Python (em um terminal):${NC}"
echo -e "   ${BLUE}cd backend && ./start.sh${NC}"
echo -e "   Será executado em: ${BLUE}http://localhost:8000${NC}"
echo ""
echo -e "${YELLOW}2. Inicie o Frontend React (em outro terminal):${NC}"
echo -e "   ${BLUE}npm start${NC}"
echo -e "   Será executado em: ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}3. Acesse:${NC}"
echo -e "   Frontend:   ${BLUE}http://localhost:3000${NC}"
echo -e "   API Docs:   ${BLUE}http://localhost:8000/docs${NC}"
echo ""

echo -e "${BLUE}Dicas:${NC}"
echo -e "  • Faça upload de PDFs na interface web"
echo -e "  • O OCR será processado no backend Python"
echo -e "  • Padrões (CNPJ, CPF, datas) serão detectados automaticamente"
echo -e "  • Veja os logs nos dois terminais para debug"
echo ""

echo -e "${YELLOW}Documentação:${NC}"
echo -e "  • Backend:  ${BLUE}backend/README.md${NC}"
echo -e "  • Integração: ${BLUE}PYTHON_OCR_INTEGRATION.md${NC}"
echo ""

# Optionally start services
echo -e "${YELLOW}Deseja iniciar os serviços agora? (s/n)${NC}"
read -r -p "> " response

if [[ "$response" =~ ^[Ss]$ ]]; then
    echo ""
    echo -e "${BLUE}Você precisa de dois terminais:${NC}"
    echo ""
    echo -e "Terminal 1 (Backend):"
    echo -e "  ${BLUE}cd backend && ./start.sh${NC}"
    echo ""
    echo -e "Terminal 2 (Frontend):"
    echo -e "  ${BLUE}npm start${NC}"
    echo ""
    echo -e "${YELLOW}Abra novos terminais e execute os comandos acima.${NC}"
fi

echo ""
echo -e "${GREEN}Setup finalizado! 🎉${NC}"
