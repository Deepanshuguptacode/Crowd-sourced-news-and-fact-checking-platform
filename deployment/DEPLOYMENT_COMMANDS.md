# GCP VM Deployment - Important Commands Reference

## 1. GCP VM Setup & SSH Access

### Connect to VM via SSH
```bash
#Start
gcloud compute ssh voxveritas --zone=asia-south2-b
# Windows (PowerShell)
ssh -i C:\Users\deepa\.ssh\google_compute_engine deepanshuguptacode@34.131.44.0

# Linux/Mac
ssh -i ~/.ssh/google_compute_engine deepanshuguptacode@34.131.44.0
```
**Explanation:** Connects to GCP VM using SSH key authentication. Replace IP with your VM's external IP.

### Check VM System Info
```bash
# Check Ubuntu version
lsb_release -a

# Check available memory
free -h

# Check disk space
df -h

# Check CPU info
lscpu
```
**Explanation:** Displays system information to verify VM specifications and available resources.

---

## 2. Git Repository Management

### Clone Repository
```bash
cd ~
git clone https://github.com/Deepanshuguptacode/Crowd-sourced-news-and-fact-checking-platform.git
cd Crowd-sourced-news-and-fact-checking-platform
```
**Explanation:** Downloads the entire project from GitHub to VM.

### Pull Latest Changes
```bash
cd ~/Crowd-sourced-news-and-fact-checking-platform
git pull origin master
```
**Explanation:** Updates local code with latest changes from GitHub repository.

### Check Git Status
```bash
git status
```
**Explanation:** Shows modified files and current branch status.

### Commit and Push Changes
```bash
git add .
git commit -m "Your commit message"
git push origin master
```
**Explanation:** Saves changes locally and pushes them to remote GitHub repository.

---

## 3. Backend Service Management (Node.js + PM2)

### Install Node.js Dependencies
```bash
cd ~/Crowd-sourced-news-and-fact-checking-platform/backend
npm install
```
**Explanation:** Installs all required Node.js packages from package.json.

### Start Backend with PM2
```bash
pm2 start ecosystem.config.js
```
**Explanation:** Starts backend server using PM2 process manager with environment variables from ecosystem.config.js.

### Check Backend Status
```bash
pm2 status
pm2 list
```
**Explanation:** Shows all PM2 processes, their status (online/stopped), memory usage, and uptime.

### View Backend Logs
```bash
pm2 logs voxveritas-backend --lines 50
pm2 logs voxveritas-backend --follow
```
**Explanation:** Displays last 50 lines of logs or follows logs in real-time for debugging.

### Restart Backend
```bash
pm2 restart voxveritas-backend
```
**Explanation:** Restarts the backend service (useful after code changes or configuration updates).

### Stop Backend
```bash
pm2 stop voxveritas-backend
```
**Explanation:** Stops the backend service without removing it from PM2.

### Delete Backend from PM2
```bash
pm2 delete voxveritas-backend
```
**Explanation:** Removes backend process from PM2 completely.

### Save PM2 Configuration
```bash
pm2 save
```
**Explanation:** Saves current PM2 process list to be restored on system reboot.

### Setup PM2 Startup Script
```bash
pm2 startup
# Then run the command it suggests
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deepa --hp /home/deepa
pm2 save
```
**Explanation:** Configures PM2 to automatically start backend on system boot.

---

## 4. Face-Auth Service Management (Python + Systemd)

### Check Face-Auth Service Status
```bash
sudo systemctl status face-auth
```
**Explanation:** Shows if face-auth service is running, recent logs, and process details.

### Start Face-Auth Service
```bash
sudo systemctl start face-auth
```
**Explanation:** Starts the face-auth Flask application.

### Stop Face-Auth Service
```bash
sudo systemctl stop face-auth
```
**Explanation:** Stops the face-auth service gracefully.

