# Face Authentication - Frontend & Setup Guide

## Table of Contents

1. [Frontend Face Capture Component](#1-frontend-face-capture-component)
2. [Complete Setup Instructions](#2-complete-setup-instructions)
3. [Dependencies & Requirements](#3-dependencies--requirements)
4. [Configuration Files](#4-configuration-files)
5. [Development Workflow](#5-development-workflow)
6. [Production Deployment](#6-production-deployment)
7. [Common Error Messages & Solutions](#7-common-error-messages--solutions)

---

# 1. Frontend Face Capture Component

## Overview

The `FaceCapture.jsx` component handles webcam access and image capture in the React frontend.

**Location:** `frontend/src/components/FaceCapture.jsx`

## Component Structure

```jsx
const FaceCapture = ({ 
  onCapture,           // Callback when image is captured
  onError,             // Callback when error occurs
  disabled = false,    // Disable the component
  className = "",      // Custom CSS classes
  mode = "capture",    // "capture" | "upload" | "both"
  showPreview = true,  // Show captured image preview
  captureButtonText = "Capture Face",
  uploadButtonText = "Upload Image"
})
```

## Key State Variables

```javascript
const [isCapturing, setIsCapturing] = useState(false);      // Camera active?
const [stream, setStream] = useState(null);                 // MediaStream object
const [capturedImage, setCapturedImage] = useState(null);   // Base64 image
const [error, setError] = useState(null);                   // Error message
const [processing, setProcessing] = useState(false);        // Processing indicator
const [devices, setDevices] = useState([]);                 // Available cameras
const [selectedDevice, setSelectedDevice] = useState('');   // Selected camera ID
const [faceDetectionResult, setFaceDetectionResult] = useState(null);
const [faceCropPreview, setFaceCropPreview] = useState(null);
```

## Core Functions Explained

### 1. Getting Camera Devices

```javascript
const getDevices = useCallback(async () => {
  try {
    // Request camera permission first to get proper device labels
    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
    tempStream.getTracks().forEach(track => track.stop()); // Stop immediately
    
    const deviceList = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
    setDevices(videoDevices);
    
    if (videoDevices.length > 0 && !selectedDevice) {
      setSelectedDevice(videoDevices[0].deviceId);
    }
  } catch (error) {
    setError('Could not access camera devices. Please ensure camera permissions are granted.');
  }
}, [selectedDevice]);
```

**What This Does:**
1. Requests temporary camera access (needed to get device labels)
2. Stops the temp stream immediately
3. Gets all video input devices
4. Sets default to first camera

**Why Request Permission First?**
- Without permission, device labels are empty strings
- With permission, get actual names like "HD Webcam", "External Camera"

### 2. Starting the Camera

```javascript
const startCamera = useCallback(async () => {
  try {
    setError(null);
    
    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Camera constraints
    const constraints = {
      video: {
        deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 15, max: 30 }
      },
      audio: false
    };

    const newStream = await navigator.mediaDevices.getUserMedia(constraints);
    setStream(newStream);
    setIsCapturing(true);
  } catch (error) {
    // Handle specific error types
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Camera access denied. Please allow camera permissions.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera found. Please connect a camera.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera is already in use by another application.';
    }
    setError(errorMessage);
  }
}, [stream, selectedDevice, onError]);
```

**Constraint Details:**
| Setting | Value | Why |
|---------|-------|-----|
| `width.ideal` | 640 | Good balance of quality and performance |
| `width.max` | 1280 | Limit for faster processing |
| `height.ideal` | 480 | Standard aspect ratio |
| `frameRate.ideal` | 15 | Enough for face capture, saves resources |
| `audio` | false | We don't need audio for face |

### 3. Capturing the Photo

```javascript
const capturePhoto = useCallback(async () => {
  if (!videoRef.current || !canvasRef.current) return;

  try {
    setProcessing(true);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Ensure video has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      throw new Error('Video not ready. Please wait for the camera to fully load.');
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 with high quality (0.9 = 90%)
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    
    // Test face detection
    await testFaceDetection(imageDataUrl);
    
    // Send to parent component
    await onCapture(imageDataUrl);
  } catch (error) {
    setError('Failed to capture photo: ' + error.message);
  } finally {
    setProcessing(false);
  }
}, [onCapture, onError]);
```

**Canvas to Base64 Process:**
```
Video Stream → Canvas → toDataURL() → Base64 String

Result format:
"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD..."
```

### 4. Testing Face Detection

```javascript
const testFaceDetection = useCallback(async (imageDataUrl) => {
  try {
    const response = await fetch(`${config.FACE_AUTH_URL}/api/detect_face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageDataUrl }),
    });

    const result = await response.json();
    
    if (result.success) {
      setFaceDetectionResult({
        success: true,
        message: result.message,
        bbox: result.bbox
      });
      
      if (result.face_crop) {
        setFaceCropPreview(result.face_crop);
      }
    } else {
      setFaceDetectionResult({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    setFaceDetectionResult({
      success: false,
      message: `Face detection service error: ${error.message}`
    });
  }
}, []);
```

**Why Test Face Detection?**
- Immediate feedback to user
- Shows if face was detected before submitting
- Displays cropped face preview
- Better UX than waiting for submission to fail

## Using FaceCapture in Forms

### SignupForm.jsx Example

```jsx
import FaceCapture from '../components/FaceCapture';

const SignupForm = () => {
  const [faceImage, setFaceImage] = useState(null);
  const [skipFaceAuth, setSkipFaceAuth] = useState(false);

  const handleCapture = async (imageDataUrl) => {
    setFaceImage(imageDataUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = {
      name: name,
      email: email,
      password: password,
      // Only include faceImage if user wants face auth
      ...(faceImage && !skipFaceAuth && { faceImage })
    };
    
    const response = await api.signup(userType, formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields... */}
      
      {/* Face Auth Toggle */}
      <label>
        <input 
          type="checkbox" 
          checked={!skipFaceAuth}
          onChange={(e) => setSkipFaceAuth(!e.target.checked)}
        />
        Enable Face Authentication
      </label>
      
      {/* Face Capture Component */}
      {!skipFaceAuth && (
        <FaceCapture
          onCapture={handleCapture}
          onError={(err) => console.error(err)}
          mode="both"
          showPreview={true}
        />
      )}
    </form>
  );
};
```

### LoginForm.jsx Example

```jsx
const LoginForm = () => {
  const [faceImage, setFaceImage] = useState(null);
  const [loginMethod, setLoginMethod] = useState('password');

  const handleLogin = async () => {
    if (loginMethod === 'face') {
      await api.login(userType, {
        email: email,
        loginMethod: 'face',
        faceImage: faceImage
      });
    } else {
      await api.login(userType, {
        email: email,
        password: password,
        loginMethod: 'password'
      });
    }
  };

  return (
    <form>
      {/* Login method selector */}
      <select 
        value={loginMethod} 
        onChange={(e) => setLoginMethod(e.target.value)}
      >
        <option value="password">Password Login</option>
        <option value="face">Face Login</option>
      </select>

      {loginMethod === 'face' && (
        <FaceCapture
          onCapture={setFaceImage}
          mode="capture"
        />
      )}
    </form>
  );
};
```

---

# 2. Complete Setup Instructions

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 18+ | Backend & frontend runtime |
| **Python** | 3.8-3.10 | Face auth service |
| **MongoDB** | 4.4+ | Database |
| **Git** | Latest | Version control |

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 4 cores | 8 cores |
| **RAM** | 8 GB | 16 GB |
| **GPU** | None (CPU works) | NVIDIA (for faster processing) |
| **Webcam** | Any USB/Built-in | HD 720p+ |

## Step-by-Step Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/your-username/Crowd-sourced-news-and-fact-checking-platform.git
cd Crowd-sourced-news-and-fact-checking-platform
```

### Step 2: Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Windows - Download from mongodb.com
# Start MongoDB service

# Linux
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/atlas
2. Create free cluster
3. Get connection string:
   ```
   mongodb+srv://username:password@cluster.xxxxx.mongodb.net/voxveritas
   ```

### Step 3: Set Up Python Face Auth Service

```bash
# Navigate to Face Auth directory
cd Face-authorization-System

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# First run downloads the ArcFace model (~100MB)
python app.py
```

**Expected Output:**
```
Starting Face Authorization System...
* Serving Flask app 'app'
* Running on http://127.0.0.1:5000
```

### Step 4: Set Up Node.js Backend

```bash
# Open new terminal
cd backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env
# Or on Linux:
cp .env.example .env

# Edit .env with your values:
# MONGODB_URI=mongodb://localhost:27017/voxveritas
# JWT_SECRET=your-secret-key
# PORT=3000

# Start backend
npm run dev
```

**Expected Output:**
```
Server is running on port 3000
Connected to MongoDB
```

### Step 5: Set Up React Frontend

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Create .env file
# VITE_API_URL=http://localhost:3000
# VITE_FACE_AUTH_URL=http://localhost:5000

# Start frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in xxx ms
Local: http://localhost:5173/
```

### Step 6: Verify Everything Works

1. **Check Face Auth Service:**
   ```bash
   curl http://localhost:5000/
   # Should return HTML page
   ```

2. **Check Backend:**
   ```bash
   curl http://localhost:3000/api/health
   # Should return { "status": "ok" }
   ```

3. **Open Frontend:**
   - Go to http://localhost:5173
   - Try to sign up with face auth enabled
   - Camera should activate

---

# 3. Dependencies & Requirements

## Python Dependencies (requirements.txt)

```
Flask==2.3.3              # Web framework for API
Flask-CORS==4.0.0         # Cross-origin support
opencv-python==4.8.1.78   # Image processing
numpy==1.24.3             # Numerical operations
insightface==0.7.3        # Face recognition (ArcFace)
onnxruntime==1.16.1       # Neural network runtime
Pillow==10.0.1            # Image manipulation
pymongo==4.5.0            # MongoDB driver
python-dotenv==1.0.0      # Environment variables
matplotlib==3.7.2         # Image display (testing)
```

**Key Libraries Explained:**

| Library | Size | Purpose |
|---------|------|---------|
| `insightface` | ~50 MB | Face detection & recognition |
| `onnxruntime` | ~50 MB | Run neural network models |
| `opencv-python` | ~40 MB | Image processing |
| Model files | ~100 MB | Downloaded on first run |

## Node.js Dependencies (backend/package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",       // Web framework
    "mongoose": "^7.5.3",       // MongoDB ODM
    "bcrypt": "^5.1.1",         // Password hashing
    "jsonwebtoken": "^9.0.2",   // JWT authentication
    "axios": "^1.5.1",          // HTTP client (for face service)
    "cors": "^2.8.5",           // Cross-origin support
    "dotenv": "^16.3.1",        // Environment variables
    "cookie-parser": "^1.4.6"   // Cookie handling
  }
}
```

## Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.16.0",
    "axios": "^1.5.1",
    "lucide-react": "^0.284.0"   // Icons
  },
  "devDependencies": {
    "vite": "^4.4.9",
    "tailwindcss": "^3.3.3",
    "@vitejs/plugin-react": "^4.0.4"
  }
}
```

---

# 4. Configuration Files

## Backend .env

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/voxveritas
# For Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/voxveritas

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Face Auth Service
FACE_AUTH_URL=http://127.0.0.1:5000

# Cookie Settings (production)
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
```

## Frontend .env

```env
# API URLs
VITE_API_URL=http://localhost:3000
VITE_FACE_AUTH_URL=http://localhost:5000

# App Settings
VITE_APP_NAME=VoxVeritas
```

## Frontend config.js

```javascript
// frontend/src/config.js
const config = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  FACE_AUTH_URL: import.meta.env.VITE_FACE_AUTH_URL || 'http://localhost:5000',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'VoxVeritas'
};

export default config;
```

---

# 5. Development Workflow

## Starting All Services

### Windows (PowerShell)

```powershell
# start-all-services.ps1
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Face-authorization-System; python app.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
```

### Linux/Mac

```bash
# start-all-services.sh
#!/bin/bash
cd Face-authorization-System && python app.py &
cd backend && npm run dev &
cd frontend && npm run dev &
```

## Development Tips

### Hot Reloading

- **Frontend (Vite):** Automatic hot reload on file save
- **Backend (nodemon):** Use `npm run dev` for auto-restart
- **Python:** Use `python app.py` with `debug=True` for auto-reload

### Testing Face Auth Locally

1. Open browser to http://localhost:5000
2. Use the built-in test page
3. Check console for face detection results

### Debugging Face Issues

```python
# Add to app.py for debugging
@app.route('/api/debug_face', methods=['POST'])
def debug_face():
    data = request.json
    image_data = data.get('image')
    
    # Decode and save image for inspection
    image_bytes = base64.b64decode(image_data.split(',')[1])
    with open('debug_face.jpg', 'wb') as f:
        f.write(image_bytes)
    
    return jsonify({'message': 'Image saved to debug_face.jpg'})
```

---

# 6. Production Deployment

## Architecture for Production

```
                       ┌─────────────────┐
                       │    Nginx        │
                       │  (Reverse Proxy │
                       │   + SSL)        │
                       └───────┬─────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ↓                    ↓                    ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  React Frontend │  │  Node.js Backend│  │  Python Face    │
│  (Static Files) │  │  (Port 3000)    │  │  (Port 5000)    │
│                 │  │                 │  │                 │
│  Built with:    │  │  PM2 managed    │  │  Gunicorn +     │
│  npm run build  │  │                 │  │  Systemd        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                               │
                               ↓
                     ┌─────────────────┐
                     │    MongoDB      │
                     │    Atlas        │
                     └─────────────────┘
```

## Nginx Configuration

```nginx
# /etc/nginx/sites-available/voxveritas

upstream backend {
    server 127.0.0.1:3000;
}

upstream face_auth {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name voxveritas.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name voxveritas.example.com;

    ssl_certificate /etc/letsencrypt/live/voxveritas.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/voxveritas.example.com/privkey.pem;

    # Frontend (static files)
    location / {
        root /var/www/voxveritas/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Face Auth Service
    location /face-api/ {
        proxy_pass http://face_auth/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_read_timeout 60s;
    }
}
```

## PM2 for Node.js

```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start backend/index.js --name voxveritas-backend

# Save process list
pm2 save

# Start on boot
pm2 startup
```

## Systemd for Python

```ini
# /etc/systemd/system/face-auth.service
[Unit]
Description=Face Authorization System
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/voxveritas/Face-authorization-System
Environment="PATH=/var/www/voxveritas/Face-authorization-System/.venv/bin"
ExecStart=/var/www/voxveritas/Face-authorization-System/.venv/bin/gunicorn -w 2 -b 127.0.0.1:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable face-auth
sudo systemctl start face-auth
```

---

# 7. Common Error Messages & Solutions

## Frontend Errors

### "Camera access denied"

**Cause:** User blocked camera permission

**Solution:**
1. Click the camera icon in browser address bar
2. Select "Allow"
3. Refresh the page

### "No camera found"

**Cause:** No camera connected or driver issue

**Solution:**
1. Check camera is connected
2. Check if camera works in other apps
3. Update camera drivers
4. Try a different browser

### "Camera is already in use"

**Cause:** Another app is using the camera

**Solution:**
1. Close other video chat apps (Zoom, Teams, etc.)
2. Close other browser tabs using camera
3. Restart browser

### "Face detection service error"

**Cause:** Python service not running

**Solution:**
```bash
# Check if service is running
curl http://localhost:5000/

# If not, start it:
cd Face-authorization-System
python app.py
```

## Backend Errors

### "Face authentication service unavailable"

**Cause:** HttpFaceAuthService can't connect to Python

**Solution:**
1. Verify Python service is running on port 5000
2. Check FACE_AUTH_URL in .env
3. Check for firewall blocking

### "Embedding extraction failed"

**Cause:** Python service error or bad image

**Solution:**
1. Check Python service console for errors
2. Ensure image is valid base64
3. Check image has a detectable face

## Python Service Errors

### "ModuleNotFoundError: No module named 'insightface'"

**Cause:** Dependencies not installed

**Solution:**
```bash
cd Face-authorization-System
pip install -r requirements.txt
```

### "No face detected in image"

**Cause:** Face not visible or image too dark

**Solution:**
- Ensure good lighting
- Face should be centered
- No obstructions (sunglasses, masks)
- Face should fill 20-50% of frame

### "Could not load model"

**Cause:** InsightFace model not downloaded

**Solution:**
```bash
# First run downloads automatically
python app.py

# Or manually download:
python -c "from insightface.app import FaceAnalysis; FaceAnalysis()"
```

## Database Errors

### "Face already registered"

**Cause:** User already has face embedding

**Solution:**
- This is expected behavior
- User can reset face auth from profile settings

### "faceEmbedding is not an array"

**Cause:** Corrupted or wrong data type in DB

**Solution:**
```javascript
// In MongoDB shell
db.normalusers.updateOne(
  { email: "user@example.com" },
  { $set: { faceEmbedding: null, hasFaceAuth: false } }
)
```

---

## Quick Reference Commands

```bash
# Start all services (development)
cd Face-authorization-System && python app.py &
cd backend && npm run dev &
cd frontend && npm run dev &

# Check services are running
curl http://localhost:5000/        # Python
curl http://localhost:3000/        # Node.js
# Open http://localhost:5173       # React

# View Python logs
tail -f Face-authorization-System/logs/app.log

# View Node.js logs
pm2 logs voxveritas-backend

# Restart all services
pm2 restart all
sudo systemctl restart face-auth

# Check for port conflicts
netstat -an | findstr 3000
netstat -an | findstr 5000
```

---

This completes the Frontend & Setup documentation for Face Authentication!
