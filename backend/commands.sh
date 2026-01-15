#!/bin/bash

# AUDESP - Python OCR Backend Commands Reference
# Quick command reference for common operations

# ============================================
# BACKEND OPERATIONS
# ============================================

# Start backend (development with auto-reload)
backend-dev() {
    cd backend
    source venv/bin/activate
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
}

# Start backend (production mode)
backend-prod() {
    cd backend
    source venv/bin/activate
    gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
}

# Setup backend (install dependencies)
backend-setup() {
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip setuptools wheel
    pip install -r requirements.txt
    echo "✓ Backend setup complete"
}

# Check backend health
backend-health() {
    curl -s http://localhost:8000/health | python3 -m json.tool
}

# View backend API documentation
backend-docs() {
    echo "Opening http://localhost:8000/docs"
    "$BROWSER" http://localhost:8000/docs 2>/dev/null || \
    open http://localhost:8000/docs 2>/dev/null || \
    xdg-open http://localhost:8000/docs 2>/dev/null || \
    echo "Please visit: http://localhost:8000/docs"
}

# Test OCR with sample PDF
backend-test() {
    if [ ! -f "$1" ]; then
        echo "Usage: backend-test <pdf-file>"
        echo "Example: backend-test sample.pdf"
        return 1
    fi
    
    echo "Uploading $1 to OCR backend..."
    curl -X POST http://localhost:8000/api/ocr/extract \
        -F "file=@$1" \
        -H "Accept: application/json" | python3 -m json.tool
}

# ============================================
# FRONTEND OPERATIONS
# ============================================

# Setup frontend (install Node dependencies)
frontend-setup() {
    npm install --legacy-peer-deps
    echo "✓ Frontend setup complete"
}

# Start frontend (development)
frontend-dev() {
    REACT_APP_OCR_API=http://localhost:8000 npm start
}

# Build frontend (production)
frontend-build() {
    npm run build
    echo "✓ Build complete. Output in build/"
}

# ============================================
# PROJECT SETUP
# ============================================

# Complete setup (both frontend and backend)
project-setup() {
    echo "Setting up AUDESP project..."
    
    # Backend setup
    echo "1. Setting up backend..."
    backend-setup
    
    # Frontend setup
    echo "2. Setting up frontend..."
    frontend-setup
    
    echo ""
    echo "✓ Project setup complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Start backend: backend-dev"
    echo "  2. Start frontend: frontend-dev"
}

# Run quick start script
project-quickstart() {
    ./quick-start.sh
}

# ============================================
# DOCKER OPERATIONS
# ============================================

# Build Docker image for backend
docker-build() {
    cd backend
    docker build -t audesp-ocr:latest .
    echo "✓ Docker image built: audesp-ocr:latest"
}

# Run backend with Docker
docker-run() {
    docker run -p 8000:8000 \
        -e API_HOST=0.0.0.0 \
        -e API_PORT=8000 \
        audesp-ocr:latest
}

# Run with docker-compose
docker-compose-up() {
    cd backend
    docker-compose up -d
    echo "✓ Backend started with Docker Compose"
    echo "  Check health: curl http://localhost:8000/health"
}

docker-compose-down() {
    cd backend
    docker-compose down
    echo "✓ Docker Compose stopped"
}

docker-compose-logs() {
    cd backend
    docker-compose logs -f ocr-backend
}

# ============================================
# TESTING & DEBUGGING
# ============================================

# Test API endpoints
test-api() {
    echo "Testing API endpoints..."
    echo ""
    
    echo "1. Health check:"
    curl -s http://localhost:8000/health | python3 -m json.tool
    
    echo ""
    echo "2. API info:"
    curl -s http://localhost:8000/api/ocr/info | python3 -m json.tool
}

# Check if ports are available
check-ports() {
    echo "Checking port availability..."
    
    if lsof -i :3000 >/dev/null 2>&1; then
        echo "❌ Port 3000 (Frontend): IN USE"
    else
        echo "✓ Port 3000 (Frontend): Available"
    fi
    
    if lsof -i :8000 >/dev/null 2>&1; then
        echo "❌ Port 8000 (Backend): IN USE"
    else
        echo "✓ Port 8000 (Backend): Available"
    fi
}

# Kill processes on ports
kill-ports() {
    echo "Killing processes on ports 3000 and 8000..."
    
    lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
    lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
    
    sleep 2
    check-ports
}

# ============================================
# DEPLOYMENT
# ============================================

# Prepare for Heroku deployment
deploy-heroku() {
    echo "Preparing for Heroku deployment..."
    
    # Create Procfile if doesn't exist
    if [ ! -f "backend/Procfile" ]; then
        echo "web: gunicorn -w 1 -k uvicorn.workers.UvicornWorker main:app --timeout 300" > backend/Procfile
    fi
    
    echo "✓ Heroku files prepared"
    echo "Next: heroku create && git push heroku main"
}

# Set environment variables for Heroku
deploy-heroku-env() {
    if [ -z "$1" ]; then
        echo "Usage: deploy-heroku-env <app-name>"
        return 1
    fi
    
    heroku config:set \
        API_HOST=0.0.0.0 \
        API_PORT=8000 \
        OCR_PREPROCESS=true \
        --app "$1"
    
    echo "✓ Environment variables set for $1"
}

# ============================================
# UTILITY FUNCTIONS
# ============================================

# View logs
logs-backend() {
    if [ -f "backend/ocr_service.log" ]; then
        tail -f backend/ocr_service.log
    else
        echo "Log file not found. Backend not running?"
    fi
}

# Clean project (remove build artifacts)
project-clean() {
    echo "Cleaning project..."
    
    # Frontend
    rm -rf build node_modules
    
    # Backend
    cd backend && rm -rf build dist *.egg-info __pycache__ .pytest_cache
    find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
    
    echo "✓ Project cleaned"
}

# Reset to clean state
project-reset() {
    project-clean
    rm -rf backend/venv
    echo "✓ Project reset to clean state"
    echo "Run 'project-setup' to reinstall"
}

# ============================================
# HELP
# ============================================

show-help() {
    cat << 'EOF'
AUDESP - Command Reference

BACKEND COMMANDS:
  backend-dev          Start backend (development with auto-reload)
  backend-prod         Start backend (production mode)
  backend-setup        Setup backend (install dependencies)
  backend-health       Check backend health status
  backend-docs         Open API documentation
  backend-test <file>  Test OCR with a PDF file

FRONTEND COMMANDS:
  frontend-setup       Setup frontend (install dependencies)
  frontend-dev         Start frontend (development)
  frontend-build       Build frontend (production)

PROJECT COMMANDS:
  project-setup        Complete setup (backend + frontend)
  project-quickstart   Run quick start script
  project-clean        Clean build artifacts
  project-reset        Reset to clean state (remove all installs)

DOCKER COMMANDS:
  docker-build         Build Docker image
  docker-run           Run backend with Docker
  docker-compose-up    Start with Docker Compose
  docker-compose-down  Stop Docker Compose
  docker-compose-logs  View Docker Compose logs

TESTING & DEBUG:
  test-api             Test API endpoints
  check-ports          Check port availability
  kill-ports           Kill processes on 3000/8000
  logs-backend         View backend logs

DEPLOYMENT:
  deploy-heroku        Prepare for Heroku deployment
  deploy-heroku-env    Set Heroku environment variables

USAGE EXAMPLES:
  backend-dev
  frontend-dev
  backend-test sample.pdf
  docker-compose-up
  kill-ports

EOF
}

# Default: show help if no argument
if [ "$1" = "" ]; then
    show-help
fi
