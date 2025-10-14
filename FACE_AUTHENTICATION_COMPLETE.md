# Face Authentication Integration Guide

## Overview

This guide walks you through the complete integration of face authentication into the Crowd-sourced News and Fact-checking Platform. The integration enhances user signup and login with optional face-based authentication using the existing face-authorization-system.

## Features Added

### Backend Enhancements
- **Face Authentication Service**: Integrates existing InsightFace AI logic
- **Enhanced User Models**: Added face embedding storage fields
- **Dual Authentication**: Support for both password and face-based login
- **Face Registration API**: Endpoints for registering face embeddings
- **Face Verification API**: Endpoints for verifying face matches

### Frontend Enhancements
- **Face Capture Component**: Reusable component for camera/upload functionality
- **Enhanced Signup Form**: Optional face registration during signup
- **Enhanced Login Form**: Choice between password and face login
- **Real-time Face Detection**: Live camera feed with face detection
- **Mobile Camera Support**: Automatic device detection and selection

## Prerequisites

### System Requirements
1. **Python 3.9+** with pip installed
2. **Node.js 16+** with npm
3. **MongoDB** running locally or remotely
4. **Webcam** or camera device (for face capture)

### Dependencies Installed
- **Python**: InsightFace, OpenCV, Flask, NumPy, Pillow
- **Node.js**: Express, Mongoose, bcrypt, jsonwebtoken
- **React**: Camera access, file upload, real-time preview

## Installation Steps

### 1. Automated Setup (Recommended)

Run the automated setup script:

```bash
cd backend
node setup-face-auth.js
```

This will:
- Install Python dependencies
- Test the face authentication service
- Verify integration components

### 2. Manual Setup (Alternative)

If the automated setup fails, follow these manual steps:

#### Install Python Dependencies
```bash
cd Face-authorization-System
pip install -r requirements.txt
```

#### Verify Python Installation
```bash
python -c "from insightface.app import FaceAnalysis; print('✓ InsightFace ready')"
python -c "import cv2; print('✓ OpenCV ready')"
```

#### Install Node.js Dependencies (if not already done)
```bash
cd backend
npm install

cd ../frontend
npm install
```

## Configuration

### Backend Configuration

The face authentication service is automatically configured with:
- **Similarity Threshold**: 0.6 (60% match required)
- **Face Detection Model**: ArcFace with CPU execution
- **Image Processing**: Optimized for both webcam and upload
- **Database Storage**: Face embeddings stored as number arrays

### Frontend Configuration

The face capture component supports:
- **Multiple Cameras**: Automatic device enumeration
- **Image Formats**: JPEG, PNG, WebP
- **Upload Methods**: Camera capture or file upload
- **Preview Mode**: Real-time face detection feedback

## Usage Guide

### For Users

#### Signup with Face Authentication
1. Fill out the signup form normally
2. Check "Enable face authentication"
3. Click "Capture Face Image"
4. Allow camera permissions when prompted
5. Position face in the camera frame
6. Click "Capture Your Face"
7. Review the captured image
8. Complete signup

#### Login Options
1. **Password Login**: Traditional email + password
2. **Face Login**: Email + face verification
   - Select "Face ID" login method
   - Enter your email address
   - Capture your face or upload photo
   - System verifies against stored embedding

### For Developers

#### User Model Schema Changes
All user models now include:
```javascript
{
  faceEmbedding: [Number],     // Face embedding array
  faceRegisteredAt: Date,      // Registration timestamp
  hasFaceAuth: Boolean         // Face auth enabled flag
}
```

#### API Endpoints Added
- `POST /users/{type}/register-face` - Register face for existing user
- `POST /users/{type}/verify-face` - Verify face against database
- `GET /users/{type}/face-auth-status/{userId}` - Get face auth status

