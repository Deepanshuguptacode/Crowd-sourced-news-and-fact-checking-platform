# 15 - Controllers: Business Logic Implementation

## What You'll Learn
- What controllers do in MVC architecture
- Common controller patterns in the codebase
- Request validation and error handling
- Service layer integration
- Response formatting

---

## Controller Overview

Controllers are the "C" in MVC. They receive requests from routes, process business logic, and return responses.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTROLLER ROLE                                     │
└─────────────────────────────────────────────────────────────────────────────┘

        Route                Controller              Services/Models
          │                      │                          │
          │  Route matched       │                          │
          │ ────────────────────►│                          │
          │                      │                          │
          │                      │  1. Validate input       │
          │                      │  2. Call service/model   │
          │                      │ ────────────────────────►│
          │                      │                          │
          │                      │  3. Receive data         │
          │                      │ ◄────────────────────────│
          │                      │                          │
          │  4. Format response  │                          │
          │ ◄────────────────────│                          │
          │                      │                          │

Controller Responsibilities:
  ✓ Extract data from request (params, query, body)
  ✓ Validate input data
  ✓ Call services or models
  ✓ Handle errors
  ✓ Format and send response
```

---

## Controller Files

```
backend/controllers/
├── UserController.js         # Auth, signup, login, face auth
├── NewsController.js         # News CRUD, file uploads
├── CommentsController.js     # Comments, voting
├── AIVerdictController.js    # AI verdict generation
├── CommentFilterController.js # Comment grouping
├── DebateRoomController.js   # Debate rooms
├── DebateGroupController.js  # Debate argument groups
├── DebateCommentController.js # Debate comments
├── TrendingNewsController.js # External news
└── ProfileController.js      # User profiles
```

---

## Standard Controller Pattern

Every controller follows this pattern:

```javascript
const SomeService = require('../services/someService');
const SomeModel = require('../models/SomeModel');

/**
 * Description of what this endpoint does
 * HTTP_METHOD /path
 */
const controllerFunction = async (req, res) => {
  try {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: EXTRACT DATA FROM REQUEST
    // ═══════════════════════════════════════════════════════════
    const { param1, param2 } = req.body;  // POST/PUT body data
    const { id } = req.params;            // URL parameters
    const { filter } = req.query;         // Query string
    const user = req.user;                // From auth middleware

    // ═══════════════════════════════════════════════════════════
    // STEP 2: VALIDATE INPUT
    // ═══════════════════════════════════════════════════════════
    if (!param1) {
      return res.status(400).json({
        success: false,
        message: 'param1 is required'
      });
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 3: BUSINESS LOGIC (via services/models)
    // ═══════════════════════════════════════════════════════════
    const result = await SomeService.doSomething(param1, param2);
    
    // OR direct model access:
    const item = await SomeModel.findById(id);

    // ═══════════════════════════════════════════════════════════
    // STEP 4: HANDLE NOT FOUND
    // ═══════════════════════════════════════════════════════════
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 5: RETURN SUCCESS RESPONSE
    // ═══════════════════════════════════════════════════════════
    res.status(200).json({
      success: true,
      message: 'Operation successful',
      data: result
    });

  } catch (error) {
    // ═══════════════════════════════════════════════════════════
    // STEP 6: ERROR HANDLING
    // ═══════════════════════════════════════════════════════════
    console.error('Error in controllerFunction:', error);
    
    res.status(500).json({
      success: false,
      message: 'Operation failed',
      error: error.message
    });
  }
};

module.exports = { controllerFunction };
```

---

## NewsController Example

### uploadNews - Creating News with File Upload

```javascript
const News = require('../models/News');
const multer = require('multer');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURE MULTER FOR FILE UPLOADS
// ═══════════════════════════════════════════════════════════════════════════

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/screenshots/');  // Save to this folder
  },
  filename: function (req, file, cb) {
    // Add timestamp to avoid filename collisions
    cb(null, Date.now() + path.extname(file.originalname));
    // "1705123456789.jpg"
  },
});

// Allow up to 5 screenshots
const upload = multer({ storage: storage }).array('screenshots', 5);

// ═══════════════════════════════════════════════════════════════════════════
// UPLOAD NEWS CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

