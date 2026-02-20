# 01 — Node.js & Express Fundamentals

## Why This File Exists
Before diving into the VoxVeritas code, you need to understand the building blocks. Every file in our backend uses Node.js and Express. This document explains them at a beginner level.

---

## What is Node.js?

Node.js lets you run JavaScript outside the browser — on a server. When a user visits your website, their browser sends a request to your server. Node.js handles that request and sends back data (usually JSON).

**Why Node.js for this project?**
- JavaScript everywhere (same language as our React frontend)
- Non-blocking I/O — can handle many requests at once without waiting for each to finish
- Huge ecosystem of packages via npm (Node Package Manager)

---

## What is Express?

Express is a lightweight framework built on top of Node.js. It gives us tools to:
1. Define **routes** (URL paths like `/news/upload`)
2. Use **middleware** (functions that run before your route handler)
3. Send **responses** (JSON data back to the frontend)

### How Our Server Starts — `index.js`

```javascript
// index.js — the entry point of the entire backend
const express = require('express');       // Import Express framework
const app = express();                    // Create an Express application instance
```

**What's happening:** `require('express')` loads the Express package. `express()` creates an app object that we'll attach routes and middleware to.

### Middleware Setup

```javascript
// Parse JSON bodies — when frontend sends JSON data, Express converts it to req.body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

**Why `{ limit: '50mb' }`?** Because some requests contain large data (like base64-encoded images for face authentication). The default limit is only 100KB, which would reject those requests.

### CORS (Cross-Origin Resource Sharing)

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',          // Local development (Vite)
      'http://localhost:5174',          // Alternative dev port
      'https://your-domain.vercel.app', // Production deployment
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);             // Allow the request
    } else {
      callback(new Error('Not allowed by CORS'));  // Block it
    }
  },
  credentials: true,  // Allow cookies to be sent cross-origin
};
app.use(cors(corsOptions));
```

**Why we need CORS:** Browsers block requests from one domain (like `localhost:5173`) to another (like `localhost:3000`) by default. CORS headers tell the browser "it's okay, I trust this origin."

**Why `credentials: true`?** Our authentication uses cookies. Without this, the browser won't include cookies in cross-origin requests.

---

## Routes — How URLs Map to Code

Express routes follow this pattern:

```javascript
app.use('/path', routerFile);
```

This means: "For any URL starting with `/path`, use the handlers defined in `routerFile`."

### Our Route Mounting (from `index.js`)

```javascript
app.use('/users', userRoute);              // → /users/normal/signup, /users/expert/login, etc.
app.use('/news', newsRoute);               // → /news/upload, /news/posts, /news/vote/:postId
app.use('/comment-filter', commentFilter); // → /comment-filter/grouped/:newsId
app.use('/debate-rooms', debateRoomRoute); // → /debate-rooms/, /debate-rooms/:roomId/comments
app.use('/trending-news', trendingRoute);  // → /trending-news/, /trending-news/:id/repost
app.use('/profile', profileRoute);         // → /profile/me, /profile/update
app.use('/api', aiVerdictRoute);           // → /api/news/:newsId/ai-verdict
app.use('/api/accuracy', accuracyTest);    // → /api/accuracy/results, /api/accuracy/calculate
```

### Inside a Route File

```javascript
// routes/NewsRoute.js
const express = require('express');
const router = express.Router();                    // Create a mini-router
const { uploadNews, getAllPosts } = require('../controllers/NewsController');
const { authenticateAnyUser } = require('../middlewares/authMiddleware');

router.post('/upload', authenticateAnyUser, uploadNews);  // POST /news/upload
router.get('/posts', getAllPosts);                          // GET /news/posts
module.exports = router;
```

**Breaking it down:**
- `router.post('/upload', ...)` — handles POST requests to `/news/upload`
- `authenticateAnyUser` — middleware that runs first to verify the user is logged in
- `uploadNews` — the controller function that actually processes the request

---

## The Request-Response Cycle

Every API call follows this cycle:

```
Browser/Frontend  →  Route  →  Middleware  →  Controller  →  Service  →  Database
                                                                              │
Browser/Frontend  ←  JSON Response  ←  Controller  ←  Data  ←───────────────┘
```

