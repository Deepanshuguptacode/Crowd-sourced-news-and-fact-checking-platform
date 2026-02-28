# 08 — Authentication Flow: Login, Signup & Face Auth Deep-Dive

## Table of Contents
1. [Authentication Overview — What and Why](#1-authentication-overview--what-and-why)
2. [JWT (JSON Web Tokens) Theory](#2-jwt-json-web-tokens-theory)
3. [The User Types and Their Powers](#3-the-user-types-and-their-powers)
4. [Login Flow — Password Method](#4-login-flow--password-method)
5. [Login Flow — Face Authentication](#5-login-flow--face-authentication)
6. [Guest Login Flow](#6-guest-login-flow)
7. [Signup Flow](#7-signup-flow)
8. [Session Persistence — Surviving Page Refresh](#8-session-persistence--surviving-page-refresh)
9. [Logout Flow](#9-logout-flow)
10. [The FaceCapture Component](#10-the-facecapture-component)
11. [Interview Q&A](#11-interview-qa)

---

## 1. Authentication Overview — What and Why

**Authentication** = proving who you are ("I am user X").
**Authorization** = checking what you can do ("User X can comment").

VoxVeritas uses **JWT (JSON Web Token)** based authentication:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AUTHENTICATION ARCHITECTURE                                                │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐       ┌──────────┐       ┌──────────────────┐
  │  Browser  │       │  Backend │       │  Face Auth (Flask)│
  │  (React)  │       │ (Express)│       │  Port 5000        │
  └──────────┘       └──────────┘       └──────────────────┘
       │                    │                     │
       │  POST /auth/login  │                     │
       │ ──────────────────▶│                     │
       │  {email, password} │                     │
       │                    │                     │
       │  { token, user }   │                     │
       │ ◀──────────────────│                     │
       │                    │                     │
       │  (Token stored in  │                     │
       │   localStorage)    │                     │
       │                    │                     │
       │  GET /api/news     │                     │
       │  Authorization:    │                     │
       │  Bearer <token>    │                     │
       │ ──────────────────▶│                     │
       │                    │ verifies JWT        │
       │  { posts: [...] }  │                     │
       │ ◀──────────────────│                     │
       │                    │                     │
       │  FACE AUTH FLOW:   │                     │
       │  POST /api/detect  │                     │
       │  { image: base64 } │                     │
       │ ──────────────────────────────────────▶  │
       │                    │  { success, bbox }  │
       │ ◀──────────────────────────────────────  │
```

---

## 2. JWT (JSON Web Tokens) Theory

### 2.1 — What Is a JWT?

A JWT is a string that the server creates after successful login. It contains:
- **Header**: Algorithm used (e.g., HS256)
- **Payload**: User data (ID, role, expiry time)
- **Signature**: Cryptographic proof that the token wasn't tampered with

```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMifQ.SflKxwRJSMeKKF2QT4fwpM
└──────── Header ──────┘└───── Payload ──────────┘└────── Signature ──────┘
```

### 2.2 — How VoxVeritas Uses JWT

1. User logs in → Server creates a JWT containing the user's ID and role
2. Frontend stores the JWT in `localStorage.setItem('token', jwt)`
3. Every subsequent API request includes: `Authorization: Bearer <jwt>`
4. Server decodes the JWT to identify the user — no need to re-enter credentials

---

## 3. The User Types and Their Powers

| User Type | Login Required | Can View News | Can Vote | Can Comment | Can Submit News | Can Generate AI Verdict |
|---|---|---|---|---|---|---|
| Guest | No | ✅ | ❌ | ❌ | ❌ | ❌ |
| Normal (Onlooker) | Yes | ✅ | ✅ | ❌ | ✅ | ❌ |
| Community | Yes | ✅ | ✅ | ✅ Community | ✅ | ❌ |
| Expert | Yes | ✅ | ✅ | ✅ Expert | ✅ | ✅ |
| Admin | Yes | ✅ | ✅ | ✅ Both | ✅ | ✅ |

---

## 4. Login Flow — Password Method

### 4.1 — The Journey

```
User on LoginForm page
    │
    ├─ Selects Account Type (normal / community / expert) from dropdown
    ├─ Enters email and password
    ├─ Clicks "Sign In"
    │
    ▼
handleSubmit fires
    │
    ├─ Validate: loginMethod === 'password'?
    │     └── Check email and password are not empty
    │
    ├─ Build credentials: { email, password, userType }
    │
    ├─ Call authAPI.login(userType, credentials)
    │     └── POST /auth/{userType}/login
    │         Body: { email, password }
    │
    ├─ Server validates → returns { token, user }
    │
    ├─ Call context.login(user, token)
    │     ├── setUserType(user.userType)
    │     ├── setUserInfo(user)
    │     ├── setIsAuthenticated(true)
    │     ├── localStorage.setItem('token', token)
    │     └── localStorage.setItem('userInfo', JSON.stringify(user))
    │
    ├─ toast.success('Login successful!')
    │
    └─ navigate('/home')  →  ProtectedRoute checks isAuthenticated=true → renders HomePage
```

### 4.2 — LoginForm Code Walkthrough

```jsx
// The form state holds all form inputs in a single object:
const [formData, setFormData] = useState({
  email: '',
  password: '',
  userType: 'normal',
});

// UI state for non-data concerns:
const [ui, setUi] = useState({
  showPassword: false,
  loading: false,
  loginMethod: 'password',   // 'password' or 'face'
  face: { open: false, image: null },
});

const { login } = useContext(UserContext);
const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();  // Prevent browser's default form submission (page reload)

  if (ui.loginMethod === 'password') {
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      setUi(prev => ({ ...prev, loading: true }));
      const result = await authAPI.login(formData.userType, {
        email: formData.email,
        password: formData.password,
      });
      login(result.user, result.token);
      toast.success('Login successful!');
      navigate('/home');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setUi(prev => ({ ...prev, loading: false }));
    }
  }
  // Face login handled separately
};
```

---

## 5. Login Flow — Face Authentication

### 5.1 — The Journey

```
User on LoginForm page
    │
    ├─ Selects Account Type
    ├─ Enters email
    ├─ Clicks "Face ID" tab (switches loginMethod to 'face')
    ├─ Clicks "Capture Face" button → FaceCapture component shows
    │     │
    │     ├── Camera activates (getUserMedia API)
    │     ├── User positions face → clicks capture
    │     ├── Canvas draws video frame → converts to base64
    │     ├── Sends to Flask: POST /api/detect_face { image }
    │     ├── Flask returns: { success: true, face_crop: base64 }
    │     └── handleFaceCapture(imageDataUrl) stores it in ui.face.image
    │
    ├─ Clicks "Sign In"
    │
    ▼
handleSubmit fires
    │
    ├─ loginMethod === 'face'
    ├─ Check ui.face.image exists
    │
    ├─ Call authAPI.verifyFace(userType, { email, faceImage: base64 })
    │     └── POST /auth/{userType}/verify-face
    │
    ├─ Server sends face data to Flask for verification
    ├─ Flask compares with stored face encoding
    ├─ Returns { token, user } if match found
    │
    ├─ login(user, token) + navigate('/home')
    │
    └─ Same flow as password after this point
```

### 5.2 — Face Capture to Login Integration

```jsx
// In LoginForm:
const handleFaceCapture = (imageDataUrl) => {
  // imageDataUrl is a base64 string like "data:image/jpeg;base64,/9j/4AAQ..."
  setUi(prev => ({
    ...prev,
    face: { ...prev.face, image: imageDataUrl, open: false },
  }));
};

// In handleSubmit for face method:
if (ui.loginMethod === 'face') {
  if (!ui.face.image) {
    toast.error('Please capture your face first');
    return;
  }
  const result = await authAPI.verifyFace(formData.userType, {
    email: formData.email,
    faceImage: ui.face.image,
  });
  login(result.user, result.token);
  navigate('/home');
}
```

---

## 6. Guest Login Flow

The simplest flow — no API call needed:

```jsx
const handleGuestLogin = () => {
  login({ userType: 'guest' });  // No token, just set userType
  navigate('/home');
};

// In UserContext.login():
if (userData?.userType === 'guest') {
  setUserType('guest');
  setUserInfo({ userType: 'guest', username: 'Guest' });
  setIsAuthenticated(true);
  return;  // No localStorage persistence for guests
}
```

Guest sessions are **not persisted** — refreshing the page logs the guest out because nothing is saved to localStorage.

---

## 7. Signup Flow

```
User on SignupForm page
    │
    ├─ Fills: username, email, password, confirm password, account type
    ├─ (Optionally) captures face for face registration
    ├─ Clicks "Create Account"
    │
    ▼
handleSubmit fires
    │
    ├─ Validate: passwords match, all fields filled
    ├─ Build userData object
    │
    ├─ Call authAPI.signup(userType, userData)
    │     └── POST /auth/{userType}/signup
    │
    ├─ Server creates user, returns { token, user }
    │
    ├─ If face was captured:
    │     └── Call authAPI.registerFace(userType, { faceImage })
    │         to store the face encoding for future face logins
    │
    ├─ login(user, token)  →  auto-login after signup
    │
    └─ navigate('/home')
```

---

## 8. Session Persistence — Surviving Page Refresh

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PAGE REFRESH / NEW TAB FLOW                                                │
└─────────────────────────────────────────────────────────────────────────────┘

  User refreshes the browser (F5)
       │
       ▼
  index.html loads → main.jsx executes → UserProvider mounts
       │
       ▼
  UserProvider's useEffect runs:
    const savedUserInfo = apiUtils.getCurrentUser();   // Read localStorage
    const token = localStorage.getItem('token');
       │
       ├── Both exist:
       │     ├── setUserInfo(savedUserInfo)
       │     ├── setUserType(savedUserInfo.userType)
       │     ├── setIsAuthenticated(true)
       │     └── setLoading(false) → ProtectedRoute renders children
       │
       └── Missing:
             ├── setLoading(false)
             └── isAuthenticated stays false → ProtectedRoute redirects to /login
```

---

## 9. Logout Flow

```jsx
// In Header.jsx:
const { logout } = useContext(UserContext);

const handleLogout = () => {
  logout();           // Clears state + localStorage
  navigate('/login'); // Redirect to login page
};

// In UserContext:
const logout = () => {
  setUserType('');
  setUserInfo(null);
  setIsAuthenticated(false);
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  // All components consuming context re-render automatically
};
```

---

## 10. The FaceCapture Component

### 10.1 — What It Does

`FaceCapture` is a reusable component that handles webcam access, photo capture, file upload, and face detection preview. It's used in both `LoginForm` (for face login) and `SignupForm` (for face registration).

### 10.2 — Props

| Prop | Type | Purpose |
|---|---|---|
| `onCapture` | function | Called with base64 image after capture |
| `onError` | function | Called with error message |
| `mode` | string | `'camera'`, `'upload'`, or `'both'` |
| `showPreview` | boolean | Show captured image preview |
| `captureButtonText` | string | Customize button label |

### 10.3 — Key Internal Functions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FaceCapture Internal Flow                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  1. getDevices()
     └── navigator.mediaDevices.enumerateDevices()
         Returns list of cameras on the user's device

  2. startCamera(deviceId)
     └── navigator.mediaDevices.getUserMedia({ video: { deviceId } })
         Opens the camera, stores the MediaStream in state
         Video element displays the live feed (videoRef.current.srcObject = stream)

  3. capturePhoto()
     ├── Reads video element dimensions
     ├── Sets canvas to same size
     ├── canvas.getContext('2d').drawImage(video, ...)
     │   (Draws the current video frame onto an invisible canvas)
     ├── canvas.toDataURL('image/jpeg', 0.9)
     │   (Converts canvas pixels to a base64 string)
     ├── testFaceDetection(imageDataUrl)
     │   └── POST to Flask /api/detect_face
     │       Returns { success, bbox, face_crop }
     └── onCapture(imageDataUrl)  ← notifies parent component

  4. handleFileUpload(event)
     ├── Reads selected file with FileReader
     ├── reader.readAsDataURL(file) → base64 string
     ├── testFaceDetection(imageDataUrl)
     └── onCapture(imageDataUrl)

  5. stopCamera()
     └── stream.getTracks().forEach(track => track.stop())
         Releases the camera hardware

  6. resetCapture()
     └── Clears capturedImage and error state
```

### 10.4 — Browser APIs Used

| API | Purpose |
|---|---|
| `navigator.mediaDevices.getUserMedia()` | Access webcam |
| `navigator.mediaDevices.enumerateDevices()` | List cameras |
| `HTMLCanvasElement.toDataURL()` | Convert image to base64 |
| `FileReader.readAsDataURL()` | Convert uploaded file to base64 |
| `MediaStream.getTracks()` | Control camera hardware |

---

## 11. Interview Q&A

**Q: Why store the token in localStorage instead of cookies?**
A: localStorage is simpler for SPA JWT flows — no cookie parsing needed, easy to read/write from JavaScript, and works well with the `Authorization: Bearer` header pattern. Cookies would be better for server-side rendering (SSR) or for `httpOnly` security (prevents XSS access), but VoxVeritas is a pure client-side SPA.

**Q: What happens when the JWT expires?**
A: The frontend still sends the expired token. The server returns a 401 Unauthorized response. The frontend catch block shows an error. VoxVeritas doesn't currently implement automatic token refresh — the user must log in again.

**Q: Why is face data sent as base64 instead of a file upload?**
A: Base64 encoding lets the face image be sent as a JSON string in the request body, making it easy to include alongside other data (email, userType). File uploads would require `multipart/form-data`, adding complexity for a single image that is captured programmatically (not from a file picker).

**Q: How does guest auth work without a token?**
A: Guest "authentication" is purely client-side. `UserContext.login({ userType: 'guest' })` sets `isAuthenticated = true` in React state only. No token is stored. ProtectedRoute sees `isAuthenticated = true` and renders the page. But API calls that require a token will fail because no Bearer token is attached.

---

**Next → [09-LAYOUT-COMPONENTS.md](./09-LAYOUT-COMPONENTS.md)** — Header, Footer, and page layout structure.
