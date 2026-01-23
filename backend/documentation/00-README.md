# 📚 VoxVeritas Backend Documentation

## Complete Guide to Understanding the Backend Architecture

Welcome to the comprehensive backend documentation for **VoxVeritas** - a crowd-sourced news and fact-checking platform. This documentation is designed for beginners who want to understand every aspect of the backend codebase.

**Total Documents:** 17 files (including this README)
**Documentation Status:** ✅ COMPLETE

---

## 🗂️ Documentation Structure

```
documentation/
│
├── 00-README.md                         ← You are here (Navigation Hub)
│
├── PART 1: FOUNDATION
│   ├── 01-PROJECT-OVERVIEW.md           ← Tech stack, MVC architecture, terminology
│   └── 02-SERVER-SETUP.md               ← Express server, middleware, CORS, body-parser
│
├── PART 2: DATABASE & MODELS
│   ├── 03-MONGODB-MONGOOSE.md           ← MongoDB basics, Mongoose ODM, schemas, indexes
│   ├── 04-USER-MODELS.md                ← NormalUser, CommunityUser, ExpertUser, Admin
│   ├── 05-CONTENT-MODELS.md             ← News, Comments, TrendingNews with voting
│   ├── 06-DEBATE-MODELS.md              ← DebateRoom, DebateGroup, DebateComment, refPath
│   └── 07-AI-VERDICT-MODEL.md           ← AIVerdict, CommentFilter, CommentGroup schemas
│
├── PART 3: AI SERVICES & LLM INTEGRATION
│   ├── 08-LLM-SERVICE.md                ← Gemini function calling, structured outputs
│   ├── 09-AI-VERDICT-SERVICE.md         ← Verdict generation, comment selection
│   ├── 10-GEMINI-KEY-ROTATION.md        ← API key rotation singleton, request tracking
│   ├── 11-COMMENT-FILTERING-SERVICE.md  ← AI-powered comment grouping & classification
│   └── 12-OFF-TOPIC-DETECTION-SERVICE.md← Debate relevance checking, static class pattern
│
├── PART 4: AUTHENTICATION & SECURITY
│   └── 13-AUTHENTICATION.md             ← JWT, bcrypt, multi-user middleware, Face Auth
│
├── PART 5: API LAYER
│   ├── 14-ROUTES.md                     ← All 8 route files, endpoints, examples
│   └── 15-CONTROLLERS.md                ← Business logic, service delegation, validation
│
└── PART 6: ERROR HANDLING
    └── 16-ERROR-HANDLING.md             ← Error types, try/catch patterns, best practices
```

---

## 🚀 Quick Start Guide

### For Complete Beginners
1. Start with **[01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md)** to understand what we're building
2. Read **[02-SERVER-SETUP.md](./02-SERVER-SETUP.md)** to understand how the server starts
3. Move to **[03-MONGODB-MONGOOSE.md](./03-MONGODB-MONGOOSE.md)** for database basics
4. Then follow the numbered files in order

### For Those Familiar with Node.js
- Jump to **[08-LLM-SERVICE.md](./08-LLM-SERVICE.md)** for AI integration
- Check **[09-AI-VERDICT-SERVICE.md](./09-AI-VERDICT-SERVICE.md)** for fact-checking logic

### For Interview Preparation
- Each file ends with **Interview Questions & Answers**
- Focus on files 08-12 for AI/LLM topics
- Focus on file 13 for authentication topics

---

## 📂 Complete Document Index

### Part 1: Foundation
| # | File | Description |
|---|------|-------------|
| 01 | [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md) | Tech stack, MVC architecture, terminology glossary |
| 02 | [02-SERVER-SETUP.md](./02-SERVER-SETUP.md) | Express.js server, middleware stack, CORS configuration |

