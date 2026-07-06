# Module 03: Authentication & Authorization Interview Questions

## Section A: Authentication Fundamentals

### Q1: What is the difference between authentication and authorization?

**Answer:**

| Authentication | Authorization |
|----------------|---------------|
| **Who are you?** | **What can you do?** |
| Verifies identity | Verifies permissions |
| Happens first | Happens after authentication |
| Uses passwords, tokens, biometrics | Uses roles, policies, ACLs |

**Example from VoxVeritas:**
- **Authentication:** Verify JWT token → `req.user = { id, type }`
- **Authorization:** Check `req.userType === 'expert'` for expert-only routes

---

### Q2: How does JWT (JSON Web Token) authentication work?

**Answer:**

```
┌─────────────┐                    ┌─────────────┐
│   Client    │ ── POST /login ──► │   Server    │
│  (Browser)  │   {email, pass}    │             │
└─────────────┘                    └──────┬──────┘
                                          │
                                          │ Verify credentials
                                          │ Create JWT
                                          │
┌─────────────┐                    ┌──────┴──────┐
│   Client    │ ◄─ {token, user} ──│   Server    │
│             │                    │             │
│  Store      │                    └─────────────┘
│  token in   │
│  cookie/    │
│  localStorage│
└─────────────┘

SUBSEQUENT REQUESTS:
┌─────────────┐                    ┌─────────────┐
│   Client    │ ── GET /profile ──►│   Server    │
│  Cookie:    │   Cookie: token=xxx │  Verify     │
│  token=xxx  │                    │  signature  │
└─────────────┘                    │  Decode     │
          │                        │  payload    │
          │                        └──────┬──────┘
          │                               │
          └────────── Response ───────────┘
```

**JWT Structure:**
```
header.payload.signature

// Header: { alg: "HS256", typ: "JWT" }
// Payload: { id: "user123", type: "expert", iat: 1234567890, exp: 1234571490 }
// Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
```

---

### Q3: What is bcrypt and why is it used for passwords?

**Answer:**

**bcrypt** is a password hashing function designed to be slow and computationally expensive.

```javascript
const bcrypt = require('bcryptjs');

// Hashing (during signup)
const salt = await bcrypt.genSalt(10);        // Cost factor: 10 rounds
const hash = await bcrypt.hash('password', salt);
// Result: "$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqhmM6JGKpS4G3R1G2JH8YpfB0Bqy"

// Verifying (during login)
const isMatch = await bcrypt.compare('password', hash);
```

**Why bcrypt:**
1. **Salting:** Each password gets unique random salt → prevents rainbow table attacks
2. **Slowness:** Intentionally slow (100ms per hash) → brute force attacks impractical
3. **Adaptive:** Can increase cost factor as computers get faster
4. **One-way:** Cannot reverse hash back to password

**Cost Factor:**
- 10 rounds ≈ 100ms (good for web apps)
- Higher = more secure but slower
- VoxVeritas uses 10 as a balance

---

### Q4: What is the difference between cookie-based and token-based auth?

**Answer:**

| Aspect | Cookie-Based (Session) | Token-Based (JWT) |
|--------|------------------------|-------------------|
| Storage | Server-side (session store) | Client-side (cookie/localStorage) |
| Scalability | Requires shared session store | Stateless - any server can verify |
| Size | Small (session ID) | Larger (contains user data) |
| Revocation | Easy (delete session) | Hard (wait for expiry or blacklist) |
| XSS Risk | httpOnly cookies safe | localStorage vulnerable |

**VoxVeritas uses both:**
```javascript
// HTTP-only cookie (secure, XSS-safe)
res.cookie('token', jwtToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
});

// Also send in response body (for Postman, mobile apps)
res.json({ token: jwtToken, user: {...} });
```

---

### Q5: Explain httpOnly, secure, and sameSite cookie flags.

**Answer:**

```javascript
res.cookie('token', token, {
  httpOnly: true,    // JavaScript cannot access
  secure: true,      // Only sent over HTTPS
  sameSite: 'lax'    // CSRF protection
});
```

| Flag | Purpose | Without It |
|------|---------|------------|
| `httpOnly` | Prevents JavaScript access | XSS can steal token via `document.cookie` |
| `secure` | HTTPS only | Token sent over HTTP (network sniffing) |
| `sameSite` | Cross-site request protection | CSRF attacks possible |

