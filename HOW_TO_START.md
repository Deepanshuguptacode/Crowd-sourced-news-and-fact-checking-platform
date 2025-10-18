# 🎬 How to Start VoxVeritas Platform - Visual Guide

## Method 1: PowerShell Script (Recommended) ⚡

### Step 1: Open PowerShell
1. Press `Windows Key + X`
2. Select **"Windows PowerShell"** or **"Terminal"**
3. Navigate to project folder:
   ```powershell
   cd C:\Crowd-sourced-news-and-fact-checking-platform
   ```

### Step 2: Run the Script
```powershell
.\start-all-services.ps1
```

### Step 3: What You'll See
```
=====================================================================
  VoxVeritas Platform - Starting All Services
=====================================================================

🔍 Checking ports...
  ✅ Ports cleared and ready

📡 Starting Backend API (Node.js)...
   Port: 5001
   Directory: backend\

🔐 Starting Face Recognition System (Python)...
   Port: 5000
   Directory: Face-authorization-System\

🎨 Starting Frontend (React/Vite)...
   Port: 5173
   Directory: frontend\

=====================================================================
  Service Status Check
=====================================================================

  ✅ Backend API - Running on port 5001
  ✅ Face Recognition - Running on port 5000
  ✅ Frontend - Running on port 5173

=====================================================================
  Access URLs
=====================================================================

  🌐 Frontend:          http://localhost:5173
  📡 Backend API:       http://localhost:5001
  🔐 Face Recognition:  http://127.0.0.1:5000

=====================================================================

✅ All services have been launched!
```

### Step 4: Three Windows Open
You'll see three separate PowerShell windows:

**Window 1 - Backend API**
```
📡 Backend API Starting...
Server is running on port 5001
Connected to MongoDB
```

**Window 2 - Face Recognition**
```
🔐 Face Recognition System Starting...
 * Running on http://127.0.0.1:5000
InsightFace initialized
```

**Window 3 - Frontend**
```
🎨 Frontend Starting...
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Step 5: Access the Platform
Open your browser and go to:
```
http://localhost:5173
```

---

## Method 2: Batch File (Simple Double-Click) 🖱️

### Step 1: Find the File
1. Open File Explorer
2. Navigate to: `C:\Crowd-sourced-news-and-fact-checking-platform`
3. Find file: `start-all-services.bat`

### Step 2: Double-Click
Double-click `start-all-services.bat`

### Step 3: Three Command Windows Open
Three black command windows will appear, one for each service.

### Step 4: Access the Platform
After ~10 seconds, open browser:
```
http://localhost:5173
```

---

## Method 3: Manual Start (For Developers) 🛠️

### Terminal 1 - Backend
```powershell
cd backend
node index.js
```

### Terminal 2 - Face Recognition
```powershell
cd Face-authorization-System
python deferred-app.py
```

### Terminal 3 - Frontend
```powershell
cd frontend
npm run dev
```

---

## ✅ Verification Checklist

After starting, verify all services:

### 1. Check Service Windows
- [ ] Backend window shows "Server is running on port 5001"
- [ ] Face Recognition shows "Running on http://127.0.0.1:5000"
- [ ] Frontend shows "Local: http://localhost:5173/"

### 2. Test URLs
- [ ] http://localhost:5173 - Frontend loads
- [ ] http://localhost:5001 - Backend API responds
- [ ] http://127.0.0.1:5000/api/status - Face API responds

### 3. Test Features
- [ ] Can navigate to login page
- [ ] Can navigate to signup page
- [ ] Face camera works (if testing face features)

---

## 🛑 How to Stop Services

### PowerShell Method
Close each of the three PowerShell windows, or press `Ctrl + C` in each window.

### Batch Method
Close each of the three command windows.

### Force Stop (if frozen)
```powershell
# Stop all Node.js processes
Get-Process -Name node | Stop-Process -Force

# Stop all Python processes
Get-Process -Name python | Stop-Process -Force
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot run scripts" error
**Error:**
```
.\start-all-services.ps1 : File cannot be loaded because running scripts is disabled
```

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try again:
```powershell
.\start-all-services.ps1
```

### Issue 2: Port Already in Use
**Error:**
```
Port 5173 is already in use
```

**Solution:**
The script automatically handles this! If it doesn't work:
```powershell
# Find process using port 5173
Get-NetTCPConnection -LocalPort 5173

# Kill it (replace 1234 with actual PID)
Stop-Process -Id 1234 -Force
```