### Part 2: Database & Models
| # | File | Description |
|---|------|-------------|
| 03 | [03-MONGODB-MONGOOSE.md](./03-MONGODB-MONGOOSE.md) | MongoDB fundamentals, Mongoose ODM, schemas, indexes |
| 04 | [04-USER-MODELS.md](./04-USER-MODELS.md) | All 4 user types: Normal, Community, Expert, Admin |
| 05 | [05-CONTENT-MODELS.md](./05-CONTENT-MODELS.md) | News, Comments, TrendingNews with voting logic |
| 06 | [06-DEBATE-MODELS.md](./06-DEBATE-MODELS.md) | DebateRoom, DebateGroup, DebateComment with refPath |
| 07 | [07-AI-VERDICT-MODEL.md](./07-AI-VERDICT-MODEL.md) | AIVerdict, CommentFilter, CommentGroup schemas |

### Part 3: AI Services & LLM
| # | File | Description |
|---|------|-------------|
| 08 | [08-LLM-SERVICE.md](./08-LLM-SERVICE.md) | Gemini function calling, structured outputs, class architecture |
| 09 | [09-AI-VERDICT-SERVICE.md](./09-AI-VERDICT-SERVICE.md) | Verdict generation, top comment selection, confidence scoring |
| 10 | [10-GEMINI-KEY-ROTATION.md](./10-GEMINI-KEY-ROTATION.md) | API key rotation singleton, request tracking, modulo logic |
| 11 | [11-COMMENT-FILTERING-SERVICE.md](./11-COMMENT-FILTERING-SERVICE.md) | AI-powered comment grouping and classification |
| 12 | [12-OFF-TOPIC-DETECTION-SERVICE.md](./12-OFF-TOPIC-DETECTION-SERVICE.md) | Debate relevance checking, static class pattern |

### Part 4: Authentication & Security
| # | File | Description |
|---|------|-------------|
| 13 | [13-AUTHENTICATION.md](./13-AUTHENTICATION.md) | JWT tokens, bcrypt hashing, multi-user middleware, Face Auth |

### Part 5: API Layer
| # | File | Description |
|---|------|-------------|
| 14 | [14-ROUTES.md](./14-ROUTES.md) | All 8 route files, endpoints, request/response examples |
| 15 | [15-CONTROLLERS.md](./15-CONTROLLERS.md) | Business logic, service delegation, validation patterns |

### Part 6: Error Handling
| # | File | Description |
|---|------|-------------|
| 16 | [16-ERROR-HANDLING.md](./16-ERROR-HANDLING.md) | Error types, try/catch patterns, graceful degradation |

---

## � Topic Quick Reference

Looking for something specific? Here's where to find it:

### Database Topics
| Topic | Document |
|-------|----------|
| Mongoose schemas | [03-MONGODB-MONGOOSE](./03-MONGODB-MONGOOSE.md) |
| Schema indexes | [03-MONGODB-MONGOOSE](./03-MONGODB-MONGOOSE.md) |
| ObjectId references | [03-MONGODB-MONGOOSE](./03-MONGODB-MONGOOSE.md), [05-CONTENT-MODELS](./05-CONTENT-MODELS.md) |
| refPath (dynamic refs) | [06-DEBATE-MODELS](./06-DEBATE-MODELS.md) |
| Timestamps | [03-MONGODB-MONGOOSE](./03-MONGODB-MONGOOSE.md) |

### User & Auth Topics
| Topic | Document |
|-------|----------|
| User types | [04-USER-MODELS](./04-USER-MODELS.md) |
| JWT tokens | [13-AUTHENTICATION](./13-AUTHENTICATION.md) |
| Password hashing (bcrypt) | [13-AUTHENTICATION](./13-AUTHENTICATION.md) |
| Face recognition | [13-AUTHENTICATION](./13-AUTHENTICATION.md) |
| Auth middleware | [13-AUTHENTICATION](./13-AUTHENTICATION.md) |
| Role-based access | [13-AUTHENTICATION](./13-AUTHENTICATION.md) |

