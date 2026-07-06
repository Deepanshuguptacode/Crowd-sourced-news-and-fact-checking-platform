# Complete Deployment Guide - VoxVeritas Platform (Part 2)

## Phase 4: Face Authentication Service Deployment (Python + Flask)

### Why This Phase?
Deploy the Python-based face authentication service that handles:
- Face detection and cropping
- Feature extraction (embeddings)
- Face matching and verification
- InsightFace and ONNX Runtime integration

### Step 4.1: Create Python Virtual Environment

**Why Virtual Environment:**
- **Isolation:** Keeps dependencies separate from system Python
- **Version Control:** Ensures exact package versions for this app
- **Avoid Conflicts:** Prevents breaking other Python apps

**Navigate to Face Auth Directory:**
```bash
cd /home/deepa/Crowd-sourced-news-and-fact-checking-platform/Face-authorization-System
```

**Create Virtual Environment:**
```bash
python3 -m venv venv
```

**Command explanation:**
```bash
python3      # Use Python 3 interpreter
-m venv      # Run the venv module
venv         # Name of the directory to create (convention is 'venv')
```

**Activate Environment:**
```bash
source venv/bin/activate
```
*Notice your terminal prompt will change to include `(venv)` at the beginning, indicating the environment is active.*

### Step 4.2: Install Dependencies

**Why install dependencies:**
- **insightface:** Core facial recognition library
- **onnxruntime:** Runs machine learning models efficiently
- **Flask:** Lightweight web framework for API
- **gunicorn:** Production-ready WSGI HTTP Server for Python

**Install via requirements.txt:**
```bash
pip install -r requirements.txt
```

**Install Gunicorn:**
```bash
pip install gunicorn
```

**Verify Installation:**
```bash
python -c "import insightface; print('InsightFace installed')"
```

### Step 4.3: Setup Systemd Service for Face Auth

**Why Systemd:**
- **Reliability:** Keeps the Flask app running in the background
- **Auto-start:** Starts the service automatically on server boot
- **Log Management:** Centralized logging via `journalctl`

**Create Service File:**
```bash
sudo nano /etc/systemd/system/face-auth.service
```

**Add Configuration:**
```ini
[Unit]
Description=Gunicorn instance to serve VoxVeritas Face Auth
After=network.target

[Service]
User=deepa
Group=www-data
WorkingDirectory=/home/deepa/Crowd-sourced-news-and-fact-checking-platform/Face-authorization-System
Environment="PATH=/home/deepa/Crowd-sourced-news-and-fact-checking-platform/Face-authorization-System/venv/bin"
ExecStart=/home/deepa/Crowd-sourced-news-and-fact-checking-platform/Face-authorization-System/venv/bin/gunicorn --workers 1 --threads 4 --timeout 120 --bind 127.0.0.1:5000 app:app

[Install]
WantedBy=multi-user.target
```

**Explanation of Service Config:**
- `User=deepa`: Runs under your user, avoiding root access risks
- `Group=www-data`: Common web group for standard permissions
- `WorkingDirectory`: Path to the face auth code
- `ExecStart`: Uses Gunicorn to start `app.py` with 1 worker and 4 threads to save memory, and a 120-second timeout to allow ML models to load properly.

**Start and Enable Service:**
```bash
sudo systemctl daemon-reload
sudo systemctl start face-auth
sudo systemctl enable face-auth
```

**Verify Service Status:**
```bash
sudo systemctl status face-auth
# Should show "active (running)"
```

---

## Phase 5: Nginx Reverse Proxy Setup

### Why This Phase?
- Expose the backend (3000) and face-auth (5000) services via a single public entry point
- Provide a unified API domain (e.g., `api.voxveritas.me`)
- Handle HTTPS/SSL termination in later phases

### Step 5.1: Create Nginx Configuration

**Create Config File:**
```bash
sudo nano /etc/nginx/sites-available/voxveritas
```

**Add Configuration:**
```nginx
server {
    listen 80;
    server_name api.voxveritas.me; # Replace with your API subdomain

    # Proxy rules for Backend (Node.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Proxy rules for Face Authentication (Flask)
    location /face-auth/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # ML requests can be slow, increase timeouts
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
    }
}
```

### Step 5.2: Enable Configuration

**Create Symlink:**
```bash
sudo ln -s /etc/nginx/sites-available/voxveritas /etc/nginx/sites-enabled/
```

**Test and Restart Nginx:**
```bash
sudo nginx -t
# Should output: "nginx: configuration file /etc/nginx/nginx.conf test is successful"

sudo systemctl restart nginx
```

