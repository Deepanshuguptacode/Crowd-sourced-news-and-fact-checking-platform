# Module 01: Node.js & Express Interview Questions

## Section A: Conceptual Questions

### Q1: What is the difference between Node.js and Express.js?

**Answer:**
- **Node.js** is a JavaScript runtime that executes JavaScript outside the browser. It provides the V8 engine, event loop, and non-blocking I/O capabilities.
- **Express.js** is a web framework built on top of Node.js. It provides a structured way to handle HTTP requests, routing, middleware, and responses.

**Analogy:** Node.js is like the engine of a car; Express is the steering wheel, pedals, and dashboard that make it drivable.

---

### Q2: Explain the middleware pattern in Express. Why is it powerful?

**Answer:**
Middleware functions have access to `req`, `res`, and `next`. They can:
1. Execute code
2. Modify request/response objects
3. End the request-response cycle
4. Call `next()` to pass control to the next middleware

**Why it's powerful:**
- **Modularity**: Each middleware does one thing (auth, logging, validation)
- **Reusability**: Same auth middleware used across many routes
- **Composability**: Chain multiple middlewares: `router.post('/upload', auth, validate, upload)`

**Code Example from VoxVeritas:**
```javascript
router.post('/upload', authenticateAnyUser, uploadNews);
// authenticateAnyUser runs first, calls next(), then uploadNews runs
```

---

### Q3: What is CORS and why do we need it?

**Answer:**
**CORS (Cross-Origin Resource Sharing)** is a browser security feature that blocks requests from one domain to another by default.

**Why needed:**
- Frontend runs on `localhost:5173` (Vite dev server)
- Backend runs on `localhost:3000`
- Without CORS, browsers reject these cross-origin requests

**Key Configuration:**
```javascript
const corsOptions = {
  origin: ['http://localhost:5173', 'https://production.com'],
  credentials: true,  // Allows cookies (JWT tokens)
};
```

---

### Q4: Why does VoxVeritas use `{ limit: '50mb' }` for JSON parsing?

**Answer:**
The default Express JSON limit is 100KB. This is insufficient because:
- Face authentication sends base64-encoded images (can be several MB)
- News uploads may include screenshot images
- Large payloads would be rejected with "Payload Too Large" errors

---

### Q5: What is the difference between `req.params`, `req.query`, and `req.body`?

**Answer:**

| Property | Source | Example | Use Case |
|----------|--------|---------|----------|
| `req.params` | URL path | `/news/:id` → `req.params.id` | Identifiers in URL |
| `req.query` | Query string | `?page=2&sort=date` → `req.query.page` | Optional filters |
| `req.body` | Request body | POST JSON data | Creating/updating data |

**Example from VoxVeritas:**
```javascript
// GET /news/posts?page=2&stance=for
const page = parseInt(req.query.page) || 1;  // 2
const stance = req.query.stance;              // 'for'

// POST /news/upload
const { title, description } = req.body;       // Form data

// GET /news/vote/:postId
const postId = req.params.postId;              // 'abc123'
```

---

### Q6: Explain the purpose of `async/await` and why controllers use `try/catch`.

**Answer:**

**Async/Await:**
- Database operations are asynchronous (take time)
- `await` pauses execution until the Promise resolves
- Makes async code read like synchronous code

**Try/Catch Pattern:**
```javascript
const uploadNews = async (req, res) => {
  try {
    const news = await News.create({ ... });   // Happy path
    res.status(201).json({ success: true });
  } catch (error) {
    // Error handling - always needed for async operations
    console.error('Upload failed:', error);
    res.status(500).json({ success: false });
  }
};
```

**Why required:** Unhandled promise rejections crash the server. Every `await` needs error handling.

---

## Section B: Coding Scenario Questions

### Q7: Write an Express route with middleware chain.

**Question:**
Create a route `POST /comments` that:
1. Authenticates the user
2. Validates that comment text is at least 10 characters
3. Creates the comment

**Answer:**
```javascript
const express = require('express');
const router = express.Router();

// Middleware 1: Authentication
const authenticate = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware 2: Validation
const validateComment = (req, res, next) => {
  const { text } = req.body;
  if (!text || text.length < 10) {
    return res.status(400).json({ message: 'Comment must be at least 10 characters' });
  }
  next();
};

// Controller
const createComment = async (req, res) => {
  try {
    const comment = await Comment.create({
      text: req.body.text,
      author: req.user.id
    });
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Route with middleware chain
router.post('/comments', authenticate, validateComment, createComment);

module.exports = router;
```

---

### Q8: How do you handle file uploads in Express?

**Answer:**
Use `multer` middleware for multipart/form-data:

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/screenshots/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Single file upload
router.post('/upload', upload.single('screenshot'), (req, res) => {
  // req.file contains file info
  // req.body contains other form fields
  res.json({ 
    message: 'File uploaded',
    filePath: `/uploads/screenshots/${req.file.filename}`
  });
});
```

---

### Q9: Explain environment variables and why they matter for security.

**Answer:**

**Purpose:**
- Store sensitive data outside of code
- Different values for development vs production
- Prevent secrets from being committed to git

**Usage:**
```javascript
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;
```

**.env file (NEVER commit this):**
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-super-secret-key
GEMINI_API_KEY=AIzaSy...
```

**Why critical:**
- If you commit API keys, attackers can steal them from git history
- Database credentials would be exposed
- Violates security best practices

---

## Section C: Advanced Questions

### Q10: What happens if you don't call `next()` in middleware?

**Answer:**
The request hangs indefinitely. The client will timeout.

**Correct pattern:**
```javascript
const middleware = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'No token' });
    // Request ends here - must use return to stop execution
  }
  next();  // Continue to next middleware
};
```

---

### Q11: How does the event loop work in Node.js?

**Answer:**
Node.js is single-threaded but handles many connections via the event loop:

1. **Call Stack**: Synchronous code executes here
2. **Node APIs**: Async operations (DB queries, HTTP requests) offload here
3. **Callback Queue**: Completed async operations wait here
4. **Event Loop**: Moves callbacks from queue to stack when stack is empty

**Why it matters:**
- Never block the event loop with CPU-intensive tasks
- Use async/await for I/O operations
- One slow synchronous function blocks ALL requests

---

## Section D: Troubleshooting Questions

### Q12: A route returns 404 but the route exists. What could be wrong?

**Answer:**
Common causes:
1. **Route order**: More specific routes must come before generic ones
   ```javascript
   // WRONG
   app.use('/:id', handler);      // Catches /users first!
   app.use('/users', userRoute);
   
   // CORRECT
   app.use('/users', userRoute);
   app.use('/:id', handler);
   ```

2. **Method mismatch**: Sending GET to a POST route

3. **Base path**: Route defined as `/posts` but accessed as `/api/posts`

4. **Not exported**: Forgot `module.exports = router`

---

### Q13: How do you debug an Express application?

**Answer:**

1. **Logging middleware:**
   ```javascript
   app.use((req, res, next) => {
     console.log(`${req.method} ${req.path}`, req.body);
     next();
   });
   ```

2. **VS Code debugger:**
   ```json
   // launch.json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Server",
     "program": "${workspaceFolder}/index.js"
   }
   ```

3. **Error handling middleware (must be last):**
   ```javascript
   app.use((err, req, res, next) => {
     console.error(err.stack);
     res.status(500).json({ error: err.message });
   });
   ```

---

## Quick Reference: Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Valid token, but no permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate data |
| 500 | Server Error | Unexpected server error |
| 503 | Service Unavailable | External service down |
