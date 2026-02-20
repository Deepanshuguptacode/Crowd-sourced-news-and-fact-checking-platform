# 02 - Server Setup & Entry Point

## What You'll Learn
- How the Express server is configured
- What each middleware does and why
- Understanding CORS and why it's needed
- How routes are organized
- Error handling patterns
- Database connection process

---

## The Main Entry Point: index.js

The `index.js` file is where everything starts. Let's break it down completely.

### Complete Code with Explanations

```javascript
// ============================================
// SECTION 1: IMPORTS
// ============================================

const express = require('express');
// Express is our web framework. It handles HTTP requests/responses.
// Think of it as the receptionist of our server.

const mongoose = require('mongoose');
// Mongoose connects us to MongoDB and provides schema validation.
// It's our translator between JavaScript objects and database documents.

const userRoutes = require('./routes/userRoute');
const NewsRoutes = require('./routes/NewsRoute');
const commentFilterRoutes = require('./routes/commentFilterRoute');
const debateRoomRoutes = require('./routes/debateRoomRoute');
const trendingNewsRoutes = require('./routes/trendingNewsRoute');
const profileRoutes = require('./routes/profileRoute');
const aiVerdictRoutes = require('./routes/aiVerdictRoute');
const accuracyTestRoutes = require('./routes/accuracyTest');
// Each route file handles a specific resource (users, news, etc.)
// This keeps code organized and maintainable.

const trendingNewsScheduler = require('./services/trendingNewsScheduler');
// This service runs in the background to fetch trending news
// automatically every 10 minutes.

const cors = require('cors');
// CORS = Cross-Origin Resource Sharing
// Allows our frontend (different domain/port) to access our API.

const cookieParser = require('cookie-parser');
// Parses cookies from incoming requests.
// We use cookies to store JWT tokens.

const path = require('path');
// Node.js utility for handling file paths.
// Helps create paths that work on any operating system.

require('dotenv').config();
// Loads environment variables from .env file.
// Keeps sensitive data (API keys, passwords) out of code.
```

**Why These Imports?**

| Import | Purpose |
|--------|---------|
| `express` | Core web framework |
| `mongoose` | MongoDB connection and schemas |
| `routes/*` | Organized API endpoints |
| `trendingNewsScheduler` | Background job for news updates |
| `cors` | Allow cross-origin requests |
| `cookieParser` | Handle authentication cookies |
| `path` | Cross-platform file paths |
| `dotenv` | Environment variable loading |

---

### Creating the Express App

```javascript
// ============================================
// SECTION 2: APP INITIALIZATION
// ============================================

const app = express();
// Creates an Express application instance.
// This is the main object we'll configure and start.

// Think of 'app' as a container that holds:
// - Middleware (functions that process requests)
// - Routes (URL handlers)
// - Settings (port, environment, etc.)
```

---

### CORS Configuration (CRITICAL FOR UNDERSTANDING)

```javascript
// ============================================
// SECTION 3: CORS CONFIGURATION
// ============================================

const corsOptions = {
  origin: [
    // Development URLs (where frontend runs during development)
    'http://localhost:3000',      // CRA default
    'http://localhost:5173',      // Vite default
    'http://localhost:5174',      // Vite alternate
    'http://127.0.0.1:5173',      // Vite with IP
    'http://127.0.0.1:5174',
    'http://localhost:4173',      // Vite preview mode
    'http://127.0.0.1:4173',
    
    // Production URLs (deployed frontend)
    'https://voxveritas.me',
    'https://www.voxveritas.me',
    'https://voxveritas.vercel.app',
    'https://voxveritas-frontend.vercel.app',
    'https://crowd-sourced-news-and-fact-checkin.vercel.app',
    
    // GCP VM IP (for direct access)
    'http://34.131.44.0',
    'https://34.131.44.0',
    
    // Dynamic URL from environment
    process.env.FRONTEND_URL
  ].filter(Boolean), // Remove undefined/null values
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // HTTP methods our API accepts
  
  allowedHeaders: [
    'Content-Type',         // For JSON body
    'Authorization',        // For JWT token
    'X-Requested-With',     // For AJAX identification
    'Accept',               // Content negotiation
    'Origin',               // Request origin
    'Access-Control-Request-Method',    // Preflight
    'Access-Control-Request-Headers'    // Preflight
  ],
  
  credentials: true,        // Allow cookies to be sent
  optionsSuccessStatus: 200, // For legacy browsers
  preflightContinue: false
};

app.use(cors(corsOptions));
// Apply CORS middleware to all routes

app.options('*', cors(corsOptions));
// Handle preflight requests for all routes
```