const uploadNews = async (req, res) => {
  try {
    // STEP 1: Check authentication
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    // STEP 2: Handle file upload with multer
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(500).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: 'File upload failed' });
      }

      try {
        // STEP 3: Extract form data
        const { title, description, link, imageUrls } = req.body;

        // STEP 4: Process images (uploaded files + URLs)
        let screenshots = [];
        
        // Add uploaded file paths
        if (req.files && req.files.length > 0) {
          screenshots = req.files.map(file => 
            `/uploads/screenshots/${file.filename}`
          );
        }
        
        // Add image URLs if provided
        if (imageUrls) {
          try {
            const urls = JSON.parse(imageUrls);
            if (Array.isArray(urls)) {
              // Validate URLs
              const validUrls = urls.filter(url => {
                try {
                  const urlObj = new URL(url);
                  return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
                } catch {
                  return false;
                }
              });
              screenshots = [...screenshots, ...validUrls];
            }
          } catch (parseError) {
            console.error('Error parsing image URLs:', parseError);
          }
        }

        // STEP 5: Create and save news document
        const news = new News({
          title,
          description,
          link,
          screenshots,
          uploadedBy: req.user._id,
        });

        await news.save();

        // STEP 6: Return success response
        res.status(201).json({
          message: 'News uploaded successfully',
          news: news,
        });
        
      } catch (dbError) {
        console.error('Database error:', dbError);
        res.status(500).json({ 
          message: 'Error saving news to database', 
          error: dbError.message 
        });
      }
    });
    
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Error uploading news', error: err.message });
  }
};
```

### Why Nested Callbacks?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MULTER CALLBACK PATTERN                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Multer uses callback pattern (older style):

upload(req, res, async (err) => {
  // File processing happens here
  // req.files is now populated
  // req.body is now available
});

This is because:
1. Multer processes multipart/form-data
2. It needs to parse the entire request before continuing
3. Form fields and files are streamed
4. async/await requires wrapper

Alternative: Use multer as middleware:
  router.post('/upload', upload.array('screenshots', 5), uploadNews);
  // But less error handling control
```

---

## CommentsController Example

### addCommunityComment - With Service Integration

```javascript
const { CommunityComment, ExpertComment } = require('../models/Comments');
const News = require('../models/News');
const commentFilteringService = require('../services/commentFilteringService');

const addCommunityComment = async (req, res) => {
  try {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: EXTRACT DATA
    // ═══════════════════════════════════════════════════════════
    const { newsId, comment, evidenceLinks, stance } = req.body;

    // ═══════════════════════════════════════════════════════════
    // STEP 2: VALIDATE NEWS EXISTS
    // ═══════════════════════════════════════════════════════════
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 3: VALIDATE STANCE
    // ═══════════════════════════════════════════════════════════
    if (stance && !['in_favor', 'against', 'general'].includes(stance)) {
      return res.status(400).json({ 
        message: 'Invalid stance. Must be in_favor, against, or general' 
      });
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 4: VALIDATE EVIDENCE LINKS
    // ═══════════════════════════════════════════════════════════
    if (evidenceLinks && evidenceLinks.length > 0) {
      for (const evidence of evidenceLinks) {
        if (!evidence.url || !evidence.explanation) {
          return res.status(400).json({ 
            message: 'Each evidence link must have both URL and explanation' 
          });
        }
        if (evidence.explanation.length > 500) {
          return res.status(400).json({ 
            message: 'Evidence explanation must be 500 characters or less' 
          });
        }
      }
    }
    // WHY validate: Ensure data quality before saving

    // ═══════════════════════════════════════════════════════════
    // STEP 5: CREATE COMMENT
    // ═══════════════════════════════════════════════════════════
    const newComment = new CommunityComment({
      newsId,
      commenter: req.user.id,  // From auth middleware
      comment,
      evidenceLinks: evidenceLinks || [],
      stance: stance || 'general'
    });

    await newComment.save();
    
    // ═══════════════════════════════════════════════════════════
    // STEP 6: UPDATE PARENT NEWS
    // ═══════════════════════════════════════════════════════════
    news.comments.push(newComment._id);
    await news.save();
    // WHY: Keep bidirectional reference

    // ═══════════════════════════════════════════════════════════
    // STEP 7: AI PROCESSING (NON-BLOCKING)
    // ═══════════════════════════════════════════════════════════
    try {
      await commentFilteringService.processComment(
        comment,
        newComment._id,
        'community',
        newsId
      );
    } catch (filterError) {
      console.error('Error processing comment for filtering:', filterError);
      // DON'T fail the main operation if AI fails
    }
    // WHY try/catch inside: AI is enhancement, not critical path

    // ═══════════════════════════════════════════════════════════
    // STEP 8: RETURN SUCCESS
    // ═══════════════════════════════════════════════════════════
    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment,
    });
    
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
};
```

