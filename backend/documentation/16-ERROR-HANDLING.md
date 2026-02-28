# 16 - Error Handling: Robust Error Management

## What You'll Learn
- Error handling strategies used in the codebase
- Try/catch patterns for async operations
- Mongoose error types and handling
- Service-level error propagation
- Best practices for production-ready error handling

---

## Error Handling Philosophy

The VoxVeritas backend follows these error handling principles:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING PRINCIPLES                                │
└─────────────────────────────────────────────────────────────────────────────┘

1. FAIL GRACEFULLY
   • Non-critical operations (AI) should not break critical operations (save)
   • Return safe defaults when uncertain
   • Log errors for debugging, but don't expose to users

2. BE SPECIFIC
   • Different errors get different status codes
   • Custom messages for known errors
   • Generic message for unknown errors

3. LOG EVERYTHING
   • Console.error for all caught errors
   • Include context (function name, user action)
   • Help debugging without exposing to clients

4. NEVER CRASH
   • Every async operation in try/catch
   • Every external call with error handling
   • Fallback values for API failures
```

---

## Error Types in the System

### 1. Mongoose Validation Errors

```javascript
// Triggered when schema validation fails
{
  name: 'ValidationError',
  errors: {
    email: {
      message: 'Email is required',
      path: 'email',
      kind: 'required'
    },
    username: {
      message: 'Username must be at least 3 characters',
      path: 'username',
      kind: 'minlength'
    }
  }
}

// Handling:
if (error.name === 'ValidationError') {
  const messages = Object.values(error.errors).map(e => e.message);
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: messages
  });
}
```

### 2. Mongoose Cast Errors

```javascript
// Triggered when invalid ObjectId is passed
{
  name: 'CastError',
  path: '_id',
  value: 'not-a-valid-id',
  kind: 'ObjectId'
}

// Handling:
if (error.name === 'CastError') {
  return res.status(400).json({
    success: false,
    message: 'Invalid ID format'
  });
}
```

### 3. Duplicate Key Errors

```javascript
// Triggered when unique constraint is violated
{
  name: 'MongoServerError',
  code: 11000,
  keyPattern: { email: 1 },
  keyValue: { email: 'existing@email.com' }
}

// Handling:
if (error.code === 11000) {
  const field = Object.keys(error.keyPattern)[0];
  return res.status(409).json({
    success: false,
    message: `${field} already exists`
  });
}
```

### 4. Authentication Errors

```javascript
// JWT verification failure
{
  name: 'JsonWebTokenError',
  message: 'invalid signature'
}

// JWT expiration
{
  name: 'TokenExpiredError',
  message: 'jwt expired',
  expiredAt: '2024-01-15T10:00:00.000Z'
}

// Handling (in middleware):
try {
  const decoded = jwt.verify(token, secret);
} catch (err) {
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired, please login again' });
  }
  return res.status(401).json({ message: 'Invalid token' });
}
```

### 5. Business Logic Errors

```javascript
// Custom errors thrown from services
throw new Error('No comments available for analysis');
throw new Error('News article not found');
throw new Error('Verdict already exists');