### Issue 3: "Python not found"
**Error:**
```
'python' is not recognized as an internal or external command
```

**Solution 1:** Use `python3` instead:
Edit `start-all-services.ps1` line with python and change to `python3`

**Solution 2:** Install Python:
Download from https://www.python.org/ and check "Add to PATH" during installation

### Issue 4: "npm not found"
**Error:**
```
'npm' is not recognized as an internal or external command
```

**Solution:**
Install Node.js from https://nodejs.org/ (LTS version recommended)

### Issue 5: Frontend shows blank page
**Solution:**
1. Wait 10-15 seconds for Vite to fully start
2. Hard refresh browser: `Ctrl + Shift + R`
3. Check frontend window for error messages

---

## 📊 Service Startup Timeline

```
Time    Service               Status
0s      PowerShell Script     ✅ Started
1s      Backend API           🔄 Starting...
4s      Backend API           ✅ Running
4s      Face Recognition      🔄 Starting...
7s      Face Recognition      ✅ Running
7s      Frontend              🔄 Starting...
12s     Frontend              ✅ Running
15s     All Services          ✅ Ready!
```

**Recommended Wait Time:** 15-20 seconds before accessing http://localhost:5173

---

## 🎯 Quick Test After Startup

### 1. Test Backend API
Open browser: http://localhost:5001
**Expected:** JSON response or "Cannot GET /"

### 2. Test Face Recognition
Open browser: http://127.0.0.1:5000/api/status
**Expected:**
```json
{
  "success": true,
  "message": "Face Authorization System is running",
  "face_analysis_initialized": true,
  "face_model_loaded": true
}
```

### 3. Test Frontend
Open browser: http://localhost:5173
**Expected:** VoxVeritas login/home page

---

## 📸 Screenshot Guide

### Expected PowerShell Output
```
PS C:\...\Crowd-sourced-news-and-fact-checking-platform> .\start-all-services.ps1

=====================================================================
  VoxVeritas Platform - Starting All Services
=====================================================================

🔍 Checking ports...
  ✅ Ports cleared and ready

📡 Starting Backend API (Node.js)...
🔐 Starting Face Recognition System (Python)...
🎨 Starting Frontend (React/Vite)...

  ✅ Backend API - Running on port 5001
  ✅ Face Recognition - Running on port 5000
  ✅ Frontend - Running on port 5173

  🌐 Frontend:          http://localhost:5173
  📡 Backend API:       http://localhost:5001
  🔐 Face Recognition:  http://127.0.0.1:5000

✅ All services have been launched!
```

---

## 💡 Pro Tips

### Tip 1: Keep Windows Open
Don't close the three service windows! They show important logs and errors.

### Tip 2: Watch for Errors
If any service fails, check its window for error messages.

### Tip 3: Wait for "Ready"
Frontend takes longest to start (~10-15 seconds). Wait for:
```
➜  Local:   http://localhost:5173/
```

### Tip 4: Bookmark URLs
Save these bookmarks:
- http://localhost:5173 (Frontend)
- http://localhost:5001 (Backend)
- http://127.0.0.1:5000/api/status (Face API Status)

### Tip 5: Development Mode
All services run in development mode with:
- Hot reload (frontend)
- Auto-restart on file changes (backend with nodemon)
- Debug output in service windows

---

## 🔄 Restart Services

If you need to restart:

### Full Restart
1. Close all three service windows
2. Run launcher again:
   ```powershell
   .\start-all-services.ps1
   ```

### Individual Service Restart
Find the service window and press `Ctrl + C`, then:

**Backend:**
```powershell
cd backend
node index.js
```

**Face Recognition:**
```powershell
cd Face-authorization-System
python deferred-app.py
```

**Frontend:**
```powershell
cd frontend
npm run dev
```

---

## 📞 Need More Help?

1. **Read Full Guide:** [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)
2. **Check Documentation:** [README.md](README.md)
3. **View Recent Changes:** [ENHANCEMENT_COMPLETE_SUMMARY.md](ENHANCEMENT_COMPLETE_SUMMARY.md)
4. **Check Service Logs:** Look at the three service windows for errors

---

<div align="center">

**Happy Development! 🎉**

If this guide helped you, please ⭐ star the repository!

</div>
