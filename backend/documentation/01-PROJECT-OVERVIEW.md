# 01 - Project Overview & Architecture

## What You'll Learn
- What is VoxVeritas and what problem it solves
- Complete technology stack explanation
- High-level architecture understanding
- How different components work together
- Key terminology used throughout the project

---

## What is VoxVeritas?

**VoxVeritas** (Latin for "Voice of Truth") is a **crowd-sourced news and fact-checking platform** that:

1. **Allows users to submit news articles** for verification
2. **Enables community discussion** with voting and evidence sharing
3. **Uses AI (Google Gemini)** to analyze comments and generate credibility verdicts
4. **Supports expert verification** with credentialed users having more weight
5. **Provides debate rooms** for structured discussions on topics
6. **Offers biometric authentication** through face recognition

### The Problem We're Solving

```
❌ Traditional News:
   - Misinformation spreads fast
   - Hard to verify sources
   - Echo chambers and bias
   - No structured fact-checking

✅ VoxVeritas Solution:
   - Crowd-sourced verification
   - Evidence-based comments
   - Expert opinions weighted higher
   - AI-assisted credibility scoring
   - Transparent voting system
```

---

## Technology Stack Deep Dive

### Why We Chose Each Technology

#### 1. Node.js (Runtime)

```javascript
// Node.js allows us to write server-side JavaScript
// This means frontend and backend use the same language

// Benefits:
// - Single language for full stack
// - Non-blocking I/O (handles many requests efficiently)
// - Huge npm ecosystem (thousands of packages)
// - Great for real-time applications
```

**What is Node.js?**
- JavaScript runtime built on Chrome's V8 engine
- Lets you run JavaScript outside the browser
- Uses event-driven, non-blocking I/O model

#### 2. Express.js (Web Framework)

```javascript
// Express.js is a minimal, flexible web framework for Node.js
// It simplifies creating web servers and APIs

const express = require('express');
const app = express();

// Without Express (pure Node.js) - Complex:
const http = require('http');
http.createServer((req, res) => {
  if (req.url === '/api/users' && req.method === 'GET') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({users: []}));
  }
}).listen(3000);

// With Express - Simple:
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});
```

**Why Express?**
- Minimal and unopinionated (you make the decisions)
- Middleware support (functions that run before route handlers)
- Easy routing (mapping URLs to functions)
- Large community and ecosystem

#### 3. MongoDB (Database)

```javascript
// MongoDB is a NoSQL document database
// Data is stored as JSON-like documents, not tables

// SQL Database (Traditional):
// Table: users
// | id | name    | email          |
// | 1  | John    | john@email.com |
// | 2  | Jane    | jane@email.com |

// MongoDB (NoSQL):
// Collection: users
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "John",
  "email": "john@email.com",
  "profile": {
    "bio": "Developer",
    "interests": ["tech", "news"]
  }
}
// Notice: Nested objects are natural in MongoDB!
```

**Why MongoDB?**
- Flexible schema (can add fields without migrations)
- JSON-like documents (natural for JavaScript)
- Easy horizontal scaling
- Great for hierarchical data (comments, nested objects)

#### 4. Mongoose (ODM - Object Document Mapper)

```javascript
// Mongoose sits between Express and MongoDB
// It provides schema validation and helpful methods

// Without Mongoose - raw MongoDB:
const { MongoClient } = require('mongodb');
const client = new MongoClient(uri);
await client.connect();
const db = client.db('voxveritas');
const users = await db.collection('users').find({}).toArray();

// With Mongoose - cleaner and safer:
const mongoose = require('mongoose');
const User = require('./models/User');
const users = await User.find({});  // Much simpler!
```

**Why Mongoose?**
- Schema validation (ensure data has correct structure)
- Type casting (convert strings to numbers automatically)
- Middleware hooks (run functions before/after operations)
- Population (like SQL JOINs for related data)

#### 5. JWT (JSON Web Tokens) - Authentication