// Handling:
if (error.message === 'No comments available for analysis') {
  return res.status(400).json({
    success: false,
    message: 'Cannot generate verdict without comments'
  });
}
```

---

## Error Handling Patterns

### Pattern 1: Controller Try/Catch

Every controller uses this structure:

```javascript
const someController = async (req, res) => {
  try {
    // All async operations here
    const result = await someAsyncOperation();
    
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error in someController:', error);
    
    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ ... });
    }
    
    // Generic fallback
    res.status(500).json({
      success: false,
      message: 'Operation failed',
      error: error.message
    });
  }
};
```

### Pattern 2: Nested Try/Catch for Non-Critical Operations

When an operation can fail without breaking the main flow:

```javascript
const addComment = async (req, res) => {
  try {
    // CRITICAL: Must succeed
    const comment = new Comment({ ... });
    await comment.save();

    // NON-CRITICAL: Can fail silently
    try {
      await aiService.classifyComment(comment);
    } catch (aiError) {
      console.error('AI classification failed:', aiError);
      // Continue anyway - comment is still saved
    }

    res.status(201).json({
      success: true,
      data: comment
    });

  } catch (error) {
    // Only catches errors from critical path
    res.status(500).json({ success: false });
  }
};
```

### Pattern 3: Service Error Propagation

Services throw errors, controllers catch them:

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// SERVICE: Throws descriptive errors
// ═══════════════════════════════════════════════════════════════════════════

class AIVerdictService {
  async generateVerdict(newsId) {
    const news = await News.findById(newsId);
    if (!news) {
      throw new Error('News article not found');
    }

    const comments = await this.selectTopComments(newsId);
    if (comments.length === 0) {
      throw new Error('No comments available for analysis');
    }

    // ... rest of logic
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTROLLER: Catches and translates to HTTP
// ═══════════════════════════════════════════════════════════════════════════

const generateVerdict = async (req, res) => {
  try {
    const verdict = await aiVerdictService.generateVerdict(newsId);
    res.status(201).json({ success: true, data: verdict });
    
  } catch (error) {
    // Translate service errors to HTTP responses
    if (error.message === 'News article not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'No comments available for analysis') {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Failed to generate verdict' });
  }
};
```

### Pattern 4: Safe Fallbacks for AI Operations

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// AI SERVICE: Returns safe defaults on failure
// ═══════════════════════════════════════════════════════════════════════════

async classifyComment(comment, existingGroups) {
  try {
    const response = await this.callGeminiAPI(prompt);
    return this.parseResponse(response);
    
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // FALLBACK: Return safe default instead of throwing
    return {
      isOffTopic: false,        // Default: allow the comment
      reason: 'Classification unavailable',
      label: 'Relevant'
    };
  }
}
```

---

## Comprehensive Error Handler

A complete error handler function:

```javascript
/**
 * Centralized error handler for controllers
 */