**sameSite values:**
- `strict`: Never send on cross-site navigation (most secure, breaks some UX)
- `lax`: Send on top-level GET requests only (VoxVeritas uses this)
- `none`: Always send (requires `secure: true`)

---

## Section B: Middleware Implementation

### Q6: Implement JWT authentication middleware.

**Answer:**

```javascript
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    // Extract token from cookie or Authorization header
    let token = req.cookies?.token;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.userId = decoded.id;
    req.userType = decoded.type;
    
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ message: 'Authentication failed' });
  }
};
```

---

### Q7: How does VoxVeritas handle multiple user types with authentication?

**Answer:**

VoxVeritas has 4 user types: Normal, Community, Expert, Admin.

**Challenge:** A JWT only contains the user ID, not the collection.

**Solution: Cascading Middleware**

```javascript
const authenticateAnyUser = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'No token' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Try each collection until user is found
    const collections = [
      { model: NormalUser, type: 'normal' },
      { model: CommunityUser, type: 'community' },
      { model: ExpertUser, type: 'expert' },
      { model: Admin, type: 'admin' }
    ];
    
    for (const { model, type } of collections) {
      const user = await model.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        req.userType = type;
        return next();
      }
    }
    
    return res.status(401).json({ message: 'User not found' });
    
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

**Specific middleware variants:**
```javascript
const authenticateExpertUser = async (req, res, next) => {
  await authenticateAnyUser(req, res, () => {
    if (req.userType !== 'expert') {
      return res.status(403).json({ message: 'Expert access required' });
    }
    next();
  });
};

const authenticateCommunityOrExpert = async (req, res, next) => {
  await authenticateAnyUser(req, res, () => {
    if (!['community', 'expert'].includes(req.userType)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  });
};
```

**Performance Note:** This makes up to 4 DB queries. Better approach: include `type` in JWT payload and query only that collection.

---

### Q8: Implement role-based access control (RBAC).

**Answer:**

```javascript
// Role hierarchy
const ROLES = {
  public: 0,
  normal: 1,
  community: 2,
  expert: 3,
  admin: 4
};

// Authorization middleware factory
const requireRole = (minRole) => {
  return (req, res, next) => {
    if (!req.userType) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userLevel = ROLES[req.userType] || 0;
    const requiredLevel = typeof minRole === 'string' ? ROLES[minRole] : minRole;
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        message: `Access denied. Requires ${minRole} or higher.` 
      });
    }
    
    next();
  };
};

// Usage
router.post('/vote', authenticateAnyUser, requireRole('community'), voteOnNews);
router.post('/expert-vote', authenticateAnyUser, requireRole('expert'), expertVote);
router.delete('/user/:id', authenticateAnyUser, requireRole('admin'), deleteUser);
```

---

## Section C: Security Questions

### Q9: What are common authentication vulnerabilities and how to prevent them?

**Answer:**

| Vulnerability | Prevention |
|--------------|------------|
| **Password Leaks** | Hash with bcrypt, never store plain text |
| **Brute Force** | Implement rate limiting (5 attempts, then CAPTCHA) |
| **Session Hijacking** | Use httpOnly cookies, short expiry, refresh tokens |
| **JWT Theft** | Short expiry (15 min), refresh tokens stored httpOnly |
| **CSRF** | sameSite cookies, CSRF tokens for state-changing operations |
| **XSS** | httpOnly cookies, sanitize user input, CSP headers |
| **MITM** | Always use HTTPS (secure cookie flag) |
| **Timing Attacks** | Constant-time comparison for tokens |

**Implementation Examples:**

```javascript
// Rate limiting for login
const loginAttempts = new Map();

const rateLimitLogin = (req, res, next) => {
  const key = req.ip;
  const attempts = loginAttempts.get(key) || { count: 0, lastAttempt: Date.now() };
  
  if (attempts.count >= 5) {
    const timeSinceLast = Date.now() - attempts.lastAttempt;
    if (timeSinceLast < 15 * 60 * 1000) {  // 15 minute lockout
      return res.status(429).json({ message: 'Too many attempts. Try again later.' });
    }
    loginAttempts.delete(key);
  }
  
  req.recordAttempt = (success) => {
    if (!success) {
      attempts.count++;
      attempts.lastAttempt = Date.now();
      loginAttempts.set(key, attempts);
    }
  };
  
  next();
};

// Constant-time token comparison (prevent timing attacks)
const crypto = require('crypto');

