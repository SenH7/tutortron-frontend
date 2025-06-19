#!/bin/bash

# Tutortron Development Startup Script - Updated for backend folder structure

echo "🚀 Starting Tutortron Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i:$1 >/dev/null 2>&1
}

# Get the project root directory (parent of scripts folder)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo -e "${BLUE}Project root: $PROJECT_ROOT${NC}"
echo -e "${BLUE}Backend directory: $BACKEND_DIR${NC}"

echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

# Check Node.js
if command_exists node; then
    echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

# Check Python
if command_exists python3; then
    echo -e "${GREEN}✓ Python found: $(python3 --version)${NC}"
elif command_exists python; then
    echo -e "${GREEN}✓ Python found: $(python --version)${NC}"
else
    echo -e "${RED}✗ Python not found. Please install Python 3.8+${NC}"
    exit 1
fi

# Check Conda
if command_exists conda; then
    echo -e "${GREEN}✓ Conda found: $(conda --version)${NC}"
    USE_CONDA=true
else
    echo -e "${YELLOW}⚠ Conda not found. Using regular Python venv${NC}"
    USE_CONDA=false
fi

# Check Docker
if command_exists docker; then
    echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"
else
    echo -e "${RED}✗ Docker not found. Please install Docker Desktop${NC}"
    echo -e "${YELLOW}Install from: https://docs.docker.com/desktop/install/mac-install/${NC}"
    exit 1
fi

echo -e "${BLUE}Step 2: Starting Qdrant vector database...${NC}"

# Check if Qdrant is already running
if port_in_use 6333; then
    echo -e "${GREEN}✓ Qdrant already running on port 6333${NC}"
else
    echo -e "${YELLOW}Starting Qdrant container...${NC}"
    docker run -d -p 6333:6333 --name qdrant-tutortron qdrant/qdrant
    sleep 3
    if port_in_use 6333; then
        echo -e "${GREEN}✓ Qdrant started successfully${NC}"
    else
        echo -e "${RED}✗ Failed to start Qdrant${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}Step 3: Setting up Python backend...${NC}"

# Change to backend directory
cd "$BACKEND_DIR"

if [ "$USE_CONDA" = true ]; then
    echo -e "${YELLOW}Setting up Conda environment...${NC}"
    
    # Check if tutortron environment exists
    if conda env list | grep -q "tutortron"; then
        echo -e "${GREEN}✓ Conda environment 'tutortron' already exists${NC}"
    else
        echo -e "${YELLOW}Creating Conda environment 'tutortron'...${NC}"
        conda create -n tutortron python=3.9 -y
    fi
    
    echo -e "${YELLOW}Activating Conda environment...${NC}"
    source $(conda info --base)/etc/profile.d/conda.sh
    conda activate tutortron
else
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}Creating Python virtual environment...${NC}"
        python3 -m venv venv
    fi

    # Activate virtual environment
    echo -e "${YELLOW}Activating virtual environment...${NC}"
    source venv/bin/activate
fi

# Install Python dependencies
if [ -f "requirements.txt" ]; then
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    pip install -q -r requirements.txt
    echo -e "${GREEN}✓ Python dependencies installed${NC}"
else
    echo -e "${RED}✗ requirements.txt not found in backend directory${NC}"
    exit 1
fi

# Check environment file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from template...${NC}"
    cat > .env << EOF
OPENAI_API_KEY=your_openai_api_key_here
QDRANT_HOST=localhost
QDRANT_PORT=6333
FLASK_ENV=development
FLASK_DEBUG=True
EOF
    echo -e "${YELLOW}Please edit backend/.env file with your OpenAI API key${NC}"
fi

echo -e "${BLUE}Step 4: Setting up Next.js frontend...${NC}"

# Change back to project root
cd "$PROJECT_ROOT"

# Install Node.js dependencies
if [ -f "package.json" ]; then
    echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
    npm install --silent
    echo -e "${GREEN}✓ Node.js dependencies installed${NC}"
else
    echo -e "${RED}✗ package.json not found${NC}"
    exit 1
fi

# Check frontend environment file
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local for Next.js...${NC}"
    echo "RAG_BACKEND_URL=http://localhost:5000" > .env.local
fi

echo -e "${BLUE}Step 5: Starting services...${NC}"

# Start Python backend in background
echo -e "${YELLOW}Starting Python backend on port 5001...${NC}"
cd "$BACKEND_DIR"
if [ "$USE_CONDA" = true ]; then
    conda activate tutortron
fi
python app.py &
BACKEND_PID=$!
sleep 3

# Check if backend started successfully
if port_in_use 5001; then
    echo -e "${GREEN}✓ Python backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Failed to start Python backend${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start Next.js frontend
echo -e "${YELLOW}Starting Next.js frontend on port 3000...${NC}"
cd "$PROJECT_ROOT"
npm run dev &
FRONTEND_PID=$!
sleep 5

# Check if frontend started successfully
if port_in_use 3000; then
    echo -e "${GREEN}✓ Next.js frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ Failed to start Next.js frontend${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}"
echo "🎉 Tutortron development environment is ready!"
echo ""
echo "📋 Services running:"
echo "   • Qdrant Vector DB: http://localhost:6333/dashboard"
echo "   • Python Backend:   http://localhost:5001/health"
echo "   • Next.js Frontend: http://localhost:3000"
echo ""
echo "🧪 Testing steps:"
echo "   1. Visit http://localhost:3000"
echo "   2. Login with student@example.com / password"
echo "   3. Upload a PDF document"
echo "   4. Ask questions about the document"
echo ""
echo "🛑 To stop all services, press Ctrl+C"
echo -e "${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    docker stop qdrant-tutortron 2>/dev/null
    docker rm qdrant-tutortron 2>/dev/null
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT

# Wait for user to stop services
wait