#### What is CORS and Why Do We Need It?

```
Without CORS:
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   Frontend (localhost:5173)                                │
│        ↓                                                   │
│   "I want to call /api/users"                             │
│        ↓                                                   │
│   Browser: "BLOCKED! Different origin!"                    │
│                                                            │
│   Backend (localhost:3000) never receives request          │
│                                                            │
└────────────────────────────────────────────────────────────┘

With CORS:
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   Frontend (localhost:5173)                                │
│        ↓                                                   │
│   "I want to call /api/users"                             │
│        ↓                                                   │
│   Browser: "Let me check with the server..."              │
│        ↓ (Preflight OPTIONS request)                       │
│   Backend: "Yes, localhost:5173 is allowed!"              │
│        ↓                                                   │
│   Browser: "OK, I'll allow it"                            │
│        ↓ (Actual GET request)                              │
│   Backend processes request → Response sent                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**CORS Terms:**
- **Origin**: Protocol + Host + Port (e.g., `http://localhost:5173`)
- **Preflight**: Browser's "May I?" request before actual request
- **Credentials**: Cookies, Authorization headers

---

### Middleware Configuration

```javascript
// ============================================
// SECTION 4: MIDDLEWARE SETUP
// ============================================

app.use(express.json({ limit: '50mb' }));
// PURPOSE: Parse JSON request bodies
// 
// Without this:
//   req.body = undefined
// 
// With this:
//   Client sends: {"name": "John"}
//   req.body = { name: "John" }
// 
// limit: '50mb' → Allows large payloads (for images)

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// PURPOSE: Parse URL-encoded form data
// 
// Without this:
//   Form submissions wouldn't be parsed
// 
// With this:
//   Form: name=John&email=john@email.com
//   req.body = { name: "John", email: "john@email.com" }
// 
// extended: true → Allows nested objects

app.use(cookieParser());
// PURPOSE: Parse cookies from request headers
// 
// Without this:
//   req.cookies = undefined
// 
// With this:
//   Cookie header: "token=abc123; session=xyz789"
//   req.cookies = { token: "abc123", session: "xyz789" }

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// PURPOSE: Serve static files (uploaded images)
// 
// What this does:
//   URL: http://localhost:3000/uploads/screenshots/image.jpg
//   Serves: ./uploads/screenshots/image.jpg
// 
// path.join(__dirname, 'uploads'):
//   __dirname = current directory (e.g., /app/backend)
//   Result = /app/backend/uploads
```

#### Middleware Execution Order (IMPORTANT!)

```javascript
// Middleware runs in the ORDER they are defined!

app.use(cors(corsOptions));     // 1st: Check CORS
app.use(express.json());        // 2nd: Parse JSON body
app.use(cookieParser());        // 3rd: Parse cookies
app.use('/uploads', static());  // 4th: Serve static files
// Then: Routes are checked
```

**Visual Flow:**

```
Request arrives
     ↓
┌────────────────────────────────────────────────────────────┐
│  cors()                                                    │
│  "Is this origin allowed?"                                 │
│  ✓ Yes → Continue    ✗ No → Error                         │
└────────────────────────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────────────────────────┐
│  express.json()                                            │
│  "Is there a JSON body? Let me parse it."                 │
│  req.body = parsed JSON                                    │
└────────────────────────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────────────────────────┐
│  cookieParser()                                            │
│  "Are there cookies? Let me parse them."                  │
│  req.cookies = parsed cookies                              │
└────────────────────────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────────────────────────┐
│  static('/uploads')                                        │
│  "Is this a request for /uploads/*?"                      │
│  ✓ Yes → Serve file    ✗ No → Continue to routes          │
└────────────────────────────────────────────────────────────┘
     ↓
Routes check (userRoutes, NewsRoutes, etc.)
```

