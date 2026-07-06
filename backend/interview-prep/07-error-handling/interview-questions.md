# Module 07: Error Handling Interview Questions

## Section A: Error Handling Fundamentals

### Q1: What are the different types of errors in Node.js?

**Answer:**

| Error Type | Cause | Example | Handling |
|------------|-------|---------|----------|
| **Operational** | Expected runtime issues | Network timeout, file not found | Handle gracefully, retry if possible |
| **Programmer** | Bugs in code | Null reference, type error | Fix the bug, log for debugging |
| **System** | Infrastructure issues | DB connection lost, out of memory | Circuit breaker, graceful degradation |

**Code Examples:**

```javascript
// Operational error - expected
async function fetchNews(id) {
  try {
    const news = await News.findById(id);
    if (!news) {
      throw new OperationalError('News not found', 404);
    }
    return news;
  } catch (error) {
    if (error.name === 'CastError') {
      // Invalid ID format - programmer error
      throw new ProgrammerError('Invalid news ID format');
    }
    throw error;
  }
}

// Custom error classes
class OperationalError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'OperationalError';
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class ProgrammerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProgrammerError';
    this.isOperational = false;
  }
}
```

---

### Q2: Explain the difference between callback errors, promises, and async/await.

**Answer:**

```javascript
// Callback style (old, avoid)
function getUserCallback(id, callback) {
  User.findById(id, (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(new Error('Not found'));
    callback(null, user);
  });
}

// Promise style (better)
function getUserPromise(id) {
  return User.findById(id)
    .then(user => {
      if (!user) throw new Error('Not found');
      return user;
    });
}

// Async/await (best - cleanest)
async function getUserAsync(id) {
  const user = await User.findById(id);
  if (!user) throw new Error('Not found');
  return user;
}

// Error handling comparison

// Callback - error handling scattered
callbackStyle(id, (err, result) => {
  if (err) {
    console.error(err);
    return;
  }
  // handle result
});

// Async/await - centralized try/catch
try {
  const result = await asyncStyle(id);
  // handle result
} catch (err) {
  console.error(err);
}
```

---

### Q3: What happens if you don't handle a rejected promise?

**Answer:**

**Before Node.js 15:** Unhandled promise rejection - process continues, warning logged
**Node.js 15+:** Process terminates with error

```javascript
// BAD - unhandled rejection
async function bad() {
  const result = await Promise.reject(new Error('Oops'));
  // Never reached
}
bad();  // Unhandled promise rejection!

// GOOD - always use try/catch or .catch()
async function good() {
  try {
    const result = await Promise.reject(new Error('Oops'));
  } catch (err) {
    console.error('Handled:', err.message);
  }
}

// For fire-and-forget: attach catch
fireAndForget().catch(err => console.error('Background error:', err));
```

**Global handler (last resort):**
```javascript
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Application decision: crash or continue?
  process.exit(1);  // Safer to crash and restart
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
```

---

### Q4: How do you implement nested error handling?

**Answer:**

**Use Case:** Critical operation must succeed, optional operation can fail

```javascript
async function createComment(req, res) {
  try {
    // CRITICAL: Must succeed
    const comment = await Comment.create({
      text: req.body.text,
      author: req.user.id,
      newsId: req.body.newsId
    });
    
    // NON-CRITICAL: Can fail without breaking main flow
    try {
      // AI classification - nice to have
      await aiService.classifyComment(comment);
    } catch (aiError) {
      // Log but don't fail the request
      console.error('AI classification failed:', aiError);
      // Continue - comment is already saved
    }
    
    // NON-CRITICAL: Send notification
    try {
      await notificationService.notifyMentionedUsers(comment);
    } catch (notifError) {
      console.error('Notification failed:', notifError);
      // Continue
    }
    
    res.status(201).json({ success: true, comment });
    
  } catch (error) {
    // Only catches errors from critical path
    console.error('Comment creation failed:', error);
    res.status(500).json({ success: false, message: 'Failed to create comment' });
  }
}
```

**Pattern Summary:**
```javascript
try {
  // Critical operations
  
  try {
    // Non-critical operation 1
  } catch {
    // Log and continue
  }
  
  try {
    // Non-critical operation 2
  } catch {
    // Log and continue
  }
  
} catch {
  // Handle critical failure
}
```

---

## Section B: Mongoose Error Handling

### Q5: How do you handle different Mongoose error types?

**Answer:**

```javascript
const handleMongooseError = (error, res) => {
  // ValidationError - schema validation failed
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      type: 'ValidationError',
      errors: messages
    });
  }
  
  // CastError - invalid ObjectId or type
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      type: 'CastError',
      message: `Invalid ${error.path}: ${error.value}`
    });
  }
  
  // Duplicate key error (code 11000)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(409).json({
      success: false,
      type: 'DuplicateError',
      message: `${field} already exists`
    });
  }
  
  // MongoNetworkError - connection issues
  if (error.name === 'MongoNetworkError') {
    return res.status(503).json({
      success: false,
      type: 'DatabaseError',
      message: 'Database temporarily unavailable'
    });
  }
  
  // Default
  return res.status(500).json({
    success: false,
    type: 'UnknownError',
    message: 'An unexpected error occurred'
  });
};

// Usage
const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json({ success: true, user });
  } catch (error) {
    handleMongooseError(error, res);
  }
};
```