### Restart Face-Auth Service
```bash
sudo systemctl restart face-auth
```
**Explanation:** Restarts face-auth (use after code updates or configuration changes).

### Enable Face-Auth on Boot
```bash
sudo systemctl enable face-auth
```
**Explanation:** Configures face-auth to start automatically on system boot.

### View Face-Auth Logs
```bash
sudo journalctl -u face-auth -n 50 --no-pager
sudo journalctl -u face-auth -f
```
**Explanation:** Shows last 50 lines of face-auth logs or follows logs in real-time.

### Edit Face-Auth Service File
```bash
sudo nano /etc/systemd/system/face-auth.service
```
**Explanation:** Edits the systemd service configuration file for face-auth.

### Reload Systemd After Editing Service File
```bash
sudo systemctl daemon-reload
```
**Explanation:** Reloads systemd configuration after modifying service files.

---

## 5. Nginx Web Server Management

### Check Nginx Status
```bash
sudo systemctl status nginx
```
**Explanation:** Shows if nginx is running and any recent errors.

### Test Nginx Configuration
```bash
sudo nginx -t
```
**Explanation:** Tests nginx configuration files for syntax errors before restarting.

### Restart Nginx
```bash
sudo systemctl restart nginx
```
**Explanation:** Restarts nginx (required after configuration changes).

### Reload Nginx (Graceful)
```bash
sudo systemctl reload nginx
```
**Explanation:** Reloads configuration without dropping connections.

### View Nginx Error Logs
```bash
sudo tail -f /var/log/nginx/error.log
```
**Explanation:** Shows real-time nginx error logs for debugging.

### View Nginx Access Logs
```bash
sudo tail -f /var/log/nginx/access.log
```
**Explanation:** Shows incoming HTTP requests in real-time.

### Edit Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/voxveritas
```
**Explanation:** Edits nginx reverse proxy configuration for your application.

---

## 6. SSL Certificate Management

### Generate Self-Signed SSL Certificate
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt
```
**Explanation:** Creates a self-signed SSL certificate valid for 365 days (for testing).

### Install Let's Encrypt (Certbot)
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```
**Explanation:** Installs Certbot for obtaining free SSL certificates from Let's Encrypt.

### Obtain Let's Encrypt Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
**Explanation:** Automatically obtains and installs SSL certificate for your domain.

### Renew SSL Certificate
```bash
sudo certbot renew
```
**Explanation:** Renews SSL certificates that are about to expire.

### Test Certificate Auto-Renewal
```bash
sudo certbot renew --dry-run
```
**Explanation:** Tests certificate renewal process without actually renewing.

---

## 7. Firewall Management

### Check Firewall Status
```bash
sudo ufw status
```
**Explanation:** Shows current firewall rules and status.

### Allow Specific Ports
```bash
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH
```
**Explanation:** Opens specific ports through the firewall.

### Enable Firewall
```bash
sudo ufw enable
```
**Explanation:** Activates the firewall with configured rules.

---

## 8. Testing & Debugging Commands

### Test Backend Health Endpoint
```bash
curl http://localhost:3000/health
curl https://34.131.44.0/health
```
**Explanation:** Checks if backend server is responding correctly.

### Test Face-Auth Endpoints
```bash
# Test detect_face endpoint
curl -X POST http://localhost:5000/api/detect_face \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/png;base64,test"}'

# Test extract_embedding endpoint
curl -X POST http://localhost:5000/api/extract_embedding \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/png;base64,test"}'