---

### Health Check Endpoint

```javascript
// ============================================
// SECTION 5: HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()  // Seconds since server started
  });
});
```

**Why Have a Health Check?**
- Deployment platforms (Vercel, AWS) ping this to check server health
- Load balancers use it to know if server is alive
- Monitoring tools alert you if it fails
- Quick way to verify deployment worked

**Example Response:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2026-01-23T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

### Route Registration

```javascript
// ============================================
// SECTION 6: ROUTES
// ============================================

app.use('/users', userRoutes);
// All routes in userRoute.js are prefixed with /users
// POST /users/normal/signup → userRoute handles it

app.use('/news', NewsRoutes);
// POST /news/upload, GET /news/all, etc.

app.use('/comment-filter', commentFilterRoutes);
// AI-powered comment grouping endpoints

app.use('/debate-rooms', debateRoomRoutes);
// Debate room CRUD operations

app.use('/trending-news', trendingNewsRoutes);
// Auto-scraped trending news

app.use('/profile', profileRoutes);
// User profile management

app.use('/api', aiVerdictRoutes);
// AI verdict generation
// POST /api/verdict/generate

app.use('/api/accuracy', accuracyTestRoutes);
// Testing accuracy of AI verdicts
```

**Route Prefix System:**

```
Route File: userRoute.js
  ├── POST /normal/signup
  └── POST /normal/login

Registered as: app.use('/users', userRoutes)

Final URLs:
  ├── POST /users/normal/signup
  └── POST /users/normal/login
```

---

### Security Headers

```javascript
// ============================================
// SECTION 7: SECURITY HEADERS
// ============================================

app.use((req, res, next) => {
  // Allow credentials (cookies) in CORS
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Prevent MIME type sniffing
  res.header('X-Content-Type-Options', 'nosniff');
  // Browser won't try to guess content type
  // Prevents XSS attacks via file uploads
  
  // Prevent clickjacking
  res.header('X-Frame-Options', 'DENY');
  // Page cannot be embedded in an iframe
  // Prevents attackers from putting your site in their iframe
  
  // Enable XSS filter in browsers
  res.header('X-XSS-Protection', '1; mode=block');
  // Browser blocks page if XSS attack detected
  
  next();  // Continue to next middleware
});
```

**Security Header Explanations:**

| Header | Protection Against |
|--------|-------------------|
| `X-Content-Type-Options: nosniff` | MIME type confusion attacks |
| `X-Frame-Options: DENY` | Clickjacking attacks |
| `X-XSS-Protection: 1; mode=block` | Cross-site scripting (XSS) |

---

### Error Handling

```javascript
// ============================================
// SECTION 8: ERROR HANDLING
// ============================================

// Global error handler - catches all unhandled errors
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    // Only show detailed error in development
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Something went wrong'
  });
});

// 404 handler - catches unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});
```

**Error Handler Signature:**
```javascript
// Normal middleware: (req, res, next)
// Error middleware: (err, req, res, next) ← 4 parameters!

// Express knows it's an error handler because of 4 parameters
```

**Error Flow:**

```
Route handler throws error
          ↓
try { ... } catch (error) { next(error); }
          ↓
Error middleware catches it
          ↓
Returns consistent error response
```

---

### Database Connection & Server Start

```javascript
// ============================================
// SECTION 9: DATABASE & SERVER
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/DBMS';
// Use environment variable or default to local MongoDB

const PORT = process.env.PORT || 3000;
// Use environment variable or default to 3000

// Startup logging
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('MONGODB_URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); 
// ↑ Hide credentials in logs for security

console.log('GEMINI_API_KEY_1:', process.env.GEMINI_API_KEY_1 ? '✓ Set' : '✗ Missing');
console.log('GEMINI_API_KEY_2:', process.env.GEMINI_API_KEY_2 ? '✓ Set' : '✗ Missing');
console.log('GEMINI_API_KEY_3:', process.env.GEMINI_API_KEY_3 ? '✓ Set' : '✗ Missing');

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✓ Connected to MongoDB successfully");
    
    // Start background scheduler AFTER database is connected
    trendingNewsScheduler.start();
    console.log("✓ Trending news scheduler started");
    
    // Start the HTTP server AFTER database is connected
    app.listen(PORT, '0.0.0.0', () => {
      // '0.0.0.0' means accept connections from any IP
      // (needed for Docker, cloud deployment)
      
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Health check available at: http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    console.error("✗ MongoDB connection failed:", error.message);
    process.exit(1);  // Exit with error code
  });
```

