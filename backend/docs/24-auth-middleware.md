# Part 6.1: Authentication Middleware - Protecting Routes

## 🎯 Purpose

This document explains how JWT authentication middleware works, protecting routes from unauthorized access. We'll understand how tokens are verified, users are authenticated, and requests are allowed or blocked.

## 📁 File: `middlewares/authMiddleware.js`

Middleware functions that run BEFORE route handlers to verify user identity.

## 🔍 What is Middleware?

**Middleware** is a function that executes between receiving a request and sending a response.

### Middleware Flow

```
Client Request
    ↓
┌─────────────────┐
│   Middleware 1  │ ← Parse JSON
└─────────────────┘
    ↓
┌─────────────────┐
│   Middleware 2  │ ← Verify JWT (authMiddleware)
└─────────────────┘
    ↓
┌─────────────────┐
│  Route Handler  │ ← Your controller function
└─────────────────┘
    ↓
Response to Client
```

### Middleware Signature

```javascript
const middleware = (req, res, next) => {
  // Do something with request
  // If okay, call next() to continue
  // If error, send response and don't call next()
};
```

**Parameters:**
- `req`: Request object (incoming data)
- `res`: Response object (send data back)
- `next`: Function to call next middleware

**Critical:** Must call `next()` or send response, or request hangs!

---

## 🔐 Import Dependencies

```javascript
const jwt = require('jsonwebtoken');
const NormalUser = require('../models/NormalUser');
const CommunityUser = require('../models/CommunityUser');
const ExpertUser = require('../models/ExpertUser');
```

**Why import user models:**
- Need to fetch user from database
- Attach user object to request
- Controller can access `req.user`

---

## 🛡️ authenticateNormalUser Middleware

### Complete Code Walkthrough

```javascript
const authenticateNormalUser = async (req, res, next) => {
```

**Why async:**
- Database query is asynchronous
- JWT verification may throw errors (need try-catch)

### Step 1: Extract Token from Request

```javascript
// Try to get token from cookies first, then from Authorization header
let token = req.cookies.token;

if (!token) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
}
```

**Why check two places:**
- **Cookies**: Web browsers automatically send
- **Authorization header**: Mobile apps, API clients

#### Cookie Method

```javascript
let token = req.cookies.token;
```

**What req.cookies is:**
- Object with all cookies
- Parsed by `cookie-parser` middleware

**Example:**
```javascript
// Cookie header:
"Cookie: token=eyJhbGc...; theme=dark"

// req.cookies becomes:
{
  token: "eyJhbGc...",
  theme: "dark"
}
```

#### Authorization Header Method

```javascript
const authHeader = req.headers.authorization;
if (authHeader && authHeader.startsWith('Bearer ')) {
  token = authHeader.split(' ')[1];
}
```

**Authorization header format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Breaking down the code:**

1. **Get header:**
   ```javascript
   const authHeader = req.headers.authorization;
   // "Bearer eyJhbGc..."
   ```

2. **Check format:**
   ```javascript
   authHeader.startsWith('Bearer ')
   ```
   **Why "Bearer ":**
   - Standard OAuth 2.0 format
   - Space after "Bearer" is important!
   - "Bearer" means "holder of this token"

3. **Extract token:**
   ```javascript
   token = authHeader.split(' ')[1];
   ```
   **What split does:**
   ```javascript
   "Bearer eyJhbGc...".split(' ')
   // ["Bearer", "eyJhbGc..."]
   
   // [1] gets second element:
   // "eyJhbGc..."
   ```

**Why [1] not [0]:**
- [0] is "Bearer"
- [1] is the actual token

### Step 2: Check if Token Exists

```javascript
if (!token) {
  return res.status(401).json({ message: 'Authorization token is missing' });
}
```

**Status 401 Unauthorized:**
- Client must authenticate
- No valid credentials provided
- Different from 403 (Forbidden - authenticated but not allowed)

**Why return:**
- Stop execution
- Don't continue to next steps
- Immediately send response

**Example request without token:**
```javascript
GET /profile
// No cookie, no Authorization header

// Response:
401 Unauthorized
{ "message": "Authorization token is missing" }
```

### Step 3: Verify Token and Fetch User

```javascript
try {
  const decoded = jwt.verify(token, "RAM");
  req.user = await NormalUser.findById(`${decoded.id}`);
  next();
} catch (err) {
  return res.status(401).json({ message: 'Invalid or expired token' });
}
```

#### jwt.verify()

```javascript
const decoded = jwt.verify(token, "RAM");
```

**What it does:**
1. Checks token signature with secret
2. Checks if token is expired
3. Decodes payload if valid
4. Throws error if invalid

**Parameters:**
- **token**: JWT string to verify
- **"RAM"**: Secret key (must match signing key)

**Returns decoded payload:**
```javascript
{
  id: "507f1f77bcf86cd799439011",
  email: "john@example.com",
  role: "NormalUser",
  iat: 1706010000,  // Issued at
  exp: 1706096400   // Expires at
}
```

