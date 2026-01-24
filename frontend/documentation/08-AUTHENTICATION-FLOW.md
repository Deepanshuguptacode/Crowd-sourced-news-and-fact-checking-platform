# 08 - Authentication Flow: Login, Signup, and Face Auth

## What You'll Learn
- Complete authentication flow from start to finish
- How login works with multiple user types
- Face authentication integration
- Token storage and management
- Session persistence across page reloads
- Logout and session cleanup

---

## Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌────────────────────────────┐
                    │      User Opens App        │
                    └────────────────────────────┘
                              │
                              ▼
                    ┌────────────────────────────┐
                    │  Check localStorage for    │
                    │  existing token            │
                    └────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
     Token Exists                      No Token
              │                               │
              ▼                               ▼
     Restore Session               Show Login/Signup Page
     (UserContext loads)
              │
              ▼
     User Authenticated
```

---

## User Types and Their Roles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    USER TYPES IN THE PLATFORM                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────┬────────────────────────────────────────────────────────────┐
│   USER TYPE    │   CAPABILITIES                                             │
├────────────────┼────────────────────────────────────────────────────────────┤
│   guest        │ - View news feed                                          │
│                │ - No commenting or voting                                  │
│                │ - Limited features                                         │
├────────────────┼────────────────────────────────────────────────────────────┤
│   normal       │ - View news feed                                          │
│   (Onlooker)   │ - Vote on news                                            │
│                │ - No commenting on news (can comment in debates)          │
├────────────────┼────────────────────────────────────────────────────────────┤
│   community    │ - All normal user features                                │
│                │ - Add comments on news                                     │
│                │ - Participate in debates                                   │
│                │ - Upload news articles                                     │
├────────────────┼────────────────────────────────────────────────────────────┤
│   expert       │ - All community user features                             │
│                │ - Add expert comments (higher weight)                      │
│                │ - Verify community comments                                │
│                │ - Access to AI verdict generation                         │
│                │ - Create debate rooms                                      │
└────────────────┴────────────────────────────────────────────────────────────┘
```

---

## The Login Form Component

```jsx
// frontend/src/pages/LoginForm.jsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/userContext";
import { authAPI } from "../services/api";
import { toast } from "react-toastify";
import FaceCapture from '../components/FaceCapture';

const LoginForm = () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Form data state - stores what user types
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "normal"    // Default to 'normal' (Onlooker)
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);  // Toggle password visibility
  const [loading, setLoading] = useState(false);             // Show loading spinner
  
  // Login method selection
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'face'
  
  // Face authentication state
  const [faceImage, setFaceImage] = useState(null);           // Captured face image
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [similarityScore, setSimilarityScore] = useState(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT AND NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Get login function from context (to update global state)
  const { login } = useContext(UserContext);
  
  // Navigation hook (to redirect after login)
  const navigate = useNavigate();
```

### Form Input Handlers

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Handle text input changes (email, password)
  const handleInputChange = (e) => {
    const { id, value } = e.target;    // Get field id and new value
    setFormData({
      ...formData,     // Keep existing values
      [id]: value,     // Update changed field
    });
  };

  // Handle user type dropdown change
  const handleUserTypeChange = (e) => {
    setFormData({
      ...formData,
      userType: e.target.value,  // 'normal', 'community', or 'expert'
    });
  };
```

### Guest Login (No Authentication Needed)

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // GUEST LOGIN
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Quick login without credentials
  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      // Set guest user context without API call
      // Guest doesn't need backend authentication
      login({
        userType: 'guest',
        token: 'guest-token',
        name: 'Guest User'
      });
      
      toast.success("Logged in as Guest!");
      navigate("/home");
      
    } catch (error) {
      toast.error("Guest login failed!");
    } finally {
      setLoading(false);
    }
  };
```

