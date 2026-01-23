# Part 4.2: User Routes - API Endpoints

## 🎯 Purpose

This document explains how API routes are structured, how they map to controllers, and the different user-related endpoints available in our system.

## 📁 File: `routes/userRoute.js`

This file defines all user-related API endpoints (registration, login, face authentication).

## 🛣️ What are Routes?

**Routes** define the API endpoints that clients can access. They map URLs to controller functions.

### Route Structure

```javascript
router.METHOD('path', middleware, controller)
```

**Components:**
- **METHOD**: HTTP method (GET, POST, PUT, DELETE)
- **path**: URL pattern ('/signup', '/login')
- **middleware**: Optional functions before controller (authentication)
- **controller**: Function that handles the request

### Example

```javascript
router.post('/normal/signup', normalUserSignup);
```

**Breakdown:**
- `post`: HTTP POST method (creating data)
- `/normal/signup`: URL path
- `normalUserSignup`: Controller function to call

**Full URL:** `http://localhost:3000/users/normal/signup`
- Base: `http://localhost:3000`
- Mount point: `/users` (from index.js: `app.use('/users', userRoutes)`)
- Route path: `/normal/signup`

---

## 📦 Import Dependencies

```javascript
const express = require('express');
const {
  normalUserSignup,
  communityUserSignup,
  expertUserSignup,
  normalUserLogin,
  communityUserLogin,
  expertUserLogin,
  // Face Authentication Functions
  normalUserRegisterFace,
  communityUserRegisterFace,
  expertUserRegisterFace,
  normalUserVerifyFace,
  communityUserVerifyFace,
  expertUserVerifyFace,
  normalUserFaceAuthStatus,
  communityUserFaceAuthStatus,
  expertUserFaceAuthStatus,
  getAllExperts,
  getExpertById,
} = require('../controllers/UserController');

const router = express.Router();
```

### Understanding Imports

#### 1. Express Router

```javascript
const express = require('express');
const router = express.Router();
```

**What is Router:**
- Mini Express app
- Can define routes
- Can be mounted in main app
- Modularity: Each feature has its own router

#### 2. Destructuring Controller Functions

```javascript
const {
  normalUserSignup,
  communityUserSignup,
  // ...
} = require('../controllers/UserController');
```

**Why destructuring:**
- Import only needed functions
- Clear what's being used
- Same as:
  ```javascript
  const UserController = require('../controllers/UserController');
  UserController.normalUserSignup
  UserController.communityUserSignup
  ```

**What these functions do:**
- Each handles a specific user operation
- Signup, login, face auth, etc.
- Explained in detail in UserController documentation

---

## 👤 Normal User Routes

### Registration

```javascript
router.post('/normal/signup', normalUserSignup);
```

**Endpoint:** `POST /users/normal/signup`

**Purpose:** Create a new normal user account

**Request Body:**
```json
{
  "name": "John Doe",
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "faceImage": "data:image/jpeg;base64,..." (optional)
}
```

**Response (Success):**
```json
{
  "message": "User registered successfully!",
  "hasFaceAuth": false,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "username": "john_doe",
    "email": "john@example.com",
    "hasFaceAuth": false
  }
}
```

**Status Codes:**
- `201`: Created successfully
- `400`: Validation error or user exists
- `500`: Server error

**cURL Example:**
```bash
curl -X POST http://localhost:3000/users/normal/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

### Login

```javascript
router.post('/normal/login', normalUserLogin);
```

**Endpoint:** `POST /users/normal/login`

**Purpose:** Authenticate and get JWT token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123",
  "loginMethod": "password"
}
```

**Alternative (Face Login):**
```json
{
  "email": "john@example.com",
  "loginMethod": "face",
  "faceImage": "data:image/jpeg;base64,..."
}
```

