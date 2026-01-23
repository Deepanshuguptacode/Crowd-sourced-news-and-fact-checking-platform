# Complete Deployment Guide - VoxVeritas Platform
## From Zero to Production on GCP with Cloudflare SSL

**Author:** Deepanshu Gupta  
**Platform:** Crowd-Sourced News and Fact-Checking Platform  
**Last Updated:** January 2026  
**Deployment Type:** GCP VM (Backend + Face-Auth) + Vercel (Frontend) + Cloudflare (SSL/CDN)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Prerequisites](#3-prerequisites)
4. [Phase 1: GCP Virtual Machine Setup](#phase-1-gcp-virtual-machine-setup)
5. [Phase 2: Initial Server Configuration](#phase-2-initial-server-configuration)
6. [Phase 3: Backend Deployment (Node.js + Express)](#phase-3-backend-deployment-nodejs--express)
7. [Phase 4: Face Authentication Service Deployment (Python + Flask)](#phase-4-face-authentication-service-deployment-python--flask)
8. [Phase 5: Nginx Reverse Proxy Setup](#phase-5-nginx-reverse-proxy-setup)
9. [Phase 6: Frontend Deployment on Vercel](#phase-6-frontend-deployment-on-vercel)
10. [Phase 7: SSL Certificate with Cloudflare](#phase-7-ssl-certificate-with-cloudflare)
11. [Phase 8: DNS Configuration](#phase-8-dns-configuration)
12. [Phase 9: Final Testing & Verification](#phase-9-final-testing--verification)
13. [Phase 10: Monitoring & Maintenance](#phase-10-monitoring--maintenance)
14. [Troubleshooting Guide](#troubleshooting-guide)
15. [Command Reference](#command-reference)

---

## 1. Project Overview

### What is VoxVeritas?

VoxVeritas is a crowd-sourced news and fact-checking platform that combines:
- **Community News Posting** - Users can submit news articles
- **AI-Powered Fact Checking** - Google Gemini AI analyzes content authenticity
- **Face Authentication** - Secure biometric login using facial recognition
- **Expert Verification** - Experts can verify and comment on news authenticity
- **Debate Forums** - Users can discuss news credibility

### Technology Stack

**Frontend:**
- React 18.3.1 (UI Library)
- Vite 6.0.5 (Build Tool)
- Tailwind CSS (Styling)
- Deployed on: Vercel

**Backend:**
- Node.js 18.x (Runtime)
- Express.js 4.21.2 (Web Framework)
- MongoDB Atlas (Database)
- PM2 (Process Manager)
- Deployed on: GCP VM

**Face Authentication:**
- Python 3.9+ (Runtime)
- Flask 2.3.3 (Web Framework)
- InsightFace 0.7.3 (Face Recognition)
- ONNX Runtime (ML Inference)
- Systemd (Service Manager)
- Deployed on: GCP VM

**Infrastructure:**
- GCP Compute Engine (e2-standard-2)
- Nginx (Reverse Proxy)
- Cloudflare (SSL/TLS + CDN + DDoS Protection)

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                     https://voxveritas.me                       │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ HTTPS (443)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE CDN                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SSL/TLS Encryption (Full Strict Mode)                  │   │
│  │  DDoS Protection                                         │   │
│  │  Caching & Performance                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────┬───────────────────────┬─────────────────────────┘
                │                       │
                │ Frontend Traffic      │ Backend/API Traffic
                ▼                       ▼
    ┌───────────────────────┐   ┌─────────────────────────────┐
    │   VERCEL (Frontend)   │   │   GCP VM (34.131.44.0)      │
    │ ───────────────────── │   │ ──────────────────────────  │
    │  React + Vite App     │   │  Nginx Reverse Proxy        │
    │  Static Files         │   │  (Port 80, 443)             │
    │  https://voxveritas.me│   │                             │
    └───────────────────────┘   └──────────┬──────────────────┘
                                           │
                                           │ Proxies to:
                        ┌──────────────────┴──────────────────┐
                        │                                     │
                        ▼                                     ▼
            ┌───────────────────────┐         ┌──────────────────────┐
            │  Backend (Node.js)    │         │  Face Auth (Flask)   │
            │  ─────────────────    │         │  ──────────────────  │
            │  Express.js           │         │  Python + InsightFace│
            │  Port: 3000           │         │  Port: 5000          │
            │  Process: PM2         │         │  Process: Systemd    │
            │  ────────────────     │         │  ────────────────    │
            │  Routes:              │         │  Routes:             │
            │  /api/*               │         │  /face-auth/api/*    │
            │  /users/*             │         │                      │
            │  /news/*              │         │  - detect_face       │
            │  /health              │         │  - verify_face       │
            │                       │         │  - register_face     │
            │  Gemini AI            │         │  - extract_embedding │
            │  Integration          │         │  - check_duplicate   │
            └───────────┬───────────┘         └──────────┬───────────┘
                        │                                │
                        │                                │
                        └────────────┬───────────────────┘
                                     │
                                     ▼
                        ┌──────────────────────────┐
                        │   MongoDB Atlas          │
                        │   (Cloud Database)       │
                        │   ──────────────────     │
                        │   Collections:           │
                        │   - users                │
                        │   - news                 │
                        │   - comments             │
                        │   - debates              │
                        │   - faceEmbeddings       │
                        └──────────────────────────┘
```

**Request Flow:**

1. User accesses `https://voxveritas.me` → Cloudflare CDN → Vercel (Frontend)
2. Frontend makes API call to `https://api.voxveritas.me/news/posts`
3. Cloudflare routes to GCP VM → Nginx → Backend (Port 3000)
4. Backend queries MongoDB Atlas and returns data
5. Frontend displays news to user
6. For face authentication: Frontend → Cloudflare → Nginx → Face-Auth (Port 5000)

---

## 3. Prerequisites

### Required Accounts

1. **Google Cloud Platform (GCP)**
   - Create account: https://cloud.google.com/
   - Enable billing (first $300 free credit)
   - Why: Host backend and face-auth services

2. **GitHub**
   - Create account: https://github.com/
   - Create repository for your project
   - Why: Version control and deployment automation

3. **MongoDB Atlas**
   - Create account: https://www.mongodb.com/cloud/atlas
   - Create free cluster (M0)
   - Why: Cloud database for storing users, news, comments

4. **Vercel**
   - Create account: https://vercel.com/
   - Connect GitHub account
   - Why: Deploy frontend with automatic CI/CD

5. **Cloudflare**
   - Create account: https://dash.cloudflare.com/sign-up
   - Free plan sufficient
   - Why: Free SSL certificates, CDN, DDoS protection

6. **Namecheap (or any domain registrar)**
   - Buy domain: `voxveritas.me` (example)
   - Why: Custom domain for professional deployment

7. **Google AI Studio**
   - Get API key: https://ai.google.dev/
   - Create 3 API keys for rotation
   - Why: Gemini AI for fact-checking

### Required Software (Local Machine)

**Windows:**
```powershell
# Git for Windows
# Download from: https://git-scm.com/download/win
# Why: Version control operations

# Node.js 18.x LTS
# Download from: https://nodejs.org/
# Why: Run frontend build commands locally

# Visual Studio Code (Optional but recommended)
# Download from: https://code.visualstudio.com/
# Why: Code editor with terminal integration
```

**Verify installations:**

```powershell
# Check Git version
git --version
# Expected: git version 2.43.0 or higher
# Explanation: Confirms Git is installed correctly

# Check Node.js version
node --version
# Expected: v18.x.x or higher
# Explanation: Node.js is needed for frontend build

# Check npm version
npm --version
# Expected: 9.x.x or higher
# Explanation: npm is Node's package manager
```

### Knowledge Requirements

**Basic understanding of:**
- Command line/terminal operations
- Git version control basics
- SSH connections
- Environment variables
- HTTP/HTTPS concepts
- REST APIs

**Don't worry if you're not an expert - this guide explains everything step-by-step!**

---

## Phase 1: GCP Virtual Machine Setup

### Why GCP?

- **Reliability:** 99.95% uptime SLA
- **Scalability:** Easy to upgrade resources
- **Cost-effective:** Pay only for what you use (~$30-50/month for e2-standard-2)
- **Global reach:** Data centers worldwide
- **Integration:** Works seamlessly with other Google services

### Step 1.1: Create GCP Project

**Why:** Projects organize all your GCP resources (VMs, networks, billing)

**Commands/Actions:**

1. Go to: https://console.cloud.google.com/

2. Click **"Create Project"** (top bar)

3. **Enter details:**
   ```
   Project Name: voxveritas-production
   Location: No organization
   ```
   
   **Why these values:**
   - Descriptive name helps identify the project
   - "No organization" is fine for personal projects

4. Click **"Create"**

5. **Wait 30 seconds** for project creation

6. **Select the project** from dropdown (top bar)

### Step 1.2: Enable Required APIs

**Why:** GCP requires explicit API enablement for security

**Commands/Actions:**

1. Go to: **Navigation Menu (☰)** → **APIs & Services** → **Library**

2. Search and enable:
   - **Compute Engine API** (for VM creation)
   - **Cloud Resource Manager API** (for project management)

3. Click **"Enable"** for each

**Explanation:**
- These APIs allow programmatic control of compute resources
- Free to enable, you only pay for actual VM usage

### Step 1.3: Create Virtual Machine Instance

**Why:** This VM will host both backend and face-auth services

**Navigate to:**
- **Navigation Menu (☰)** → **Compute Engine** → **VM instances**

**Click "Create Instance"**

**Configuration:**

```yaml
Name: news-fact-check-vm
# Why: Descriptive name for easy identification

Region: asia-south2 (Delhi)
# Why: Closest to your users = lower latency
# Other options: us-central1 (Iowa), europe-west1 (Belgium)

Zone: asia-south2-b
# Why: Specific data center within region
# Best practice: Choose -b zone for better availability

Machine Configuration:
  Series: E2
  # Why: Cost-optimized for web servers
  # E2 is balance between performance and cost
  
  Machine Type: e2-standard-2
  # Why: 2 vCPUs + 8GB RAM sufficient for our needs
  # Specs breakdown:
  #   - 2 vCPU: Handles concurrent requests (backend + face-auth)
  #   - 8 GB RAM: ~4GB for Node.js, ~3GB for Python/ML models, 1GB buffer
  # Cost: ~$50/month
  # Alternatives:
  #   - e2-medium (1 vCPU, 4GB): Too small for face recognition
  #   - e2-standard-4 (4 vCPU, 16GB): Overkill and expensive

Boot Disk:
  Operating System: Ubuntu
  # Why: Most popular Linux for web servers, excellent package support
  
  Version: Ubuntu 22.04 LTS
  # Why: LTS = Long Term Support (5 years of updates)
  
  Boot disk type: Balanced persistent disk
  # Why: Good balance of performance and cost
  
  Size: 30 GB
  # Why: 
  #   - OS: ~5GB
  #   - Node.js + dependencies: ~2GB
  #   - Python + ML models: ~5GB
  #   - Logs + uploads: ~5GB
  #   - Buffer: ~13GB
  # Note: Can expand later if needed

Firewall:
  ☑ Allow HTTP traffic (port 80)
  # Why: Required for Cloudflare to reach your server
  
  ☑ Allow HTTPS traffic (port 443)
  # Why: SSL/TLS encrypted traffic
```

**Click "Create"** (bottom of page)

**Wait 2-3 minutes** for VM provisioning

**Understanding VM Costs:**

```
e2-standard-2 pricing (as of 2026):
- Compute: $0.067/hour = ~$49/month (if running 24/7)
- Storage: 30GB × $0.10/GB-month = $3/month
- Network egress: First 1GB free, then $0.12/GB

Total: ~$52/month

Cost optimization tips:
1. Use preemptible VMs (70% cheaper but can be shut down)
2. Committed use discounts (save up to 57% with 1-3 year commitment)
3. Right-size your VM after monitoring actual usage
```

### Step 1.4: Configure Firewall Rules

**Why:** By default, GCP blocks all incoming traffic except SSH. We need to open specific ports.

**Navigate to:**
- **Navigation Menu (☰)** → **VPC network** → **Firewall**

**Click "Create Firewall Rule"**

**Rule 1: Allow HTTP (Port 80)**

```yaml
Name: allow-http
# Why: Descriptive name for the rule

Direction: Ingress
# Explanation: Ingress = incoming traffic, Egress = outgoing traffic
# Why: We want to allow traffic TO our server

Action on match: Allow
# Why: Permit the traffic (vs. Deny)

Targets: All instances in the network
# Why: Apply to all VMs (can be more specific in production)

Source IP ranges: 0.0.0.0/0
# Why: Allow from anywhere in the world
# Explanation: 0.0.0.0/0 means "any IP address"
# In production: Could restrict to Cloudflare IPs only

Protocols and ports: tcp:80
# Why: HTTP uses TCP protocol on port 80
```

**Rule 2: Allow HTTPS (Port 443)**

```yaml
Name: allow-https
Direction: Ingress
Action on match: Allow
Targets: All instances in the network
Source IP ranges: 0.0.0.0/0
Protocols and ports: tcp:443
# Why: HTTPS uses TCP protocol on port 443
```

**Click "Create"** for each rule

**Explanation of Ports:**

```
Port 22 (SSH): Already open by default - for remote access
Port 80 (HTTP): Web traffic (redirects to HTTPS)
Port 443 (HTTPS): Secure web traffic (main entry point)
Port 3000 (Backend): Internal only, not exposed to internet
Port 5000 (Face-auth): Internal only, not exposed to internet

Security Model:
Internet → Cloudflare → Nginx (443) → Backend (3000) / Face-auth (5000)
```

### Step 1.5: Reserve Static External IP

**Why:** By default, VMs get dynamic IPs that change on restart. Static IP stays permanent.

**Navigate to:**
- **Navigation Menu (☰)** → **VPC network** → **IP addresses**

**Click "Reserve External Static Address"**

```yaml
Name: voxveritas-static-ip

IP version: IPv4
# Why: Most common, universally supported

Type: Regional
# Why: Cheaper than Global ($7/month vs $18/month)

Region: asia-south2
# Why: Must match VM region

Attached to: news-fact-check-vm
# Why: Assign to our VM immediately
```

**Click "Reserve"**

**Copy the IP address** (example: `34.131.44.0`)

**Why Static IP is important:**
- DNS records point to this IP
- IP won't change after VM restarts
- Required for Cloudflare setup
- Easier debugging (consistent IP)

**Cost:** $7.20/month (if VM is always running, FREE if attached to running VM)

### Step 1.6: Set Up SSH Access

**Why:** SSH (Secure Shell) lets you remotely control the VM via command line

**Method 1: Using GCP Console (Easiest for first time)**

1. **VM Instances page** → Find your VM
2. Click **"SSH"** button (under Connect column)
3. **New browser window** opens with terminal
4. **Done!** You're connected to VM

**Method 2: Using Local Terminal (Recommended for regular use)**

**Windows PowerShell:**

```powershell
# Install Google Cloud SDK
# Download from: https://cloud.google.com/sdk/docs/install

# Initialize gcloud
gcloud init
# Why: Sets up authentication and default project
# Follow prompts:
#   1. Login with Google account
#   2. Select project: voxveritas-production
#   3. Set default region: asia-south2-b

# Connect to VM
gcloud compute ssh news-fact-check-vm --zone=asia-south2-b
# Syntax: gcloud compute ssh [VM_NAME] --zone=[ZONE]
# Why --zone: Specifies which data center has your VM
```

**Explanation of gcloud command:**

```bash
gcloud          # Google Cloud command-line tool
compute         # Compute Engine service
ssh             # SSH connection
news-fact-check-vm   # Your VM name
--zone=asia-south2-b # Data center location
```

**First connection will:**
1. Generate SSH key pair (~/.ssh/google_compute_engine)
2. Upload public key to GCP
3. Establish connection
4. Display welcome message

**Method 3: Using SSH Key (Advanced)**

```powershell
# Generate SSH key (if not exists)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# Why RSA: Industry-standard encryption algorithm
# Why 4096: Key length in bits (more secure)
# Saves to: C:\Users\YourName\.ssh\id_rsa

# Copy public key
Get-Content C:\Users\YourName\.ssh\id_rsa.pub | Set-Clipboard
# Why: Public key is safe to share, private key must stay secret

# Add to GCP
# Go to: Compute Engine → Metadata → SSH Keys
# Click "Add SSH Key"
# Paste public key
# Username will be extracted from key

# Connect
ssh -i C:\Users\YourName\.ssh\id_rsa username@34.131.44.0
# Syntax: ssh -i [PRIVATE_KEY_PATH] [USER]@[IP]
# Why -i: Specifies identity file (private key)
```

**SSH Security Best Practices:**

```bash
# Never share private key (~/.ssh/id_rsa)
# Only share public key (~/.ssh/id_rsa.pub)
# Use strong passphrase when generating key
# Rotate keys periodically (every 6-12 months)
# Disable password authentication (use keys only)
```

**Verify Connection:**

```bash
# After connecting, you should see:
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-1045-gcp x86_64)

deepa@news-fact-check-vm:~$
# Explanation:
# deepa: Your username
# news-fact-check-vm: VM hostname
# ~: Current directory (home)
# $: Regular user (# means root user)
```

---

## Phase 2: Initial Server Configuration

### Why This Phase?

Before deploying applications, we need to:
1. **Update system packages** (security patches)
2. **Install required software** (Node.js, Python, Nginx, etc.)
3. **Configure firewall** (Ubuntu UFW)
4. **Set up user permissions** (avoid using root)

### Step 2.1: Update System Packages

**Why:** Fresh Ubuntu installations need latest security updates

**Command:**

```bash
sudo apt update && sudo apt upgrade -y
```

**Syntax Breakdown:**

```bash
sudo          # Execute as superuser (admin privileges)
              # Why needed: System updates require admin access

apt update    # Downloads package lists from repositories
              # Explanation: Refreshes available package versions
              # Doesn't install anything, just updates catalog

&&            # Logical AND operator
              # Explanation: Run next command only if first succeeds
              # Why: No point upgrading if update fails

apt upgrade   # Upgrades installed packages to latest versions
              # Explanation: Actually installs updates

-y            # Automatically answer "yes" to prompts
              # Why: Prevents interactive prompts during automation
```

**What this does:**

1. **apt update:**
   - Connects to Ubuntu package repositories
   - Downloads latest package index
   - Shows available updates
   - Output: "Fetched 25.4 MB in 3s"

2. **apt upgrade:**
   - Downloads updated packages
   - Installs updates
   - Configures new versions
   - Output: "Upgraded 47 packages, 0 newly installed"

**Expected time:** 3-5 minutes

**Alternative command (if you want to see what will be updated):**

```bash
sudo apt update
# Review the list

sudo apt list --upgradable
# Shows packages that will be upgraded

sudo apt upgrade
# Proceed with upgrade
```

### Step 2.2: Install Essential Packages

**Why:** These are dependencies needed by various services

**Command:**

```bash
sudo apt install -y curl wget git build-essential software-properties-common
```

**What each package does:**

```bash
curl              # Download files from URLs
                  # Example: curl https://api.example.com
                  # Used by: API testing, downloading installers
                  # Alternative: wget (similar tool)

wget              # Download files from URLs (older than curl)
                  # Example: wget https://example.com/file.zip
                  # Used by: Downloading large files, scripts
                  # Difference from curl: Better for file downloads

git               # Version control system
                  # Used by: Cloning repository from GitHub
                  # Commands: git clone, git pull, git push

build-essential   # C/C++ compiler and libraries
                  # Includes: gcc, g++, make
                  # Why needed: Some Node.js/Python packages compile from source
                  # Example: node-gyp builds native addons

software-properties-common
                  # Manages APT repositories
                  # Provides: add-apt-repository command
                  # Used by: Adding Node.js, Python PPAs
```

**Verify installations:**

```bash
curl --version
# Expected: curl 7.81.0

git --version
# Expected: git version 2.34.1

gcc --version
# Expected: gcc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0
```

### Step 2.3: Install Node.js 18.x LTS

**Why Node.js 18:**
- LTS (Long Term Support) = Stable, maintained until 2025
- Required by: Backend Express.js application
- Version 18 specific features: Native Fetch API, Test runner

**Method 1: Using NodeSource Repository (Recommended)**

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```

**Command Explanation:**

```bash
curl              # Download utility
-f                # Fail silently on HTTP errors
-s                # Silent mode (no progress bar)
-S                # Show errors even in silent mode
-L                # Follow redirects

https://deb.nodesource.com/setup_18.x
                  # NodeSource setup script URL
                  # What it does: Adds NodeSource to APT sources

|                 # Pipe operator
                  # Explanation: Passes curl output to next command

sudo -E bash -    # Execute script as root, preserve environment
                  # Why sudo: Script modifies system files
                  # Why -E: Keep environment variables
                  # Why bash -: Execute piped input as bash script
```

**What the script does:**

1. Detects your Ubuntu version
2. Adds NodeSource GPG key (for package verification)
3. Adds NodeSource repository to `/etc/apt/sources.list.d/`
4. Runs `apt update`

**Output:**

```
## Installing the NodeSource Node.js 18.x repo...
## Run `sudo apt-get install -y nodejs` to install Node.js 18.x
```

**Install Node.js:**

```bash
sudo apt install -y nodejs
```

**Verify installation:**

```bash
node --version
# Expected: v18.19.0 or higher

npm --version
# Expected: 9.2.0 or higher

# Check Node.js was installed with correct version
which node
# Expected: /usr/bin/node
```

**Understanding versions:**

```
v18.19.0
 │  │  └── Patch version (bug fixes)
 │  └───── Minor version (new features, backwards compatible)
 └──────── Major version (breaking changes)

npm@9.2.0 comes bundled with Node.js 18
```

**Test Node.js:**

```bash
node -e "console.log('Node.js works!')"
# Output: Node.js works!
# Explanation: -e flag executes JavaScript code directly
```

**Method 2: Using NVM (Alternative, for version management)**

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js 18
nvm install 18

# Set default version
nvm alias default 18

# Why NVM: Allows multiple Node.js versions on same system
# Use case: Testing app with different Node versions
```

### Step 2.4: Install Python 3.9+ and pip

**Why Python:**
- Required by: Face authentication service (InsightFace)
- Version 3.9+: Needed for InsightFace compatibility
- pip: Python package manager

**Check current version:**

```bash
python3 --version
# Expected on Ubuntu 22.04: Python 3.10.12
# Good! 3.10 > 3.9 requirement
```

**Install Python development headers:**

```bash
sudo apt install -y python3-dev python3-pip python3-venv
```

**What each package does:**

```bash
python3-dev       # Python header files
                  # Why needed: Compile Python C extensions
                  # Example: numpy, opencv require C compilation

python3-pip       # pip package manager
                  # Used by: Installing Python libraries
                  # Commands: pip install, pip uninstall

python3-venv      # Virtual environment support
                  # Why needed: Isolate Python dependencies
                  # Optional but recommended for production
```

**Upgrade pip:**

```bash
python3 -m pip install --upgrade pip
```

**Command explanation:**

```bash
python3 -m        # Run Python module as script
                  # Why: Ensures using Python 3's pip, not Python 2

pip               # Module name (pip package manager)

install --upgrade # Install or upgrade to latest version

pip               # Package to upgrade (pip itself!)
```

**Verify installation:**

```bash
python3 --version
# Output: Python 3.10.12

pip3 --version
# Output: pip 24.0 from /usr/lib/python3/dist-packages/pip (python 3.10)

# Test Python
python3 -c "print('Python works!')"
# Output: Python works!
```

### Step 2.5: Install Nginx Web Server

**Why Nginx:**
- **Reverse Proxy:** Routes traffic to backend (3000) and face-auth (5000)
- **SSL Termination:** Handles HTTPS encryption/decryption
- **Load Balancing:** Can distribute load across multiple backends
- **Static Files:** Serves static content efficiently
- **Security:** Additional layer of protection

**Nginx vs Apache:**

```
Nginx:
- Event-driven architecture (faster for static content)
- Low memory footprint (~2-3 MB per worker)
- Better for reverse proxy and load balancing
- Used by: Netflix, Airbnb, NASA

Apache:
- Process-driven architecture
- More modules available
- Better for .htaccess and dynamic content
- Older, more documentation

Our choice: Nginx (better for our use case)
```

**Install Nginx:**

```bash
sudo apt install -y nginx
```

**Nginx automatically:**
1. Installs to `/etc/nginx/`
2. Creates systemd service
3. Starts on port 80
4. Enables auto-start on boot

**Verify Nginx:**

```bash
# Check Nginx version
nginx -v
# Output: nginx version: nginx/1.18.0 (Ubuntu)

# Check if Nginx is running
sudo systemctl status nginx
```

**Understanding systemctl status output:**

```bash
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running) since Sat 2026-01-18 12:00:00 UTC; 2min ago
   
Explanation:
- ● (green): Service is active
- Loaded: Service file found and loaded
- enabled: Will start automatically on boot
- active (running): Currently running
- Main PID: Process ID of main Nginx process
```

**Test Nginx:**

```bash
# From VM (internal test)
curl http://localhost
# Expected: HTML content starting with "<!DOCTYPE html>"

# From browser (external test)
# Open: http://34.131.44.0 (your VM IP)
# Expected: "Welcome to nginx!" page
```

**Nginx file structure:**

```bash
/etc/nginx/
├── nginx.conf              # Main configuration
├── sites-available/        # Available site configurations
│   └── default            # Default site config
├── sites-enabled/          # Active site configurations
│   └── default -> ../sites-available/default  # Symlink
├── conf.d/                 # Additional configs
└── modules-enabled/        # Loaded modules

Understanding symlinks:
- sites-available: All configs (enabled or not)
- sites-enabled: Only active configs (symlinks)
- To enable: ln -s sites-available/mysite sites-enabled/
- To disable: rm sites-enabled/mysite
```

**Common Nginx commands:**

```bash
# Start Nginx
sudo systemctl start nginx

# Stop Nginx
sudo systemctl stop nginx

# Restart Nginx (stops then starts)
sudo systemctl restart nginx

# Reload Nginx (reload config without downtime)
sudo systemctl reload nginx

# Check configuration syntax
sudo nginx -t
# Output: nginx: configuration file /etc/nginx/nginx.conf test is successful

# Enable auto-start on boot
sudo systemctl enable nginx

# Disable auto-start
sudo systemctl disable nginx

# View Nginx logs
sudo tail -f /var/log/nginx/access.log  # Incoming requests
sudo tail -f /var/log/nginx/error.log   # Errors
```

### Step 2.6: Install PM2 Process Manager

**Why PM2:**
- **Process Management:** Keep Node.js app running forever
- **Auto-restart:** Restarts app if it crashes
- **Load Balancing:** Can run multiple instances
- **Monitoring:** Built-in CPU/memory monitoring
- **Logging:** Centralized log management
- **Startup Script:** Auto-start on system boot

**PM2 vs Forever vs nodemon:**

```
PM2:
- Production-grade process manager
- Built-in load balancer
- Monitoring dashboard
- Best for: Production deployments

Forever:
- Simpler, older alternative
- No load balancing
- Best for: Simple deployments

nodemon:
- Development only
- Auto-restarts on file changes
- Not for production
```

**Install PM2 globally:**

```bash
sudo npm install -g pm2
```

**Command explanation:**

```bash
sudo          # Run with admin privileges
              # Why: Installing globally requires system-level access

npm install   # Install Node.js package

-g            # Global flag
              # Explanation: Install system-wide, not in local project
              # Location: /usr/lib/node_modules/pm2
              # Benefit: Can use 'pm2' command anywhere

pm2           # Package name
```

**Verify PM2:**

```bash
pm2 --version
# Expected: 5.3.0 or higher

# Check PM2 installation path
which pm2
# Expected: /usr/bin/pm2

# Test PM2
pm2 list
# Expected: Empty list (no apps running yet)
```

**Understanding PM2 commands:**

```bash
pm2 start app.js          # Start application
pm2 start app.js --name myapp  # Start with custom name

pm2 list                  # List all processes
pm2 status                # Same as list

pm2 logs                  # View logs (all apps)
pm2 logs myapp            # View logs (specific app)
pm2 logs --lines 100      # View last 100 lines

pm2 restart myapp         # Restart app (graceful)
pm2 reload myapp          # Reload with 0-downtime

pm2 stop myapp            # Stop app (keep in PM2 list)
pm2 delete myapp          # Stop and remove from PM2

pm2 monit                 # Real-time monitoring dashboard
pm2 show myapp            # Detailed app information

pm2 save                  # Save current process list
pm2 resurrect             # Restore saved processes

pm2 startup               # Generate startup script
                         # Run on system boot
```

**PM2 ecosystem file (we'll create this later):**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'voxveritas-backend',
    script: './index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}

// Why ecosystem file:
// - Centralizes PM2 configuration
// - Environment-specific settings
// - Easy to version control
// - Repeatable deployments
```

### Step 2.7: Configure UFW Firewall (Ubuntu)

**Why UFW:**
- **Defense in depth:** Additional security layer after GCP firewall
- **Application-specific:** Allows by application name (nginx, ssh)
- **Simple syntax:** Easier than iptables
- **Logging:** Track connection attempts

**GCP Firewall vs UFW:**

```
GCP Firewall (External):
- Cloud-level protection
- Filters before traffic reaches VM
- Managed via GCP Console
- Priority: Primary defense

UFW (Internal):
- OS-level protection  
- Filters at VM network interface
- Managed via command line
- Priority: Secondary defense

Best Practice: Use both for defense in depth
```

**Check UFW status:**

```bash
sudo ufw status
# Expected: Status: inactive (on fresh Ubuntu)
```

**Configure UFW:**

```bash
# Allow SSH (port 22) - IMPORTANT! Do this first!
sudo ufw allow 22/tcp
```

**Why SSH first:**

```
CRITICAL: If you enable UFW without allowing SSH, you'll be locked out!
Always allow SSH before enabling firewall.
Port 22 = SSH (Secure Shell)
TCP protocol for terminal connections
```

**Allow HTTP and HTTPS:**

```bash
# Allow HTTP (port 80)
sudo ufw allow 80/tcp

# Allow HTTPS (port 443)
sudo ufw allow 443/tcp
```

**Alternative (allow by application name):**

```bash
sudo ufw allow 'Nginx Full'
# 'Nginx Full' = ports 80 and 443
# 'Nginx HTTP' = port 80 only
# 'Nginx HTTPS' = port 443 only
```

**Enable UFW:**

```bash
sudo ufw enable
```

**Output:**

```
Command may disrupt existing ssh connections. Proceed with operation (y|n)? y
Firewall is active and enabled on system startup
```

**Verify rules:**

```bash
sudo ufw status verbose
```

**Expected output:**

```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
22/tcp (v6)                ALLOW IN    Anywhere (v6)
80/tcp (v6)                ALLOW IN    Anywhere (v6)
443/tcp (v6)                ALLOW IN    Anywhere (v6)
```

**Understanding UFW rules:**

```bash
Default policy:
- deny (incoming): Block all incoming connections by default
- allow (outgoing): Allow all outgoing connections
- disabled (routed): Don't forward traffic between interfaces

Our rules:
- 22/tcp: SSH access (so we can connect)
- 80/tcp: HTTP (will redirect to HTTPS)
- 443/tcp: HTTPS (main entry point)

Ports NOT exposed:
- 3000: Backend (only accessible via Nginx internally)
- 5000: Face-auth (only accessible via Nginx internally)
- 27017: MongoDB (we use MongoDB Atlas, not local)
```

**Common UFW commands:**

```bash
# View numbered rules
sudo ufw status numbered

# Delete rule by number
sudo ufw delete 3

# Delete rule by specification
sudo ufw delete allow 80/tcp

# Allow specific IP
sudo ufw allow from 1.2.3.4

# Allow IP to specific port
sudo ufw allow from 1.2.3.4 to any port 22

# Block IP
sudo ufw deny from 1.2.3.4

# Disable firewall
sudo ufw disable

# Reset firewall (remove all rules)
sudo ufw reset

# View app profiles
sudo ufw app list
```

### Step 2.8: Create Application Directory Structure

**Why organized structure:**
- **Easier maintenance:** Know where everything is
- **Better security:** Proper ownership and permissions
- **Standard practice:** Follows Linux filesystem hierarchy

**Create directories:**

```bash
# Create project directory
sudo mkdir -p /var/www/voxveritas

# Why /var/www:
# - Standard location for web applications on Linux
# - /var = variable data (changes frequently)
# - /www = web content by convention

# Create subdirectories
sudo mkdir -p /var/www/voxveritas/{backend,face-auth,logs,backups}

# Explanation of {backend,face-auth,logs,backups}:
# Brace expansion creates multiple directories:
#   /var/www/voxveritas/backend
#   /var/www/voxveritas/face-auth
#   /var/www/voxveritas/logs
#   /var/www/voxveritas/backups
```

**Set ownership:**

```bash
# Change owner to current user (deepa)
sudo chown -R $USER:$USER /var/www/voxveritas
```

**Command explanation:**

```bash
chown            # Change ownership command

-R               # Recursive flag
                 # Why: Apply to directory and all contents

$USER:$USER      # user:group format
                 # $USER = your username (deepa)
                 # First $USER = file owner
                 # Second $USER = group owner

/var/www/voxveritas  # Target directory
```

**Set permissions:**

```bash
chmod -R 755 /var/www/voxveritas
```

**Understanding 755:**

```
7 5 5
│ │ └── Others: read + execute (4+1=5)
│ └──── Group: read + execute (4+1=5)
└────── Owner: read + write + execute (4+2+1=7)

Binary representation:
7 = 111 (rwx) - Owner can read, write, execute
5 = 101 (r-x) - Group/Others can read, execute
```

**Permission numbers:**

```
0 = --- (no permissions)
1 = --x (execute)
2 = -w- (write)
3 = -wx (write + execute)
4 = r-- (read)
5 = r-x (read + execute)
6 = rw- (read + write)
7 = rwx (read + write + execute)
```

**Verify structure:**

```bash
ls -la /var/www/voxveritas
```

**Expected output:**

```
drwxr-xr-x 6 deepa deepa 4096 Jan 18 12:00 .
drwxr-xr-x 3 root  root  4096 Jan 18 11:50 ..
drwxr-xr-x 2 deepa deepa 4096 Jan 18 12:00 backend
drwxr-xr-x 2 deepa deepa 4096 Jan 18 12:00 face-auth
drwxr-xr-x 2 deepa deepa 4096 Jan 18 12:00 logs
drwxr-xr-x 2 deepa deepa 4096 Jan 18 12:00 backups
```

**Understanding ls -la output:**

```
d rwx r-x r-x  6 deepa deepa 4096 Jan 18 12:00 backend
│ │   │   │    │   │     │    │      │           │
│ │   │   │    │   │     │    │      │           └─ Name
│ │   │   │    │   │     │    │      └─ Modified date
│ │   │   │    │   │     │    └─ Size (bytes)
│ │   │   │    │   │     └─ Group
│ │   │   │    │   └─ Owner
│ │   │   │    └─ Number of links
│ │   │   └─ Others permissions
│ │   └─ Group permissions
│ └─ Owner permissions
└─ File type (d=directory, -=file, l=link)
```

### Step 2.9: Install Additional Python Dependencies

**Why these packages:**
- **Face recognition:** InsightFace requires system libraries
- **Image processing:** OpenCV dependencies
- **Build tools:** For compiling Python C extensions

**Install system libraries:**

```bash
sudo apt install -y \
    libopencv-dev \
    python3-opencv \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx
```

**What each library does:**

```bash
libopencv-dev      # OpenCV development files
                   # Why: Computer vision library
                   # Used by: Face detection, image manipulation

python3-opencv     # Python bindings for OpenCV
                   # Why: Access OpenCV from Python
                   # Alternative: pip install opencv-python

libglib2.0-0       # GNOME library
                   # Why: Core system utilities
                   # Used by: Many Python packages

libsm6             # X11 Session Management library
libxext6           # X11 extensions library
libxrender-dev     # X Rendering Extension library
                   # Why all three: Required by OpenCV GUI functions

libgomp1           # GNU OpenMP library
                   # Why: Parallel processing support
                   # Used by: InsightFace for faster inference

libgl1-mesa-glx    # OpenGL library
                   # Why: 3D graphics support
                   # Used by: Some computer vision operations
```

**Verify OpenCV:**

```bash
python3 -c "import cv2; print(cv2.__version__)"
# Expected: 4.5.4 or higher
# Why test: Ensures OpenCV is properly installed
```

### Phase 2 Complete! ✅

**What we've accomplished:**

```
✅ System updated with latest security patches
✅ Node.js 18.x installed (for backend)
✅ Python 3.10+ installed (for face-auth)
✅ Nginx installed (for reverse proxy)
✅ PM2 installed (for process management)
✅ UFW configured (firewall protection)
✅ Directory structure created
✅ Python dependencies installed

Ready for: Application deployment
```

**Verify all installations:**

```bash
# Node.js
node --version && npm --version

# Python
python3 --version && pip3 --version

# Nginx
nginx -v

# PM2
pm2 --version

# UFW
sudo ufw status

# OpenCV
python3 -c "import cv2; print('OpenCV OK')"
```

**If all commands succeed, proceed to Phase 3!**

---

## Phase 3: Backend Deployment (Node.js + Express)

### Why This Phase?

Deploy the main backend API that handles:
- User authentication (JWT)
- News CRUD operations
- Comments and debates
- AI fact-checking (Gemini)
- Database operations (MongoDB)

### Step 3.1: Clone Repository from GitHub

**Why GitHub:**
- Version control history
- Collaborative development
- Automated deployments
- Backup and disaster recovery

**Navigate to home directory:**

```bash
cd ~
# ~ is shorthand for /home/deepa
# pwd command shows: /home/deepa
```

**Clone repository:**

```bash
git clone https://github.com/Deepanshuguptacode/Crowd-sourced-news-and-fact-checking-platform.git
```

**Command explanation:**

```bash
git clone         # Git command to copy repository

https://...       # Repository URL
                  # https: Uses HTTPS protocol (no SSH key needed)
                  # Alternative: git@github.com:user/repo.git (needs SSH key)

Effect:
1. Downloads entire repository
2. Creates directory with repo name
3. Initializes .git folder (version control)
4. Checks out main/master branch
```

**Understanding git clone output:**

```
Cloning into 'Crowd-sourced-news-and-fact-checking-platform'...
remote: Enumerating objects: 1234, done.
remote: Counting objects: 100% (1234/1234), done.
remote: Compressing objects: 100% (567/567), done.
remote: Total 1234 (delta 456), reused 1234 (delta 456)
Receiving objects: 100% (1234/1234), 2.34 MiB | 5.67 MiB/s, done.
Resolving deltas: 100% (456/456), done.

Explanation:
- remote: Operations on GitHub server
- Receiving objects: Downloading files
- Resolving deltas: Reconstructing file versions
- done: Clone successful
```

**Navigate to project:**

```bash
cd Crowd-sourced-news-and-fact-checking-platform
# cd = change directory

# Verify location
pwd
# Output: /home/deepa/Crowd-sourced-news-and-fact-checking-platform
```

**List directory contents:**

```bash
ls -la
```

**Expected structure:**

```
total 512
drwxr-xr-x 10 deepa deepa  4096 Jan 18 12:00 .
drwxr-x---  7 deepa deepa  4096 Jan 18 11:55 ..
drwxr-xr-x  8 deepa deepa  4096 Jan 18 12:00 .git
-rw-r--r--  1 deepa deepa  1234 Jan 18 12:00 .gitignore
-rw-r--r--  1 deepa deepa  5678 Jan 18 12:00 README.md
drwxr-xr-x  6 deepa deepa  4096 Jan 18 12:00 backend
drwxr-xr-x  4 deepa deepa  4096 Jan 18 12:00 Face-authorization-System
drwxr-xr-x  8 deepa deepa  4096 Jan 18 12:00 frontend
drwxr-xr-x  3 deepa deepa  4096 Jan 18 12:00 dataset
-rw-r--r--  1 deepa deepa  2345 Jan 18 12:00 package.json
```

**Understanding .git directory:**

```bash
.git/             # Hidden directory (starts with .)
├── config        # Repository configuration
├── HEAD          # Current branch pointer
├── objects/      # Compressed file storage
├── refs/         # Branch and tag references
└── logs/         # Change history

Why important:
- Contains entire project history
- Enables version control commands (git pull, push, etc.)
- Never delete this directory!
```

### Step 3.2: Configure Backend Environment Variables

**Why .env file:**
- **Security:** Keep secrets out of source code
- **Flexibility:** Change config without code changes
- **Environment-specific:** Different values for dev/prod
- **Best Practice:** Industry standard (12-factor app)

**Navigate to backend directory:**

```bash
cd backend
# Full path: /home/deepa/Crowd-sourced-news-and-fact-checking-platform/backend
```

**Create .env file:**

```bash
nano .env
# nano: Simple text editor (alternatives: vim, vi, emacs)
# Why nano: Easiest for beginners
```

**Add environment variables:**

```bash
# Environment Variables for Backend

# Gemini AI API Keys (3 keys for rotation)
GEMINI_API_KEY_1=AIzaSyAKC_ntqEyb8T5FERD2feyzC7WDMx00bbU
GEMINI_API_KEY_2=AIzaSyBhcuQGNuYgiEU33HKW2nJzC18hfXLHyWA
GEMINI_API_KEY_3=AIzaSyBv1_dj1ueig6J_4i-PROxqi-nWA2Y0Hxw

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=VoxVeritas

# JWT Secret (for token generation)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long_random_string_here

# Face Authentication Service URL
FACE_AUTH_URL=http://localhost:5000

# Frontend URL (for CORS)
FRONTEND_URL=https://voxveritas.me

# Server Configuration
PORT=3000
NODE_ENV=production
```

**Understanding each variable:**

```bash
GEMINI_API_KEY_1/2/3
# Purpose: Google Gemini AI API authentication
# Why 3 keys: Rotation to avoid rate limits
# Rate limit: 60 requests/minute per key
# With 3 keys: 180 requests/minute total
# Get keys: https://ai.google.dev/
# Format: AIzaSy[38_characters]

MONGODB_URI
# Purpose: Database connection string
# Format: mongodb+srv://user:pass@host/database?options
# Components:
#   - mongodb+srv: Protocol (srv = DNS seed list)
#   - username: Your MongoDB Atlas username
#   - password: Your MongoDB Atlas password (URL-encoded)
#   - cluster.mongodb.net: Your cluster hostname
#   - retryWrites=true: Auto-retry failed writes
#   - w=majority: Write concern (wait for majority acknowledgment)
#   - appName: Application identifier
# Security: Never commit this to Git!

JWT_SECRET
# Purpose: Sign and verify JWT tokens
# Requirements:
#   - Minimum 32 characters
#   - Random alphanumeric string
#   - High entropy (random, not dictionary words)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Example: 5f7d8a9c3e1b4f6a8d2c5e7f9b1a3d6e8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e
# Why important: Compromised secret = anyone can forge tokens

FACE_AUTH_URL
# Purpose: Internal URL for face authentication service
# Value: http://localhost:5000
# Why localhost: Both services on same VM
# Why http: Internal communication (nginx handles https externally)
# Port 5000: Flask default port

FRONTEND_URL
# Purpose: CORS configuration (allow requests from frontend)
# Value: https://voxveritas.me
# Why needed: Prevents unauthorized cross-origin requests
# Multiple: Can be comma-separated for multiple domains
# Example: https://voxveritas.me,https://www.voxveritas.me

PORT
# Purpose: Backend HTTP server port
# Value: 3000
# Why 3000: Node.js convention (3000-3999)
# Not exposed: Only accessible via nginx proxy

NODE_ENV
# Purpose: Environment detection (development/production)
# Value: production
# Effects:
#   - Disables verbose logging
#   - Enables caching
#   - Optimizes performance
#   - Changes error messages (less verbose)
```

**Save file:**

```
Press: Ctrl + X
Then: Y (yes to save)
Then: Enter (confirm filename)
```

**Verify .env file:**

```bash
cat .env
# cat: Concatenate and display file contents
# Should show all your environment variables
```

**Set proper permissions:**

```bash
chmod 600 .env
```

**Why 600 permissions:**

```
6 = rw- (read + write for owner only)
0 = --- (no permissions for group)
0 = --- (no permissions for others)

Effect:
- Only you can read/write .env
- Other users cannot see secrets
- Even other processes running as different users can't read it
```

**Security best practices for .env:**

```bash
# 1. Never commit .env to Git
echo ".env" >> .gitignore

# 2. Use different .env for each environment
.env.development
.env.production
.env.test

# 3. Backup .env securely
# Bad: Store in Git
# Good: Store in password manager (1Password, LastPass)
# Better: Use secret management service (AWS Secrets Manager, HashiCorp Vault)

# 4. Rotate secrets periodically
# JWT_SECRET: Every 6 months
# API keys: When team members leave
# Database passwords: Quarterly

# 5. Validate required variables on startup
const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});
```

### Step 3.3: Install Backend Dependencies

**Why install dependencies:**
- Project needs external libraries (Express, Mongoose, etc.)
- package.json lists all dependencies
- npm install downloads and installs them
- Creates node_modules folder

**Check package.json:**

```bash
cat package.json | head -20
# head -20: Show first 20 lines
# | (pipe): Pass output to next command
```

**Expected dependencies:**

```json
{
  "name": "voxveritas-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.21.2",      // Web framework
    "mongoose": "^8.9.5",       // MongoDB ODM
    "bcryptjs": "^2.4.3",       // Password hashing
    "jsonwebtoken": "^9.0.2",   // JWT tokens
    "cors": "^2.8.5",           // CORS handling
    "dotenv": "^16.4.7",        // Environment variables
    "axios": "^1.7.9",          // HTTP client
    "@google/generative-ai": "^0.21.0"  // Gemini AI
  }
}
```

**Install dependencies:**

```bash
npm install
# Alternative: npm i (shorthand)
```

**What npm install does:**

```bash
1. Reads package.json
2. Resolves dependency versions
3. Downloads packages from npm registry (https://registry.npmjs.org/)
4. Installs to node_modules/
5. Creates package-lock.json (locks exact versions)
6. Creates node_modules/.package-lock.json (metadata)

Output:
added 234 packages, and audited 235 packages in 45s

Explanation:
- added 234: Direct + transitive dependencies
- audited: Checked for known vulnerabilities
- 45s: Download + installation time
```

**Understanding node_modules structure:**

```bash
node_modules/
├── express/           # Direct dependency
│   ├── package.json
│   └── lib/
├── body-parser/       # Express dependency (transitive)
│   └── ...
├── mongoose/          # Direct dependency
│   └── ...
└── .bin/             # Executable scripts
    └── nodemon

Size: ~150-300 MB (varies by project)
Files: ~20,000-50,000 files
Why so many: Each package has its own dependencies
```

**Understanding package-lock.json:**

```json
{
  "name": "voxveritas-backend",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "packages": {
    "node_modules/express": {
      "version": "4.21.2",
      "resolved": "https://registry.npmjs.org/express/-/express-4.21.2.tgz",
      "integrity": "sha512-abc123...",
      "dependencies": {...}
    }
  }
}

Why important:
- Locks exact versions (4.21.2, not ^4.21.2)
- Ensures reproducible builds
- Everyone installs same versions
- Commit to Git (unlike node_modules)
```

**Verify installation:**

```bash
# Check if node_modules exists
ls -d node_modules
# Output: node_modules/

# Count installed packages
ls node_modules | wc -l
# Output: 234 (approximate)

# Check specific package
ls node_modules/express
# Should show Express.js files

# View package version
cat node_modules/express/package.json | grep version
# Output: "version": "4.21.2"
```

**Handling installation errors:**

```bash
# Error: ENOSPC (no space left)
df -h  # Check disk space
sudo apt clean  # Free up space

# Error: EACCES (permission denied)
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER ./node_modules

# Error: Network timeout
npm install --verbose  # See detailed logs
npm install --registry=https://registry.npmmirror.com  # Use mirror

# Start fresh
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**npm install vs npm ci:**

```bash
npm install
# - Installs dependencies from package.json
# - Updates package-lock.json if needed
# - Slower but flexible
# Use: Development

npm ci
# - Installs from package-lock.json only
# - Deletes node_modules first
# - Faster and deterministic
# Use: Production deployments, CI/CD
```

### Step 3.4: Create PM2 Ecosystem Configuration

**Why ecosystem.config.js:**
- **Centralized config:** All PM2 settings in one file
- **Environment variables:** Define per environment
- **Process options:** Memory limits, instances, etc.
- **Version control:** Can commit to Git
- **Reusable:** Easy deployment across environments

**Create ecosystem file:**

```bash
nano ecosystem.config.js
```

**Add configuration:**

```javascript
// PM2 Ecosystem Configuration
// Documentation: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [{
    // Application Configuration
    name: 'voxveritas-backend',
    // Why: Identifies process in PM2 list
    // Use: pm2 restart voxveritas-backend
    
    script: './index.js',
    // Entry point of application
    // Alternative: './src/server.js'
    
    instances: 1,
    // Number of instances to run
    // 1 = Single process
    // 2 = Two processes (load balanced)
    // 'max' = One per CPU core
    // Why 1: Face-auth uses significant CPU, leave headroom
    
    exec_mode: 'fork',
    // fork: Creates child process (standard Node.js)
    // cluster: Multiple instances with built-in load balancer
    // Why fork: Simpler, sufficient for single instance
    
    autorestart: true,
    // Automatically restart if app crashes
    // Critical for production uptime
    
    watch: false,
    // Auto-restart on file changes
    // true: Development mode (like nodemon)
    // false: Production (manual restarts)
    
    max_memory_restart: '1G',
    // Restart if memory exceeds 1GB
    // Prevents memory leaks from crashing system
    // Why 1G: Backend should use ~300-500MB normally
    
    error_file: '/home/deepa/Crowd-sourced-news-and-fact-checking-platform/logs/backend-error.log',
    out_file: '/home/deepa/Crowd-sourced-news-and-fact-checking-platform/logs/backend-out.log',
    // Log file locations
    // error_file: stderr (errors, exceptions)
    // out_file: stdout (console.log, info)
    
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Timestamp format in logs
    // Z = UTC timezone offset
    // Example: 2026-01-18 12:34:56 +00:00
    
    merge_logs: true,
    // Combine logs from multiple instances
    // Useful when instances > 1
    
    // Environment Variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      
      // MongoDB
      MONGODB_URI: 'mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=VoxVeritas',
      
      // JWT
      JWT_SECRET: 'your_super_secret_jwt_key_min_32_chars_long_random_string_here',
      
      // Gemini AI API Keys
      GEMINI_API_KEY_1: 'AIzaSyAKC_ntqEyb8T5FERD2feyzC7WDMx00bbU',
      GEMINI_API_KEY_2: 'AIzaSyBhcuQGNuYgiEU33HKW2nJzC18hfXLHyWA',
      GEMINI_API_KEY_3: 'AIzaSyBv1_dj1ueig6J_4i-PROxqi-nWA2Y0Hxw',
      
      // Services
      FACE_AUTH_URL: 'http://localhost:5000',
      FRONTEND_URL: 'https://voxveritas.me,https://www.voxveritas.me,https://crowd-sourced-news-and-fact-checkin.vercel.app',
    },
    
    // Development environment (optional)
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000,
      FRONTEND_URL: 'http://localhost:5173'
    }
  }]
};
```

**Understanding PM2 process lifecycle:**

```javascript
PM2 Process States:
1. stopped   - Not running (pm2 stop app)
2. starting  - Being launched
3. online    - Running normally
4. stopping  - Being terminated
5. errored   - Crashed/exited with error
6. restart   - Being restarted

State Transitions:
stopped → starting → online (successful start)
online → stopping → stopped (graceful shutdown)
online → errored → starting (auto-restart after crash)
```

**Save file:** `Ctrl+X`, `Y`, `Enter`

**Validate configuration:**

```bash
# Check syntax (JavaScript)
node -c ecosystem.config.js
# -c flag: Check syntax without executing
# No output = Valid syntax

# View configuration
cat ecosystem.config.js

# Test loading config
node -e "console.log(require('./ecosystem.config.js'))"
# Should print config object
```

**PM2 ecosystem advanced options:**

```javascript
module.exports = {
  apps: [{
    name: 'app',
    
    // Advanced Options
    cron_restart: '0 0 * * *',
    // Cron-based restart
    // Example: '0 0 * * *' = Daily at midnight
    // Use: Clear memory leaks periodically
    
    min_uptime: '10s',
    // Minimum uptime before considering online
    // Prevents restart loops on startup crashes
    
    max_restarts: 10,
    // Max restarts within restart window
    // Prevents infinite restart loops
    
    restart_delay: 4000,
    // Delay between restarts (ms)
    // Gives external services time to recover
    
    kill_timeout: 5000,
    // Time to wait before force-killing (ms)
    // Allows graceful shutdown (close connections, save state)
    
    listen_timeout: 3000,
    // Time to wait for app to bind port (ms)
    
    shutdown_with_message: true,
    // Send shutdown signal instead of force-kill
    
    // Load Balancing (cluster mode)
    instances: 'max',
    exec_mode: 'cluster',
    // Creates instance per CPU core
    // PM2 load balances between them
    
    // Monitoring
    pmx: true,
    // Enable PM2 Plus monitoring
    // Requires: pm2 link [key] [secret]
  }]
};
```

### Step 3.5: Start Backend with PM2

**Start application:**

```bash
pm2 start ecosystem.config.js
```

**Understanding PM2 startup:**

```
[PM2] Starting /home/deepa/.../backend/ecosystem.config.js in fork mode (1 instance)
[PM2] Done.
┌─────┬────────────────────┬─────────┬─────────┬──────────┬─────────┐
│ id  │ name               │ mode    │ ↺      │ status   │ cpu     │
├─────┼────────────────────┼─────────┼─────────┼──────────┼─────────┤
│ 0   │ voxveritas-backend │ fork    │ 0      │ online   │ 0%      │
└─────┴────────────────────┴─────────┴─────────┴──────────┴─────────┘

Columns explained:
- id: Process ID in PM2 (not OS PID)
- name: Application name from config
- mode: fork or cluster
- ↺ (restart): Number of restarts
- status: online/stopped/errored
- cpu: CPU usage percentage
```

**Check process status:**

```bash
pm2 status
# or
pm2 list
# Both commands show same output
```

**View detailed information:**

```bash
pm2 show voxveritas-backend
```

**Output:**

```
Describing process with id 0 - name voxveritas-backend
┌───────────────────┬──────────────────────────────────────┐
│ status            │ online                                │
│ name              │ voxveritas-backend                    │
│ version           │ 1.0.0                                 │
│ restarts          │ 0                                     │
│ uptime            │ 2m                                    │
│ script path       │ /home/deepa/.../backend/index.js      │
│ script args       │ N/A                                   │
│ error log path    │ /home/deepa/.../logs/backend-error.log│
│ out log path      │ /home/deepa/.../logs/backend-out.log  │
│ pid path          │ /home/deepa/.pm2/pids/...            │
│ interpreter       │ node                                  │
│ interpreter args  │ N/A                                   │
│ script id         │ 0                                     │
│ exec cwd          │ /home/deepa/.../backend               │
│ exec mode         │ fork_mode                             │
│ node.js version   │ 18.19.0                              │
│ node env          │ production                            │
│ watch & reload    │ ✘                                    │
│ unstable restarts │ 0                                     │
│ created at        │ 2026-01-18T12:00:00.000Z            │
└───────────────────┴──────────────────────────────────────┘

Key metrics:
- uptime: How long process has been running
- restarts: Should stay at 0 (indicates stability)
- memory: RAM usage (should be < 500MB)
```

**View real-time logs:**

```bash
pm2 logs voxveritas-backend
```

**Understanding log output:**

```
0|voxveritas-backend  | 2026-01-18 12:00:01: ✅ MongoDB connected successfully
0|voxveritas-backend  | 2026-01-18 12:00:01: ✅ Server listening on port 3000
0|voxveritas-backend  | 2026-01-18 12:00:01: 🚀 VoxVeritas Backend is running!

Log format:
[PM2_ID]|[APP_NAME] | [TIMESTAMP]: [MESSAGE]

Colors:
- White: Info messages
- Yellow: Warnings
- Red: Errors
- Green: Success messages (varies by app)

To exit logs: Ctrl+C
```

**View last 50 lines:**

```bash
pm2 logs voxveritas-backend --lines 50
```

**Monitor in real-time:**

```bash
pm2 monit
```

**Understanding PM2 monit dashboard:**

```
┌─ Process list ───────────────────────────────────────────────┐
│[ 0] voxveritas-backend      Mem: 45 MB    CPU: 0 %   online │
└──────────────────────────────────────────────────────────────┘
┌─ voxveritas-backend Logs ───────────────────────────────────┐
│ 2026-01-18 12:00:01: Server listening on port 3000          │
│ 2026-01-18 12:00:02: MongoDB connected                      │
└──────────────────────────────────────────────────────────────┘
┌─ Custom metrics ─────────────────────────────────────────────┐
│ Loop delay: 0.5ms    Active handles: 5    Active requests: 0│
└──────────────────────────────────────────────────────────────┘

Navigation:
- ↑/↓: Select process
- Left/Right: Switch tabs
- Ctrl+C: Exit
```

**Save PM2 process list:**

```bash
pm2 save
```

**Why save:**

```
Creates dump file at: ~/.pm2/dump.pm2
Contains:
- All running processes
- Their configurations
- Current state

Restored by:
- pm2 resurrect (manual)
- pm2 startup (automatic on boot)

Purpose:
- Survive server reboots
- Quick disaster recovery
- Maintain process list
```

**Setup startup script:**

```bash
pm2 startup
```

**Output:**

```
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u deepa --hp /home/deepa
```

**Copy and run the suggested command:**

```bash
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u deepa --hp /home/deepa
```

**What this command does:**

```bash
sudo               # Run as root (required for systemd)

env PATH=...       # Preserve PATH environment variable
                   # Why: PM2 needs to find Node.js executable

/usr/local/lib/.../pm2/bin/pm2
                   # Full path to PM2 executable

startup systemd    # Create systemd service
                   # Alternative: upstart, launchd (macOS), etc.

-u deepa           # Run as user 'deepa'
                   # Why: Don't run as root for security

--hp /home/deepa   # User's home directory
                   # Where .pm2 folder is located
```

**What gets created:**

```bash
/etc/systemd/system/pm2-deepa.service

# Systemd service file
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=deepa
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=...
ExecStart=/usr/local/lib/.../pm2 resurrect
ExecReload=/usr/local/lib/.../pm2 reload all
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**Test startup script:**

```bash
# Check if service is enabled
sudo systemctl status pm2-deepa

# Simulate reboot
pm2 kill  # Stop PM2 daemon
pm2 resurrect  # Restore processes

# Verify processes restarted
pm2 list
```

### Step 3.6: Test Backend API

**Test health endpoint:**

```bash
curl http://localhost:3000/health
```

**Expected response:**

```json
{
  "status": "OK",
  "message": "VoxVeritas Backend is running!",
  "timestamp": "2026-01-18T12:00:00.000Z",
  "uptime": 120.5,
  "environment": "production",
  "version": "1.0.0"
}
```

**Understanding curl command:**

```bash
curl                  # Client URL - HTTP client

http://localhost:3000 # URL to test
                     # localhost = 127.0.0.1 (this machine)
                     # 3000 = Backend port

/health              # Endpoint path

Common curl options:
-X POST              # HTTP method
-H "Content-Type: application/json"  # Headers
-d '{"key":"value"}' # Request body (data)
-i                   # Include response headers
-v                   # Verbose output
-o file.json         # Save response to file
```

**Test with verbose output:**

```bash
curl -v http://localhost:3000/health
```

**Output:**

```
* Trying 127.0.0.1:3000...
* Connected to localhost (127.0.0.1) port 3000 (#0)
> GET /health HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/7.81.0
> Accept: */*
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Content-Type: application/json; charset=utf-8
< Content-Length: 156
< ETag: W/"9c-abc123"
< Date: Sat, 18 Jan 2026 12:00:00 GMT
< Connection: keep-alive
<
{"status":"OK","message":"VoxVeritas Backend is running!","timestamp":"2026-01-18T12:00:00.000Z"}

Explanation:
- >: Request (what we sent)
- <: Response (what we received)
- 200 OK: Successful response
- Content-Type: JSON response
- Connection: keep-alive (reuse connection)
```

**Test MongoDB connection:**

```bash
curl http://localhost:3000/api/users/health
# This endpoint checks MongoDB connectivity
```

**Expected response:**

```json
{
  "database": "connected",
  "users_count": 42,
  "news_count": 156
}
```

**Test from external machine:**

```bash
curl http://34.131.44.0:3000/health
# Replace 34.131.44.0 with your VM IP

# Should fail! Port 3000 not exposed to internet
# This is correct - only Nginx should access port 3000
```

**Why port 3000 not accessible externally:**

```
Security layers:
1. GCP Firewall: Only allows 22, 80, 443
2. UFW Firewall: Only allows 22, 80, 443
3. Nginx: Listens on 80/443, proxies to 3000

Direct access blocked:
Internet → :3000 ❌ (blocked by firewalls)

Correct flow:
Internet → :443 → Nginx → :3000 ✅
```

### Step 3.7: Common Backend Issues and Solutions

**Issue 1: PM2 process crashes immediately**

```bash
# Check error logs
pm2 logs voxveritas-backend --err --lines 50

# Common causes:
# 1. MongoDB connection failed
#    - Check MONGODB_URI in ecosystem.config.js
#    - Test: mongosh "your_mongodb_uri"

# 2. Port 3000 already in use
#    - Check: sudo lsof -i :3000
#    - Kill: kill -9 [PID]

# 3. Missing environment variables
#    - Verify all required vars in ecosystem.config.js

# 4. Syntax error in code
#    - Check: node -c index.js
```

**Issue 2: High memory usage**

```bash
# Check memory
pm2 show voxveritas-backend | grep memory

# If > 1GB:
# 1. Check for memory leaks
node --inspect index.js
# Use Chrome DevTools: chrome://inspect

# 2. Reduce max_memory_restart
# Edit ecosystem.config.js: max_memory_restart: '500M'

# 3. Enable cluster mode (multiple small processes)
# Edit ecosystem.config.js: 
#   instances: 2
#   exec_mode: 'cluster'
```

**Issue 3: Application not responding**

```bash
# Check if process is running
pm2 list

# Check CPU usage
pm2 monit

# If CPU 100%:
# - Infinite loop in code
# - Heavy computation blocking event loop

# Check logs for errors
pm2 logs --lines 100

# Restart process
pm2 restart voxveritas-backend

# If still unresponsive, reload
pm2 reload voxveritas-backend  # Zero-downtime reload
```

**Issue 4: MongoDB connection errors**

```bash
# Error: MongooseServerSelectionError

# Solutions:
# 1. Check MongoDB URI
echo $MONGODB_URI

# 2. Whitelist VM IP in MongoDB Atlas
#    Atlas Console → Network Access → Add IP
#    Add: 34.131.44.0 (VM external IP)
#    Or: 0.0.0.0/0 (allow all - not recommended for production)

# 3. Check MongoDB cluster status
#    Atlas Console → Clusters → Should be "Active"

# 4. Test connection manually
mongosh "your_mongodb_uri"
# Should connect successfully
```

### Phase 3 Complete! ✅

**What we've accomplished:**

```
✅ Repository cloned from GitHub
✅ Environment variables configured
✅ Dependencies installed (234 packages)
✅ PM2 ecosystem configured
✅ Backend started with PM2
✅ Startup script configured (auto-start on boot)
✅ Health endpoint verified
✅ MongoDB connection tested

Ready for: Face Authentication deployment
```

**Verify everything:**

```bash
# 1. Process running
pm2 status
# Should show: voxveritas-backend | online

# 2. Logs clean
pm2 logs --lines 20
# Should show: Server listening, MongoDB connected

# 3. Health check
curl http://localhost:3000/health
# Should return: {"status":"OK",...}

# 4. Resource usage
pm2 monit
# Memory: < 500MB
# CPU: < 5% (idle)
```

**Next:** Deploy Face Authentication Service (Phase 4)

---

*Due to length constraints, I'll continue with remaining phases in the next response. This covers the first 3 critical phases in extreme detail with explanations for every command, syntax, and concept.*

**Remaining Phases:**
- Phase 4: Face Authentication Service Deployment
- Phase 5: Nginx Reverse Proxy Setup  
- Phase 6: Frontend Deployment on Vercel
- Phase 7: SSL Certificate with Cloudflare
- Phase 8: DNS Configuration
- Phase 9: Final Testing & Verification
- Phase 10: Monitoring & Maintenance

Would you like me to continue with the remaining phases?