### Face Capture Handler

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // FACE CAPTURE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Called when face is successfully captured
  const handleFaceCapture = (imageDataUrl) => {
    setFaceImage(imageDataUrl);   // Store base64 image
    toast.success("Face captured successfully!");
  };

  // Called when face capture fails
  const handleFaceCaptureError = (error) => {
    toast.error("Face capture failed: " + error);
  };
```

### Main Submit Handler (The Core Login Logic)

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // FORM SUBMISSION
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleSubmit = async (e) => {
    e.preventDefault();   // Prevent form from refreshing page
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: VALIDATE INPUTS
    // ─────────────────────────────────────────────────────────────────────
    
    // Password login requires email + password
    if (loginMethod === 'password' && (!formData.email || !formData.password)) {
      toast.error("Email and password are required for password login!");
      return;
    }
    
    // Face login requires email + face image
    if (loginMethod === 'face' && (!formData.email || !faceImage)) {
      toast.error("Email and face image are required for face login!");
      return;
    }

    setLoading(true);
    
    try {
      // ─────────────────────────────────────────────────────────────────────
      // STEP 2: BUILD LOGIN DATA
      // ─────────────────────────────────────────────────────────────────────
      
      const loginData = {
        email: formData.email,
        loginMethod: loginMethod,   // Tell backend which method we're using
        
        // Conditionally include password OR face image
        ...(loginMethod === 'password' && { password: formData.password }),
        ...(loginMethod === 'face' && { faceImage: faceImage })
      };

      // ─────────────────────────────────────────────────────────────────────
      // STEP 3: MAKE API CALL
      // ─────────────────────────────────────────────────────────────────────
      
      // authAPI.login(userType, credentials)
      // This sends POST to /users/{userType}/login
      const response = await authAPI.login(formData.userType, loginData);

      // ─────────────────────────────────────────────────────────────────────
      // STEP 4: HANDLE SUCCESS
      // ─────────────────────────────────────────────────────────────────────
      
      if (response.token) {
        // Display similarity score for face login
        if (response.authMethod === 'face' && response.similarity) {
          setSimilarityScore(response.similarity);
          const scorePercent = (response.similarity * 100).toFixed(1);
          toast.success(`Face login successful! Match: ${scorePercent}%`);
        } else {
          toast.success("Login successful!");
        }
        
        // Update global context with user data
        login({
          ...response.user,
          userType: formData.userType
        }, response.token);

        // Redirect to home page
        navigate("/home");
      }
      
    } catch (error) {
      // ─────────────────────────────────────────────────────────────────────
      // STEP 5: HANDLE ERROR
      // ─────────────────────────────────────────────────────────────────────
      toast.error(error.response?.data?.message || "Login failed!");
      
    } finally {
      setLoading(false);
    }
  };
```

---

## Login Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                                               │
└─────────────────────────────────────────────────────────────────────────────┘

User fills form
      │
      ▼
handleSubmit() called
      │
      ▼
┌──────────────────┐
│ Validate inputs  │
│ based on method  │
└──────────────────┘
      │
      ▼
┌──────────────────┐
│ Build loginData  │
│ object           │
└──────────────────┘
      │
      ▼
┌──────────────────────────────────────────┐
│ authAPI.login(userType, loginData)       │
│                                          │
│ POST /users/{userType}/login             │
│ Body: { email, password/faceImage }      │
└──────────────────────────────────────────┘
      │
      ▼
┌──────────────────┐
│ Backend validates│
│ credentials      │
└──────────────────┘
      │
      ├──────────────────────────────┐
      ▼                              ▼
   SUCCESS                        ERROR
      │                              │
      ▼                              ▼
┌──────────────────┐         ┌──────────────────┐
│ Response:        │         │ toast.error()    │
│ { token, user }  │         │ Show error msg   │
└──────────────────┘         └──────────────────┘
      │
      ▼
┌──────────────────────────────────────────┐
│ login(userData, token)                   │
│                                          │
│ - Updates UserContext state              │
│ - Saves to localStorage:                 │
│   - authToken                            │
│   - userInfo                             │
│   - userType                             │
└──────────────────────────────────────────┘
      │
      ▼
