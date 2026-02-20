# Part 1.2: Server Setup & Entry Point

## 🎯 Purpose

This document explains how the Express server is set up, configured, and started. We'll walk through `index.js` line by line to understand every configuration choice and why it matters.

## 📁 File: `backend/index.js`

This is the **main entry point** of our backend application. When you run `npm start`, this file executes and sets up the entire server.

## 📝 Complete Code Walkthrough

### Step 1: Import Dependencies

```javascript
const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoute');
const NewsRoutes = require('./routes/NewsRoute');
const commentFilterRoutes = require('./routes/commentFilterRoute');
const debateRoomRoutes = require('./routes/debateRoomRoute');
const trendingNewsRoutes = require('./routes/trendingNewsRoute');
const profileRoutes = require('./routes/profileRoute');
const aiVerdictRoutes = require('./routes/aiVerdictRoute');
const accuracyTestRoutes = require('./routes/accuracyTest');
const trendingNewsScheduler = require('./services/trendingNewsScheduler');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
```

**Why we write this:**
- **require()** is Node.js's way to import modules
- We import everything we need at the top for organization

**What each import does:**

1. **express**: Web framework for creating the server
   - Provides methods like `app.get()`, `app.post()`
   - Handles routing and middleware

2. **mongoose**: MongoDB object modeling tool
   - Connects to MongoDB database
   - Provides schema validation
   - Simplifies database queries

3. **Route imports** (userRoutes, NewsRoutes, etc.):
   - Each file contains related API endpoints
   - Separating routes keeps code organized
   - We'll attach these to our app later

4. **trendingNewsScheduler**: Background job service
   - Runs periodic tasks (cleanup, updates)
   - Explained in detail in Services documentation

5. **cors**: Cross-Origin Resource Sharing
   - Allows frontend (different domain) to call our API
   - Security feature that controls who can access our server

6. **cookieParser**: Parses cookies from requests
   - Extracts cookie data into req.cookies object
   - Used for session management

7. **path**: Node.js built-in module
   - Handles file paths correctly across OS (Windows/Mac/Linux)
   - Used for serving static files

**Important Detail**: The order of imports doesn't matter, but it's good practice to group them logically (framework, database, routes, utilities).

---

### Step 2: Load Environment Variables

```javascript
// Load environment variables
require('dotenv').config();
```

**Why we write this:**
- Sensitive data (API keys, database passwords) should NOT be in code
- Environment variables keep secrets separate from code
- `.env` file stores these variables locally

**What it does:**
- Reads the `.env` file in the backend directory
- Loads variables into `process.env` object
- Example: `process.env.MONGODB_URI` becomes available

**Example .env file:**
```env
MONGODB_URI=mongodb://localhost:27017/DBMS
JWT_SECRET=your_super_secret_key_here
PORT=3000
GEMINI_API_KEY_1=AIza...
GEMINI_API_KEY_2=AIza...
```

**Important Detail**: The `.env` file should NEVER be committed to Git (add to .gitignore). Use `.env.example` as a template for other developers.

---

### Step 3: Create Express Application

```javascript
const app = express();
```

**Why we write this:**
- Creates an instance of an Express application
- This `app` object is what we'll configure and use

**What it does:**
- Initializes Express framework
- Returns an object with methods like `.use()`, `.get()`, `.post()`
- This becomes our web server

**Important Detail**: We only create ONE app instance for the entire application.

---

### Step 4: Configure CORS (Critical Security Feature)

```javascript
// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:4173', // Vite preview
    'http://127.0.0.1:4173',
    // Production domains
    'https://voxveritas.me',
    'https://www.voxveritas.me',
    'https://voxveritas.vercel.app',
    'https://voxveritas-frontend.vercel.app',
    'https://crowd-sourced-news-and-fact-checkin.vercel.app',
    // GCP VM IP
    'http://34.131.44.0',
    'https://34.131.44.0',
    // Environment variable for custom frontend URL
    process.env.FRONTEND_URL
  ].filter(Boolean), // Remove undefined values
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  credentials: true, // Allow cookies and authorization headers
  optionsSuccessStatus: 200, // For legacy browser support
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
```

**Why we write this:**
- **Security**: By default, browsers block requests from different domains
- **Flexibility**: We need frontend (localhost:5173) to call backend (localhost:3000)
- **Control**: We specify exactly which domains can access our API

