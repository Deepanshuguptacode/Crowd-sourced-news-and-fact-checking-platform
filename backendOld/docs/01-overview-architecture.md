# Part 1.1: Overview & Architecture

## 🎯 Purpose

This document provides a high-level understanding of the VoxVeritas backend architecture, explaining what the system does, why it's structured this way, and how different components work together.

## What is VoxVeritas?

VoxVeritas is a **crowd-sourced news and fact-checking platform** that allows users to:
- Submit and vote on news articles
- Comment on news with credibility tracking
- Participate in structured debates
- Get AI-powered fact-checking verdicts
- Use biometric (face) authentication for enhanced security

## 🏗️ Architecture Pattern: MVC (Model-View-Controller)

### Why MVC?

We use the MVC pattern because it:
- **Separates concerns**: Each part has a specific job
- **Makes code maintainable**: Easy to find and fix bugs
- **Enables scalability**: Can add features without breaking existing code
- **Improves testability**: Can test each layer independently

### How MVC Works in Our Backend

```
Client Request (Frontend)
        ↓
    ┌─────────────────────────────────────┐
    │          ROUTES                     │  ← Entry point for requests
    │  (Routes define API endpoints)      │
    └─────────────────────────────────────┘
                ↓
    ┌─────────────────────────────────────┐
    │       MIDDLEWARE                    │  ← Authentication, validation
    │  (Checks permissions, validates)    │
    └─────────────────────────────────────┘
                ↓
    ┌─────────────────────────────────────┐
    │       CONTROLLERS                   │  ← Business logic
    │  (Handles request, calls services)  │
    └─────────────────────────────────────┘
                ↓
    ┌─────────────────────────────────────┐
    │        SERVICES                     │  ← Complex operations
    │  (AI calls, external APIs)          │
    └─────────────────────────────────────┘
                ↓
    ┌─────────────────────────────────────┐
    │         MODELS                      │  ← Database layer
    │  (MongoDB schemas and queries)      │
    └─────────────────────────────────────┘
                ↓
        MongoDB Database
                ↓
    Response sent back to client
```

## 📦 Technology Stack

### Core Technologies

| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **Node.js** | Runtime environment | JavaScript everywhere, fast, non-blocking I/O |
| **Express.js** | Web framework | Simple, flexible, great middleware support |
| **MongoDB** | Database | Flexible schema, great for document storage |
| **Mongoose** | ODM (Object Data Modeling) | Schema validation, easier queries |

### Key Dependencies

```json
{
  "express": "Web server framework",
  "mongoose": "MongoDB object modeling",
  "jsonwebtoken": "JWT authentication tokens",
  "bcrypt": "Password hashing for security",
  "cors": "Cross-Origin Resource Sharing",
  "dotenv": "Environment variable management",
  "@google/genai": "Google Gemini AI integration",
  "axios": "HTTP client for external APIs",
  "multer": "File upload handling",
  "cookie-parser": "Parse cookies from requests",
  "cron": "Schedule background jobs"
}
```

## 🗂️ Project Structure

```
backend/
├── index.js              # Main entry point (server setup)
├── startup.js            # Startup script with health checks
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables (secrets)
│
├── models/               # Database schemas
│   ├── User models (NormalUser, ExpertUser, etc.)
│   ├── News.js
│   ├── Comments.js
│   ├── DebateRoom.js
│   └── AIVerdict.js
│
├── controllers/          # Business logic
│   ├── UserController.js
│   ├── NewsController.js
│   ├── CommentsController.js
│   ├── DebateRoomController.js
│   └── AIVerdictController.js
│
├── routes/               # API endpoints
│   ├── userRoute.js
│   ├── NewsRoute.js
│   ├── debateRoomRoute.js
│   └── aiVerdictRoute.js
│
├── services/             # External integrations & utilities
│   ├── llmService.js           # AI integration
│   ├── faceAuthService.js      # Biometric auth
│   ├── commentFilteringService.js
│   └── trendingNewsScheduler.js
│
├── middlewares/          # Request interceptors
│   └── authMiddleware.js       # JWT verification
│
└── uploads/              # User uploaded files
```

## 🔄 Request Flow Example

Let's trace a request to submit news:

### Step 1: Client sends request
```http
POST /news/submit-news
Headers: {
  "Authorization": "Bearer eyJhbGc...",
  "Content-Type": "application/json"
}
Body: {
  "headline": "Breaking News!",
  "description": "Important event...",
  "category": "politics"
}
```