### Why Wrap AI Processing in Try/Catch?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GRACEFUL DEGRADATION                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Without inner try/catch:
  await commentFilteringService.processComment(...);  // AI service fails!
  
  → Entire request fails
  → Comment NOT saved (even though DB save was successful)
  → User sees error, has to retry
  → Bad experience!

With inner try/catch:
  try {
    await commentFilteringService.processComment(...);  // AI service fails
  } catch (filterError) {
    console.error('Error:', filterError);
    // Continue anyway!
  }
  
  → Comment IS saved
  → User sees success
  → AI categorization can be retried later
  → Good experience!

Philosophy: Core function (save comment) should succeed
            even if enhancement (AI grouping) fails.
```

---

## AIVerdictController Example

### generateAIVerdict - Service Delegation

```javascript
const aiVerdictService = require('../services/aiVerdictService');
const News = require('../models/News');

/**
 * Generate AI verdict for a news article
 * POST /news/:newsId/ai-verdict
 */
const generateAIVerdict = async (req, res) => {
  try {
    const { newsId } = req.params;

    // ═══════════════════════════════════════════════════════════
    // STEP 1: VALIDATE NEWS EXISTS
    // ═══════════════════════════════════════════════════════════
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 2: CHECK FOR EXISTING VERDICT
    // ═══════════════════════════════════════════════════════════
    const existingVerdict = await aiVerdictService.getVerdict(newsId);
    if (existingVerdict) {
      return res.status(409).json({
        success: false,
        message: 'AI verdict already exists. Use regenerate endpoint.',
        data: existingVerdict
      });
    }
    // WHY 409 Conflict: Resource already exists

    // ═══════════════════════════════════════════════════════════
    // STEP 3: DELEGATE TO SERVICE
    // ═══════════════════════════════════════════════════════════
    const verdict = await aiVerdictService.generateVerdict(newsId);
    // ALL the complex AI logic is in the service
    // Controller just orchestrates

    // ═══════════════════════════════════════════════════════════
    // STEP 4: RETURN SUCCESS
    // ═══════════════════════════════════════════════════════════
    res.status(201).json({
      success: true,
      message: 'AI verdict generated successfully',
      data: verdict
    });

  } catch (error) {
    console.error('Error generating AI verdict:', error);
    
    // ═══════════════════════════════════════════════════════════
    // STEP 5: HANDLE SPECIFIC ERRORS
    // ═══════════════════════════════════════════════════════════
    if (error.message === 'No comments available for analysis') {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate AI verdict: No comments available'
      });
    }
    // WHY: Different errors need different status codes
    // 400 for client error, 500 for server error

    res.status(500).json({
      success: false,
      message: 'Failed to generate AI verdict',
      error: error.message
    });
  }
};
```

### Controller vs Service Responsibilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONTROLLER vs SERVICE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

CONTROLLER (AIVerdictController):
  ✓ Extracts newsId from req.params
  ✓ Validates news exists
  ✓ Checks for existing verdict
  ✓ Returns appropriate HTTP status codes
  ✓ Formats JSON response
  ✗ Does NOT know how to call Gemini API
  ✗ Does NOT know how to select comments
  ✗ Does NOT know how to parse AI response

SERVICE (aiVerdictService):
  ✓ Knows how to call Gemini API
  ✓ Knows how to select top comments
  ✓ Knows how to parse AI response
  ✓ Knows how to calculate metadata
  ✗ Does NOT handle HTTP request/response
  ✗ Does NOT set status codes
  ✗ Does NOT know about req/res objects

WHY SEPARATE?
  • Single responsibility
  • Easier testing (mock services)
  • Reusable (same service, different controllers)
  • Cleaner code
```

---

## Response Patterns

### Standard Success Response

```javascript
res.status(200).json({
  success: true,
  message: 'Human-readable success message',
  data: resultObject
});
```

### Standard Error Response

```javascript
res.status(errorCode).json({
  success: false,
  message: 'Human-readable error message',
  error: error.message  // Optional: for debugging
});
```

### HTTP Status Codes Used

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HTTP STATUS CODE GUIDE                                   │
└─────────────────────────────────────────────────────────────────────────────┘

2XX SUCCESS:
  200 OK              → GET successful, default success
  201 Created         → POST successful, new resource created
  204 No Content      → DELETE successful, nothing to return

4XX CLIENT ERRORS:
  400 Bad Request     → Invalid input data
  401 Unauthorized    → Not authenticated (no token)
  403 Forbidden       → Authenticated but not allowed
  404 Not Found       → Resource doesn't exist
  409 Conflict        → Resource already exists