# Test verify_face endpoint
curl -X POST http://localhost:5000/api/verify_face \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/png;base64,test", "userId": "123"}'
```
**Explanation:** Tests face-auth API endpoints locally on the VM.

### Check Open Ports
```bash
sudo netstat -tulpn | grep LISTEN
```
**Explanation:** Lists all open ports and the processes listening on them.

### Check Process Using Specific Port
```bash
sudo lsof -i :3000  # Backend port
sudo lsof -i :5000  # Face-auth port
sudo lsof -i :80    # HTTP port
sudo lsof -i :443   # HTTPS port
```
**Explanation:** Shows which process is using a specific port.

---

## 9. Python Environment (Face-Auth)

### Install Python Dependencies
```bash
cd ~/Crowd-sourced-news-and-fact-checking-platform/Face-authorization-System
pip install -r requirements.txt
```
**Explanation:** Installs all required Python packages for face-auth service.

### Check Python Version
```bash
python3 --version
```
**Explanation:** Displays installed Python version.

### Create Virtual Environment (Optional)
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
**Explanation:** Creates isolated Python environment for face-auth dependencies.

---

## 10. System Monitoring

### Check System Resource Usage
```bash
# CPU and memory usage
htop

# Or use top
top

# Disk usage by directory
du -sh *

# Check running processes
ps aux | grep node
ps aux | grep python
```
**Explanation:** Monitors system resources and identifies resource-intensive processes.

### Check System Logs
```bash
# View system logs
sudo journalctl -xe

# View logs for specific service
sudo journalctl -u nginx -n 100
sudo journalctl -u face-auth -n 100
```
**Explanation:** Displays system and service logs for troubleshooting.

---

## 11. File Operations

### View File Content
```bash
cat filename.txt           # View entire file
less filename.txt          # View with pagination
tail -f filename.log       # Follow log file in real-time
head -n 20 filename.txt    # View first 20 lines
```
**Explanation:** Different ways to view file contents.

### Edit Files
```bash
nano filename.txt          # Simple text editor
vim filename.txt           # Advanced editor
```
**Explanation:** Opens files for editing in terminal.

### Search in Files
```bash
grep "search_term" filename.txt
grep -r "search_term" /path/to/directory/
```
**Explanation:** Searches for text within files.

### File Permissions
```bash
chmod +x script.sh         # Make file executable
chmod 644 file.txt         # Set read/write for owner, read for others
sudo chown user:group file # Change file ownership
```
**Explanation:** Modifies file permissions and ownership.

---

## 12. Environment Variables

### View Environment Variables
```bash
printenv
echo $PATH
echo $MONGODB_URI
```
**Explanation:** Displays environment variables set in the system.

### Edit .env File
```bash
nano ~/Crowd-sourced-news-and-fact-checking-platform/backend/.env
nano ~/Crowd-sourced-news-and-fact-checking-platform/Face-authorization-System/.env
```
**Explanation:** Edits environment configuration files.

---

## 13. MongoDB Atlas Connection

### Test MongoDB Connection
```bash
# From Python
python3 -c "from pymongo import MongoClient; client = MongoClient('your_mongodb_uri'); print(client.list_database_names())"

# From Node.js
node -e "const mongoose = require('mongoose'); mongoose.connect('your_mongodb_uri').then(() => console.log('Connected')).catch(err => console.log(err))"
```
**Explanation:** Tests if MongoDB Atlas connection is working.

---

## 14. Quick Troubleshooting Commands

### Restart All Services
```bash
# Restart backend
pm2 restart voxveritas-backend

# Restart face-auth
sudo systemctl restart face-auth

# Restart nginx
sudo systemctl restart nginx

# View all logs
pm2 logs voxveritas-backend --lines 20
sudo journalctl -u face-auth -n 20
sudo tail -n 20 /var/log/nginx/error.log
```
**Explanation:** Complete restart sequence for all services.

### Check All Services Status
```bash
echo "=== Backend Status ===" && pm2 status && \
echo "=== Face-Auth Status ===" && sudo systemctl status face-auth --no-pager && \
echo "=== Nginx Status ===" && sudo systemctl status nginx --no-pager
```
**Explanation:** One-liner to check status of all services.

---

## 15. Important File Locations

```
Backend:
- Service: /home/deepa/Crowd-sourced-news-and-fact-checking-platform/backend/
- PM2 Config: ~/Crowd-sourced-news-and-fact-checking-platform/backend/ecosystem.config.js
- Logs: Run `pm2 logs voxveritas-backend`