**Errors thrown:**
- `JsonWebTokenError`: Invalid signature
- `TokenExpiredError`: Token expired
- `NotBeforeError`: Token not yet valid

**Example verification:**
```javascript
// Valid token:
jwt.verify("eyJhbGc...", "RAM");
// ✓ Returns decoded object

// Tampered token:
jwt.verify("modified-token", "RAM");
// ✗ Throws: JsonWebTokenError: invalid signature

// Expired token:
jwt.verify("old-token", "RAM");
// ✗ Throws: TokenExpiredError: jwt expired

// Wrong secret:
jwt.verify("eyJhbGc...", "WRONG_SECRET");
// ✗ Throws: JsonWebTokenError: invalid signature
```

#### Fetch User from Database

```javascript
req.user = await NormalUser.findById(`${decoded.id}`);
```

**What this does:**
1. Extracts user ID from decoded token
2. Queries database for user
3. Attaches user object to request

**Why `${decoded.id}`:**
- Template literal converts to string
- MongoDB expects string ID
- Not necessary in modern Mongoose, but safe

**What req.user becomes:**
```javascript
{
  _id: "507f1f77bcf86cd799439011",
  name: "John Doe",
  username: "john_doe",
  email: "john@example.com",
  // ... other fields (NOT password in query)
}
```

**Why attach to req:**
- Route handler can access user
- Don't need to query again
- Available as `req.user` in controller

**Example in controller:**
```javascript
// In protected route:
router.get('/profile', authenticateNormalUser, (req, res) => {
  // req.user is available here!
  res.json({
    name: req.user.name,
    email: req.user.email
  });
});
```

#### Call next()

```javascript
next();
```

**Critical function:**
- Passes control to next middleware or route handler
- Without this, request hangs forever
- No response sent yet

**Flow with next():**
```javascript
authenticateNormalUser(req, res, next) {
  // ... verification
  next();  // ← Continue to route handler
}

// Route handler executes:
(req, res) => {
  res.json({ data: req.user });
}
```

### Step 4: Handle Errors

```javascript
} catch (err) {
  return res.status(401).json({ message: 'Invalid or expired token' });
}
```

**Catches any error:**
- JWT verification fails
- Token expired
- Database connection error
- User not found

**Why catch all as 401:**
- Security: Don't reveal details
- User just needs to log in again
- Same response for all auth failures

**Example errors:**

```javascript
// Expired token:
catch (err) {
  // err.name === "TokenExpiredError"
  // But we return generic message
}

// Invalid signature:
catch (err) {
  // err.name === "JsonWebTokenError"
  // But we return generic message
}

// User deleted from database:
catch (err) {
  // req.user is null/undefined
  // But we return generic message
}
```

**Why not specific errors:**
```javascript
// DON'T DO THIS:
if (err.name === 'TokenExpiredError') {
  return res.json({ error: 'Token expired at 2026-01-23 10:30:00' });
}
// Reveals too much information!

// DO THIS:
return res.status(401).json({ message: 'Invalid or expired token' });
// Generic, secure message
```

---

## 🔄 authenticateCommunityUser Middleware

```javascript
const authenticateCommunityUser = async (req, res, next) => {
  // Exact same logic as authenticateNormalUser
  // But queries CommunityUser model instead
  
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
    req.user = await CommunityUser.findById(`${decoded.id}`);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

**Only difference:**
```javascript
// Normal user:
req.user = await NormalUser.findById(`${decoded.id}`);