const handleError = (error, res, context = 'Operation') => {
  // Log with context
  console.error(`Error in ${context}:`, error);

  // ═══════════════════════════════════════════════════════════
  // MONGOOSE ERRORS
  // ═══════════════════════════════════════════════════════════
  
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${error.path} format`
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // ═══════════════════════════════════════════════════════════
  // JWT ERRORS
  // ═══════════════════════════════════════════════════════════
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Session expired, please login again'
    });
  }

  // ═══════════════════════════════════════════════════════════
  // KNOWN BUSINESS ERRORS
  // ═══════════════════════════════════════════════════════════
  
  const notFoundErrors = [
    'News article not found',
    'User not found',
    'Comment not found',
    'Group not found',
    'Debate room not found'
  ];
  
  if (notFoundErrors.includes(error.message)) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }

  const badRequestErrors = [
    'No comments available for analysis',
    'Invalid stance',
    'Face authentication not available'
  ];
  
  if (badRequestErrors.some(msg => error.message.includes(msg))) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // ═══════════════════════════════════════════════════════════
  // GENERIC ERROR (FALLBACK)
  // ═══════════════════════════════════════════════════════════
  
  return res.status(500).json({
    success: false,
    message: `${context} failed`,
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
};

// Usage in controller:
const controller = async (req, res) => {
  try {
    // ... logic
  } catch (error) {
    handleError(error, res, 'Create news');
  }
};
```

---

## Error Handling in Different Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ERROR FLOW THROUGH LAYERS                                │
└─────────────────────────────────────────────────────────────────────────────┘

EXTERNAL API (Gemini)
       │
       │ API call fails
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ SERVICE LAYER                                                    │
│                                                                  │
│   try {                                                          │
│     const response = await ai.generateContent(...);              │
│   } catch (error) {                                              │
│     console.error('API error:', error);                          │
│     // Option A: Return fallback                                 │
│     return { score: 50, confidence: 0.1 };                       │
│     // Option B: Throw with context                              │
│     throw new Error('AI service temporarily unavailable');       │
│   }                                                              │
└──────────────────────────────────────────────────────────────────┘
       │
       │ Throws or returns fallback
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ CONTROLLER LAYER                                                 │
│                                                                  │
│   try {                                                          │
│     const result = await service.generateVerdict(newsId);        │
│     res.status(200).json({ success: true, data: result });       │
│   } catch (error) {                                              │
│     // Translate to HTTP response                                │
│     res.status(503).json({                                       │
│       success: false,                                            │
│       message: 'AI service temporarily unavailable'              │
│     });                                                          │
│   }                                                              │
└──────────────────────────────────────────────────────────────────┘
       │
       │ HTTP Response
       ▼
    CLIENT (React Frontend)
```

---

## Logging Best Practices

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// GOOD LOGGING
// ═══════════════════════════════════════════════════════════════════════════

// Include context
console.error(`[NewsController.uploadNews] Database error for user ${req.user.id}:`, error);

// Include relevant data
console.error('Error generating verdict:', {
  newsId,
  commentCount: topComments.length,
  error: error.message,
  stack: error.stack
});

// Use emojis for quick scanning
console.log('🔑 API Key rotated');
console.log('✅ Comment saved successfully');
console.error('❌ Database connection failed');
console.warn('⚠️ Using fallback API key');

// ═══════════════════════════════════════════════════════════════════════════
// BAD LOGGING
// ═══════════════════════════════════════════════════════════════════════════

// Too vague
console.error('Error');

// Exposes sensitive data
console.log('User password:', password);
console.log('API Key:', process.env.GEMINI_API_KEY);

// Too verbose in production
console.log(JSON.stringify(entireRequestObject, null, 2));
```

---

## Production vs Development Error Responses

```javascript
const isDevelopment = process.env.NODE_ENV === 'development';

// In controllers:
res.status(500).json({
  success: false,
  message: 'Operation failed',
  // Only include details in development
  ...(isDevelopment && {
    error: error.message,
    stack: error.stack
  })
});

// Production response:
{
  "success": false,
  "message": "Operation failed"
}

// Development response:
{
  "success": false,
  "message": "Operation failed",
  "error": "Cannot read property 'title' of undefined",
  "stack": "TypeError: Cannot read property 'title' of undefined\n    at NewsController.js:45:12..."
}
```

---

## Interview Questions & Answers

### Q1: Why use try/catch inside another try/catch?

**Answer:** For graceful degradation. The outer try/catch handles critical operations that must succeed. The inner try/catch handles non-critical operations (like AI processing) that can fail without breaking the main flow.

```javascript
try {
  // Must succeed
  const comment = await Comment.create(data);
  
  try {
    // Nice to have
    await aiService.classify(comment);
  } catch {
    // Log but continue
  }
  
  return comment;
} catch {
  // Only if critical operation fails
  throw error;
}
```

### Q2: Should services throw errors or return error objects?

**Answer:** Depends on the situation:
- **Throw** for unrecoverable errors (not found, invalid data)
- **Return fallback** for recoverable errors (AI unavailable)

Services should throw when the calling code needs to know something failed. They should return fallbacks when a default behavior is acceptable.

### Q3: How do you prevent sensitive data in error messages?

**Answer:**
1. Never include passwords, tokens, or API keys in error messages
2. Use generic messages for production (`"Authentication failed"` not `"Password incorrect for user X"`)
3. Log details server-side, return sanitized messages to client
4. Use environment checks to include debug info only in development

### Q4: What's the difference between 4xx and 5xx error codes?

**Answer:**
- **4xx (Client errors)**: Client did something wrong - bad input, unauthorized, not found
- **5xx (Server errors)**: Server did something wrong - database down, service failure

The distinction matters for:
- Retry logic: 5xx might be worth retrying, 4xx usually won't
- Monitoring: 5xx errors indicate server problems to fix
- User messaging: 4xx can suggest user action, 5xx should apologize

---

## Summary

- **Every async operation** needs try/catch
- **Nested try/catch** for non-critical operations
- **Services throw**, controllers catch and translate to HTTP
- **Specific error types** get specific handling
- **Safe fallbacks** for AI/external services
- **Log everything** server-side, sanitize client responses
- **Development vs Production** error detail levels

---

This concludes the core documentation. For additional topics, see:
- **[00-README.md](./00-README.md)** - Navigation and index
- **Face Authentication** - Separate documentation in Face-authorization-System folder