**What CORS does:**
When a browser makes a request from `http://localhost:5173` to `http://localhost:3000`:
1. Browser sends a "preflight" OPTIONS request
2. Server responds with allowed origins and methods
3. If origin is allowed, actual request proceeds
4. If not allowed, browser blocks the request

**Breaking down corsOptions:**

1. **origin**: Array of allowed domains
   - Development: localhost with various ports
   - Production: actual domain names
   - `.filter(Boolean)` removes undefined values

2. **methods**: HTTP methods we allow
   - GET: Read data
   - POST: Create data
   - PUT: Update entire resource
   - PATCH: Update part of resource
   - DELETE: Remove data
   - OPTIONS: Preflight check

3. **allowedHeaders**: Which headers clients can send
   - Content-Type: Specifies data format (JSON, etc.)
   - Authorization: JWT token for authentication
   - Others: Standard HTTP headers

4. **credentials: true**: Very important!
   - Allows cookies and authorization headers
   - Required for JWT authentication
   - Must be true for our auth system to work

5. **optionsSuccessStatus: 200**
   - Some old browsers expect 200 for OPTIONS requests
   - Instead of 204 (No Content)

**app.options('*', cors(corsOptions))**:
- Handles preflight requests for all routes
- '*' means any route
- Browsers send OPTIONS request before actual request

**Important Detail**: If a domain is NOT in the origin array, requests from that domain will be blocked by the browser, not the server.

---

### Step 5: Apply Middleware

```javascript
// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname,'uploads')));
```

**Why we write this:**
- Middleware functions run before route handlers
- They process incoming requests
- Order matters - middleware runs in the order it's added

**What each middleware does:**

### 1. `express.json({ limit: '50mb' })`

```javascript
app.use(express.json({ limit: '50mb' }));
```

**Purpose**: Parses incoming JSON data
**How it works**:
- Looks at Content-Type header
- If `application/json`, parses body
- Makes data available in `req.body`

**Example**:
```javascript
// Client sends:
POST /users/register
Content-Type: application/json
{ "username": "john", "email": "john@example.com" }

// In controller, we can access:
const { username, email } = req.body;  // Parsed automatically!
```

**limit: '50mb'**:
- Maximum size of JSON payload
- Prevents memory overflow attacks
- Needed for large data (images as base64)

### 2. `express.urlencoded({ extended: true, limit: '50mb' })`

```javascript
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

**Purpose**: Parses URL-encoded data (HTML forms)
**How it works**:
- Parses data like: `username=john&email=john@example.com`
- Makes it available in `req.body`

**extended: true**:
- Allows rich objects and arrays
- Uses `qs` library instead of `querystring`
- Can parse nested objects

**Example**:
```javascript
// Form submission:
username=john&interests[0]=coding&interests[1]=reading

// With extended: true, req.body becomes:
{
  username: "john",
  interests: ["coding", "reading"]
}
```

### 3. `cookieParser()`

```javascript
app.use(cookieParser());
```

**Purpose**: Parses cookies from Cookie header
**How it works**:
- Extracts cookies from request headers
- Makes them available in `req.cookies`

**Example**:
```javascript
// Client sends:
Cookie: token=abc123; theme=dark

// In controller:
console.log(req.cookies.token);  // 'abc123'
console.log(req.cookies.theme);  // 'dark'
```

**Important Detail**: While we use JWT in headers, cookies provide an alternative authentication method.

### 4. `express.static()`

```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

**Purpose**: Serves static files (images, documents)
**How it works**:
- When request comes to `/uploads/...`
- Express looks in the `uploads` folder
- Returns the file if it exists

**Example**:
```javascript
// File structure:
backend/uploads/profiles/user123.jpg

// Access via URL:
http://localhost:3000/uploads/profiles/user123.jpg
```

**path.join(__dirname, 'uploads')**:
- `__dirname`: Current directory (backend/)
- `path.join()`: Correctly joins paths for any OS
- Result: `C:\project\backend\uploads` (Windows) or `/project/backend/uploads` (Linux)

**Why this matters**:
- Users upload profile pictures
- News articles may have images
- We need to serve these files to frontend

---

### Step 6: Health Check Endpoint

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

**Why we write this:**
- Monitoring: Check if server is alive
- Debugging: Quick way to test server
- DevOps: Health checks for deployment platforms

