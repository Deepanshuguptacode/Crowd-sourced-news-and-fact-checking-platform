# Part 3.2: User Controller - Registration & Authentication

## 🎯 Purpose

This document explains how user registration and login work in detail. We'll walk through the UserController code line by line, understanding password hashing, JWT tokens, face authentication, and error handling.

## 📁 File: `controllers/UserController.js`

This controller handles all user-related operations: signup, login, profile updates, and face authentication.

## 📦 Required Imports

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import Models
const NormalUser = require('../models/NormalUser');
const CommunityUser = require('../models/CommunityUser');
const ExpertUser = require('../models/ExpertUser');

// Import Face Authentication Service
const HttpFaceAuthService = require('../services/httpFaceAuthService');
const faceAuthService = new HttpFaceAuthService();

// JWT Secret Key
const JWT_SECRET = "RAM"; // Replace with a secure secret key
```

### Understanding Each Import

#### 1. bcrypt
```javascript
const bcrypt = require('bcrypt');
```
**Purpose:** Password hashing library
**Key methods:**
- `bcrypt.hash(password, saltRounds)`: Hash a password
- `bcrypt.compare(plain, hashed)`: Verify password

**Why bcrypt:**
- Slow by design (prevents brute force)
- Auto-generates salt
- Industry standard for password hashing

#### 2. jsonwebtoken (jwt)
```javascript
const jwt = require('jsonwebtoken');
```
**Purpose:** Create and verify authentication tokens
**Key methods:**
- `jwt.sign(payload, secret, options)`: Create token
- `jwt.verify(token, secret)`: Verify and decode token

**JWT Structure:**
```
header.payload.signature
eyJhbG... .eyJpZCI6... .SflKxw...
```

#### 3. User Models
```javascript
const NormalUser = require('../models/NormalUser');
const CommunityUser = require('../models/CommunityUser');
const ExpertUser = require('../models/ExpertUser');
```
**Why three models:** Different user types with different features
**Used in:** Generic signup/login functions that work with any user type

#### 4. Face Auth Service
```javascript
const HttpFaceAuthService = require('../services/httpFaceAuthService');
const faceAuthService = new HttpFaceAuthService();
```
**Purpose:** Communicates with Python face recognition service
**Methods:**
- `extractFaceEmbedding(imageData)`: Get face features from photo
- `verifyFace(imageData, storedEmbedding)`: Compare faces
- `isServiceRunning()`: Check if service is available
- `startFaceAuthService()`: Start the service if not running

**Why separate service:** Face recognition uses Python libraries (face_recognition, dlib)

#### 5. JWT Secret
```javascript
const JWT_SECRET = "RAM";
```
**⚠️ Security Issue:** Hardcoded secret is bad practice!
**Should be:** `process.env.JWT_SECRET` from .env file

**What it does:** Signs tokens so they can't be forged
**How it works:**
```javascript
// Token signed with secret
jwt.sign({ userId: "123" }, "RAM");
// Result: eyJhbGc...

// Anyone can decode, but can't modify without secret
jwt.decode("eyJhbGc...");  // { userId: "123" }