navigate("/home")
```

---

## The Signup Form

```jsx
// frontend/src/pages/SignupForm.jsx

const SignupForm = () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE - MORE FIELDS THAN LOGIN
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [formData, setFormData] = useState({
    name: "",             // Display name
    username: "",         // Unique username
    email: "",            // Email address
    password: "",         // Password
    userType: "normal",   // User role
    confirmPassword: "",  // Password confirmation
    profession: ""        // Only for expert users
  });
  
  const [faceImage, setFaceImage] = useState(null);      // Face for auth
  const [skipFaceAuth, setSkipFaceAuth] = useState(false); // Option to skip face
  
  const { login } = useContext(UserContext);
  const navigate = useNavigate();
```

### Face Duplicate Check During Signup

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // FACE CAPTURE WITH DUPLICATE CHECK
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleFaceCapture = async (imageDataUrl) => {
    setFaceImage(imageDataUrl);
    
    // If user wants face auth, check for duplicates
    if (!skipFaceAuth && imageDataUrl) {
      try {
        // Call Face Auth Python service to check for duplicates
        const response = await fetch(`${config.FACE_AUTH_URL}/api/check_duplicate_face`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageDataUrl }),
        });

        const result = await response.json();
        
        if (result.success && result.isDuplicate) {
          // Someone else already registered this face!
          const scorePercent = (result.similarity * 100).toFixed(1);
          toast.error(
            `This face is already registered! Match: ${scorePercent}% with user: ${result.existingUsername}`,
            { autoClose: 5000 }
          );
          setFaceImage(null);  // Clear the image
          return;
        }
        
        toast.success("Face captured successfully!");
        
      } catch (error) {
        console.error('Duplicate check error:', error);
        toast.warning("Face captured, but couldn't check for duplicates.");
      }
    }
  };
```

### Signup Submit Handler

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNUP SUBMISSION
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: VALIDATE PASSWORD MATCH
    // ─────────────────────────────────────────────────────────────────────
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: CHECK FACE AUTH REQUIREMENT
    // ─────────────────────────────────────────────────────────────────────
    if (!skipFaceAuth && !faceImage) {
      toast.error("Please capture your face or choose to skip face authentication.");
      setShowFaceCapture(true);
      return;
    }

    setLoading(true);

    try {
      // ─────────────────────────────────────────────────────────────────────
      // STEP 3: BUILD SIGNUP DATA
      // ─────────────────────────────────────────────────────────────────────
      const signupData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        
        // Include profession only for experts
        ...(formData.userType === 'expert' && { profession: formData.profession }),
        
        // Include face image only if captured and not skipped
        ...(faceImage && !skipFaceAuth && { faceImage })
      };

      // ─────────────────────────────────────────────────────────────────────
      // STEP 4: CALL SIGNUP API
      // ─────────────────────────────────────────────────────────────────────
      const response = await authAPI.signup(formData.userType, signupData);
      
      // ─────────────────────────────────────────────────────────────────────
      // STEP 5: HANDLE RESPONSE
      // ─────────────────────────────────────────────────────────────────────
      if (response.token) {
        // Auto-login after successful signup
        login({
          ...response.user,
          userType: formData.userType
        }, response.token);

        toast.success(
          response.hasFaceAuth 
            ? "Signup successful with face authentication!" 
            : "Signup successful!"
        );
        navigate("/home");
        
      } else {
        // Expert users might need admin approval
        toast.success("Signup successful! Please wait for admin approval.");
        navigate("/login");
      }
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed!");
    } finally {
      setLoading(false);
    }
  };
```

---

## Face Capture Component

```jsx
// frontend/src/components/FaceCapture.jsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import config from '../config';