---

### Q6: How do you handle database connection errors?

**Answer:**

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,  // 5 seconds
    socketTimeoutMS: 45000,          // 45 seconds
    maxPoolSize: 10,
    retryWrites: true
  };
  
  try {
    await mongoose.connect(process.env.MONGO_URI, options);
    console.log('✅ MongoDB connected');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Retry logic
    console.log('⏳ Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
  // Attempt to reconnect
  setTimeout(connectDB, 5000);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;
```

---

## Section C: Production Error Handling

### Q7: What is a global error handler in Express?

**Answer:**

```javascript
// Must be the LAST middleware
const globalErrorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Different handling by environment
  if (process.env.NODE_ENV === 'development') {
    // Detailed error for developers
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Limited info for production
    // Operational errors: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message
      });
    } else {
      // Programming errors: don't leak details
      console.error('ERROR 💥', err);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong'
      });
    }
  }
};

// Usage in app.js
app.use(globalErrorHandler);
```

---

### Q8: How do you implement retry logic with exponential backoff?

**Answer:**

```javascript
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => true  // Function to decide if error is retryable
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries - 1 || !shouldRetry(error)) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt),
        maxDelay
      );
      const jitter = Math.random() * 1000;  // Add randomness
      
      console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  throw lastError;
}

// Usage examples

// Retry database query
const user = await retryWithBackoff(
  () => User.findById(userId),
  {
    maxRetries: 3,
    shouldRetry: (err) => err.name === 'MongoNetworkError'
  }
);

// Retry API call
const embedding = await retryWithBackoff(
  () => geminiAPI.generateEmbedding(text),
  {
    maxRetries: 5,
    initialDelay: 3000,
    shouldRetry: (err) => err.message?.includes('429') || 
                          err.message?.includes('RATE_LIMIT')
  }
);
```

---

### Q9: How do you handle errors in async Express routes?

**Answer:**

```javascript
// Problem: Express doesn't catch async errors automatically
router.get('/news', async (req, res) => {
  const news = await News.find();  // If this throws, Express won't handle it
  res.json(news);
});

// Solution 1: Wrap each route
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/news', asyncHandler(async (req, res) => {
  const news = await News.find();
  res.json(news);
}));

// Solution 2: Override Express router methods
const express = require('express');

['get', 'post', 'put', 'patch', 'delete'].forEach(method => {
  const original = express.Router.prototype[method];
  express.Router.prototype[method] = function(path, ...handlers) {
    const wrappedHandlers = handlers.map(handler => {
      if (typeof handler === 'function') {
        return async (req, res, next) => {
          try {
            await handler(req, res, next);
          } catch (error) {
            next(error);
          }
        };
      }
      return handler;
    });
    return original.call(this, path, ...wrappedHandlers);
  };
});

// Now all routes are automatically wrapped
router.get('/news', async (req, res) => {
  const news = await News.find();
  res.json(news);
});
```

---

### Q10: How do you sanitize error messages for clients?

**Answer:**

```javascript
const sanitizeError = (error) => {
  const sanitized = {
    message: error.message,
    statusCode: error.statusCode || 500
  };
  
  // Remove sensitive information
  delete sanitized.stack;
  delete sanitized.sql;
  delete sanitized.query;
  
  // Check for specific error types
  if (error.message?.includes('password')) {
    sanitized.message = 'Authentication failed';
  }
  
  if (error.message?.includes('SQL')) {
    sanitized.message = 'Database error';
  }
  
  // Never expose internal details
  if (!error.isOperational) {
    sanitized.message = 'An error occurred';
  }
  
  return sanitized;
};

// Safe logging (for server-side only)
const logError = (error, req) => {
  console.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });
};
```

---

## Quick Reference: HTTP Status Codes for Errors

| Code | Use When | Example |
|------|----------|---------|
| 400 | Bad request (client error) | Missing required field |
| 401 | Unauthorized (no credentials) | Missing token |
| 403 | Forbidden (has credentials, no permission) | Expert-only action |
| 404 | Resource not found | News doesn't exist |
| 409 | Conflict with current state | Duplicate email |
| 422 | Validation failed | Invalid email format |
| 429 | Too many requests | Rate limit exceeded |
| 500 | Server error (unexpected) | Database connection lost |
| 502 | Bad gateway (upstream error) | AI service down |
| 503 | Service unavailable | Maintenance mode |

---

## Best Practices Checklist

- [ ] Always use try/catch with async/await
- [ ] Distinguish operational vs programmer errors
- [ ] Use custom error classes for different types
- [ ] Log detailed errors server-side
- [ ] Sanitize errors before sending to client
- [ ] Implement retry logic for transient failures
- [ ] Set up global error handler (last middleware)
- [ ] Handle unhandled rejections and uncaught exceptions
- [ ] Use appropriate HTTP status codes
- [ ] Include error IDs for support tracking
