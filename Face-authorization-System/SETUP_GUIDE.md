# Face Authorization System - Complete Setup Guide

## 📋 System Requirements

### Hardware Requirements:
- **Minimum**: 4GB RAM, Intel i3 or equivalent processor
- **Recommended**: 8GB+ RAM, Intel i5+ or equivalent processor
- **Camera**: Webcam or mobile phone with camera (DroidCam, EpocCam, etc.)
- **Storage**: At least 2GB free space

### Software Requirements:
- **Operating System**: Windows 10/11, macOS 10.14+, or Ubuntu 18.04+
- **Python**: Version 3.9 to 3.11 (3.12+ may have compatibility issues)
- **MongoDB**: Version 4.4+ (Community Edition)

## 🚀 Installation Guide

### Step 1: Install Python
1. Download Python from [python.org](https://www.python.org/downloads/)
2. **Important**: During installation, check "Add Python to PATH"
3. Verify installation:
   ```bash
   python --version
   # Should show Python 3.9.x or 3.10.x or 3.11.x
   ```

### Step 2: Install MongoDB
#### Windows:
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install with default settings
3. MongoDB will start automatically as a Windows service

#### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

#### Ubuntu/Linux:
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 3: Verify MongoDB Installation
```bash
# Test MongoDB connection
mongosh
# Or for older versions:
mongo

# You should see MongoDB shell. Type 'exit' to quit.
```

### Step 4: Clone/Download Project
```bash
# If using Git
git clone <your-repository-url>
cd face-authorization-system

# Or download and extract the project files to a folder
# Navigate to the project directory
cd path/to/your/project
```

### Step 5: Create Virtual Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate

# macOS/Linux:
source .venv/bin/activate

# You should see (.venv) in your terminal prompt
```

### Step 6: Install Dependencies
```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Install all requirements
pip install -r requirements.txt

# This will install:
# - Flask (web framework)
# - OpenCV (computer vision)
# - InsightFace (face recognition AI)
# - MongoDB driver
# - Image processing libraries
```

### Step 7: Download AI Models (Automatic)
The InsightFace models will be downloaded automatically on first run:
- Models are downloaded to: `~/.insightface/models/`
- Total size: ~350MB
- This happens once during first startup

## 🔧 Configuration

### MongoDB Setup
1. **Start MongoDB** (if not already running):
   ```bash
   # Windows (if not running as service):
   mongod

   # macOS:
   brew services start mongodb/brew/mongodb-community

   # Linux:
   sudo systemctl start mongod
   ```

2. **Verify MongoDB is running**:
   ```bash
   mongosh
   # Should connect without errors
   ```

### Project Structure
```
face-authorization-system/
├── app.py                 # Main Flask application
├── working.py            # Original face recognition script
├── requirements.txt      # Python dependencies
├── templates/
│   ├── index.html       # Home page
│   ├── register_clean.html  # Registration page
│   └── login_clean.html     # Verification page
└── .venv/               # Virtual environment (created during setup)
```

## 🎯 Running the Application

### Start the System
1. **Ensure MongoDB is running**:
   ```bash
   # Check if MongoDB is running
   mongosh --eval "db.runCommand('ping')"
   ```

2. **Activate virtual environment** (if not already active):
   ```bash
   # Windows:
   .venv\Scripts\activate

   # macOS/Linux:
   source .venv/bin/activate
   ```

3. **Start the Flask application**:
   ```bash
   python app.py
   ```

4. **Access the application**:
   - Open browser and go to: `http://localhost:5000`
   - Or use the network IP shown in terminal for mobile access

### Application Features
- **Home Page**: `http://localhost:5000`
- **Face Registration**: `http://localhost:5000/register`
- **Face Verification**: `http://localhost:5000/login`

## 📱 Mobile Webcam Setup (Optional)

### Using DroidCam (Android/iOS):
1. Install DroidCam on your phone and computer
2. Connect phone and computer to same WiFi
3. Start DroidCam app on phone
4. Start DroidCam client on computer
5. Your phone camera will appear in the camera selection dropdown

### Using EpocCam (iOS):
1. Install EpocCam on iPhone and Mac/PC
2. Connect devices to same network
3. Start EpocCam on both devices
4. Camera will be available in the application

## 🔍 Testing the System

### 1. Test Face Registration:
1. Go to `http://localhost:5000/register`
2. Enter a username
3. Choose "📷 Use Camera" or "📁 Upload Image"
4. For camera: Select camera → Start Camera → Capture Face → Register
5. For upload: Select image → Process Image → Register

### 2. Test Face Verification:
1. Go to `http://localhost:5000/login`
2. Choose verification method
3. Verify with same face used in registration
4. Check terminal for detailed similarity scores

### 3. Check Database:
```bash
mongosh
use face_auth_db
db.users.find()
# Should show registered users with embeddings
```

## 🛠️ Troubleshooting

### Common Issues:

#### 1. "No module named 'cv2'"
```bash
pip uninstall opencv-python
pip install opencv-python==4.8.1.78
```

#### 2. "MongoDB connection failed"
```bash
# Check if MongoDB is running
mongosh

# If not running, start it:
# Windows: mongod
# macOS: brew services start mongodb/brew/mongodb-community
# Linux: sudo systemctl start mongod
```

#### 3. "Cannot find model files"
- Models download automatically on first run
- Ensure internet connection during first startup
- Models stored in: `C:\Users\{username}\.insightface\models\` (Windows)

#### 4. "Camera not detected"
- Check camera permissions in browser
- Try different browsers (Chrome recommended)
- For mobile webcam, ensure DroidCam/EpocCam is running

#### 5. "Face detection too slow"
- Use mobile camera for better performance
- Ensure good lighting
- Position face clearly in camera frame

#### 6. "Port 5000 already in use"
```bash
# Kill process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID {PID_NUMBER} /F

# macOS/Linux:
lsof -ti:5000 | xargs kill -9
```

### Performance Optimization:
1. **Use mobile camera** for better image quality
2. **Good lighting** improves face detection speed
3. **Close unnecessary applications** to free up CPU/RAM
4. **Position face centrally** in camera frame

## 📊 System Monitoring

### Check Logs:
- Terminal shows detailed logs with timing information
- Look for similarity scores in verification logs
- Monitor face detection performance

### Database Monitoring:
```bash
mongosh
use face_auth_db
db.users.countDocuments()  # Count registered users
db.users.find({}, {username: 1, registered_at: 1})  # List users
```

## 🔒 Security Notes

1. **Development Server**: This uses Flask's development server
2. **Production Deployment**: Use WSGI server like Gunicorn for production
3. **Database Security**: Configure MongoDB authentication for production
4. **HTTPS**: Use HTTPS in production for camera access
5. **Data Privacy**: Face embeddings are stored, not actual images

## 📞 Support

### If you encounter issues:
1. Check terminal logs for error messages
2. Verify all dependencies are installed: `pip list`
3. Ensure MongoDB is running: `mongosh`
4. Test with good lighting and clear face positioning
5. Try different browsers if camera issues persist

### System Requirements Met:
- ✅ Python 3.9-3.11 installed
- ✅ MongoDB running on localhost:27017
- ✅ All dependencies installed via requirements.txt
- ✅ Camera access permissions granted
- ✅ Good lighting for face detection

## 🎉 Success Indicators:
- Flask app starts without errors
- MongoDB connection successful
- Camera appears in dropdown list
- Face detection works within 2-5 seconds
- Registration and verification complete successfully
- Terminal shows similarity scores during verification

Your Face Authorization System is now ready to use! 🚀