#### Face Capture Component Props
```jsx
<FaceCapture
  onCapture={handleCapture}        // Required: callback for captured image
  onError={handleError}            // Required: callback for errors
  mode="both"                      // "capture" | "upload" | "both"
  showPreview={true}               // Show captured image preview
  captureButtonText="Capture"      // Custom button text
  uploadButtonText="Upload"        // Custom button text
  disabled={false}                 // Disable component
  className=""                     // Additional CSS classes
/>
```

## Security Features

### Face Data Protection
- **No Image Storage**: Only mathematical embeddings stored
- **Encrypted Transmission**: All face data sent via HTTPS
- **Local Processing**: Face detection runs locally
- **Similarity Threshold**: Configurable match requirements

### Authentication Flow
1. **Face Registration**: Extract embedding → Store in database
2. **Face Login**: Extract embedding → Compare with stored → Verify match
3. **Fallback Support**: Password login always available
4. **Cross-User Prevention**: Embeddings compared within user type

## Troubleshooting

### Common Issues

#### Python Dependencies
```bash
# If InsightFace installation fails:
pip install --upgrade pip
pip install onnxruntime
pip install insightface

# For ARM64 systems (M1 Mac):
pip install onnxruntime-silicon
```

#### Camera Access
- **Permission Denied**: Check browser camera permissions
- **No Camera Found**: Verify camera is connected and not in use
- **Poor Quality**: Ensure good lighting and face visibility

#### Face Detection
- **No Face Detected**: Ensure face is clearly visible and well-lit
- **Multiple Faces**: System uses first detected face
- **Low Similarity**: Try recapturing with better angle/lighting

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "No face detected" | Face not visible or poor quality | Improve lighting, center face |
| "Face not recognized" | Low similarity score | Recapture or use password login |
| "Camera access denied" | Browser permissions | Allow camera access in browser |
| "Python service error" | Missing dependencies | Run setup script or install manually |

## Testing

### Manual Testing Steps

1. **Test Signup with Face Auth**:
   - Create new account with face capture
   - Verify face embedding is stored
   - Check `hasFaceAuth` flag is true

2. **Test Face Login**:
   - Use face login with registered user
   - Verify successful authentication
   - Test with different lighting/angles

3. **Test Password Fallback**:
   - Ensure password login still works
   - Test with users who have face auth enabled

4. **Test Error Handling**:
   - Try with no face in image
   - Test with multiple faces
   - Verify error messages are helpful

### Automated Testing

```bash
# Test Python service
cd Face-authorization-System
python test_setup.py

# Test backend integration
cd backend
npm test # (if tests are configured)

# Test frontend components
cd frontend
npm test # (if tests are configured)
```

## Performance Considerations

### Optimization Settings
- **Image Resize**: Automatic scaling for faster processing
- **Quality Balance**: Different settings for webcam vs upload
- **Memory Management**: Embeddings cleared after processing
- **Concurrent Limits**: One face operation per user session

### Resource Usage
- **CPU**: Face detection requires moderate CPU for ~2-5 seconds
- **Memory**: ~50MB additional for face processing models
- **Storage**: ~512 bytes per face embedding in database
- **Network**: Base64 images temporarily increase payload size

## Future Enhancements

### Planned Features
- **Multiple Face Registration**: Support for backup face embeddings
- **Liveness Detection**: Prevent photo-based attacks
- **Face Quality Assessment**: Automatic quality scoring
- **Progressive Enhancement**: Graceful fallback for unsupported devices

### Integration Opportunities
- **2FA Integration**: Combine with existing 2FA systems
- **Admin Dashboard**: Face auth usage analytics
- **Audit Logging**: Track face authentication events
- **Mobile App**: React Native face capture component

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console logs for detailed error messages
3. Verify Python dependencies are correctly installed
4. Test camera access in browser settings
5. Ensure MongoDB is running and accessible

The face authentication system is designed to enhance security while maintaining user experience. All face authentication is optional - users can always fall back to password-based authentication.
