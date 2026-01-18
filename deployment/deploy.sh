#!/bin/bash

# VoxVeritas Deployment Script for GCP VM
# This script sets up the complete environment and starts all services

set -e

echo "======================================"
echo "VoxVeritas Deployment Script"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current username
CURRENT_USER=$(whoami)
HOME_DIR="/home/$CURRENT_USER"
PROJECT_DIR="$HOME_DIR/voxveritas"

echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

echo -e "${YELLOW}Step 2: Installing Node.js 18.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo -e "${GREEN}Node.js version: $(node --version)${NC}"
echo -e "${GREEN}npm version: $(npm --version)${NC}"

echo -e "${YELLOW}Step 3: Installing nginx...${NC}"
sudo apt install -y nginx

echo -e "${YELLOW}Step 4: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

echo -e "${YELLOW}Step 5: Installing Python and dependencies...${NC}"
sudo apt install -y python3 python3-pip python3-venv \
    libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender-dev

echo -e "${YELLOW}Step 6: Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/backend"
npm ci --production

echo -e "${YELLOW}Step 7: Setting up Python virtual environment for face-auth...${NC}"
cd "$PROJECT_DIR/Face-authorization-System"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

echo -e "${YELLOW}Step 8: Configuring nginx...${NC}"
sudo cp "$PROJECT_DIR/deployment/nginx-voxveritas.conf" /etc/nginx/sites-available/voxveritas
sudo ln -sf /etc/nginx/sites-available/voxveritas /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo -e "${YELLOW}Step 9: Setting up face-auth systemd service...${NC}"
# Replace placeholder with actual username
sed "s/YOUR_USERNAME/$CURRENT_USER/g" "$PROJECT_DIR/deployment/face-auth.service" | \
    sudo tee /etc/systemd/system/face-auth.service > /dev/null
sudo systemctl daemon-reload
sudo systemctl enable face-auth
sudo systemctl restart face-auth

echo -e "${YELLOW}Step 10: Starting backend with PM2...${NC}"
cd "$PROJECT_DIR/backend"
pm2 stop voxveritas-backend 2>/dev/null || true
pm2 delete voxveritas-backend 2>/dev/null || true
pm2 start startup.js --name voxveritas-backend
pm2 startup | grep 'sudo' | bash || true
pm2 save

echo -e "${GREEN}======================================"
echo -e "Deployment Complete!"
echo -e "======================================${NC}"
echo ""
echo "Services Status:"
echo "----------------"
pm2 status
echo ""
sudo systemctl status face-auth --no-pager
echo ""
sudo systemctl status nginx --no-pager
echo ""
echo -e "${GREEN}Your application is now running!${NC}"
echo ""
echo "Access your services:"
echo "  - Backend API: http://$(curl -s ifconfig.me)/api/"
echo "  - Face Auth: http://$(curl -s ifconfig.me)/face-auth/"
echo "  - Health Check: http://$(curl -s ifconfig.me)/health"
echo ""
echo "Useful commands:"
echo "  - View backend logs: pm2 logs voxveritas-backend"
echo "  - View face-auth logs: sudo journalctl -u face-auth -f"
echo "  - View nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "  - Restart backend: pm2 restart voxveritas-backend"
echo "  - Restart face-auth: sudo systemctl restart face-auth"
echo "  - Restart nginx: sudo systemctl restart nginx"
