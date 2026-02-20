# 13 - Authentication: JWT, bcrypt, and Face Auth

## What You'll Learn
- How JWT (JSON Web Tokens) work
- Password hashing with bcrypt
- Multi-user type authentication middleware
- Face authentication integration
- Token management and security practices

---

## Authentication Overview

VoxVeritas supports multiple authentication methods:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION METHODS                                   │
└─────────────────────────────────────────────────────────────────────────────┘

1. PASSWORD AUTHENTICATION
   ├─ User enters email + password
   ├─ bcrypt compares hashed password
   └─ JWT token issued on success

2. FACE AUTHENTICATION (Optional)
   ├─ User captures face image
   ├─ Face-Authorization-System extracts embedding
   ├─ Cosine similarity compares embeddings
   └─ JWT token issued on match

3. MULTI-USER TYPES
   ├─ NormalUser   → Basic viewers
   ├─ CommunityUser → Content contributors
   ├─ ExpertUser   → Verified professionals
   └─ Each has separate middleware!
```

---

## File Locations

```
backend/
├── controllers/
│   └── UserController.js      # Signup, login, face registration
├── middlewares/
│   └── authMiddleware.js      # JWT verification for all user types
└── services/
    └── httpFaceAuthService.js # Face embedding extraction
```

---

## How JWT Works

### What is JWT?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    JSON WEB TOKEN (JWT)                                     │
└─────────────────────────────────────────────────────────────────────────────┘

A JWT is a signed token containing user information.

Structure:
  HEADER.PAYLOAD.SIGNATURE
  ────────────────────────────────────────────────────────────────────────
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
  eyJpZCI6IjY1YTEyMzQ1Njc4OTBhYmNkZWYiLCJlbWFpbCI6InVzZXJAdGVzdC5jb20ifQ.
  sflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
  ────────────────────────────────────────────────────────────────────────

HEADER (base64):
{
  "alg": "HS256",    // Algorithm used for signing
  "typ": "JWT"       // Token type
}

PAYLOAD (base64):
{
  "id": "65a1234567890abcdef",  // User's MongoDB _id
  "email": "user@test.com",     // User's email
  "role": "CommunityUser",      // User type model name
  "iat": 1705123456,            // Issued at (timestamp)
  "exp": 1705209856             // Expires (24 hours later)
}

SIGNATURE:
  HMACSHA256(
    base64UrlEncode(header) + "." + base64UrlEncode(payload),
    "RAM"  // Secret key
  )
```

### Why JWT?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SESSION vs JWT                                           │
└─────────────────────────────────────────────────────────────────────────────┘

Traditional Sessions:
  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │ Client  │────►│ Server  │────►│ Session │
  │         │     │         │     │ Store   │
  │ Cookie: │     │ Lookup  │     │ (Redis/ │
  │ sid=abc │     │ session │     │ Memory) │
  └─────────┘     └─────────┘     └─────────┘
  
  Problems:
    ✗ Server must store all sessions
    ✗ Session store can be bottleneck
    ✗ Hard to scale across servers

JWT Tokens:
  ┌─────────┐     ┌─────────┐
  │ Client  │────►│ Server  │
  │         │     │         │
  │ Cookie: │     │ Verify  │
  │ jwt=... │     │ signature│
  └─────────┘     │ No DB!  │
                  └─────────┘
  
  Benefits:
    ✓ Stateless - no server storage
    ✓ Self-contained - user info in token
    ✓ Scalable - any server can verify
    ✓ Standard - works everywhere
```

---

## Password Hashing with bcrypt

### Why Hash Passwords?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NEVER STORE PLAIN PASSWORDS!                             │
└─────────────────────────────────────────────────────────────────────────────┘

Database Breach Scenario:

Plain Text Storage (BAD):
  email: "john@test.com", password: "mypassword123"
  
  If database is stolen:
    • Attacker has all passwords
    • Users use same passwords elsewhere
    • Massive security breach!

Hashed Storage (GOOD):
  email: "john@test.com", password: "$2b$10$xK3PZg..."
  
  If database is stolen:
    • Attacker only has hashes
    • Cannot reverse to get password
    • Each user is protected!

bcrypt Features:
  • One-way: Cannot reverse hash to password
  • Salt: Each hash is unique even for same password
  • Slow: Intentionally slow to prevent brute force
  • Adaptive: Cost factor can increase over time
```

### How bcrypt Works