### Example: User uploads news

1. Frontend sends `POST /news/upload` with title, description, link
2. Express matches the route → `NewsRoute.js`
3. `authenticateAnyUser` middleware checks the JWT token
4. `uploadNews` controller validates data and saves to MongoDB
5. Controller sends JSON response: `{ success: true, message: 'News uploaded' }`

---

## Request Object (`req`) — What the Frontend Sends

```javascript
const uploadNews = async (req, res) => {
  // req.body — data sent in the request body (POST/PUT)
  const { title, description, link } = req.body;
  
  // req.params — URL parameters like :postId
  // For route /news/vote/:postId → req.params.postId
  
  // req.query — URL query string like ?page=2&stance=for
  // For /news/posts?page=2 → req.query.page === '2'
  
  // req.user — added by our auth middleware (the logged-in user)
  const userId = req.user._id;
  
  // req.cookies — cookies sent by the browser
  const token = req.cookies.token;
};
```

---

## Response Object (`res`) — What We Send Back

```javascript
// Success response
res.status(200).json({
  success: true,
  message: 'Operation successful',
  data: someData
});

// Error response
res.status(404).json({
  success: false,
  message: 'Resource not found'
});

// Common status codes in our app:
// 200 — OK (success)
// 201 — Created (new resource created)
// 400 — Bad Request (invalid input)
// 401 — Unauthorized (not logged in)
// 403 — Forbidden (logged in but not allowed)
// 404 — Not Found
// 500 — Internal Server Error (our code broke)
```

---

## Middleware — Functions That Run Before Your Handler

Middleware is a function with access to `req`, `res`, and `next`. It can:
- Modify `req` (add data like `req.user`)
- End the request (send an error response)
- Call `next()` to pass control to the next function

```javascript
// What middleware looks like:
const myMiddleware = (req, res, next) => {
  // Do something (check auth, log, validate)
  if (isValid) {
    next();           // Continue to the next middleware or controller
  } else {
    res.status(401).json({ message: 'Unauthorized' });  // Stop here
  }
};

// Middleware chain example:
router.post('/upload', middleware1, middleware2, controllerFunction);
// Runs: middleware1 → middleware2 → controllerFunction (only if all call next())
```

---

## Async/Await — Handling Database Operations

Almost every controller function in our app is `async` because database operations take time.

```javascript
// Without async/await (callback hell):
News.find({}, function(err, data) {
  if (err) { /* handle error */ }
  User.findById(data.userId, function(err, user) {
    // nested callbacks get messy fast
  });
});

// With async/await (what we use):
const getAllPosts = async (req, res) => {
  try {
    const news = await News.find({});           // Wait for database response
    const user = await User.findById(news.userId); // Wait for this too
    res.json({ success: true, data: news });
  } catch (error) {
    // If anything fails, we land here
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**Key pattern:** Every controller wraps its logic in `try/catch`. The `try` block runs the happy path, and `catch` handles any errors.

---

## Environment Variables

Sensitive data (API keys, database URLs) is stored in a `.env` file, never in code:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/voxveritas
GEMINI_API_KEY_1=AIzaSy...
GEMINI_API_KEY_2=AIzaSy...
GEMINI_API_KEY_3=AIzaSy...
PINECONE_API_KEY=pcsk_...
ADMIN_SECURITY_PASSWORD=someSecretPassword
```

Accessed via `process.env`:
```javascript
require('dotenv').config();  // Load .env file
const mongoUri = process.env.MONGO_URI;
```

---

## Static File Serving

```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

**Why:** When users upload screenshots or profile photos, the files are saved to the `uploads/` folder. This line tells Express to serve those files directly as URLs (e.g., `http://localhost:3000/uploads/screenshots/img123.jpg`).

---

## Server Startup

```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Why `|| 3000`?** In production, the hosting provider sets `process.env.PORT`. Locally, it defaults to 3000.

---

## Next Steps
Now that you understand the fundamentals, move on to [02 — Project Architecture & Structure](02-PROJECT-ARCHITECTURE.md) to see how all these pieces are organized.