// Community user:
req.user = await CommunityUser.findById(`${decoded.id}`);
```

**Why separate middleware:**
- Different user collections in database
- Type safety (know which user type)
- Can add type-specific checks

---

## 🔄 authenticateExpertUser Middleware

Same pattern, but for ExpertUser:

```javascript
const authenticateExpertUser = async (req, res, next) => {
  // ... same token extraction
  
  try {
    const decoded = jwt.verify(token, "RAM");
    req.user = await ExpertUser.findById(`${decoded.id}`);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

---

## 🎯 authenticateCommunityOrExpertUser Middleware

This middleware accepts EITHER community or expert users.

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
    
    // Try CommunityUser first
    let user = await CommunityUser.findById(decoded.id);
    
    // If not found, try ExpertUser
    if (!user) {
      user = await ExpertUser.findById(decoded.id);
    }
    
    // If still not found, reject
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

**Why try both models:**
- Some routes allow both user types
- Example: Commenting on news
- Both can participate, just check if authenticated

**Flow:**
```javascript
1. Decode token (get user ID)
2. Look in CommunityUser collection
3. If not found, look in ExpertUser collection
4. If found in either, attach to req.user
5. If not found in either, reject
```

**Use case:**
```javascript
// Route that accepts both types:
router.post('/news/:id/comment', 
  authenticateCommunityOrExpertUser,  // ← Allows both
  CommentsController.addComment
);
```

---

## 📤 Exporting Middleware

```javascript
module.exports = {
  authenticateNormalUser,
  authenticateCommunityUser,
  authenticateExpertUser,
  authenticateCommunityOrExpertUser
};
```

**Named exports:**
- Can import specific ones
- Clear names
- Multiple exports from one file

**Usage in routes:**
```javascript
const { 
  authenticateCommunityUser, 
  authenticateExpertUser 
} = require('../middlewares/authMiddleware');

// Use in routes:
router.post('/news/submit', 
  authenticateCommunityUser,  // ← Middleware
  NewsController.submitNews    // ← Controller
);
```

---

## 🔄 Complete Request Flow with Authentication

Let's trace a protected request:

### Step 1: Client sends request

```javascript
GET /profile
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 2: Express routes request

```javascript
// Route definition:
router.get('/profile', 
  authenticateNormalUser,  // ← Runs first
  ProfileController.getProfile  // ← Runs second
);
```

### Step 3: Middleware executes

```javascript
authenticateNormalUser(req, res, next) {
  // Extract token from header
  token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  
  // Verify token
  decoded = jwt.verify(token, "RAM");
  // { id: "507f...", email: "john@example.com" }
  
  // Fetch user
  req.user = await NormalUser.findById("507f...");
  // { _id: "507f...", name: "John", email: "john@example.com" }
  
  // Continue to route handler
  next();
}
```

### Step 4: Controller executes

```javascript
ProfileController.getProfile(req, res) {
  // req.user is available!
  const user = req.user;
  
  res.json({
    name: user.name,
    email: user.email
  });
}
```

### Step 5: Response sent

```json
200 OK
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

## ⚠️ Common Errors and Solutions

### Error 1: Token Missing

**Scenario:**
```javascript
GET /profile
// No Authorization header, no cookie
```

**Middleware response:**
```json
401 Unauthorized
{ "message": "Authorization token is missing" }
```

**Solution:** Include token in request
```javascript
fetch('/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Error 2: Invalid Token

**Scenario:**
```javascript
// Token was modified
Authorization: Bearer modified-token
```

**Middleware catches:**
```javascript
catch (err) {
  // jwt.verify throws: JsonWebTokenError
  return res.status(401).json({ 
    message: 'Invalid or expired token' 
  });
}
```

**Solution:** User must log in again

### Error 3: Expired Token

**Scenario:**
```javascript
// Token issued 2 days ago with 1d expiry
Authorization: Bearer old-token
```

**Middleware catches:**
```javascript
catch (err) {
  // jwt.verify throws: TokenExpiredError
  return res.status(401).json({ 
    message: 'Invalid or expired token' 
  });
}
```

**Solution:** Refresh token or log in again

### Error 4: User Deleted

**Scenario:**
```javascript
// Valid token, but user deleted from database
```

**Middleware handles:**
```javascript
req.user = await NormalUser.findById(decoded.id);
// req.user is null

// Next line would error, caught by catch block
return res.status(401).json({ 
  message: 'Invalid or expired token' 
});
```

**Solution:** User must register again

---

## 🎓 Key Learning Points

### 1. Middleware Pattern
- Function with (req, res, next)
- Must call next() or send response
- Runs before route handler
- Can modify request object

### 2. Token Verification
- jwt.verify() checks signature and expiry
- Throws errors if invalid
- Returns decoded payload if valid
- Secret must match signing secret

### 3. Request Attachment
- Attach user to req.user
- Available in all subsequent middleware
- No need to query database again
- Controller can access immediately

### 4. Error Handling
- Catch all authentication errors
- Return generic 401 message
- Don't reveal specific error details
- Security through obscurity

### 5. Multiple User Types
- Separate middleware for each type
- Query correct collection
- Can combine (CommunityOrExpert)
- Type safety in controllers

## 🔐 Security Best Practices

### 1. Use Environment Variables
```javascript
// CURRENT (insecure):
jwt.verify(token, "RAM");

// BETTER:
jwt.verify(token, process.env.JWT_SECRET);
```

### 2. Check User Exists
```javascript
const user = await NormalUser.findById(decoded.id);
if (!user) {
  return res.status(401).json({ message: 'User not found' });
}
```

### 3. Don't Send Sensitive Data
```javascript
// DON'T:
req.user = await NormalUser.findById(decoded.id);
// Includes password hash!

// DO:
req.user = await NormalUser.findById(decoded.id).select('-password');
// Excludes password field
```

### 4. Rotate Secrets Regularly
```javascript
// Use key rotation service
const secrets = [
  process.env.JWT_SECRET_CURRENT,
  process.env.JWT_SECRET_PREVIOUS
];

// Try current secret first
for (const secret of secrets) {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    continue;  // Try next secret
  }
}
```

---

## 🔗 Related Files

- **Controllers**: `controllers/UserController.js` - Generates JWT tokens
- **Routes**: `routes/*Route.js` - Uses middleware
- **Models**: `models/NormalUser.js`, etc. - User data structure

---

**Key Takeaway**: Authentication middleware is the gatekeeper for protected routes. It verifies JWT tokens, fetches user data, and either allows the request to proceed (calls next()) or blocks it (sends 401 response). This pattern provides centralized, reusable authentication logic across all protected endpoints.
