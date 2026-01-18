# Face Authorization System Setup Guide

## Prerequisites

1. **MongoDB Installation**: 
   - Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
   - Install MongoDB and start the MongoDB service
   - Default connection: mongodb://localhost:27017/

2. **Python Environment**: Already configured ✅

## Quick Start

1. **Start MongoDB Service** (if not running):
   ```bash
   # Windows (run as administrator)
   net start MongoDB
   
   # Or start manually from MongoDB installation directory
   mongod --dbpath "C:\data\db"
   ```

2. **Run the Face Authorization System**:
   ```bash
   # Face Authorization System

A complete web-based face recognition system using Flask, MongoDB, and InsightFace AI for secure face-based authentication.

## 🌟 Features

- **Web-based Interface**: Clean, modern UI accessible from any browser
- **Dual Input Methods**: Camera capture or image upload
- **Mobile Webcam Support**: Automatic detection and optimization for mobile cameras
- **Real-time Face Detection**: Optimized performance with 2-5 second processing
- **Face Crop Preview**: Shows detected face region before registration/verification
- **MongoDB Integration**: Secure storage of face embeddings (not images)
- **Similarity Scoring**: Detailed terminal logs with similarity percentages
- **Multi-camera Support**: Camera selection dropdown with device detection
- **Performance Optimized**: Different quality settings for detection vs final processing

## 🚀 Quick Start

1. **Install Python 3.9-3.11** and **MongoDB**
2. **Clone/Download** this project
3. **Create virtual environment**: `python -m venv .venv`
4. **Activate environment**: `.venv\Scripts\activate` (Windows) or `source .venv/bin/activate` (Mac/Linux)
5. **Install dependencies**: `pip install -r requirements.txt`
6. **Start MongoDB** service
7. **Run application**: `python app.py`
8. **Open browser**: `http://localhost:5000`

## 📁 Project Structure

```
face-authorization-system/
├── app.py                    # Main Flask application
├── working.py               # Original face recognition script
├── requirements.txt         # Python dependencies
├── SETUP_GUIDE.md          # Detailed installation guide
├── README.md               # This file
└── templates/
    ├── index.html          # Home page
    ├── register_clean.html # Face registration page
    └── login_clean.html    # Face verification page
```

## 🎯 How to Use

### Register a Face:
1. Go to `/register`
2. Enter username
3. Choose camera or upload image
4. Capture/process face
5. Review face crop preview
6. Click Register

### Verify Face:
1. Go to `/login`
2. Choose verification method
3. Present your face or upload image
4. System compares with registered users
5. View results with similarity score

## 📱 Mobile Camera Setup

- **DroidCam**: Install on phone and PC, connect to same WiFi
- **EpocCam**: Install on iPhone/Mac, start both apps
- **Camera Selection**: Mobile cameras show 📱 icon in dropdown

## 🔧 Technical Details

- **AI Model**: InsightFace Buffalo_L (ArcFace architecture)
- **Face Detection**: ONNX optimized models
- **Database**: MongoDB with face embedding storage
- **Framework**: Flask with CORS support
- **Image Processing**: OpenCV + PIL optimization
- **Performance**: 2-5 second processing time

## 📊 Performance Features

- **Adaptive Quality**: Lower quality for real-time detection, higher for final processing
- **Mobile Optimization**: Frame rate and resolution limits for mobile cameras
- **Smart Detection**: 2-second intervals to reduce CPU load
- **Resource Management**: Proper camera cleanup and memory management

## 🛠️ API Endpoints

- `GET /` - Home page
- `GET /register` - Registration page
- `GET /login` - Verification page
- `POST /api/detect_face` - Face detection API
- `POST /api/register_face` - Face registration API
- `POST /api/verify_face` - Face verification API
- `GET /api/get_users` - List registered users

## 📋 Requirements

- Python 3.9-3.11
- MongoDB 4.4+
- 4GB+ RAM (8GB recommended)
- Webcam or mobile camera
- Modern browser with camera support

## 🔒 Security Features

- Face embeddings stored (not images)
- Configurable similarity thresholds
- Input validation and error handling
- CORS protection
- Resource cleanup

## 📈 Monitoring

- Terminal logs with detailed timing
- Similarity scores for each verification
- Face detection success rates
- Camera performance metrics

## 🎨 UI Features

- Modern gradient design
- Responsive layout
- Real-time status updates
- Face crop previews
- Progress indicators
- Camera switching interface

## 🌐 Browser Compatibility

- Chrome (Recommended)
- Firefox
- Safari
- Edge
- Mobile browsers with camera support

## 📞 Support

For detailed setup instructions, see `SETUP_GUIDE.md`.

Common issues:
- Camera permissions in browser
- MongoDB connection
- Model download (automatic on first run)
- Mobile camera detection

## 🏆 Success Metrics

- ✅ 2-5 second face processing
- ✅ Mobile webcam support
- ✅ 80%+ accuracy with good lighting
- ✅ Real-time face detection
- ✅ Clean, intuitive interface

Built with ❤️ using Flask, InsightFace, and MongoDB.
   ```

3. **Access the Web Application**:
   - Open your browser and go to: http://localhost:5000
   - Register new faces
   - Verify existing faces

## Features

### Registration Process:
- Enter username
- Start camera
- Live face detection with red bounding box
- Capture face when properly detected
- Store face embedding in MongoDB

### Verification Process:
- Start camera
- Live face detection with green bounding box
- Verify face against all registered users
- Show similarity score and access result

## Database Structure

The system creates a MongoDB database `face_auth_db` with collection `users`:

```json
{
  "_id": "ObjectId",
  "username": "string",
  "embedding": [array of float values],
  "registered_at": "datetime",
  "bbox": [x1, y1, x2, y2]
}
```

## Security Features

- Face embeddings are stored instead of actual images
- Cosine similarity matching with configurable threshold
- Real-time face detection for better capture quality
- MongoDB for secure and scalable storage

## Troubleshooting

1. **Camera Access Issues**: 
   - Allow camera permissions in browser
   - Check if camera is being used by other applications

2. **MongoDB Connection Error**:
   - Ensure MongoDB service is running
   - Check connection string in app.py

3. **Face Detection Issues**:
   - Ensure good lighting
   - Face should be clearly visible
   - Look directly at camera

## Technology Stack

- **Backend**: Flask (Python)
- **AI/ML**: InsightFace (same logic as working.py)
- **Database**: MongoDB
- **Frontend**: HTML5, JavaScript, WebRTC
- **Computer Vision**: OpenCV, NumPy

## API Endpoints

- `GET /` - Home page
- `GET /register` - Registration page
- `GET /login` - Verification page
- `POST /api/register_face` - Register new face
- `POST /api/verify_face` - Verify existing face
- `GET /api/get_users` - List registered users
