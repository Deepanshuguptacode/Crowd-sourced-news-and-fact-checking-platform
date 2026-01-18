# VoxVeritas GCP Deployment Guide

## Prerequisites

1. GCP VM running Ubuntu 22.04
2. MongoDB Atlas cluster (or MongoDB instance)
3. Google Gemini API keys (3 keys)
4. Domain name (optional)

## Quick Deployment

### On Your Local Machine

1. **Create `.env` file in `backend/` directory:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your actual credentials
   ```

2. **Create `.env` file in `Face-authorization-System/` directory:**
   ```bash
   cp Face-authorization-System/.env.example Face-authorization-System/.env
   # Edit if needed
   ```

3. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add deployment configurations"
   git push origin main
   ```

### On Your GCP VM

1. **SSH into your VM:**
   ```bash
   gcloud compute ssh voxveritas --zone=asia-south2-b
   ```

2. **Clone the repository:**
   ```bash
   mkdir -p ~/voxveritas
   cd ~/voxveritas
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
   ```

3. **Copy environment files:**
   ```bash
   # Create backend .env
   nano backend/.env
   # Paste your environment variables

   # Create face-auth .env (optional)
   nano Face-authorization-System/.env
   # Add any custom configuration
   ```

4. **Run deployment script:**
   ```bash
   chmod +x deployment/deploy.sh
   ./deployment/deploy.sh
   ```

5. **Configure firewall rules (if not done):**
   ```bash
   # On your local machine
   gcloud compute firewall-rules create allow-http --allow tcp:80
   gcloud compute firewall-rules create allow-https --allow tcp:443
   ```

## Manual Deployment Steps

If you prefer manual deployment, follow these steps:

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Install Dependencies
```bash
sudo apt install -y nginx python3 python3-pip python3-venv \
    libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender-dev git
sudo npm install -g pm2
```

### 4. Setup Backend
```bash
cd ~/voxveritas/backend
npm ci --production
pm2 start startup.js --name voxveritas-backend
pm2 startup
pm2 save
```

### 5. Setup Face-Auth
```bash
cd ~/voxveritas/Face-authorization-System
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Install systemd service
sudo cp ~/voxveritas/deployment/face-auth.service /etc/systemd/system/
# Edit the service file to replace YOUR_USERNAME with your actual username
sudo systemctl daemon-reload
sudo systemctl enable face-auth
sudo systemctl start face-auth
```

### 6. Configure nginx
```bash
sudo cp ~/voxveritas/deployment/nginx-voxveritas.conf /etc/nginx/sites-available/voxveritas
sudo ln -s /etc/nginx/sites-available/voxveritas /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## Monitoring

### Check Service Status
```bash
# Backend
pm2 status
pm2 logs voxveritas-backend

# Face-Auth
sudo systemctl status face-auth
sudo journalctl -u face-auth -f

# nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log
```

### System Resources
```bash
# Install htop
sudo apt install htop
htop
```

## Updating Your Application

```bash
cd ~/voxveritas
git pull origin main

# Restart services
pm2 restart voxveritas-backend
sudo systemctl restart face-auth
sudo systemctl reload nginx
```

## Troubleshooting

### Backend not starting
```bash
pm2 logs voxveritas-backend --lines 100
# Check .env file exists and has correct values
```

### Face-Auth not working
```bash
sudo journalctl -u face-auth -n 100
# Check Python dependencies installed correctly
```

### nginx errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

## SSL/HTTPS Setup (Optional)

Install Let's Encrypt certificate:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Security Checklist

- [ ] Change default SSH port
- [ ] Set up UFW firewall
- [ ] Use strong passwords
- [ ] Enable automatic security updates
- [ ] Regular backups of MongoDB
- [ ] Monitor logs regularly
- [ ] Use environment variables for secrets (never commit .env)