const FaceCapture = ({ 
  onCapture,           // Callback when face is captured
  onError,             // Callback when error occurs
  disabled = false,    // Disable component
  className = "",      // Additional CSS classes
  mode = "capture",    // "capture" | "upload" | "both"
  showPreview = true,  // Show preview of captured face
  captureButtonText = "Capture Face",
  uploadButtonText = "Upload Image"
}) => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [isCapturing, setIsCapturing] = useState(false);      // Camera active?
  const [stream, setStream] = useState(null);                  // Media stream
  const [capturedImage, setCapturedImage] = useState(null);    // Captured base64
  const [error, setError] = useState(null);                    // Error message
  const [processing, setProcessing] = useState(false);         // Processing image
  const [devices, setDevices] = useState([]);                  // Available cameras
  const [selectedDevice, setSelectedDevice] = useState('');    // Selected camera
  const [faceDetectionResult, setFaceDetectionResult] = useState(null);
  const [faceCropPreview, setFaceCropPreview] = useState(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // REFS - Direct DOM access
  // ═══════════════════════════════════════════════════════════════════════════
  
  const videoRef = useRef(null);        // Video element
  const canvasRef = useRef(null);       // Canvas for capture
  const fileInputRef = useRef(null);    // File input element
```

### Start/Stop Camera

```jsx
  // ═══════════════════════════════════════════════════════════════════════════
  // CAMERA CONTROL
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Start camera with proper constraints
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Request camera with specific constraints
      const constraints = {
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        },
        audio: false  // No audio needed
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setIsCapturing(true);
      
    } catch (error) {
      let errorMessage = 'Could not access camera';
      
      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application.';
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [stream, selectedDevice, onError]);

  // Stop camera and cleanup
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);
```

---

## Token Storage and Session Persistence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SESSION PERSISTENCE                                      │
└─────────────────────────────────────────────────────────────────────────────┘

localStorage (Browser Storage)
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Key: "authToken"                                                           │
│  Value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."                          │
│                                                                             │
│  Key: "userInfo"                                                            │
│  Value: '{"_id":"...","name":"John","email":"john@example.com"}'            │
│                                                                             │
│  Key: "userType"                                                            │
│  Value: "community"                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          │ On App Load (main.jsx)
          │
          ▼
UserProvider checks localStorage
          │
          │ Token exists?
          │
          ├─── Yes ──▶ Restore session (user stays logged in)
          │
          └─── No ───▶ User needs to login
```

### How Session Restoration Works

```jsx
// In userContext.jsx

useEffect(() => {
  // This runs when app first loads
  
  const storedUserInfo = localStorage.getItem("userInfo");
  const storedUserType = localStorage.getItem("userType");
  const storedToken = localStorage.getItem("authToken");

  // If all data exists, restore the session
  if (storedUserInfo && storedUserType && storedToken) {
    try {
      setUserInfo(JSON.parse(storedUserInfo));
      setUserType(storedUserType);
      setIsAuthenticated(true);
    } catch (error) {
      // Invalid JSON - clear storage
      localStorage.clear();
    }
  }
  
  setLoading(false);  // Done initializing
}, []);
```

---

## Logout Flow

```jsx
// In userContext.jsx

const logout = () => {
  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: CLEAR LOCAL STATE
  // ─────────────────────────────────────────────────────────────────────────
  setUserType(null);
  setUserInfo(null);
  setIsAuthenticated(false);
  
  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: CLEAR LOCAL STORAGE
  // ─────────────────────────────────────────────────────────────────────────
  localStorage.removeItem('authToken');
  localStorage.removeItem('userType');
  localStorage.removeItem('userInfo');
};
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LOGOUT FLOW                                              │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks Logout
      │
      ▼
logout() called from UserContext
      │
      ├─────────────────────────────────────────────┐
      │                                             │
      ▼                                             ▼
Clear React State                           Clear localStorage
- setUserType(null)                         - remove authToken
- setUserInfo(null)                         - remove userType
- setIsAuthenticated(false)                 - remove userInfo
      │                                             │
      └─────────────────────────────────────────────┘
                    │
                    ▼
          User is logged out
                    │
                    ▼
          ProtectedRoute redirects to /login
```

