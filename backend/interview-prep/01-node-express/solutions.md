# Module 01: Node.js & Express - Solutions

## Exercise 1: Basic Middleware Implementation

```javascript
function loggingMiddleware(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
}
```

**Key Points:**
- Always call `next()` to continue to the next middleware
- Use `new Date().toISOString()` for consistent timestamp formatting
- `req.method` gives HTTP method, `req.path` gives the URL path

---

## Exercise 2: Rate Limiting Middleware

```javascript
const requestCounts = new Map();

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  const record = requestCounts.get(ip);
  
  if (!record) {
    // First request from this IP
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  if (now > record.resetTime) {
    // Reset window expired
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  if (record.count >= 5) {
    return res.status(429).json({ message: 'Rate limit exceeded' });
  }
  
  record.count++;
  next();
}
```

**Explanation:**
- Use `req.ip` to identify clients
- Store count and reset time per IP
- Window-based approach: reset after time period
- In production, use Redis instead of in-memory Map for distributed systems

---

## Exercise 3: Request Validation Middleware

```javascript
function validateRegistration(req, res, next) {
  const { email, password, name } = req.body;
  const errors = [];
  
  if (!email || !email.includes('@') || !email.includes('.')) {
    errors.push('Valid email is required');
  }
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!name || name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false, 
      errors 
    });
  }
  
  next();
}
```

**Key Points:**
- Collect all errors before responding (better UX)
- Check for field existence before checking length
- Return 400 for client errors

---

## Exercise 4: Async Error Handler Wrapper

```javascript
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage:
// router.get('/', asyncHandler(async (req, res) => {
//   const data = await someAsyncOperation();
//   res.json(data);
// }));
```

**How it works:**
- Wraps the async function call in `Promise.resolve()`
- Catches any rejection and passes to Express error handler via `next(error)`
- Eliminates need for try/catch in every route handler

---

## Exercise 5: Response Formatter Middleware

```javascript
function responseFormatter(req, res, next) {
  res.success = (statusCode, data) => {
    res.status(statusCode).json({
      success: true,
      data
    });
  };
  
  res.error = (statusCode, message) => {
    res.status(statusCode).json({
      success: false,
      message
    });
  };
  
  next();
}

// Usage:
// res.success(200, { users: [...] });
// res.error(404, 'User not found');
```

**Benefits:**
- Consistent API response format across all endpoints
- Reduces boilerplate in controllers
- Easy to modify format globally

---

## Exercise 6: CORS Configuration

```javascript
function createCorsConfig() {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://voxveritas.vercel.app'
  ];
  
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
}
```

**Explanation:**
- Dynamic origin function allows for conditional access
- `credentials: true` enables cookie sending
- Always allow `!origin` for server-to-server requests

---

## Exercise 7: Route Parameter Validation

```javascript
function validateObjectId(paramName) {
  return (req, res, next) => {
    const id = req.params[paramName];
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    
    if (!objectIdRegex.test(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }
    
    next();
  };
}

// Usage: router.get('/:id', validateObjectId('id'), getById);
```

**Key Points:**
- MongoDB ObjectIds are 24-character hexadecimal strings
- Curried function pattern allows parameterization
- Return 400 (client error) for invalid format

---

## Exercise 8: Pagination Helper

```javascript
function paginationMiddleware(req, res, next) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;
  
  req.pagination = { page, limit, skip };
  next();
}

// Usage in controller:
// const { skip, limit } = req.pagination;
// const results = await Model.find().skip(skip).limit(limit);
```

**Best Practices:**
- Use `Math.max()` and `Math.min()` to enforce bounds
- Calculate skip from page and limit
- Attach to `req` for downstream access

---

## Exercise 9: Request Timing Middleware

```javascript
function requestTimingMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });
  
  next();
}
```

**How it works:**
- Record start time before any processing
- Listen to `finish` event on response (fires when response fully sent)
- Log duration, status code, and request info

---

## Exercise 10: Complete Route Handler

```javascript
async function uploadNewsController(req, res) {
  try {
    // Input validation
    const { title, description } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }
    
    // Build news object
    const newsData = {
      title: title.trim(),
      description: description.trim(),
      uploadedAt: new Date(),
      userId: req.user?._id
    };
    
    // Handle optional file
    if (req.file) {
      newsData.screenshot = `/uploads/screenshots/${req.file.filename}`;
    }
    
    // Simulate database save
    console.log('Saving news:', newsData);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'News uploaded successfully',
      data: newsData
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload news'
    });
  }
}
```

**Complete Controller Pattern:**
- Try/catch wrapper for all async operations
- Validation first (fail fast)
- Build data object incrementally
- Standardized success/error response format
- Server-side error logging

---

## Bonus: Production-Ready Error Handler

```javascript
// This must be the last middleware
function globalErrorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages
    });
  }
  
  // MongoDB duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Default
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
}

// Usage: app.use(globalErrorHandler);
```