Face-Auth:
- Service: /home/deepa/Crowd-sourced-news-and-fact-checking-platform/Face-authorization-System/
- Systemd Service: /etc/systemd/system/face-auth.service
- Logs: Run `sudo journalctl -u face-auth`

Nginx:
- Config: /etc/nginx/sites-available/voxveritas
- Enabled: /etc/nginx/sites-enabled/voxveritas
- Error Logs: /var/log/nginx/error.log
- Access Logs: /var/log/nginx/access.log

SSL Certificates:
- Certificate: /etc/ssl/certs/nginx-selfsigned.crt
- Private Key: /etc/ssl/private/nginx-selfsigned.key
```

---

## 16. Production URLs

```
Frontend (Vercel):
- https://crowd-sourced-news-and-fact-checkin.vercel.app
- https://voxveritas.me
- https://www.voxveritas.me

Backend (GCP VM):
- https://34.131.44.0
- https://34.131.44.0/health
- https://34.131.44.0/api/
- https://34.131.44.0/users/
- https://34.131.44.0/news/

Face-Auth (GCP VM):
- https://34.131.44.0/face-auth/
- https://34.131.44.0/face-auth/api/detect_face
- https://34.131.44.0/face-auth/api/extract_embedding
- https://34.131.44.0/face-auth/api/verify_face
- https://34.131.44.0/face-auth/api/register_face
- https://34.131.44.0/face-auth/api/check_duplicate_face
```

---

## 17. Common Issues & Solutions

### Issue: Backend not responding
```bash
# Check if backend is running
pm2 status

# View logs for errors
pm2 logs voxveritas-backend --lines 50

# Restart backend
pm2 restart voxveritas-backend
```

### Issue: Face-auth returning 404
```bash
# Check if service is running
sudo systemctl status face-auth

# View logs
sudo journalctl -u face-auth -n 50

# Restart service
sudo systemctl restart face-auth
```

### Issue: CORS errors
```bash
# Check nginx configuration
sudo nginx -t

# View nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### Issue: SSL certificate errors
```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/nginx-selfsigned.crt -text -noout

# Re-generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt

# Restart nginx
sudo systemctl restart nginx
```

---

## 18. Maintenance Tasks

### Weekly Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check disk space
df -h

# Review logs for errors
pm2 logs --lines 100
sudo journalctl -u face-auth -n 100
```

### Monthly Tasks
```bash
# Backup MongoDB data (if local)
mongodump --uri="mongodb://localhost:27017/your_db" --out=/backup/

# Check SSL certificate expiry
openssl x509 -in /etc/ssl/certs/nginx-selfsigned.crt -noout -enddate

# Clean up old logs
pm2 flush
sudo journalctl --vacuum-time=7d
```

---

## 19. Emergency Commands

### Kill Stuck Process
```bash
# Find process ID
ps aux | grep node
ps aux | grep python

# Kill process
sudo kill -9 <PID>

# Or kill by name
sudo pkill -9 node
sudo pkill -9 python
```

### Free Up Disk Space
```bash
# Remove old logs
sudo journalctl --vacuum-size=100M

# Clean package cache
sudo apt clean

# Remove unused packages
sudo apt autoremove
```

### Reset Services
```bash
# Complete reset of all services
pm2 delete all
pm2 save
sudo systemctl stop face-auth
sudo systemctl stop nginx

# Then start fresh
cd ~/Crowd-sourced-news-and-fact-checking-platform/backend
pm2 start ecosystem.config.js
pm2 save

sudo systemctl start face-auth
sudo systemctl start nginx
```

---

**Note:** Always pull latest changes from GitHub before restarting services after local development!

```bash
cd ~/Crowd-sourced-news-and-fact-checking-platform
git pull origin master
pm2 restart voxveritas-backend
sudo systemctl restart face-auth
```