---

## Phase 6: Frontend Deployment on Vercel

### Why Vercel?
- Optimized for React/Vite applications
- Automatic CI/CD directly from GitHub
- Global Edge Network for fast content delivery
- Automatic SSL configuration for frontend

### Step 6.1: Vercel Dashboard Setup
1. Go to [Vercel](https://vercel.com/) and log in with GitHub
2. Click **Add New...** -> **Project**
3. Import the `Crowd-sourced-news-and-fact-checking-platform` repository

### Step 6.2: Configure Build Settings
- **Framework Preset:** Vite
- **Root Directory:** `frontend/` (Important: Vercel needs to know the app is in the sub-folder)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Step 6.3: Environment Variables
Add your frontend environment variables in Vercel before deploying:
- `VITE_API_URL`: `https://api.voxveritas.me` (or your chosen API domain)

**Click "Deploy"**
Wait 2-3 minutes for Vercel to build and deploy your React frontend.

---

## Phase 7: SSL Certificate with Cloudflare

### Why Cloudflare?
- Free SSL/TLS certificates (Full Strict Mode)
- Global CDN caching for speed
- Hide GCP VM IP address from attackers
- DDoS protection

### Step 7.1: Setup Cloudflare Origin CA (For API Server)
We need an SSL certificate on the GCP VM so Cloudflare can talk to it securely.

1. Go to Cloudflare Dashboard -> SSL/TLS -> Origin Server
2. Click **Create Certificate**
3. Keep default settings (RSA, 15 years) and click Create
4. Copy the **Origin Certificate** and **Private Key**

### Step 7.2: Install Certificate on GCP VM
Go back to your GCP VM terminal:

**Create SSL directory:**
```bash
sudo mkdir -p /etc/nginx/ssl
```

**Save Certificate:**
```bash
sudo nano /etc/nginx/ssl/cert.pem
# Paste the Origin Certificate here, save and exit
```

**Save Private Key:**
```bash
sudo nano /etc/nginx/ssl/key.pem
# Paste the Private Key here, save and exit
```

### Step 7.3: Update Nginx for HTTPS

**Edit Nginx Config:**
```bash
sudo nano /etc/nginx/sites-available/voxveritas
```

**Replace with SSL Config:**
```nginx
server {
    listen 80;
    server_name api.voxveritas.me;
    return 301 https://$host$request_uri; # Redirect HTTP to HTTPS
}

server {
    listen 443 ssl;
    server_name api.voxveritas.me;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Cloudflare Authenticated Origin Pulls (Security Best Practice)
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:3000;
        # ... (keep existing proxy headers)
    }

    location /face-auth/ {
        proxy_pass http://127.0.0.1:5000/;
        # ... (keep existing proxy headers)
    }
}
```

**Test and Restart:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Phase 8: DNS Configuration

### Step 8.1: Setup Cloudflare DNS Records
Go to Cloudflare Dashboard -> DNS -> Records

**Add API Record (Points to GCP):**
- Type: `A`
- Name: `api`
- IPv4 address: `34.131.44.0` (Your GCP Static IP)
- Proxy status: Proxied (Orange cloud)

**Add Frontend Record (Points to Vercel):**
- Type: `CNAME`
- Name: `@` (Root) or `www`
- Target: `cname.vercel-dns.com` (Check Vercel domain settings for exact target)
- Proxy status: Proxied

---

## Phase 9: Final Testing & Verification

**Checklist:**
1. **Frontend Loads:** Visit `https://voxveritas.me`. Does the React app load securely?
2. **API Responds:** Open `https://api.voxveritas.me/health` in browser. Do you get a JSON response?
3. **Face Auth Pipeline:** Attempt a registration or login using face auth on the frontend. Check VM logs to ensure the request hit Gunicorn correctly.
4. **Database Writes:** Create a test news post and ensure it shows up in MongoDB Atlas.

---

## Phase 10: Monitoring & Maintenance

### Log Management
- **Nginx Error Logs:** `sudo tail -f /var/log/nginx/error.log`
- **Node.js (PM2) Logs:** `pm2 logs voxveritas-backend`
- **Face Auth (Systemd) Logs:** `sudo journalctl -u face-auth -f`

### Regular Maintenance
- Update Ubuntu packages monthly: `sudo apt update && sudo apt upgrade -y`
- Monitor GCP Billing dashboard weekly to avoid surprises.
- Setup MongoDB Atlas alerts for high memory or connection spikes.

---
**Deployment Complete!** 🚀
Your Crowd-Sourced News and Fact-Checking Platform is now live, secure, and production-ready.