```javascript
const bcrypt = require('bcrypt');

// ═══════════════════════════════════════════════════════════════════════════
// HASHING (Signup)
// ═══════════════════════════════════════════════════════════════════════════
const password = "mypassword123";
const saltRounds = 10;  // Cost factor (2^10 = 1024 iterations)

const hashedPassword = await bcrypt.hash(password, saltRounds);
// Result: "$2b$10$xK3PZgG7Bm5p8T4.vQEz2.QYl5Kz3l9m7j8o0p1q2r3s4t5u6v7w8"
//          │  │  │           │
//          │  │  │           └─ Hash (22 chars) + Salt (22 chars)
//          │  │  └─ Salt rounds (10)
//          │  └─ bcrypt version (2b)
//          └─ Algorithm identifier ($)

// ═══════════════════════════════════════════════════════════════════════════
// COMPARING (Login)
// ═══════════════════════════════════════════════════════════════════════════
const inputPassword = "mypassword123";
const storedHash = "$2b$10$xK3PZg...";

const isValid = await bcrypt.compare(inputPassword, storedHash);
// Returns: true (password matches!)

// bcrypt.compare:
// 1. Extracts salt from stored hash
// 2. Hashes input with same salt
// 3. Compares resulting hashes
// 4. Returns true/false
```

### Visual: bcrypt Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BCRYPT SIGNUP FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

"mypassword123"
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ bcrypt.hash(password, 10)                                        │
│                                                                  │
│   1. Generate random salt (22 chars)                             │
│      "xK3PZgG7Bm5p8T4.vQEz2."                                   │
│                                                                  │
│   2. Combine salt + password                                     │
│      "xK3PZgG7Bm5p8T4.vQEz2.mypassword123"                      │
│                                                                  │
│   3. Hash with 2^10 iterations (slow on purpose!)                │
│                                                                  │
│   4. Combine salt + hash                                         │
│      "$2b$10$xK3PZg...entire_hash..."                           │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
Stored in Database
"$2b$10$xK3PZgG7Bm5p8T4.vQEz2.QYl5Kz3l9m7j8o0p1q2r3s4t5u6v7w8"


┌─────────────────────────────────────────────────────────────────────────────┐
│                         BCRYPT LOGIN FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

User Input: "mypassword123"
Stored Hash: "$2b$10$xK3PZg...hash..."
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ bcrypt.compare(input, storedHash)                                │
│                                                                  │
│   1. Extract salt from stored hash                               │
│      "xK3PZgG7Bm5p8T4.vQEz2."                                   │
│                                                                  │
│   2. Hash input with SAME salt                                   │
│      hash("mypassword123" + salt)                                │
│                                                                  │
│   3. Compare resulting hash with stored hash                     │
│      "QYl5Kz3..." === "QYl5Kz3..." ← MATCH!                     │
│                                                                  │
│   4. Return true                                                 │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
    true (authenticated!)