```javascript
// JWT is a token-based authentication system
// When user logs in, server gives them a token
// User sends this token with every request

// Token Structure:
// header.payload.signature

// Example Token:
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

// Decoded:
// Header: { "alg": "HS256", "typ": "JWT" }
// Payload: { "userId": "1234567890", "name": "John Doe", "iat": 1516239022 }
// Signature: Verifies the token wasn't tampered with
```

**Why JWT?**
- Stateless (server doesn't need to store session)
- Scalable (works across multiple servers)
- Contains user info (no database lookup needed)
- Secure (signed and optionally encrypted)

#### 6. bcrypt (Password Hashing)

```javascript
// NEVER store passwords as plain text!
// bcrypt hashes passwords so they can't be reversed

const bcrypt = require('bcrypt');

// Hashing a password:
const password = "MySecurePassword123";
const saltRounds = 10;  // How many times to scramble
const hash = await bcrypt.hash(password, saltRounds);
// Result: "$2b$10$XpE.../8TgG..." (irreversible!)

// Comparing passwords:
const isMatch = await bcrypt.compare("MySecurePassword123", hash);
// Returns: true (without ever knowing the original password)
```

**Why bcrypt?**
- One-way hashing (can't be decrypted)
- Salting (adds random data to prevent rainbow table attacks)
- Slow by design (makes brute force attacks impractical)
- Industry standard for password storage

#### 7. Google Gemini (AI/LLM)

```javascript
// Gemini is Google's large language model (LLM)
// We use it for:
// 1. Classifying comments into groups
// 2. Generating fact-checking verdicts
// 3. Detecting off-topic comments

const { GoogleGenAI } = require('@google/genai');

const genAI = new GoogleGenAI({ apiKey: 'YOUR_API_KEY' });

// Example: Analyze a comment
const response = await genAI.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: [{ 
    role: 'user', 
    parts: [{ text: 'Is this news article credible?' }] 
  }]
});
```

**Why Gemini?**
- Function calling capability (structured output)
- Fast inference speed
- Cost-effective for our use case
- Good at classification tasks

---

## Architecture Patterns

### MVC Pattern (Model-View-Controller)

VoxVeritas follows the MVC pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                      MVC Architecture                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   REQUEST → Routes → Controllers → Services → Models        │
│                           ↓            ↓          ↓         │
│                        Logic      Business    Database      │
│                                    Rules                     │
│                                                              │
│   RESPONSE ← Controllers ← Services ← Models                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **Model**: Database schemas (what data looks like)
- **View**: Frontend (not in our backend)
- **Controller**: Request handlers (what to do with requests)
- **Routes**: URL mappings (which URL calls which controller)
- **Services**: Business logic (reusable functions)

### Request Flow Example

```
User clicks "Submit News" button
          ↓
Frontend sends POST request to /news/upload
          ↓
┌─────────────────────────────────────────────┐
│            Express Router                    │
│   router.post('/upload', uploadNews)        │
└─────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────┐
│         Auth Middleware                      │
│   Check if user has valid JWT token         │
│   If not → 401 Unauthorized                 │
│   If yes → attach user to req.user          │
└─────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────┐
│         NewsController.uploadNews           │
│   1. Validate input data                    │
│   2. Process file uploads                   │
│   3. Create News document                   │
│   4. Save to MongoDB                        │
│   5. Return success response                │
└─────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────┐
│         MongoDB                             │
│   Insert new document into 'news' collection│
└─────────────────────────────────────────────┘
          ↓
Response: { message: "News uploaded successfully", news: {...} }
```

---

## Core Entities

### User Types

VoxVeritas has 4 types of users:

```
┌─────────────────────────────────────────────────────────────┐
│                     User Types                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. NormalUser                                               │
│     └── Basic user, can view content and participate in     │
│         debates, cannot submit news                          │
│                                                              │
│  2. CommunityUser                                            │
│     └── Can submit news, comment, vote on news              │
│         Primary contributor to the platform                  │
│                                                              │
│  3. ExpertUser                                               │
│     └── Verified expert in a field                          │
│         Votes and comments carry more weight                 │
│         Can vote on other users' comments                    │
│                                                              │
│  4. Admin                                                    │
│     └── Platform administrator                              │
│         Can manage users, approve experts                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Content Types

```
┌─────────────────────────────────────────────────────────────┐
│                    Content Types                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. News                                                     │
│     └── User-submitted news articles for verification       │
│         Has: title, description, link, screenshots          │
│         Status: Pending → Verified OR Fake                   │
│                                                              │
│  2. TrendingNews                                             │
│     └── Auto-scraped from news APIs                         │
│         Updated every 10 minutes by scheduler               │
│                                                              │
│  3. Comments (Community & Expert)                            │
│     └── Reactions to news articles                          │
│         Stance: in_favor, against, general                  │
│         Can include evidence links                           │
│                                                              │
│  4. DebateRoom                                               │
│     └── Topic-based discussion rooms                        │
│         Contains groups of related comments                  │
│                                                              │
│  5. AIVerdict                                                │
│     └── AI-generated credibility analysis                   │
│         Score (0-100), confidence level, key factors        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Terminology

| Term | Definition |
|------|------------|
| **ODM** | Object Document Mapper - maps code objects to database documents |
| **Schema** | Blueprint defining structure of documents |
| **Middleware** | Functions that run between request and response |
| **Controller** | Functions that handle specific routes |
| **Service** | Reusable business logic functions |
| **JWT** | JSON Web Token - secure way to transmit user identity |
| **LLM** | Large Language Model - AI that understands/generates text |
| **Function Calling** | LLM feature to output structured JSON |
| **Embedding** | Numerical representation of text/images |
| **CORS** | Cross-Origin Resource Sharing - allows different domains to communicate |
| **Cron Job** | Scheduled task that runs periodically |
| **Populate** | Mongoose method to fill in referenced documents (like JOIN) |

---

## Interview Questions & Answers

### Q1: What is VoxVeritas and what problem does it solve?
**Answer:** VoxVeritas is a crowd-sourced news fact-checking platform that combats misinformation. It allows community members to submit news articles, which are then verified through community voting, expert analysis, and AI-powered credibility scoring. The platform addresses the challenge of fake news by providing transparent, evidence-based verification.

### Q2: Why did you choose MongoDB over SQL databases?
**Answer:** MongoDB was chosen because:
1. **Flexible schema** - News articles, comments, and user data have varying structures
2. **Document model** - Nested data (like evidence links in comments) is natural in JSON
3. **Horizontal scaling** - Easy to scale as the platform grows
4. **JavaScript compatibility** - Works seamlessly with Node.js using JSON

### Q3: Explain the MVC pattern in your application.
**Answer:** In VoxVeritas:
- **Models** (`/models/`): Mongoose schemas defining data structure (User, News, Comment)
- **Controllers** (`/controllers/`): Request handlers containing business logic
- **Routes** (`/routes/`): URL mappings that direct requests to controllers
- **Services** (`/services/`): Reusable business logic like AI integration and verification
- Views are handled by the separate React frontend

### Q4: Why use JWT instead of session-based authentication?
**Answer:**
1. **Stateless** - Server doesn't need to store session data
2. **Scalable** - Works across multiple server instances
3. **Mobile-friendly** - Tokens work well with mobile apps
4. **Self-contained** - Contains user info, reducing database lookups
5. **Cross-domain** - Works with CORS for frontend/backend separation

### Q5: How does the platform handle different user types?
**Answer:** VoxVeritas uses separate Mongoose models for each user type (NormalUser, CommunityUser, ExpertUser, Admin) with specific privileges. Dynamic references (`refPath`) allow documents like DebateRoom to reference any user type. The auth middleware identifies user type from JWT and loads the appropriate model.

---

## Summary

VoxVeritas is built on a modern Node.js stack:
- **Express.js** handles HTTP routing
- **MongoDB + Mongoose** manages data
- **JWT + bcrypt** secures authentication
- **Google Gemini** provides AI fact-checking
- **MVC pattern** organizes the codebase

The platform serves as a real-world example of:
- Multi-user authentication systems
- AI/LLM integration in production
- Background job scheduling
- Microservice architecture (Face Auth)

---

**Next: [02-SERVER-SETUP.md](./02-SERVER-SETUP.md)** - Understanding the Express server configuration →