const constantTimeCompare = (a, b) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
};
```

---

### Q10: How do you implement refresh tokens?

**Answer:**

```javascript
// Token types:
// - Access Token: Short-lived (15 min), contains user info
// - Refresh Token: Long-lived (7 days), stored httpOnly, used to get new access token

// Schema
const refreshTokenSchema = new mongoose.Schema({
  userId: { type: ObjectId, required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Login - issue both tokens
const login = async (req, res) => {
  // ... validate credentials ...
  
  const accessToken = jwt.sign(
    { id: user._id, type: user.type },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = crypto.randomBytes(40).toString('hex');
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  
  res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  
  res.json({ success: true });
};

// Refresh endpoint
const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token' });
  }
  
  const tokenDoc = await RefreshToken.findOne({ 
    token: refreshToken,
    expiresAt: { $gt: new Date() }
  });
  
  if (!tokenDoc) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
  
  // Issue new access token
  const user = await User.findById(tokenDoc.userId);
  const newAccessToken = jwt.sign(
    { id: user._id, type: user.type },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  res.cookie('accessToken', newAccessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
  res.json({ success: true });
};

// Logout - invalidate refresh token
const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await RefreshToken.deleteOne({ token: refreshToken });
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true });
};
```

**Benefits:**
- Access tokens can be short-lived (security)
- Refresh tokens can be revoked (control)
- Automatic session renewal (UX)

---

### Q11: How would you implement "Remember Me" functionality?

**Answer:**

```javascript
const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  
  // ... validate credentials ...
  
  const expiresIn = rememberMe ? '30d' : '7d';
  const cookieMaxAge = rememberMe 
    ? 30 * 24 * 60 * 60 * 1000  // 30 days
    : 7 * 24 * 60 * 60 * 1000;   // 7 days
  
  const token = jwt.sign(
    { id: user._id, type: user.type, rememberMe },
    process.env.JWT_SECRET,
    { expiresIn }
  );
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: cookieMaxAge
  });
  
  res.json({ success: true });
};
```

---

## Section D: Face Authentication

### Q12: How does face authentication work in VoxVeritas?

**Answer:**

```javascript
// Face Authentication Flow:

// 1. Registration: Store face embedding
const registerFace = async (req, res) => {
  const { userId, faceImage } = req.body;
  
  // Extract face embedding via Python service
  const response = await axios.post('http://face-service:5000/extract', {
    image: faceImage  // Base64 encoded
  });
  
  if (!response.data.success) {
    return res.status(400).json({ message: 'No face detected' });
  }
  
  const embedding = response.data.embedding;  // 512-dimensional vector
  
  await User.findByIdAndUpdate(userId, {
    faceEmbedding: embedding,
    hasFaceAuth: true
  });
  
  res.json({ success: true });
};

// 2. Login: Compare faces
const loginWithFace = async (req, res) => {
  const { username, faceImage } = req.body;
  
  const user = await User.findOne({ username });
  if (!user || !user.hasFaceAuth) {
    return res.status(400).json({ message: 'Face authentication not available' });
  }
  
  // Extract embedding from login attempt
  const response = await axios.post('http://face-service:5000/extract', {
    image: faceImage
  });
  
  if (!response.data.success) {
    return res.status(400).json({ message: 'Face not detected' });
  }
  
  // Compare embeddings using cosine similarity
  const similarity = cosineSimilarity(
    response.data.embedding,
    user.faceEmbedding
  );
  
  if (similarity < 0.3) {  // Threshold
    return res.status(401).json({ message: 'Face verification failed' });
  }
  
  // Success - issue JWT
  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.cookie('token', token, { httpOnly: true });
  res.json({ success: true });
};

// Cosine similarity calculation
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
```

**Key Concepts:**
- **Face Embedding:** 512-dimensional vector representing face features
- **Cosine Similarity:** Measures angle between vectors (1.0 = identical, 0.0 = different)
- **Threshold (0.3):** Balance between security (not too lenient) and usability (not too strict)

---

## Quick Reference: Auth Status Codes

| Code | Use Case |
|------|----------|
| 200 | Successful login/logout |
| 201 | Account created |
| 400 | Invalid credentials format |
| 401 | Invalid/expired token (not authenticated) |
| 403 | Valid token but insufficient permissions |
| 409 | Email already exists |
| 429 | Too many login attempts |
| 500 | Server error during auth |
