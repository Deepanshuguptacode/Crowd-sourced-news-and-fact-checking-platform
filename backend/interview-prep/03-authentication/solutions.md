# Module 03: Authentication & Authorization - Solutions

## Exercise 1: Password Hashing

```javascript
async function hashPassword(password, saltRounds = 10) {
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
```

**Explanation:**
- `genSalt(10)` creates a salt with cost factor 10 (~100ms computation time)
- Each password gets a unique random salt, preventing rainbow table attacks
- `compare` automatically extracts salt from hash and re-hashes input

---

## Exercise 2: JWT Token Utilities

```javascript
function generateAccessToken(payload, secret, expiresIn = '1h') {
  return jwt.sign(payload, secret, { expiresIn });
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function verifyToken(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}
```

**Key Points:**
- `jwt.sign()` creates token with expiration
- Refresh tokens use `crypto.randomBytes()` for cryptographically secure randomness
- Proper error handling distinguishes between expired and invalid tokens

---

## Exercise 3: Authentication Middleware

```javascript
function createAuthMiddleware(secret) {
  return (req, res, next) => {
    try {
      let token;
      
      // Extract from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
      
      // Or extract from cookie
      if (!token && req.cookies?.token) {
        token = req.cookies.token;
      }
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'No authentication token provided' 
        });
      }
      
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      
      next();
      
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token has expired' 
        });
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
  };
}

function createAuthorizeMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    
    next();
  };
}
```

---

## Exercise 4: Multi-Type Authentication

```javascript
function createMultiTypeAuthMiddleware(userModels, secret) {
  return async (req, res, next) => {
    try {
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
      
      const decoded = jwt.verify(token, secret);
      
      // Try each user model
      for (const { model, type } of userModels) {
        const user = await model.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          req.userType = type;
          return next();
        }
      }
      
      return res.status(401).json({ message: 'User not found' });
      
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

// Usage:
// const userModels = [
//   { model: NormalUser, type: 'normal' },
//   { model: CommunityUser, type: 'community' },
//   { model: ExpertUser, type: 'expert' },
//   { model: Admin, type: 'admin' }
// ];
// app.use(createMultiTypeAuthMiddleware(userModels, JWT_SECRET));
```

**Performance Improvement:**
```javascript
// Better approach: Store userType in JWT
const token = jwt.sign(
  { id: user._id, type: 'expert' },  // Include type
  secret
);

// Then query only the correct collection
const user = await getUserModel(decoded.type).findById(decoded.id);
```

---

## Exercise 5: Login Rate Limiter

```javascript
function createLoginRateLimiter() {
  const attempts = new Map();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_ATTEMPTS = 5;
  
  return (req, res, next) => {
    const identifier = req.ip;
    const now = Date.now();
    
    const record = attempts.get(identifier);
    
    if (record) {
      // Check if window has expired
      if (now - record.firstAttempt > WINDOW_MS) {
        attempts.delete(identifier);
      } else if (record.count >= MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((WINDOW_MS - (now - record.firstAttempt)) / 1000);
        return res.status(429).json({
          success: false,
          message: 'Too many login attempts',
          retryAfter
        });
      }
    }
    
    // Attach method to record failed attempts
    req.recordFailedAttempt = () => {
      const existing = attempts.get(identifier);
      if (existing) {
        existing.count++;
      } else {
        attempts.set(identifier, { count: 1, firstAttempt: now });
      }
    };
    
    // Clear attempts on success
    req.clearAttempts = () => {
      attempts.delete(identifier);
    };
    
    next();
  };
}
```

---

## Exercise 6: Secure Cookie Options

```javascript
function getSecureCookieOptions(env, maxAge) {
  const isProduction = env === 'production';
  
  return {
    httpOnly: true,           // Never expose to JavaScript
    secure: isProduction,     // HTTPS only in production
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge,
    path: '/'
  };
}

// Production: sameSite: 'strict' - maximum CSRF protection
// Development: sameSite: 'lax' - allows some cross-site requests for local testing
```

---

## Exercise 7: Refresh Token Storage

```javascript
const refreshTokenStore = new Map();

function storeRefreshToken(token, userId, expiresInDays = 7) {
  refreshTokenStore.set(token, {
    userId,
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
  });
}

function validateRefreshToken(token) {
  const data = refreshTokenStore.get(token);
  
  if (!data) return null;
  
  if (new Date() > data.expiresAt) {
    refreshTokenStore.delete(token);
    return null;
  }
  
  return data;
}

function revokeRefreshToken(token) {
  refreshTokenStore.delete(token);
}

// Production: Use database instead of Map
// - Tokens survive server restarts
// - Multiple server instances share state
// - Easier token cleanup
```

---

## Exercise 8: Complete Login Controller

```javascript
async function loginController(req, res, User, jwtSecret) {
  try {
    const { email, password, rememberMe } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Record failed attempt if using rate limiter
      req.recordFailedAttempt?.();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Clear failed attempts
    req.clearAttempts?.();
    
    // Generate tokens
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: rememberMe ? '7d' : '1h' }
    );
    
    const refreshToken = generateRefreshToken();
    storeRefreshToken(refreshToken, user._id.toString());
    
    // Set cookies
    const cookieMaxAge = rememberMe 
      ? 7 * 24 * 60 * 60 * 1000 
      : 60 * 60 * 1000;
    
    res.cookie('accessToken', accessToken, getSecureCookieOptions(
      process.env.NODE_ENV,
      cookieMaxAge
    ));
    
    res.cookie('refreshToken', refreshToken, getSecureCookieOptions(
      process.env.NODE_ENV,
      7 * 24 * 60 * 60 * 1000
    ));
    
    // Return user data (without password)
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
}
```

---

## Exercise 9: Password Reset Flow

```javascript
const resetTokens = new Map();

function generatePasswordResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  
  resetTokens.set(token, {
    userId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  });
  
  return token;
}

function verifyPasswordResetToken(token) {
  const data = resetTokens.get(token);
  
  if (!data) return null;
  if (new Date() > data.expiresAt) {
    resetTokens.delete(token);
    return null;
  }
  
  return data.userId;
}

async function resetPasswordController(req, res, User) {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }
    
    const userId = verifyPasswordResetToken(token);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await User.findByIdAndUpdate(userId, {
      password: hashedPassword
    });
    
    // Invalidate token after use
    resetTokens.delete(token);
    
    res.json({
      success: true,
      message: 'Password reset successful'
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
}

// Email sending function (integrate with email service)
async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  // Send email using SendGrid, AWS SES, etc.
  console.log(`Reset URL: ${resetUrl}`);
}
```

---

## Exercise 10: Security Utilities

```javascript
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

function validateCSRFToken(token, storedToken) {
  if (!token || !storedToken) return false;
  
  try {
    // Timing-safe comparison prevents timing attacks
    const bufA = Buffer.from(token);
    const bufB = Buffer.from(storedToken);
    
    if (bufA.length !== bufB.length) return false;
    
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
```

---

## Bonus: Complete Auth Flow Example

```javascript
// app.js - Complete setup
const express = require('express');
const cookieParser = require('cookie-parser');
const { createAuthMiddleware, createAuthorizeMiddleware } = require('./auth-exercises');

const app = express();
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET;
const authMiddleware = createAuthMiddleware(JWT_SECRET);

// Public routes
app.post('/auth/login', loginHandler);
app.post('/auth/refresh', refreshHandler);

// Protected routes
app.use('/api', authMiddleware);

// Role-based routes
app.post('/api/admin/users', 
  createAuthorizeMiddleware(['admin']), 
  createUserHandler
);

app.get('/api/profile', profileHandler);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Server error' });
});
```