### Step 2: Route receives request
```javascript
// File: routes/NewsRoute.js
router.post('/submit-news', authMiddleware, NewsController.submitNews);
```
- Route matches `/news/submit-news`
- Passes through `authMiddleware` first
- Then calls `NewsController.submitNews`

### Step 3: Middleware validates
```javascript
// File: middlewares/authMiddleware.js
// Verifies JWT token, extracts user ID
// Adds req.userId for controller to use
```

### Step 4: Controller processes
```javascript
// File: controllers/NewsController.js
// Validates input
// Calls AI service to analyze news
// Saves to database via Model
// Returns response
```

### Step 5: Model interacts with database
```javascript
// File: models/News.js
// Uses Mongoose schema
// Validates data structure
// Saves to MongoDB
```

### Step 6: Response sent
```json
{
  "success": true,
  "message": "News submitted successfully",
  "data": { "newsId": "..." }
}
```

## 🔐 Security Layers

### 1. Environment Variables
```javascript
// Secrets stored in .env file (never committed to Git)
MONGODB_URI=mongodb://...
JWT_SECRET=your_secret_key
GEMINI_API_KEY_1=your_api_key
```

### 2. CORS (Cross-Origin Resource Sharing)
- Restricts which domains can access the API
- Prevents unauthorized websites from making requests

### 3. JWT Authentication
- Stateless authentication using tokens
- Token contains user ID and expiry
- Verified on protected routes

### 4. Password Hashing
- Never store plain text passwords
- Use bcrypt to hash passwords
- Salt rounds protect against rainbow table attacks

### 5. Input Validation
- Validate all user inputs
- Sanitize data before database queries
- Prevent SQL/NoSQL injection attacks

## 🎭 User Types & Roles

The platform has different user types with different permissions:

### 1. Normal User
- Can submit news
- Can vote and comment
- Basic participation rights

### 2. Expert User
- Has credibility score
- Leads debate groups
- More weight in voting

### 3. Community User
- Participates in debates
- Can join debate groups
- Collaborative fact-checking

### 4. Admin
- Manages platform
- Can moderate content
- Access to all features

## 🤖 AI Integration

### Google Gemini API
- Analyzes news for misinformation
- Generates debate topics
- Classifies comments
- Provides fact-checking verdicts

### Why AI?
- **Scale**: Can analyze thousands of articles
- **Speed**: Instant preliminary verdicts
- **Consistency**: Applies same criteria to all content
- **Support**: Helps human fact-checkers prioritize

## 📊 Database Design Principles

### 1. Embedded Documents
```javascript
// Comments embedded in News document for faster queries
News: {
  headline: "...",
  comments: [
    { userId: "...", text: "...", votes: 10 }
  ]
}
```

### 2. References
```javascript
// User referenced by ID to avoid duplication
DebateRoom: {
  createdBy: ObjectId("userId"),
  participants: [ObjectId("userId1"), ObjectId("userId2")]
}
```

### 3. Indexes
- Speed up frequent queries
- Applied to fields used in search/filter

## 🔧 Environment Configurations

### Development
```javascript
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/DBMS
```

### Production
```javascript
NODE_ENV=production
PORT=443
MONGODB_URI=mongodb+srv://production-cluster/...
```

## 📈 Scalability Considerations

### 1. Stateless Design
- No server-side sessions
- JWT tokens contain all needed info
- Easy to add more servers

### 2. Database Indexes
- Speed up common queries
- Reduce database load

### 3. Cron Jobs
- Background tasks run separately
- Don't block user requests

### 4. API Rate Limiting
- Prevent abuse
- Ensure fair usage

## 🎓 Learning Objectives

After understanding this architecture, you should know:
- ✅ Why we separate concerns with MVC
- ✅ How a request flows through the system
- ✅ What each folder/file type does
- ✅ How security is layered
- ✅ Why we use specific technologies

## 🔗 Next Steps

Now that you understand the big picture:
1. Read [Server Setup & Entry Point](./02-server-setup.md) to see how the server starts
2. Study the Models section to understand data structure
3. Explore Controllers to see business logic
4. Review Services for external integrations

---

**Key Takeaway**: The backend is organized into layers (Routes → Controllers → Services → Models) where each layer has a specific responsibility. This makes the code easier to understand, maintain, and scale.