5XX SERVER ERRORS:
  500 Internal Error  → Server-side failure
  503 Service Unavail → External service down

Usage Examples:
  Signup success       → 201 Created
  Login success        → 200 OK
  Get news             → 200 OK
  News not found       → 404 Not Found
  Invalid stance       → 400 Bad Request
  No token             → 401 Unauthorized
  Normal user posting  → 403 Forbidden (if only experts allowed)
  Verdict exists       → 409 Conflict
  Database error       → 500 Internal Error
```

---

## Validation Patterns

### Required Field Validation

```javascript
const { title, description } = req.body;

if (!title) {
  return res.status(400).json({
    success: false,
    message: 'Title is required'
  });
}

if (!description || description.length < 10) {
  return res.status(400).json({
    success: false,
    message: 'Description must be at least 10 characters'
  });
}
```

### Enum Validation

```javascript
const { stance } = req.body;

const validStances = ['in_favor', 'against', 'general'];

if (stance && !validStances.includes(stance)) {
  return res.status(400).json({
    success: false,
    message: `Invalid stance. Must be one of: ${validStances.join(', ')}`
  });
}
```

### Array Validation

```javascript
const { evidenceLinks } = req.body;

if (evidenceLinks && evidenceLinks.length > 0) {
  for (const evidence of evidenceLinks) {
    // Validate structure
    if (!evidence.url || !evidence.explanation) {
      return res.status(400).json({
        success: false,
        message: 'Each evidence link must have URL and explanation'
      });
    }
    
    // Validate content
    if (evidence.explanation.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Explanation must be 500 characters or less'
      });
    }
    
    // Validate URL format
    try {
      new URL(evidence.url);
    } catch {
      return res.status(400).json({
        success: false,
        message: `Invalid URL: ${evidence.url}`
      });
    }
  }
}
```

---

## Error Handling Pattern

```javascript
const someController = async (req, res) => {
  try {
    // Main logic...
    
  } catch (error) {
    // ═══════════════════════════════════════════════════════════
    // 1. LOG ERROR FOR DEBUGGING
    // ═══════════════════════════════════════════════════════════
    console.error('Error in someController:', error);
    
    // ═══════════════════════════════════════════════════════════
    // 2. HANDLE KNOWN ERROR TYPES
    // ═══════════════════════════════════════════════════════════
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    // Mongoose cast error (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    // Duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Resource already exists'
      });
    }
    
    // Known business logic error
    if (error.message === 'No comments available') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // ═══════════════════════════════════════════════════════════
    // 3. GENERIC ERROR (FALLBACK)
    // ═══════════════════════════════════════════════════════════
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    // WHY: Don't expose error details in production
  }
};
```

---

## Interview Questions & Answers

### Q1: Why use services instead of putting all logic in controllers?

**Answer:**
1. **Single Responsibility**: Controllers handle HTTP, services handle business logic
2. **Reusability**: Same service can be used by multiple controllers or CLI tools
3. **Testability**: Services can be unit tested without HTTP setup
4. **Maintainability**: Changes to business logic don't affect HTTP handling

### Q2: When should you use 400 vs 500 status codes?

**Answer:**
- **400 Bad Request**: Client's fault - invalid input, missing fields, wrong format
- **500 Internal Error**: Server's fault - database failure, service unavailable

If fixing the request would solve it → 400
If it fails regardless of input → 500

### Q3: Why validate in controllers if Mongoose also validates?

**Answer:**
1. **Early exit**: Return immediately without hitting database
2. **Better messages**: Custom, user-friendly error messages
3. **Complex validation**: Business rules beyond schema (e.g., checking references)
4. **Defense in depth**: Multiple layers of validation

### Q4: What's the difference between `return res.status()` and just `res.status()`?

**Answer:**
```javascript
// With return - stops function execution
if (!user) {
  return res.status(404).json({ message: 'Not found' });
}
// Code below won't run

// Without return - function continues!
if (!user) {
  res.status(404).json({ message: 'Not found' });
}
// Code below WILL run, causing errors!
// "Headers already sent" error
```

Always use `return` before response methods in conditionals.

---

## Summary

- **Controllers** bridge routes and business logic
- **Standard pattern**: Extract → Validate → Process → Respond
- **Services** handle complex logic, controllers handle HTTP
- **Validation** happens before database operations
- **Error handling** uses try/catch with specific status codes
- **Response format** is consistent (success, message, data/error)

---

**Next: [16-ERROR-HANDLING.md](./16-ERROR-HANDLING.md)** - Global error handling patterns →