**What it does:**
- Responds to GET request at `/health`
- Returns 200 status code (success)
- Sends server status information

**Response example:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2026-01-23T10:30:00.000Z",
  "uptime": 3600.5
}
```

**Understanding the response:**
- **status**: Simple OK/ERROR indicator
- **timestamp**: Current server time (ISO format)
- **uptime**: How long server has been running (seconds)
  - `process.uptime()`: Node.js built-in function
  - Returns seconds since process started

**Use cases:**
```bash
# Quick server check
curl http://localhost:3000/health

# Deployment platforms check this endpoint
# If it doesn't return 200, they restart the server
```

---

### Step 7: Mount Route Handlers

```javascript
// Routes
app.use('/users', userRoutes);
app.use('/news', NewsRoutes);
app.use('/comment-filter', commentFilterRoutes);
app.use('/debate-rooms', debateRoomRoutes);
app.use('/trending-news', trendingNewsRoutes);
app.use('/profile', profileRoutes);
app.use('/api', aiVerdictRoutes);
app.use('/api/accuracy', accuracyTestRoutes);
```

**Why we write this:**
- Organizes routes by feature
- Separates concerns (users, news, debates)
- Makes URLs meaningful and RESTful

**What app.use() does:**
- Mounts middleware/routes at a specific path
- All routes in that router are prefixed with the path

**Example flow:**

```javascript
// In userRoute.js:
router.post('/register', UserController.register);

// Mounted as:
app.use('/users', userRoutes);

// Final URL becomes:
POST /users/register
```

**Breaking down each mount:**

1. **'/users' → userRoutes**
   - All user-related endpoints
   - Registration, login, profile
   - Example: `/users/login`, `/users/register`

2. **'/news' → NewsRoutes**
   - News submission and retrieval
   - Example: `/news/submit-news`, `/news/get-all-news`

3. **'/comment-filter' → commentFilterRoutes**
   - Comment filtering and moderation
   - Example: `/comment-filter/classify`

4. **'/debate-rooms' → debateRoomRoutes**
   - Debate functionality
   - Example: `/debate-rooms/create`, `/debate-rooms/join`

5. **'/trending-news' → trendingNewsRoutes**
   - Trending content
   - Example: `/trending-news/get-all`

6. **'/profile' → profileRoutes**
   - User profile management
   - Example: `/profile/update`

7. **'/api' → aiVerdictRoutes**
   - AI fact-checking
   - Example: `/api/ai-verdict`

8. **'/api/accuracy' → accuracyTestRoutes**
   - Accuracy testing
   - Example: `/api/accuracy/test`

**Important Detail**: The order of route mounting usually doesn't matter, but more specific routes should come before general ones.

---

### Step 8: Security Headers

```javascript
// Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});
```

**Why we write this:**
- **Security**: Protect against common web vulnerabilities
- **Best Practice**: Standard security headers
- **Defense in Depth**: Multiple layers of protection

**What each header does:**

### 1. Access-Control-Allow-Credentials: 'true'

```javascript
res.header('Access-Control-Allow-Credentials', 'true');
```

**Purpose**: Works with CORS to allow cookies
**Security implication**:
- Allows frontend to send cookies with requests
- Required for authentication
- Must match CORS credentials: true

### 2. X-Content-Type-Options: 'nosniff'

```javascript
res.header('X-Content-Type-Options', 'nosniff');
```

**Purpose**: Prevents MIME type sniffing
**What it prevents**:
- Browser guessing file types
- Executing malicious files as JavaScript
- Example attack: Upload `.txt` file that's actually JavaScript

**How it works**:
- Browser must respect Content-Type header
- Won't try to "guess" the file type

### 3. X-Frame-Options: 'DENY'

```javascript
res.header('X-Frame-Options', 'DENY');
```

**Purpose**: Prevents clickjacking attacks
**What it prevents**:
- Your site being loaded in an `<iframe>`
- Attackers overlaying invisible frames
- Users clicking on hidden malicious content

**How it works**:
- Browser refuses to render page in frame
- Protects users from clickjacking

**Alternative values**:
- DENY: Never allow framing
- SAMEORIGIN: Allow same domain framing
- ALLOW-FROM: Allow specific domains

### 4. X-XSS-Protection: '1; mode=block'

```javascript
res.header('X-XSS-Protection', '1; mode=block');
```

**Purpose**: Enables browser XSS filter
**What it prevents**:
- Cross-Site Scripting attacks
- Malicious JavaScript injection

**How it works**:
- '1': Enable filter
- 'mode=block': Block page if attack detected
- Alternative: 'mode=sanitize' (removes dangerous parts)

**Important Detail**: Modern browsers have built-in XSS protection, but this header ensures it's enabled.

### The next() function

```javascript
next();
```

**Critical function**: Passes control to next middleware
- Without `next()`, request hangs
- Chain continues to route handlers
- Must be called in middleware functions

---

### Step 9: Error Handling Middleware

```javascript
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});
```

**Why we write this:**
- Centralized error handling
- Prevents server crashes
- Provides meaningful error responses

**What it does:**
- Catches errors from any route or middleware
- Logs error for debugging
- Sends appropriate response to client

**Function signature:**
```javascript
(err, req, res, next) => { }
```
**Important**: 4 parameters make this an error handler
- err: The error object
- req: Request object
- res: Response object
- next: Pass to next error handler (if any)

**Error response logic:**

```javascript
error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
```

**Why conditional error message?**
- **Development**: Show detailed error for debugging
  - Example: "Cannot read property 'name' of undefined"
- **Production**: Hide implementation details
  - Security: Don't leak information to attackers
  - User-friendly: "Something went wrong" is clearer

**Example scenarios:**

```javascript
// Development response:
{
  "success": false,
  "message": "Internal server error",
  "error": "ValidationError: email is required"
}