---

## Complete Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE AUTHENTICATION FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ 1. USER OPENS APP                                                         │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  main.jsx → UserProvider → checks localStorage for existing session      │
│                                                                           │
│  If session exists → User authenticated automatically                    │
│  If no session → User sees Login/Signup page                            │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ 2. USER SIGNS UP                                                          │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  SignupForm.jsx                                                           │
│       │                                                                   │
│       ▼                                                                   │
│  Fill form: name, username, email, password, userType                    │
│       │                                                                   │
│       ▼                                                                   │
│  Capture face (optional) → Check for duplicate faces                     │
│       │                                                                   │
│       ▼                                                                   │
│  authAPI.signup(userType, signupData)                                    │
│       │                                                                   │
│       ▼                                                                   │
│  Backend creates user, generates JWT token                               │
│       │                                                                   │
│       ▼                                                                   │
│  login(userData, token) → Updates context + localStorage                 │
│       │                                                                   │
│       ▼                                                                   │
│  navigate("/home") → User enters app                                     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ 3. USER LOGS IN                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  LoginForm.jsx                                                            │
│       │                                                                   │
│       ▼                                                                   │
│  Choose login method: Password OR Face                                   │
│       │                                                                   │
│       ├─ Password: email + password                                      │
│       └─ Face: email + capture face                                      │
│       │                                                                   │
│       ▼                                                                   │
│  authAPI.login(userType, loginData)                                      │
│       │                                                                   │
│       ▼                                                                   │
│  Backend validates credentials, returns JWT token                        │
│       │                                                                   │
│       ▼                                                                   │
│  login(userData, token) → Updates context + localStorage                 │
│       │                                                                   │
│       ▼                                                                   │
│  navigate("/home") → User enters app                                     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ 4. USER BROWSES APP                                                       │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Every API request:                                                       │
│       │                                                                   │
│       ▼                                                                   │
│  Axios interceptor adds Authorization: Bearer {token}                    │
│       │                                                                   │
│       ▼                                                                   │
│  Backend validates token, identifies user                                │
│       │                                                                   │
│       ▼                                                                   │
│  Request processed based on user permissions                             │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ 5. USER LOGS OUT                                                          │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  logout() called                                                          │
│       │                                                                   │
│       ▼                                                                   │
│  Clear context state + localStorage                                      │
│       │                                                                   │
│       ▼                                                                   │
│  ProtectedRoute redirects to /login                                      │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Interview Questions & Answers

### Q1: How do you handle session persistence in React?

**Answer:** We store authentication data (token, user info, user type) in `localStorage`. When the app loads, `UserContext` checks localStorage for existing session data. If found, the session is restored without requiring re-login.

### Q2: What's the difference between password and face authentication?

**Answer:**
- **Password auth**: User provides email + password, sent to backend for validation
- **Face auth**: User captures face image, sent to Face Auth Python service which compares against stored face embedding using DeepFace library

### Q3: How do you prevent duplicate face registrations?

**Answer:** During signup, before accepting a face image:
1. Send the captured face to `/api/check_duplicate_face`
2. Face Auth service compares against all stored faces
3. If similarity > 70%, reject with "face already registered"
4. This prevents one person from creating multiple accounts

### Q4: How does the token get attached to every API request?

**Answer:** Using Axios request interceptor:
1. Before every request, interceptor runs
2. Gets token from localStorage
3. Adds `Authorization: Bearer {token}` header
4. Backend validates token on every protected endpoint

### Q5: What happens if the token expires?

**Answer:** When backend rejects a request with 401 status:
1. Response interceptor catches the error
2. Could implement automatic token refresh
3. Or clear localStorage and redirect to login
4. User needs to re-authenticate

---

**Next: [09-LAYOUT-COMPONENTS.md](./09-LAYOUT-COMPONENTS.md)** - Header, NavBar, Footer, and page layouts →