**Response (Success):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "hasFaceAuth": false
  }
}
```

**Status Codes:**
- `200`: Login successful
- `400`: User not found
- `401`: Invalid credentials
- `500`: Server error

---

## 👥 Community User Routes

### Registration

```javascript
router.post('/community/signup', communityUserSignup);
```

**Endpoint:** `POST /users/community/signup`

**Differences from Normal User:**
- CommunityUser model has additional fields
- Can submit news articles
- Has credibility score

**Request/Response:** Similar to normal user signup

### Login

```javascript
router.post('/community/login', communityUserLogin);
```

**Endpoint:** `POST /users/community/login`

**Same flow as normal user login**

---

## 🎓 Expert User Routes

### Registration

```javascript
router.post('/expert/signup', expertUserSignup);
```

**Endpoint:** `POST /users/expert/signup`

**Additional Fields:**
```json
{
  "name": "Dr. Jane Smith",
  "username": "dr_jane",
  "email": "jane@university.edu",
  "password": "SecurePassword123",
  "profession": "Professor of Journalism",
  "expertise": "Media Ethics",
  "credentials": "PhD in Communication"
}
```

**Differences:**
- Requires profession and expertise
- May need verification before full access
- Higher privileges in platform

### Login

```javascript
router.post('/expert/login', expertUserLogin);
```

**Endpoint:** `POST /users/expert/login`

**Same authentication flow**

---

## 📸 Face Authentication Routes

These routes allow users to register and verify their faces for biometric authentication.

### Register Face - Normal User

```javascript
router.post('/normal/register-face', normalUserRegisterFace);
```

**Endpoint:** `POST /users/normal/register-face`

**Purpose:** Add face authentication to existing account

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "faceImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**What happens:**
1. Validates user exists
2. Extracts face embedding from image
3. Stores embedding in user document
4. Sets `hasFaceAuth: true`
5. Records `faceRegisteredAt` timestamp

**Response (Success):**
```json
{
  "message": "Face authentication registered successfully",
  "hasFaceAuth": true
}
```

**Status Codes:**
- `200`: Face registered successfully
- `400`: No face detected or invalid image
- `404`: User not found
- `500`: Service unavailable

**When to use:**
- After initial registration
- User wants to enable face auth later
- Re-register after face changes

### Verify Face - Normal User

```javascript
router.post('/normal/verify-face', normalUserVerifyFace);
```

**Endpoint:** `POST /users/normal/verify-face`

**Purpose:** Login using face authentication

**Request Body:**
```json
{
  "email": "john@example.com",
  "faceImage": "data:image/jpeg;base64,..."
}
```

**What happens:**
1. Find user by email
2. Check if face auth enabled
3. Extract face embedding from new image
4. Compare with stored embedding
5. Generate JWT if match

**Response (Success):**
```json
{
  "message": "Face verification successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Status Codes:**
- `200`: Verification successful
- `400`: Face not registered or no match
- `401`: Face verification failed
- `500`: Server error

### Face Auth Status - Normal User

```javascript
router.get('/normal/face-auth-status/:userId', normalUserFaceAuthStatus);
```

**Endpoint:** `GET /users/normal/face-auth-status/:userId`

**Purpose:** Check if user has face auth enabled

**URL Parameter:**
- `:userId`: User's database ID

**Example:**
```
GET /users/normal/face-auth-status/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "hasFaceAuth": true,
  "faceRegisteredAt": "2026-01-23T10:30:00.000Z"
}
```

**Use case:**
- Frontend checks before showing face login option
- Display "Enable Face Auth" button if false

---

## 🎯 Route Pattern Analysis

### Why Separate Routes per User Type?

```javascript
// Normal User
router.post('/normal/signup', normalUserSignup);
router.post('/normal/login', normalUserLogin);

// Community User
router.post('/community/signup', communityUserSignup);
router.post('/community/login', communityUserLogin);

// Expert User
router.post('/expert/signup', expertUserSignup);
router.post('/expert/login', expertUserLogin);
```

**Advantages:**
1. **Clear intent:** URL shows user type
2. **Different models:** Each queries different collection
3. **Type-specific validation:** Experts require credentials
4. **Easy to add features:** Expert-only routes

**Alternative (not used):**
```javascript
// Generic route with user type in body
router.post('/signup', (req, res) => {
  const { userType } = req.body;
  if (userType === 'normal') {
    // ...
  } else if (userType === 'community') {
    // ...
  }
});
```

**Why our approach is better:**
- RESTful design
- Clear documentation
- Type safety
- Easier to secure

---

## 🔍 Public Expert Routes

### Get All Experts

```javascript
router.get('/experts', getAllExperts);
```

**Endpoint:** `GET /users/experts`

**Purpose:** List all verified experts

**Query Parameters (optional):**
- `expertise`: Filter by field (e.g., "Politics")
- `limit`: Number of results (default 50)
- `page`: Pagination

**Example:**
```
GET /users/experts?expertise=Journalism&limit=10
```

**Response:**
```json
{
  "experts": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Dr. Jane Smith",
      "username": "dr_jane",
      "expertise": "Journalism",
      "credentials": "PhD in Communication",
      "verificationStatus": "verified"
    }
  ],
  "total": 1
}
```

**Why public:**
- Users can see available experts
- Transparency in fact-checking
- Build trust in platform

**Note:** Doesn't require authentication (public info)

### Get Expert By ID

```javascript
router.get('/experts/:id', getExpertById);
```

**Endpoint:** `GET /users/experts/:id`

**Purpose:** Get detailed expert profile

**URL Parameter:**
- `:id`: Expert's user ID

**Example:**
```
GET /users/experts/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "expert": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Dr. Jane Smith",
    "username": "dr_jane",
    "expertise": "Journalism",
    "credentials": "PhD in Communication",
    "bio": "20+ years of experience in media ethics",
    "verificationStatus": "verified",
    "contributionCount": 145,
    "credibilityScore": 95
  }
}
```

---

## 📤 Export Router

```javascript
module.exports = router;
```

**What this does:**
- Exports configured router
- Can be imported in main app
- All routes are mounted together

**Usage in index.js:**
```javascript
const userRoutes = require('./routes/userRoute');
app.use('/users', userRoutes);
```

**Result:**
- `/users/normal/signup` → normalUserSignup controller
- `/users/community/login` → communityUserLogin controller
- `/users/experts` → getAllExperts controller

---

## 🔐 Authentication Requirements

### Public Routes (No Auth Required)

```javascript
router.post('/normal/signup', normalUserSignup);
router.post('/normal/login', normalUserLogin);
router.get('/experts', getAllExperts);
router.get('/experts/:id', getExpertById);
```

**Why public:**
- Anyone can create account
- Anyone can log in
- Expert directory is transparent

### Protected Routes (Auth Required)

Face authentication routes could be protected:

```javascript
const { authenticateNormalUser } = require('../middlewares/authMiddleware');

router.post('/normal/register-face', 
  authenticateNormalUser,  // ← Require authentication
  normalUserRegisterFace
);
```

**Why protect:**
- Only authenticated users can modify their own face data
- Prevent unauthorized access
- Verify user identity

---

## 🎓 Key Learning Points

### 1. RESTful Design
- **POST**: Create (signup, register face)
- **GET**: Read (get experts, check status)
- **PUT/PATCH**: Update (not shown, but for profile updates)
- **DELETE**: Delete (not shown, but for account deletion)

### 2. Route Organization
- Group by feature (users, news, debates)
- Separate by user type (normal, community, expert)
- Clear naming conventions

### 3. Controller Separation
- Routes only define endpoints
- Controllers handle logic
- Clean separation of concerns

### 4. URL Structure
- Descriptive paths (`/normal/signup`)
- RESTful conventions
- Easy to understand and document

### 5. Status Codes
- `200`: Success (general)
- `201`: Created (signup)
- `400`: Client error (validation)
- `401`: Unauthorized (login failed)
- `404`: Not found
- `500`: Server error

---

## 🧪 Testing Routes

### Using cURL

**Signup:**
```bash
curl -X POST http://localhost:3000/users/normal/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John","username":"john_doe","email":"john@example.com","password":"pass123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/users/normal/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123"}'
```

**Get Experts:**
```bash
curl http://localhost:3000/users/experts
```

### Using JavaScript Fetch

```javascript
// Signup
const response = await fetch('http://localhost:3000/users/normal/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    username: 'john_doe',
    email: 'john@example.com',
    password: 'SecurePassword123'
  })
});

const data = await response.json();
console.log(data);

// Login
const loginResponse = await fetch('http://localhost:3000/users/normal/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePassword123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.token;

// Use token for authenticated requests
const profileResponse = await fetch('http://localhost:3000/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🔗 Related Files

- **Controllers**: `controllers/UserController.js` - Business logic
- **Models**: `models/NormalUser.js`, `models/CommunityUser.js`, `models/ExpertUser.js`
- **Middleware**: `middlewares/authMiddleware.js` - Authentication
- **Services**: `services/httpFaceAuthService.js` - Face authentication

---

**Key Takeaway**: Routes are the entry points to your API. They define what URLs are available, which HTTP methods to use, and which controllers to call. Good route design makes your API intuitive, RESTful, and easy to use.