// Production response:
{
  "success": false,
  "message": "Internal server error",
  "error": "Something went wrong"
}
```

**Important Detail**: This middleware must be defined AFTER all routes, as it catches errors from them.

---

### Step 10: 404 Handler

```javascript
// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});
```

**Why we write this:**
- Handles undefined routes gracefully
- Better UX than default error page
- Consistent API response format

**What '*' means:**
- Matches any route
- Only reached if no other route matched
- Must be defined last

**Example:**
```javascript
// User requests:
GET /api/nonexistent-endpoint

// Response:
404 Not Found
{
  "success": false,
  "message": "Route not found"
}
```

**Important Detail**: This must be the LAST middleware, as it's a catch-all.

---

### Step 11: MongoDB Connection

```javascript
// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/DBMS';
const PORT = process.env.PORT || 3000;

console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('MONGODB_URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
console.log('GEMINI_API_KEY_1:', process.env.GEMINI_API_KEY_1 ? '✓ Set' : '✗ Missing');
console.log('GEMINI_API_KEY_2:', process.env.GEMINI_API_KEY_2 ? '✓ Set' : '✗ Missing');
console.log('GEMINI_API_KEY_3:', process.env.GEMINI_API_KEY_3 ? '✓ Set' : '✗ Missing');
```

**Why we write this:**
- Load configuration from environment
- Provide fallback values
- Debug startup issues

**Understanding the code:**

### 1. Load configuration

```javascript
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/DBMS';
```

**Logical OR operator** `||`:
- If `process.env.MONGODB_URI` exists, use it
- Otherwise, use default local MongoDB

**Default breakdown**:
- `mongodb://`: MongoDB connection protocol
- `127.0.0.1`: Localhost (same as localhost)
- `27017`: Default MongoDB port
- `DBMS`: Database name

### 2. Hide credentials in logs

```javascript
MONGODB_URI.replace(/\/\/.*@/, '//***:***@')
```

**Why?**: MongoDB URIs may contain passwords
```
mongodb://username:password@host:port/database
```

**Regex explanation**:
- `\/\/`: Matches `//`
- `.*`: Matches any characters (username:password)
- `@`: Matches `@`
- Replace with: `//***:***@`

**Result**:
```javascript
// Before:
mongodb://admin:secretpass123@cluster.mongodb.net/dbname

// After (in logs):
mongodb://***:***@cluster.mongodb.net/dbname
```

### 3. Environment check logs

```javascript
console.log('GEMINI_API_KEY_1:', process.env.GEMINI_API_KEY_1 ? '✓ Set' : '✗ Missing');
```

**Ternary operator**: `condition ? trueValue : falseValue`
- Checks if API key exists
- Shows ✓ if set, ✗ if missing
- Doesn't log actual key (security)

**Why check multiple keys?**
- API rate limiting
- Key rotation for reliability
- If one key fails, use another

---

### Step 12: Connect to Database and Start Server

```javascript
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✓ Connected to MongoDB successfully");
    
    // Start trending news scheduler
    trendingNewsScheduler.start();
    console.log("✓ Trending news scheduler started");
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Health check available at: http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    console.error("✗ MongoDB connection failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  });
```

**Why we write this:**
- Connect to database first
- Only start server if database connected
- Exit gracefully if connection fails

**Breaking down the flow:**

### 1. mongoose.connect()

```javascript
mongoose.connect(MONGODB_URI)
```

**What it does:**
- Establishes connection to MongoDB
- Returns a Promise
- Async operation (takes time)

**Promise chain**: `.then()` → `.catch()`

### 2. Success handler (.then)

```javascript
.then(() => {
  console.log("✓ Connected to MongoDB successfully");
  
  // Start trending news scheduler
  trendingNewsScheduler.start();
  console.log("✓ Trending news scheduler started");
  
  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Health check available at: http://localhost:${PORT}/health`);
  });
})
```

**Execution order:**
1. ✓ Database connected
2. ✓ Start background scheduler
3. ✓ Start HTTP server

**Why this order?**
- Must have database before accepting requests
- Scheduler depends on database
- Server should be last to start

**trendingNewsScheduler.start()**:
- Starts cron job for trending news
- Runs periodically in background
- Documented in Services section

**app.listen(PORT, '0.0.0.0', callback)**:
- **PORT**: Which port to listen on (3000)
- **'0.0.0.0'**: Listen on all network interfaces
  - Allows external connections
  - Required for deployment
  - Alternative: 'localhost' (only local)
- **callback**: Function called when server starts

### 3. Error handler (.catch)

```javascript
.catch((error) => {
  console.error("✗ MongoDB connection failed:", error.message);
  console.error("Full error:", error);
  process.exit(1);
})
```

**What happens on error:**
1. Log error message
2. Log full error details
3. Exit process with code 1

**process.exit(1)**:
- Stops the Node.js process
- **0**: Success
- **1**: Error
- Why exit?: Can't run without database

**Common connection errors:**
- Wrong URI
- MongoDB not running
- Network issues
- Authentication failed

---

## 🔄 Complete Startup Flow

When you run `npm start`:

```
1. Node.js executes index.js
2. Load environment variables (.env)
3. Create Express app
4. Configure CORS
5. Apply middleware (JSON parser, cookie parser, etc.)
6. Mount routes
7. Add security headers
8. Add error handlers
9. Attempt MongoDB connection
   ├─ Success:
   │  ├─ Start scheduler
   │  ├─ Start HTTP server
   │  └─ Ready to accept requests ✓
   └─ Failure:
      ├─ Log error
      └─ Exit process ✗