```

---

## Signup Function

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const NormalUser = require('../models/NormalUser');
const JWT_SECRET = "RAM";  // Should be in environment variable!

const signup = async (req, res, UserModel) => {
  try {
    const { name, username, email, password, profession, faceImage } = req.body;
    
    // ═══════════════════════════════════════════════════════════
    // STEP 1: CHECK IF USER EXISTS
    // ═══════════════════════════════════════════════════════════
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }
    // WHY: Prevent duplicate accounts with same email

    // ═══════════════════════════════════════════════════════════
    // STEP 2: HASH PASSWORD
    // ═══════════════════════════════════════════════════════════
    const hashedPassword = await bcrypt.hash(password, 10);
    // 10 = salt rounds (good balance of security vs performance)

    // ═══════════════════════════════════════════════════════════
    // STEP 3: PROCESS FACE AUTH (OPTIONAL)
    // ═══════════════════════════════════════════════════════════
    let faceEmbedding = null;
    let hasFaceAuth = false;

    if (faceImage) {
      // Check if face service is running
      const isServiceRunning = await faceAuthService.isServiceRunning();
      if (!isServiceRunning) {
        await faceAuthService.startFaceAuthService();
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Extract embedding
      const faceResult = await faceAuthService.extractFaceEmbedding(faceImage);
      
      if (faceResult.success && faceResult.embedding) {
        faceEmbedding = faceResult.embedding;  // 512-dimensional array
        hasFaceAuth = true;
      }
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 4: CREATE USER
    // ═══════════════════════════════════════════════════════════
    const newUser = new UserModel({
      name,
      username,
      email,
      password: hashedPassword,  // Store HASH, never plain text!
      ...(profession && { profession }),  // Optional for ExpertUser
      faceEmbedding,
      hasFaceAuth,
      faceRegisteredAt: hasFaceAuth ? new Date() : null,
    });

    await newUser.save();
    
    // ═══════════════════════════════════════════════════════════
    // STEP 5: GENERATE JWT TOKEN
    // ═══════════════════════════════════════════════════════════
    const token = jwt.sign(
      { 
        id: newUser._id,           // User's MongoDB ID
        email: newUser.email,       // For display/logging
        role: UserModel.modelName   // "NormalUser", "CommunityUser", etc.
      },
      JWT_SECRET,                   // Secret key for signing
      { expiresIn: "1d" }           // Token expires in 24 hours
    );
    
    // ═══════════════════════════════════════════════════════════
    // STEP 6: SET COOKIE
    // ═══════════════════════════════════════════════════════════
    res.cookie("token", token, {
      httpOnly: true,                    // JavaScript can't access
      maxAge: 24 * 60 * 60 * 1000,       // 24 hours in milliseconds
      // secure: true,                   // Uncomment for HTTPS
    });
    // WHY httpOnly: Prevents XSS attacks from stealing token
    // WHY cookie: Automatic inclusion in subsequent requests

    res.status(201).json({ 
      message: "User registered successfully!",
      hasFaceAuth,
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email
      }
    });
    
  } catch (error) {
    res.status(500).json({ message: "Signup failed!", error: error.message });
  }
};
```

---

## Login Function

```javascript
const login = async (req, res, UserModel) => {
  try {
    const { email, password, faceImage, loginMethod = 'password' } = req.body;

    // ═══════════════════════════════════════════════════════════
    // STEP 1: FIND USER
    // ═══════════════════════════════════════════════════════════
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist!" });
    }

    let authSuccess = false;
    let authMethod = '';

    // ═══════════════════════════════════════════════════════════
    // STEP 2A: FACE AUTHENTICATION
    // ═══════════════════════════════════════════════════════════
    if (loginMethod === 'face' && faceImage) {
      // Check if user has face auth enabled
      if (!user.hasFaceAuth || !user.faceEmbedding) {
        return res.status(400).json({ 
          message: "Face auth not available. Use password." 
        });
      }

      // Extract embedding from login image
      const faceResult = await faceAuthService.extractFaceEmbedding(faceImage);
      
      if (!faceResult.success) {
        return res.status(401).json({ message: "No face detected" });
      }

      // Compare with stored embedding
      const matchResult = faceAuthService.verifyFaceMatch(
        faceResult.embedding,    // New embedding from login image
        user.faceEmbedding,       // Stored embedding from signup
        0.3                       // Similarity threshold
      );

      if (matchResult.matched) {
        authSuccess = true;
        authMethod = 'face';
      } else {
        return res.status(401).json({ message: "Face not recognized" });
      }
      
    // ═══════════════════════════════════════════════════════════
    // STEP 2B: PASSWORD AUTHENTICATION
    // ═══════════════════════════════════════════════════════════
    } else {
      if (!password) {
        return res.status(400).json({ message: "Password required!" });
      }

      // Compare input with stored hash
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials!" });
      }

      authSuccess = true;
      authMethod = 'password';
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 3: GENERATE TOKEN
    // ═══════════════════════════════════════════════════════════
    const token = jwt.sign(
      { id: user._id, email: user.email, role: UserModel.modelName },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ 
      message: `Login successful via ${authMethod}!`, 
      token,
      authMethod,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        hasFaceAuth: user.hasFaceAuth
      }
    });
    
  } catch (error) {
    res.status(500).json({ message: "Login failed!", error: error.message });
  }
};
```

---

## Authentication Middleware

### Why Middleware?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE PATTERN                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Request Flow:

  Client Request
       │
       ▼
┌──────────────┐
│  Express     │
│  Router      │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  AUTH        │────►│  CONTROLLER  │
│  MIDDLEWARE  │ OK  │              │
└──────────────┘     └──────────────┘
       │
       │ Not OK
       ▼
┌──────────────┐
│  401/403     │
│  Response    │
└──────────────┘

