# 05 — Authentication System

## Why This File Exists
VoxVeritas has 4 user types (Normal, Community, Expert, Admin), each with different permissions. Authentication verifies *who* the user is. Authorization determines *what* they can do. This file explains both systems.

---

## Authentication Flow Overview

```
1. User signs up   → password hashed with bcrypt → saved to MongoDB
2. User logs in    → password compared → JWT token generated → sent as cookie
3. User makes request → cookie sent automatically → middleware extracts token → verifies JWT
4. If valid        → req.user set to user data → request continues
5. If invalid      → 401 Unauthorized response
```

---

## Password Hashing (bcrypt)

We never store passwords as plain text. `bcrypt` converts a password into an irreversible hash.

### During Signup (UserController.js)

```javascript
const bcrypt = require('bcryptjs');

// Hash the password before saving
const salt = await bcrypt.genSalt(10);           // Generate random salt (10 rounds)
const hashedPassword = await bcrypt.hash(password, salt);  // Hash: "password123" → "$2a$10$xK..."

// Save user with hashed password
const user = new CommunityUser({
  name, username, email,
  password: hashedPassword,    // Never the original password!
});
await user.save();
```

**What is `genSalt(10)`?** The number 10 is the "cost factor." Higher = slower = more secure. 10 is the standard for web apps — it takes about 100ms to hash, which is fast enough for users but too slow for attackers to brute-force.

### During Login

```javascript
// Compare provided password against stored hash
const isMatch = await bcrypt.compare(password, user.password);
// bcrypt("password123", "$2a$10$xK...") → true/false
if (!isMatch) {
  return res.status(401).json({ message: 'Invalid password' });
}
```

---

## JWT Tokens (JSON Web Tokens)

After successful login, we create a JWT token containing the user's ID and type.

```javascript
const jwt = require('jsonwebtoken');

// Generate token
const token = jwt.sign(
  { id: user._id, type: 'community' },   // Payload — data encoded in the token
  'RAM',                                   // Secret key used to sign
  { expiresIn: '7d' }                     // Token expires in 7 days
);
```

**Why `'RAM'` as the secret?** This should be a long, random string in production (stored in `.env`). Currently hardcoded — not ideal for production.

### Sending the Token as a Cookie

```javascript
res.cookie('token', token, {
  httpOnly: true,       // JavaScript can't access this cookie (prevents XSS attacks)
  secure: false,        // Set to true in production (requires HTTPS)
  sameSite: 'lax',      // Prevents CSRF attacks
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
});

res.status(200).json({
  message: 'Login successful',
  token: token,         // Also sent in response body (for manual use)
  user: { id: user._id, name: user.name, userType: 'community' }
});
```

**Why both cookie AND response body?** The cookie is used automatically by browsers. The response body token is for manual testing (Postman) or non-browser clients.

---

## The 6 Auth Middleware Functions

All defined in `middlewares/authMiddleware.js`. Each checks a specific user type.

### Pattern: Every Auth Middleware Follows This Logic

```javascript
const authenticateCommunityUser = async (req, res, next) => {
  try {
    // Step 1: Extract token from cookie or Authorization header
    let token = req.cookies?.token;
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(' ')[1];   // "Bearer <token>" → "<token>"
    }
    if (!token) return res.status(401).json({ message: 'No token provided' });

    // Step 2: Verify and decode the JWT
    const decoded = jwt.verify(token, 'RAM');

    // Step 3: Find the user in the SPECIFIC collection
    const user = await CommunityUser.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Step 4: Attach user data to the request
    req.user = user;
    req.userType = 'community';
    next();  // Continue to the controller
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

### All 6 Middleware Functions

| Middleware | Who Can Access | Used For |
|-----------|---------------|----------|
| `authenticateNormalUser` | Normal users only | — (rarely used alone) |
| `authenticateCommunityUser` | Community users only | Adding community comments |
| `authenticateExpertUser` | Expert users only | Adding expert comments, expert voting |
| `authenticateCommunityOrExpertUser` | Community OR Expert | Voting on news, viewing filtered comments |
| `authenticateAnyUser` | Normal, Community, Expert, OR Admin | Uploading news, debate rooms, profiles |
| `authenticateAdmin` | Admin only | Admin-specific operations |

### `authenticateAnyUser` — The Cascading Middleware

This is the most interesting one. It tries all 4 user types sequentially:

```javascript
const authenticateAnyUser = async (req, res, next) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, 'RAM');

    // Try NormalUser first
    let user = await NormalUser.findById(decoded.id).select('-password');
    if (user) { req.user = user; req.userType = 'normal'; return next(); }

    // Try CommunityUser
    user = await CommunityUser.findById(decoded.id).select('-password');
    if (user) { req.user = user; req.userType = 'community'; return next(); }

    // Try ExpertUser
    user = await ExpertUser.findById(decoded.id).select('-password');
    if (user) { req.user = user; req.userType = 'expert'; return next(); }

    // Try Admin
    user = await Admin.findById(decoded.id).select('-password');
    if (user) { req.user = user; req.userType = 'admin'; return next(); }

    return res.status(401).json({ message: 'User not found in any collection' });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