### AI & LLM Topics
| Topic | Document |
|-------|----------|
| Gemini API | [08-LLM-SERVICE](./08-LLM-SERVICE.md) |
| Function calling | [08-LLM-SERVICE](./08-LLM-SERVICE.md) |
| Structured outputs | [08-LLM-SERVICE](./08-LLM-SERVICE.md) |
| API key rotation | [10-GEMINI-KEY-ROTATION](./10-GEMINI-KEY-ROTATION.md) |
| Comment classification | [11-COMMENT-FILTERING-SERVICE](./11-COMMENT-FILTERING-SERVICE.md) |
| Verdict generation | [09-AI-VERDICT-SERVICE](./09-AI-VERDICT-SERVICE.md) |
| Off-topic detection | [12-OFF-TOPIC-DETECTION-SERVICE](./12-OFF-TOPIC-DETECTION-SERVICE.md) |

### API & Controller Topics
| Topic | Document |
|-------|----------|
| Route definitions | [14-ROUTES](./14-ROUTES.md) |
| Controller patterns | [15-CONTROLLERS](./15-CONTROLLERS.md) |
| File uploads (multer) | [15-CONTROLLERS](./15-CONTROLLERS.md) |
| Service delegation | [15-CONTROLLERS](./15-CONTROLLERS.md) |
| Error handling | [16-ERROR-HANDLING](./16-ERROR-HANDLING.md) |

---

## � Backend Folder Structure

```
backend/
├── index.js              # Main server entry point
├── startup.js            # Alternative startup script
├── package.json          # Dependencies and scripts
│
├── controllers/          # Business logic handlers
│   ├── UserController.js
│   ├── NewsController.js
│   ├── CommentsController.js
│   ├── DebateRoomController.js
│   ├── DebateGroupController.js
│   ├── DebateCommentController.js
│   ├── AIVerdictController.js
│   ├── CommentFilterController.js
│   ├── TrendingNewsController.js
│   └── ProfileController.js
│
├── models/               # MongoDB schemas
│   ├── NormalUser.js
│   ├── CommunityUser.js
│   ├── ExpertUser.js
│   ├── Admin.js
│   ├── News.js
│   ├── Comments.js
│   ├── TrendingNews.js
│   ├── DebateRoom.js
│   ├── DebateGroup.js
│   ├── DebateComment.js
│   ├── AIVerdict.js
│   ├── CommentFilter.js
│   └── AccuracyTest.js
│
├── routes/               # API endpoint definitions
│   ├── userRoute.js
│   ├── NewsRoute.js
│   ├── debateRoomRoute.js
│   ├── trendingNewsRoute.js
│   ├── profileRoute.js
│   ├── aiVerdictRoute.js
│   ├── commentFilterRoute.js
│   └── accuracyTest.js
│
├── services/             # Business services & AI
│   ├── llmService.js             # Core AI/LLM integration
│   ├── geminiKeyRotation.js      # API key management
│   ├── aiVerdictService.js       # Fact-checking service
│   ├── commentFilteringService.js
│   ├── offTopicDetectionService.js
│   ├── verificationService.js
│   ├── httpFaceAuthService.js    # Face recognition integration
│   ├── trendingNewsScheduler.js  # Cron scheduler
│   └── trendingNewsCleanupService.js
│
├── middlewares/          # Request middleware
│   └── authMiddleware.js
│
├── uploads/              # Uploaded files storage
│   └── screenshots/
│
└── migration/            # Database migration scripts
```

---

## 🔧 Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Framework** | Express.js | Web server framework |
| **Database** | MongoDB | NoSQL document database |
| **ODM** | Mongoose | MongoDB object modeling |
| **Authentication** | JWT + bcrypt | Token-based auth + password hashing |
| **AI/ML** | Google Gemini API | LLM for fact-checking |
| **Face Auth** | InsightFace (Python) | Biometric authentication |
| **File Upload** | Multer | Handling file uploads |
| **Scheduling** | node-cron | Background job scheduling |
| **Security** | CORS, Helmet | API security |