// Verify signature (needs secret)
jwt.verify("eyJhbGc...", "RAM");  // ✓ Valid
jwt.verify("modified-token", "RAM");  // ✗ Invalid signature
```

---

## 🚀 Signup Function - Complete Walkthrough

### Function Signature

```javascript
const signup = async (req, res, UserModel) => {
```

**Parameters:**
- `req`: HTTP request object (contains body, params, headers)
- `res`: HTTP response object (send responses)
- `UserModel`: Which user type (NormalUser, CommunityUser, ExpertUser)

**Why UserModel parameter?**
- Same function works for all user types
- Called like: `signup(req, res, NormalUser)`
- DRY principle (Don't Repeat Yourself)

### Step 1: Extract Request Data

```javascript
try {
  const { name, username, email, password, profession, faceImage } = req.body;
```

**What is destructuring:**
```javascript
// Instead of:
const name = req.body.name;
const username = req.body.username;
const email = req.body.email;
// ... etc

// We use:
const { name, username, email, password } = req.body;
```

**Request body example:**
```json
{
  "name": "John Doe",
  "username": "john_doe",
  "email": "john@example.com",
  "password": "MySecurePass123",
  "faceImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Optional fields:**
- `profession`: Only for ExpertUser
- `faceImage`: Base64-encoded photo for face auth

### Step 2: Check Existing User

```javascript
const existingUser = await UserModel.findOne({ email });
if (existingUser) {
  return res.status(400).json({ message: "User already exists!" });
}
```

**What findOne does:**
```javascript
await UserModel.findOne({ email });
// Searches MongoDB for document where email matches
// Returns null if not found
// Returns document if found
```

**Why check email:**
- Each user needs unique email
- Prevent duplicate accounts
- email field has `unique: true` in schema, but checking here gives better error message

**Status code 400:**
- Client error (bad request)
- User tried to register with existing email
- Not a server error (500)

**Early return pattern:**
```javascript
if (existingUser) {
  return res.status(400).json({ message: "User already exists!" });
}
// If we return, rest of function doesn't execute
```

### Step 3: Hash Password

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

**Breaking down bcrypt.hash:**

**Parameter 1:** `password` - Plain text password from user
**Parameter 2:** `10` - Salt rounds (cost factor)

**What are salt rounds:**
- Number of times hashing algorithm is applied
- Higher = more secure, but slower
- 10 = ~100ms (recommended for most applications)

**Hashing process:**
```javascript
// Input:
password = "MySecurePass123"

// bcrypt generates random salt:
salt = "$2b$10$N9qo8uLOickgx2ZMRZoMyO"

// Combines password + salt and hashes:
hash = "$2b$10$N9qo8uLOickgx2ZMRZoMyO.xmAq3RJ/wv9B.qZXt7v0T6YgEqG2i"

// Salt is included in hash (first 29 characters)
```

**Why async (await):**
- Hashing is computationally expensive
- Don't block the event loop
- Server can handle other requests while hashing

**Example timing:**
```javascript
console.time('hash');
await bcrypt.hash('password', 10);
console.timeEnd('hash');  // ~100ms

await bcrypt.hash('password', 12);
// ~400ms

await bcrypt.hash('password', 15);
// ~3000ms
```

### Step 4: Process Face Authentication (Optional)

```javascript
let faceEmbedding = null;
let hasFaceAuth = false;
let faceRegisteredAt = null;

if (faceImage) {
  try {
    console.log(`🔍 [SIGNUP] Processing face image for user: ${username}`);
```

**Why initialize to null:**
- These fields are optional
- If no faceImage provided, stay null
- Database schema allows null

**Template literals:**
```javascript
console.log(`Processing face image for user: ${username}`);
// Instead of:
console.log('Processing face image for user: ' + username);
// Easier to read, can include expressions
```

#### Check Service Status

```javascript
const isServiceRunning = await faceAuthService.isServiceRunning();
if (!isServiceRunning) {
  console.log(`❌ [SIGNUP] Face-authorization-System not running, attempting to start...`);
  try {
    await faceAuthService.startFaceAuthService();
    // Wait a moment for service to fully start
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (startError) {
    return res.status(500).json({ 
      message: "Face authentication service unavailable. Please try again later." 
    });
  }
}
```

**Why check if service running:**
- Face recognition runs in separate Python process
- May not be started yet
- Needs to be running before we can extract embeddings

**Understanding the waiting:**
```javascript
await new Promise(resolve => setTimeout(resolve, 3000));
```
**What this does:** Waits 3 seconds
**Why:**
- Service needs time to initialize
- Load face recognition models into memory
- Ensure API endpoints are ready

**Breaking down the syntax:**
```javascript
new Promise(resolve => setTimeout(resolve, 3000))
// Creates a promise that resolves after 3000ms
// await makes function wait for promise
```

**Alternative (clearer):**
```javascript
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
await sleep(3000);  // Wait 3 seconds
```

#### Extract Face Embedding

```javascript
const faceResult = await faceAuthService.extractFaceEmbedding(faceImage);

if (faceResult.success && faceResult.embedding) {
  faceEmbedding = faceResult.embedding;
  hasFaceAuth = true;
  faceRegisteredAt = new Date();
  console.log(`✅ [SIGNUP] Face embedding extracted for user: ${username}`);
} else {
  console.log(`❌ [SIGNUP] Face extraction failed for user: ${username}`, faceResult.message);
  return res.status(400).json({ 
    message: "Face registration failed: " + (faceResult.message || "No face detected") 
  });
}
```

**What faceAuthService.extractFaceEmbedding does:**

1. **Receives base64 image:**
   ```javascript
   faceImage = "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
   ```

2. **Sends to Python service:**
   ```python
   # Python service extracts face features
   face_locations = face_recognition.face_locations(image)
   face_encodings = face_recognition.face_encodings(image, face_locations)
   ```

3. **Returns embedding:**
   ```javascript
   {
     success: true,
     embedding: [0.234, -0.892, 0.445, ..., 0.123],  // 128 numbers
     message: "Face extracted successfully"
   }
   ```

**Possible failure scenarios:**
- No face detected in image
- Multiple faces detected
- Image too dark or blurry
- Service not responding

**Response structure:**
```javascript
// Success:
{
  success: true,
  embedding: [array of 128 numbers],
  message: "Face extracted successfully"
}

// Failure:
{
  success: false,
  embedding: null,
  message: "No face detected in image"
}
```

**Logical AND operator:**
```javascript
if (faceResult.success && faceResult.embedding) {
```
**Both must be true:**
- `faceResult.success`: Operation succeeded
- `faceResult.embedding`: Embedding exists (not null/undefined)

**Error handling:**
```javascript
} catch (error) {
  console.error(`💥 [SIGNUP] Face processing error for user: ${username}`, error);
  return res.status(400).json({ 
    message: "Face registration failed: " + error.message 
  });
}
```
**Why catch errors:**
- Network issues calling Python service
- Service crashes
- Invalid image format
- Return user-friendly error message

### Step 5: Create User Document

```javascript
const newUser = new UserModel({
  name,
  username,
  email,
  password: hashedPassword,
  ...(profession && { profession }),
  faceEmbedding,
  hasFaceAuth,
  faceRegisteredAt,
});
```

**new UserModel():**
- Creates instance of Mongoose model
- Doesn't save to database yet
- Validates against schema

**Shorthand property:**
```javascript
{
  name,  // Same as: name: name
  email  // Same as: email: email
}
```

**Conditional spread operator:**
```javascript
...(profession && { profession })
```
**What this does:**
- If profession exists, includes it
- If profession is null/undefined, excludes it

**Equivalent to:**
```javascript
if (profession) {
  newUser.profession = profession;
}
```

**Why use spread:**
- Cleaner syntax
- Handles optional fields elegantly
- Only relevant for ExpertUser (has profession field)

### Step 6: Save to Database

```javascript
await newUser.save();
```

**What save() does:**

1. **Validates document:**
   ```javascript
   // Check required fields
   if (!name) throw Error("name is required");
   if (!email) throw Error("email is required");
   // Check types
   if (typeof name !== 'string') throw Error("name must be string");
   // Check unique constraints
   if (emailExists) throw Error("email already exists");
   ```

2. **Runs pre-save middleware:**
   ```javascript
   // If defined in schema
   userSchema.pre('save', function(next) {
     // Do something before save
     next();
   });
   ```

3. **Inserts into MongoDB:**
   ```javascript
   db.normalusers.insertOne({
     name: "John Doe",
     username: "john_doe",
     email: "john@example.com",
     password: "$2b$10$...",
     // ...
   });
   ```

4. **Returns document with _id:**
   ```javascript
   {
     _id: ObjectId("507f1f77bcf86cd799439011"),
     name: "John Doe",
     // ...
   }
   ```

**Why await:**
- Database operation is asynchronous
- Wait for MongoDB to confirm save
- Catch errors if save fails

### Step 7: Generate JWT Token

```javascript
const token = jwt.sign(
  { id: newUser._id, email: newUser.email, role: UserModel.modelName },
  JWT_SECRET,
  { expiresIn: "1d" }
);
```

**jwt.sign() parameters:**

#### Parameter 1: Payload (data to include in token)
```javascript
{
  id: newUser._id,          // User's database ID
  email: newUser.email,     // User's email
  role: UserModel.modelName // "NormalUser", "ExpertUser", etc.
}
```

**What goes in payload:**
- ✅ User ID (needed to identify user)
- ✅ User role (needed for authorization)
- ✅ Non-sensitive data
- ❌ Passwords (anyone can decode token)
- ❌ Sensitive personal info

**Payload is NOT encrypted:**
```javascript
// Anyone can decode (without secret):
const decoded = jwt.decode(token);
console.log(decoded);
// { id: "507f...", email: "john@example.com", role: "NormalUser" }
```

#### Parameter 2: Secret key
```javascript
JWT_SECRET
```
**Purpose:** Sign the token
**Security:** If someone modifies token, signature won't match

**Example:**
```javascript
// Original token (signed with "RAM"):
eyJhbGc...payload...signature

// Modified token:
eyJhbGc...modifiedpayload...signature

// Verification:
jwt.verify(modifiedToken, "RAM");  // ✗ Error: invalid signature
```

#### Parameter 3: Options
```javascript
{ expiresIn: "1d" }
```
**expiresIn formats:**
- `"1d"`: 1 day
- `"7d"`: 7 days
- `"24h"`: 24 hours
- `"30m"`: 30 minutes
- `"60"`: 60 seconds

**Why expire tokens:**
- Security: Limits damage if token stolen
- Force re-authentication periodically
- Revoke access for logged-out users (eventually)

**Expiry is encoded in token:**
```javascript
{
  id: "507f...",
  email: "john@example.com",
  iat: 1706010000,  // Issued at timestamp
  exp: 1706096400   // Expires at timestamp (1 day later)
}
```

### Step 8: Set Cookie

```javascript
res.cookie("token", token, {
  httpOnly: true,
  // secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
});
```

**res.cookie() parameters:**
- **name**: `"token"` (cookie name)
- **value**: JWT token string
- **options**: Security and expiry settings

**httpOnly: true:**
- JavaScript cannot access cookie
- Prevents XSS attacks
- Cookie only sent to server

**Example attack prevented:**
```javascript
// Malicious script on page:
<script>
  const token = document.cookie;  // Can't access httpOnly cookies!
  sendToAttacker(token);
</script>
```

**secure option (commented out):**
```javascript
secure: process.env.NODE_ENV === 'production'
```
**What it does:**
- Only send cookie over HTTPS
- Development uses HTTP (no SSL), so disabled
- Production uses HTTPS, so should be enabled

**maxAge:**
```javascript
24 * 60 * 60 * 1000
= 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
= 86,400,000 milliseconds
= 1 day
```
**Why milliseconds:** Browser cookie API uses milliseconds

### Step 9: Send Success Response

```javascript
const successMessage = hasFaceAuth 
  ? "User registered successfully with face authentication!" 
  : "User registered successfully!";

res.status(201).json({ 
  message: successMessage,
  hasFaceAuth: hasFaceAuth,
  user: {
    id: newUser._id,
    name: newUser.name,
    username: newUser.username,
    email: newUser.email,
    hasFaceAuth: newUser.hasFaceAuth
  }
});
```

**Status 201:**
- Created
- Resource successfully created
- Different from 200 (OK)

**Why not send entire user object:**
```javascript
// DON'T:
user: newUser  // Includes password hash!

// DO:
user: {
  id: newUser._id,
  name: newUser.name,
  username: newUser.username,
  email: newUser.email,
  hasFaceAuth: newUser.hasFaceAuth
}
```
**Reasons:**
- Security: Don't send password (even hashed)
- Privacy: Don't send unnecessary fields
- Bandwidth: Smaller response

**Ternary operator:**
```javascript
condition ? valueIfTrue : valueIfFalse
```
**Example:**
```javascript
hasFaceAuth 
  ? "With face auth!" 
  : "Without face auth!"
```

### Step 10: Error Handling

```javascript
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: "Signup failed!", error: error.message });
  }
};
```

**Why try-catch:**
- Database errors (connection lost, validation failed)
- Face auth service errors
- Unexpected errors

**Status 500:**
- Internal server error
- Something went wrong on server side
- Not client's fault

**error.message:**
- Human-readable error description
- Don't send full error object (may contain sensitive info)

---

## 🔐 Login Function

The login function is similar to signup but verifies credentials instead of creating new user.

### Key Differences from Signup:

1. **Find user instead of create:**
   ```javascript
   const user = await UserModel.findOne({ email });
   if (!user) {
     return res.status(400).json({ message: "User does not exist!" });
   }
   ```

2. **Verify password:**
   ```javascript
   const isMatch = await bcrypt.compare(password, user.password);
   if (!isMatch) {
     return res.status(401).json({ message: "Invalid credentials" });
   }
   ```

3. **Face verification (if enabled):**
   ```javascript
   if (loginMethod === 'face' && user.hasFaceAuth) {
     const faceResult = await faceAuthService.verifyFace(
       faceImage, 
       user.faceEmbedding
     );
     
     if (!faceResult.success) {
       return res.status(401).json({ message: "Face verification failed" });
     }
   }
   ```

4. **Generate and return token:**
   ```javascript
   const token = jwt.sign(
     { id: user._id, email: user.email, role: UserModel.modelName },
     JWT_SECRET,
     { expiresIn: "1d" }
   );
   
   res.cookie("token", token, { /* options */ });
   res.status(200).json({ message: "Login successful", token, user });
   ```

## 🎓 Key Learning Points

1. **Password Security:**
   - Never store plain passwords
   - Use bcrypt with 10+ rounds
   - Hash is slow by design (security feature)

2. **JWT Tokens:**
   - Stateless authentication
   - Payload is visible (don't include secrets)
   - Signed to prevent tampering
   - Should expire for security

3. **Cookies:**
   - httpOnly prevents JavaScript access
   - secure for HTTPS only
   - maxAge sets expiration

4. **Error Handling:**
   - Validate input
   - Check existing users
   - Handle service failures gracefully
   - Return appropriate status codes

5. **Face Authentication:**
   - Optional security layer
   - Biometric data stored as numbers
   - Separate service for ML operations
   - Graceful fallback if unavailable

## 🔗 Related Files

- **Models**: `models/NormalUser.js`, `models/CommunityUser.js`, `models/ExpertUser.js`
- **Routes**: `routes/userRoute.js`
- **Middleware**: `middlewares/authMiddleware.js`
- **Services**: `services/httpFaceAuthService.js`

---

**Key Takeaway**: Controllers orchestrate business logic - they receive requests, validate data, call services, interact with databases, and return responses. The signup/login flow demonstrates essential patterns: password hashing, JWT generation, cookie management, and error handling.