**Why cascade?** A single JWT token only contains the user's `_id`. Since we have 4 separate collections, we need to try each one until we find the user.

**Performance concern:** This makes up to 4 database queries. In production, you might store the user type in the JWT payload and query only the right collection.

---

## Signup Variants

### Generic Signup Function (UserController.js)

The `signup` function handles all 3 main user types with one codebase:

```javascript
const signup = (UserModel, userType) => async (req, res) => {
  const { name, username, email, password, ...extraFields } = req.body;

  // Check if email already exists
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) return res.status(400).json({ message: 'User already exists' });

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user with model-specific extra fields
  const user = new UserModel({
    name, username, email,
    password: hashedPassword,
    ...extraFields,          // profession, areaOfExpertise, etc. for Expert
  });
  await user.save();

  // Generate token and set cookie
  const token = jwt.sign({ id: user._id, type: userType }, 'RAM', { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax' });

  res.status(201).json({ message: `${userType} registered successfully`, token, user });
};

// Create specific signup functions
exports.normalUserSignup    = signup(NormalUser, 'normal');
exports.communityUserSignup = signup(CommunityUser, 'community');
exports.expertUserSignup    = signup(ExpertUser, 'expert');
```

**Why this pattern?** Instead of writing 3 nearly identical signup functions, we write one and create variants for each user type. DRY (Don't Repeat Yourself).

### Admin Signup — Extra Security

```javascript
exports.adminSignup = async (req, res) => {
  const { name, username, email, password, securityPassword } = req.body;

  // Must provide the security password from environment variables
  if (securityPassword !== process.env.ADMIN_SECURITY_PASSWORD) {
    return res.status(403).json({ message: 'Invalid security password' });
  }
  // ... same signup flow as above but with Admin model
};
```

**Why security password?** Anyone could POST to `/users/admin/signup`. The security password ensures only authorized people can create admin accounts.

---

## Face Authentication

VoxVeritas supports logging in with your face as an alternative to passwords.

### Registration Flow

```javascript
exports.registerFace = (UserModel) => async (req, res) => {
  const { userId, faceData } = req.body;

  const user = await UserModel.findById(userId);
  if (user.hasFaceAuth) return res.status(400).json({ message: 'Face already registered' });

  // Call the Python Face-authorization-System via HTTP
  const HttpFaceAuthService = require('../services/httpFaceAuthService');
  const faceService = new HttpFaceAuthService();
  const result = await faceService.registerFace(user.username, faceData);

  if (result.success && result.embedding) {
    user.faceEmbedding = result.embedding;     // Store 512-dim vector
    user.hasFaceAuth = true;
    user.faceRegisteredAt = new Date();
    await user.save();
  }
};
```

### Login with Face

```javascript
// During login, if face data is provided:
if (faceData) {
  const faceService = new HttpFaceAuthService();
  const result = await faceService.extractFaceEmbedding(faceData);

  if (result.success) {
    const matchResult = faceService.verifyFaceMatch(
      result.embedding,       // Test face embedding
      user.faceEmbedding,     // Stored face embedding
      0.3                     // Cosine similarity threshold
    );

    if (!matchResult.matched) {
      return res.status(401).json({ message: 'Face verification failed' });
    }
  }
}
```

**How face matching works:** Both the stored face and the login face are converted to 512-dimensional vectors. Cosine similarity measures how similar they are (1.0 = identical, 0.0 = completely different). A threshold of 0.3 means faces must be at least 30% similar.

---

## Route Protection Examples

```javascript
// Only community users can add community comments
router.post('/community-comment/add', authenticateCommunityUser, addCommunityComment);

// Only expert users can vote on comments
router.post('/community-comment/:commentId/vote', authenticateExpertUser, expertVoteOnCommunityComment);

// Any logged-in user can upload news
router.post('/upload', authenticateAnyUser, uploadNews);

// Anyone (no auth needed) can view posts
router.get('/posts', getAllPosts);

// Trending news is public
router.get('/', trendingNewsController.getTrendingNews);
```

---

## Next Steps
Now you understand how users authenticate and what permissions they have. Move on to [06 — News System](06-NEWS-SYSTEM.md) to see how news articles are uploaded, viewed, and voted on.