---

## 🎯 Key Concepts Covered

### Core Backend Concepts
- ✅ RESTful API design
- ✅ MVC architecture pattern
- ✅ MongoDB schema design with Mongoose
- ✅ JWT authentication flow
- ✅ Middleware chain pattern
- ✅ Error handling strategies
- ✅ File upload handling

### AI/ML Integration
- ✅ Google Gemini API integration
- ✅ LLM Function Calling with structured outputs
- ✅ API key rotation for rate limiting
- ✅ Prompt engineering for fact-checking
- ✅ AI-powered content moderation
- ✅ Comment classification and grouping

### Advanced Patterns
- ✅ Service layer architecture
- ✅ Background job scheduling
- ✅ Multi-user type authentication
- ✅ Dynamic model references (refPath)
- ✅ Microservice communication (Face Auth)

---

## 📖 How to Read This Documentation

Each documentation file follows a consistent structure:

```
┌─────────────────────────────────────────┐
│ 1. What You'll Learn - Overview         │
│ 2. Why? - Design decisions explained    │
│ 3. What? - Detailed explanations        │
│ 4. How? - Annotated code examples       │
│ 5. Visual Diagrams - ASCII flowcharts   │
│ 6. Interview Q&A - Common questions     │
│ 7. Next Links - Related documents       │
└─────────────────────────────────────────┘
```

### Reading Tips
- 📝 All code blocks have inline comments explaining each line
- 🎯 Visual ASCII diagrams show data flow and architecture
- ❓ Interview Q&A sections help reinforce understanding
- 🔗 "Next" links at document ends guide to related topics

---

## 🏃 Running the Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file with required variables
cp .env.example .env

# Start development server
npm run dev

# Or start production server
npm start
```

### Required Environment Variables
```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/voxveritas

# Authentication
JWT_SECRET=your-secret-key

# AI Service (Gemini) - 3 keys for rotation
GEMINI_API_KEY_1=your-key-1
GEMINI_API_KEY_2=your-key-2
GEMINI_API_KEY_3=your-key-3

# Face Auth Service
FACE_AUTH_URL=http://localhost:5000
```

---

## � System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                   │
│                         (React Application)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP/REST API
┌─────────────────────────────────────────────────────────────────────────┐
│                           EXPRESS SERVER                                │
│                            (index.js)                                   │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Routes    │→ │ Middleware  │→ │ Controllers │→ │  Services   │   │
│  │  (14-doc)   │  │  (13-doc)   │  │  (15-doc)   │  │ (08-12 doc) │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
           │                    │                           │
           ▼                    ▼                           ▼
    ┌────────────┐       ┌────────────┐             ┌─────────────┐
    │  MongoDB   │       │  Python    │             │  Google     │
    │  Database  │       │  Face Auth │             │  Gemini AI  │
    │ (03-07 doc)│       │  (13-doc)  │             │ (08-10 doc) │
    └────────────┘       └────────────┘             └─────────────┘
```

---

## 🎯 Learning Paths

### Path 1: Full Backend (Recommended)
```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16
```

### Path 2: AI/LLM Focus
```
01 → 08 → 09 → 10 → 11 → 12
```

### Path 3: Database Focus
```
01 → 03 → 04 → 05 → 06 → 07
```

### Path 4: Security Focus
```
01 → 04 → 13
```

### Path 5: API Development
```
01 → 02 → 14 → 15 → 16
```

---

## 💡 Tips for Learning

1. **Run the code** - Don't just read, run each example
2. **Use debugger** - Add console.logs to understand flow
3. **Check MongoDB** - Use MongoDB Compass to see data
4. **Test APIs** - Use Postman to test endpoints
5. **Break things** - Modify code to see what happens

---

> 📚 **Note**: This documentation was created for beginner-level developers. Every concept is explained with WHY, WHAT, and HOW.

**Let's begin! Start with [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md)** →