**Why Start Server AFTER Database Connection?**

```
BAD Order:
1. Start server → Accepting requests
2. Try database connection → Still connecting...
3. Request arrives → Database not ready! ERROR!

GOOD Order:
1. Connect to database → Wait for success
2. Start server → Now ready for requests
3. Request arrives → Database ready! SUCCESS!
```

---

### Complete Startup Flow

```
node index.js
       ↓
┌─────────────────────────────────────────────┐
│  Load environment variables (.env)          │
└─────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────┐
│  Create Express app                         │
│  Configure CORS                             │
│  Set up middleware                          │
│  Register routes                            │
│  Add error handlers                         │
└─────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────┐
│  Connect to MongoDB                         │
│  (Wait for connection)                      │
└─────────────────────────────────────────────┘
       ↓ SUCCESS
┌─────────────────────────────────────────────┐
│  Start trending news scheduler              │
│  (Background job every 10 min)              │
└─────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────┐
│  Start HTTP server on PORT                  │
│  Server now accepting requests!             │
└─────────────────────────────────────────────┘
       ↓
Console output:
✓ Connected to MongoDB successfully
✓ Trending news scheduler started
✓ Server running on port 3000
```

---

## Interview Questions & Answers

### Q1: What is middleware in Express and how does it work?
**Answer:** Middleware functions are functions that have access to the request object (req), response object (res), and the next function. They execute in order and can:
- Execute code
- Modify request/response objects
- End the request-response cycle
- Call the next middleware

Example: `app.use(express.json())` is middleware that parses JSON bodies before routes handle requests.

### Q2: What is CORS and why is it necessary?
**Answer:** CORS (Cross-Origin Resource Sharing) is a security feature in browsers that restricts web pages from making requests to a different domain than the one serving the page. It's necessary because:
- Frontend (localhost:5173) and backend (localhost:3000) are different origins
- Browsers block cross-origin requests by default
- CORS headers tell browsers which origins are allowed

### Q3: Why do you connect to MongoDB before starting the server?
**Answer:** We connect first because:
1. **Reliability** - Ensures database is available before accepting requests
2. **Fail fast** - If database is down, we know immediately at startup
3. **Data consistency** - No requests can be processed before database is ready
4. **Error handling** - Clean exit if connection fails

### Q4: Explain the middleware execution order in your application.
**Answer:** Middleware executes in the order registered:
1. CORS - Check if origin is allowed
2. express.json() - Parse JSON body
3. express.urlencoded() - Parse form data
4. cookieParser() - Parse cookies
5. Static file serving - Serve uploads
6. Routes - Handle API requests
7. Error handler - Catch unhandled errors
8. 404 handler - Catch unmatched routes

### Q5: What does `app.use('*', ...)` at the end mean?
**Answer:** The `*` is a wildcard matching all routes. Placed at the end, it catches any request that didn't match previous routes, acting as a 404 handler. It must be last because middleware executes in order - if placed first, it would catch all requests.

---

## Summary

The `index.js` file:
1. Imports required packages and route files
2. Creates Express app and configures CORS
3. Sets up middleware chain (JSON parsing, cookies, static files)
4. Registers API routes with path prefixes
5. Adds security headers and error handlers
6. Connects to MongoDB before starting server
7. Launches background scheduler for trending news
8. Starts HTTP server and begins accepting requests

---

**Next: [03-MONGODB-MONGOOSE.md](./03-MONGODB-MONGOOSE.md)** - Understanding database and schemas →