Benefits:
  ✓ Authentication logic in one place
  ✓ Reusable across routes
  ✓ Clean controller code
  ✓ Easy to add new routes
```

### authenticateNormalUser

```javascript
const jwt = require('jsonwebtoken');
const NormalUser = require('../models/NormalUser');

const authenticateNormalUser = async (req, res, next) => {
  // ═══════════════════════════════════════════════════════════
  // STEP 1: EXTRACT TOKEN
  // ═══════════════════════════════════════════════════════════
  // Try cookies first (httpOnly cookie from login)
  let token = req.cookies.token;
  
  // Fallback to Authorization header (for API clients)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      // "Bearer eyJhbG..." → "eyJhbG..."
    }
  }
  // WHY both: Browser uses cookies, mobile apps use headers

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing' });
  }

  try {
    // ═══════════════════════════════════════════════════════════
    // STEP 2: VERIFY TOKEN
    // ═══════════════════════════════════════════════════════════
    const decoded = jwt.verify(token, "RAM");
    // Throws error if:
    //   • Token is expired
    //   • Token signature invalid
    //   • Token malformed

    // ═══════════════════════════════════════════════════════════
    // STEP 3: ATTACH USER TO REQUEST
    // ═══════════════════════════════════════════════════════════
    req.user = await NormalUser.findById(decoded.id);
    // WHY: Controller can access req.user for user-specific logic
    
    next();  // Continue to controller
    
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

### authenticateCommunityOrExpertUser

```javascript
const authenticateCommunityOrExpertUser = async (req, res, next) => {
  let token = req.cookies.token;
  
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing' });
  }

  try {
    const decoded = jwt.verify(token, "RAM");
    
    // ═══════════════════════════════════════════════════════════
    // TRY BOTH USER TYPES
    // ═══════════════════════════════════════════════════════════
    const communityUser = await CommunityUser.findById(decoded.id);
    const expertUser = await ExpertUser.findById(decoded.id);

    if (communityUser || expertUser) {
      req.user = communityUser || expertUser;
      // WHY: Some routes allow both user types
      // E.g., commenting on news
      return next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
    
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

### authenticateAnyUser

```javascript
const authenticateAnyUser = async (req, res, next) => {
  let token = req.cookies.token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing' });
  }

  try {
    const decoded = jwt.verify(token, "RAM");
    
    // ═══════════════════════════════════════════════════════════
    // TRY ALL USER TYPES
    // ═══════════════════════════════════════════════════════════
    const normalUser = await NormalUser.findById(decoded.id);
    const communityUser = await CommunityUser.findById(decoded.id);
    const expertUser = await ExpertUser.findById(decoded.id);

    const user = normalUser || communityUser || expertUser;
    
    if (user) {
      req.user = user;
      // ADD USER TYPE for controller logic
      req.userType = normalUser ? 'normal' : communityUser ? 'community' : 'expert';
      return next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
    
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

---

## Middleware Usage in Routes

```javascript
// backend/routes/newsRoutes.js

const express = require('express');
const router = express.Router();
const { 
  authenticateCommunityUser, 
  authenticateExpertUser,
  authenticateAnyUser
} = require('../middlewares/authMiddleware');
const NewsController = require('../controllers/NewsController');

// Public route - no authentication
router.get('/', NewsController.getAllNews);

// Any logged-in user can view details
router.get('/:id', authenticateAnyUser, NewsController.getNewsById);

// Only community users can post
router.post('/', authenticateCommunityUser, NewsController.createNews);

// Only experts can verify
router.patch('/:id/verify', authenticateExpertUser, NewsController.verifyNews);

module.exports = router;
```

---

## Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE AUTHENTICATION FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

1. SIGNUP
──────────────────────────────────────────────────────────────────────────────

   User fills form                        Server
        │                                    │
        │ POST /auth/signup                  │
        │ {email, password, name}            │
        │ ─────────────────────────────────► │
        │                                    │
        │         ┌────────────────────────┐ │
        │         │ 1. Check email exists? │ │
        │         │ 2. bcrypt.hash(pass)   │ │
        │         │ 3. Create user in DB   │ │
        │         │ 4. jwt.sign({id,email})│ │
        │         │ 5. Set cookie          │ │
        │         └────────────────────────┘ │
        │                                    │
        │ ◄───────────────────────────────── │
        │ 201 Created                        │
        │ Set-Cookie: token=eyJ...           │
        │ {user: {id, name, email}}          │


2. LOGIN
──────────────────────────────────────────────────────────────────────────────

   User submits login                     Server
        │                                    │
        │ POST /auth/login                   │
        │ {email, password}                  │
        │ ─────────────────────────────────► │
        │                                    │
        │         ┌────────────────────────┐ │
        │         │ 1. Find user by email  │ │
        │         │ 2. bcrypt.compare()    │ │
        │         │ 3. jwt.sign({id,email})│ │
        │         │ 4. Set cookie          │ │
        │         └────────────────────────┘ │
        │                                    │
        │ ◄───────────────────────────────── │
        │ 200 OK                             │
        │ Set-Cookie: token=eyJ...           │


3. PROTECTED REQUEST
──────────────────────────────────────────────────────────────────────────────

   User makes request                     Server
        │                                    │
        │ GET /api/news (with cookie)        │
        │ Cookie: token=eyJ...               │
        │ ─────────────────────────────────► │
        │                                    │
        │    ┌─────────────────────────────┐ │
        │    │ MIDDLEWARE:                 │ │
        │    │ 1. Extract token from cookie│ │
        │    │ 2. jwt.verify(token)        │ │
        │    │ 3. Find user by decoded.id  │ │
        │    │ 4. Attach to req.user       │ │
        │    │ 5. next() → controller      │ │
        │    └─────────────────────────────┘ │
        │                                    │
        │    ┌─────────────────────────────┐ │
        │    │ CONTROLLER:                 │ │
        │    │ Access req.user for logic   │ │
        │    │ Return news data            │ │
        │    └─────────────────────────────┘ │
        │                                    │
        │ ◄───────────────────────────────── │
        │ 200 OK                             │
        │ {news: [...]}                      │
```

---

## Security Considerations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SECURITY BEST PRACTICES                                  │
└─────────────────────────────────────────────────────────────────────────────┘

1. JWT SECRET (IMPORTANT!)
   Current: const JWT_SECRET = "RAM";  ← INSECURE!
   
   Should be:
     const JWT_SECRET = process.env.JWT_SECRET;
   
   In .env:
     JWT_SECRET=a-very-long-random-string-that-nobody-can-guess-123!@#

2. HTTPONLY COOKIES
   ✓ Already implemented: httpOnly: true
   
   Prevents:
     • XSS attacks stealing tokens
     • Malicious scripts accessing auth

3. SECURE FLAG
   res.cookie("token", token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',  // HTTPS only
   });

4. TOKEN EXPIRATION
   ✓ Already implemented: expiresIn: "1d"
   
   Consider:
     • Shorter for sensitive apps
     • Refresh token pattern for longer sessions

5. BCRYPT ROUNDS
   ✓ Already using 10 rounds
   
   Consider:
     • 12-14 for higher security
     • Balance with performance
```

---

## Interview Questions & Answers

### Q1: Why use both cookies AND Authorization header for tokens?

**Answer:**
- **Cookies**: Automatic inclusion by browser, httpOnly for security
- **Authorization header**: For API clients (mobile apps, Postman)
- **Flexibility**: Supports both web and API usage patterns

### Q2: What happens if JWT expires during a user session?

**Answer:**
1. Middleware verifies token → `jwt.verify` throws error
2. 401 Unauthorized returned to client
3. Frontend detects 401, redirects to login
4. User logs in again, gets new token

**Improvement**: Implement refresh tokens for seamless re-auth

### Q3: Why check multiple user models in authenticateAnyUser?

**Answer:**
The same user ID might exist in different collections because we have separate collections for each user type. When verifying:
1. Decode token to get user ID
2. Check NormalUser → not found
3. Check CommunityUser → found!
4. Attach to request

This allows routes that work for any authenticated user.

### Q4: How does bcrypt prevent rainbow table attacks?

**Answer:**
- **Salt**: Random string added to each password before hashing
- Each password gets unique salt → unique hash
- Even identical passwords produce different hashes
- Rainbow tables (precomputed hashes) are useless

---

## Summary

- **JWT** provides stateless authentication with signed tokens
- **bcrypt** securely hashes passwords with salt
- **Middleware** extracts, verifies tokens, and attaches users
- **Multiple user types** require type-specific middleware
- **Face auth** provides biometric alternative
- **Security** requires proper secrets, HTTPS, httpOnly cookies

---

**Next: [14-ROUTES.md](./14-ROUTES.md)** - API endpoint definitions →
