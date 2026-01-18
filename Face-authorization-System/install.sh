#!/bin/bash
# Quick Installation Script for Face Authorization System
# macOS/Linux

echo "🚀 Installing Face Authorization System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check Python installation
echo -e "${YELLOW}Checking Python installation...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    echo -e "${GREEN}Found: $PYTHON_VERSION${NC}"
    
    # Check if Python version is compatible (3.9-3.11)
    if python3 -c "import sys; exit(0 if sys.version_info >= (3, 9) and sys.version_info < (3, 12) else 1)"; then
        echo -e "${GREEN}✅ Python version is compatible${NC}"
    else
        echo -e "${RED}❌ Python 3.9-3.11 required. Please install from python.org${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Python3 not found. Please install Python 3.9-3.11${NC}"
    exit 1
fi

# Check MongoDB
echo -e "${YELLOW}Checking MongoDB...${NC}"
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand('ping')" &> /dev/null; then
        echo -e "${GREEN}✅ MongoDB is running${NC}"
    else
        echo -e "${RED}❌ MongoDB not running. Please start MongoDB service${NC}"
        echo -e "${YELLOW}macOS: brew services start mongodb/brew/mongodb-community${NC}"
        echo -e "${YELLOW}Linux: sudo systemctl start mongod${NC}"
    fi
elif command -v mongo &> /dev/null; then
    if mongo --eval "db.runCommand('ping')" &> /dev/null; then
        echo -e "${GREEN}✅ MongoDB is running${NC}"
    else
        echo -e "${RED}❌ MongoDB not running. Please start MongoDB service${NC}"
    fi
else
    echo -e "${RED}❌ MongoDB not installed${NC}"
    echo -e "${YELLOW}macOS: brew install mongodb-community${NC}"
    echo -e "${YELLOW}Linux: See SETUP_GUIDE.md for installation instructions${NC}"
fi

# Create virtual environment
echo -e "${YELLOW}Creating virtual environment...${NC}"
python3 -m venv .venv

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source .venv/bin/activate

# Upgrade pip
echo -e "${YELLOW}Upgrading pip...${NC}"
python -m pip install --upgrade pip

# Install requirements
echo -e "${YELLOW}Installing dependencies (this may take a few minutes)...${NC}"
pip install -r requirements.txt

# Check installation
echo -e "${YELLOW}Verifying installation...${NC}"
packages=("flask" "opencv-python" "insightface" "pymongo")

for package in "${packages[@]}"; do
    if pip show "$package" &> /dev/null; then
        echo -e "${GREEN}✅ $package installed successfully${NC}"
    else
        echo -e "${RED}❌ $package installation failed${NC}"
    fi
done

echo -e "\n${GREEN}🎉 Installation Complete!${NC}"
echo -e "${YELLOW}To start the application:${NC}"
echo -e "${NC}1. Ensure MongoDB is running${NC}"
echo -e "${NC}2. Activate virtual environment: source .venv/bin/activate${NC}"
echo -e "${NC}3. Run: python app.py${NC}"
echo -e "${NC}4. Open browser: http://localhost:5000${NC}"

echo -e "\n${CYAN}📚 For detailed instructions, see SETUP_GUIDE.md${NC}"
