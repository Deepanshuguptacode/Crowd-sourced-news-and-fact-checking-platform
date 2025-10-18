# 🚀 VoxVeritas Platform - Quick Start Guide

## Single Command Launch

We've created a unified launcher script that starts all three services of the VoxVeritas platform with a single command!

### How to Run

**Option 1: PowerShell Script (Recommended)**
1. Open PowerShell in the project root directory
2. Run the launcher script:
   ```powershell
   .\start-all-services.ps1
   ```

**Option 2: Batch File (Alternative)**
1. Double-click `start-all-services.bat` in Windows Explorer, OR
2. Open Command Prompt and run:
   ```cmd
   start-all-services.bat
   ```

That's it! 🎉

### What Happens

The script will automatically:
- ✅ Check and clear ports (5000, 5001, 5173) if they're in use
- ✅ Start the **Backend API** (Node.js) on port 5001
- ✅ Start the **Face Recognition System** (Python) on port 5000
- ✅ Start the **Frontend** (React/Vite) on port 5173
- ✅ Open three separate PowerShell windows for each service
- ✅ Display status and access URLs

### Access URLs

After startup (wait ~10 seconds), access:
- 🌐 **Frontend**: http://localhost:5173
- 📡 **Backend API**: http://localhost:5001
- 🔐 **Face Recognition**: http://127.0.0.1:5000

### Service Windows

Three PowerShell windows will open:
1. **Backend API Window** - Shows Node.js backend logs
2. **Face Recognition Window** - Shows Python Flask logs
3. **Frontend Window** - Shows Vite dev server logs

### Stopping Services

To stop all services:
- Close each of the three PowerShell windows, OR
- Press `Ctrl+C` in each window

---

## Manual Startup (Alternative)

If you prefer to start services manually:

### 1. Backend API (Node.js)
```powershell
cd backend
node index.js
```
**Port**: 5001

### 2. Face Recognition System (Python)
```powershell
cd Face-authorization-System
python deferred-app.py
```
**Port**: 5000

### 3. Frontend (React/Vite)
```powershell
cd frontend
npm run dev
```
**Port**: 5173

---

## New Features Added ✨

### 1. Face Recognition Debug Code Removed
- ✅ All debug console logs removed from FaceCapture.jsx
- ✅ Clean, production-ready code
- ✅ Better performance

### 2. Login Similarity Score Display
- ✅ When logging in with face authentication
- ✅ Shows match percentage (e.g., "Face login successful! Match: 87.3%")
- ✅ Displays for 3 seconds in a toast notification

### 3. Duplicate Face Detection on Signup
- ✅ Automatically checks if face already exists during signup
- ✅ 60% similarity threshold
- ✅ Prevents duplicate accounts with same face
- ✅ Shows match percentage and existing username if duplicate found
- ✅ Message example: "This face is already registered! Match: 85.2% with user: john_doe"

### 4. Unified Service Launcher
- ✅ Single PowerShell script to start all services
- ✅ Automatic port conflict resolution
- ✅ Status checks and reporting
- ✅ Three separate windows for easy monitoring

---

## Troubleshooting

### Emoji/Encoding Errors in PowerShell
**Error:**
```
Unexpected token '¡' in expression or statement.
```

**Solution:**
The script has been fixed to remove emoji characters. Make sure you're using the latest version of `start-all-services.ps1`. If issues persist, use the batch file instead:
```cmd
start-all-services.bat
```

### Port Already in Use
The script automatically handles this by stopping existing processes. If issues persist:
```powershell
# Manually check what's using a port
Get-NetTCPConnection -LocalPort 5173

# Kill process by PID
Stop-Process -Id <PID> -Force
```

### Face Recognition Not Loading
- Ensure Python is installed
- Ensure `insightface` package is installed:
  ```powershell
  pip install insightface onnxruntime
  ```

### Frontend Won't Start
- Ensure dependencies are installed:
  ```powershell
  cd frontend
  npm install
  ```

### Backend Issues
- Ensure MongoDB is running
- Check MongoDB connection string in `backend/.env`
- Ensure Node.js dependencies are installed:
  ```powershell
  cd backend
  npm install
  ```

---

## First Time Setup

If this is your first time running the platform:

1. **Install Node.js dependencies**:
   ```powershell
   cd backend
   npm install
   cd ../frontend
   npm install
   cd ..
   ```

2. **Install Python dependencies**:
   ```powershell
   cd Face-authorization-System
   pip install -r requirements.txt
   cd ..
   ```

3. **Configure MongoDB**:
   - Ensure MongoDB is running
   - Update `backend/.env` with your MongoDB connection string

4. **Run the launcher**:
   ```powershell
   .\start-all-services.ps1
   ```

---

## Features Testing

### Test Face Login with Similarity Score
1. Go to http://localhost:5173/login
2. Select "Face ID" login method
3. Capture your face
4. Submit login
5. **Expected**: See toast message with similarity score percentage

### Test Duplicate Face Detection
1. Sign up with face authentication
2. Try to sign up again with the same face (different email/username)
3. **Expected**: Error message showing duplicate detected with similarity score

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  VoxVeritas Platform                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   Backend    │  │     Face     │ │
│  │  React/Vite  │→→│   Node.js    │→→│ Recognition  │ │
│  │  Port: 5173  │  │  Port: 5001  │  │  Port: 5000  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         ↓                  ↓                  ↓         │
│  ┌──────────────────────────────────────────────────┐  │
│  │            MongoDB Database (Atlas)              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Need Help?

- Check the three service windows for error logs
- Ensure all ports (5000, 5001, 5173) are available
- Verify MongoDB connection
- Check Python and Node.js versions

---

**Happy Coding! 🎉**