```

## 📊 Startup Logs Example

```
Environment check:
NODE_ENV: development
PORT: 3000
MONGODB_URI: mongodb://***:***@cluster.mongodb.net/DBMS
GEMINI_API_KEY_1: ✓ Set
GEMINI_API_KEY_2: ✓ Set
GEMINI_API_KEY_3: ✓ Set
✓ Connected to MongoDB successfully
✓ Trending news scheduler started
✓ Server running on port 3000
✓ Health check available at: http://localhost:3000/health
```

## 🎓 Key Learning Points

1. **Middleware Order Matters**: 
   - CORS before routes
   - Routes before error handlers
   - 404 handler last

2. **Security is Layered**:
   - CORS (domain control)
   - Security headers
   - Input validation
   - Environment variables

3. **Graceful Startup**:
   - Check environment
   - Connect database first
   - Start server last
   - Exit on critical errors

4. **Error Handling**:
   - Try/catch for async operations
   - Centralized error middleware
   - Different responses for dev/prod

## 🔗 Related Files

- **Environment**: `.env` (configuration)
- **Routes**: `routes/*.js` (API endpoints)
- **Services**: `services/trendingNewsScheduler.js` (background jobs)
- **Models**: `models/*.js` (database schemas)

## 📝 Next Steps

Now that you understand server setup:
1. Read [Models Overview](./03-models-overview.md) to understand data structure
2. Study [User Models](./04-user-models.md) for authentication
3. Explore [Controllers](./08-controllers-overview.md) for business logic

---

**Key Takeaway**: The server setup is like building a house - foundation first (database), then structure (routes and middleware), then safety features (security headers), and finally open the doors (start listening for requests).
