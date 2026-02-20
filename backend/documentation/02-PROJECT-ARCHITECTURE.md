# 02 — Project Architecture & Structure

## Why This File Exists
Understanding where each file lives and how the backend is organised helps you navigate the codebase quickly. This document maps every folder and file to its purpose.

---

## Folder Structure

```
backend/
├── index.js                    ← Server entry point — starts Express, connects MongoDB
├── startup.js                  ← Initial data seeding script
├── package.json                ← Dependencies and scripts
├── vercel.json                 ← Deployment config for Vercel
│
├── controllers/                ← Request handlers (business logic)
│   ├── NewsController.js           (402 lines)  — upload, feed, voting, delete
│   ├── UserController.js           (588 lines)  — signup, login, face auth, admin
│   ├── CommentsController.js       (487 lines)  — add/get/delete comments, expert voting
│   ├── CommentFilterController.js  (232 lines)  — grouped comments, regeneration
│   ├── AIVerdictController.js      (253 lines)  — generate/get/regenerate verdict
│   ├── TrendingNewsController.js   (408 lines)  — web scraping, reposting, cleanup
│   ├── DebateRoomController.js     (612 lines)  — room CRUD, join/leave, cascade delete
│   ├── DebateGroupController.js    (320 lines)  — group CRUD, relinking, counter analysis
│   ├── DebateCommentController.js  (957 lines)  — full pipeline: off-topic → group → counter
│   └── ProfileController.js        (282 lines)  — get/update profile, change password
│
├── models/                     ← Mongoose schemas (database structure)
│   ├── News.js                     — news articles with votes
│   ├── Comments.js                 — CommunityComment + ExpertComment (two schemas)
│   ├── NormalUser.js               — basic user
│   ├── CommunityUser.js            — extended user with bio, social links
│   ├── ExpertUser.js               — professional user with credentials
│   ├── Admin.js                    — admin user
│   ├── AIVerdict.js                — AI credibility verdicts
│   ├── CommentFilter.js            — CommentFilter + CommentGroup (two models)
│   ├── DebateRoom.js               — debate rooms with participants
│   ├── DebateGroup.js              — debate groups with ideal counters + counter links
│   ├── DebateComment.js            — debate comments with off-topic tracking
│   ├── TrendingNews.js             — scraped trending news articles
│   └── AccuracyTest.js             — accuracy test results
│
├── services/                   ← Business logic + external API integrations
│   ├── vectorService.js            (800+ lines) — Pinecone + embeddings (central AI hub)
│   ├── llmService.js               (543 lines)  — Gemini LLM calls (classification, generation)
│   ├── commentFilteringService.js  (473 lines)  — comment → group assignment pipeline
│   ├── aiVerdictService.js         (476 lines)  — AI verdict generation
│   ├── geminiKeyRotation.js        (168 lines)  — API key rotation (3 keys, rotate per 5)
│   ├── verificationService.js      (78 lines)   — auto news status from votes
│   ├── offTopicDetectionService.js (92 lines)    — vector-first, LLM fallback off-topic check
│   ├── trendingNewsScheduler.js    (90 lines)    — cron job for scraping every 10 mins
│   ├── trendingNewsCleanupService  (152 lines)   — keep only 50 trending articles
│   ├── newsCleanupService.js       (109 lines)   — keep only 40 news articles (4 pages)
│   ├── accuracyTestService.js      (404 lines)   — statistical accuracy calculations
│   ├── httpFaceAuthService.js      (286 lines)   — HTTP calls to Flask face auth
│   ├── faceAuthService.js          (309 lines)   — Python subprocess face auth
│   └── simpleFaceAuthService.js    (178 lines)   — simplified face auth bridge
│
├── routes/                     ← URL → controller mapping
│   ├── userRoute.js                (62 lines)   — /users/*
│   ├── NewsRoute.js                (44 lines)   — /news/*
│   ├── commentFilterRoute.js       (33 lines)   — /comment-filter/*
│   ├── debateRoomRoute.js          (79 lines)   — /debate-rooms/*
│   ├── trendingNewsRoute.js        (22 lines)   — /trending-news/*
│   ├── profileRoute.js             (15 lines)   — /profile/*
│   ├── aiVerdictRoute.js           (43 lines)   — /api/news/:newsId/ai-verdict
│   └── accuracyTest.js             (188 lines)  — /api/accuracy/* (has inline handlers)
│
├── middlewares/
│   └── authMiddleware.js           (180 lines)  — 6 authentication middleware functions
│
└── uploads/                    ← User-uploaded files (screenshots, profiles)
    ├── screenshots/
    └── profiles/
```

---

## Data Flow Pattern

Every feature follows the same layered architecture:

```
Route  ──defines URL──▶  Middleware  ──checks auth──▶  Controller  ──calls──▶  Service  ──talks to──▶  Database
```

### Concrete Example: Adding a community comment

```
POST /news/community-comment/add
        │
        ▼
    NewsRoute.js
    router.post('/community-comment/add', authenticateCommunityUser, addCommunityComment)
        │                                        │
        │                                        ▼
        │                               authMiddleware.js
        │                               Verifies JWT token, sets req.user
        │                                        │
        ▼                                        ▼
    CommentsController.js → addCommunityComment()
        │
        ├──▶ Saves comment to MongoDB (CommunityComment model)
        │
        └──▶ Calls commentFilteringService.processComment()
                │
                ├──▶ vectorService.matchNewsComment()     → Pinecone query
                ├──▶ llmService.classifyAndGenerateContent() → Gemini API (if no vector match)
                └──▶ vectorService.storeNewsGroup()       → Pinecone upsert
```

---

## Three-Layer Separation

### 1. Controllers — "What to do"
Controllers handle HTTP requests. They extract data from `req`, call services, and send `res`.
```javascript
// Controller knows about req/res but NOT about Pinecone or Gemini directly
const addCommunityComment = async (req, res) => {
  const { newsId, comment, stance } = req.body;
  // ... calls services, sends response
};
```

### 2. Services — "How to do it"
Services contain the actual business logic. They talk to databases and external APIs.
```javascript
// Service knows about Pinecone and Gemini but NOT about req/res
class VectorService {
  async matchNewsComment(text, newsId) {
    const embedding = await this.generateEmbedding(text);
    return await this.queryVector(embedding, 'news-groups', { newsId });
  }
}
```

### 3. Models — "What the data looks like"
Models define the structure of data stored in MongoDB.
```javascript
// Model defines shape but has no business logic
const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Verified', 'Fake'], default: 'Pending' },
});
```

---

## Server Startup Flow

When you run `node index.js`, here's what happens in order:

```
1. Load environment variables    (require('dotenv').config())
2. Create Express app            (const app = express())
3. Configure middleware           (CORS, JSON parsing, static files)
4. Connect to MongoDB            (mongoose.connect(MONGO_URI))
5. Mount routes                  (app.use('/news', newsRoute))
6. Start cron scheduler          (trendingNewsScheduler.start())
7. Listen on port 3000           (app.listen(PORT))
```

The trending news scheduler (`trendingNewsScheduler.start()`) immediately does a first scrape of NDTV, then repeats every 10 minutes.

---

## Dependencies (package.json)

| Package | Why We Use It |
|---------|--------------|
| `express` | Web server framework |
| `mongoose` | MongoDB object modeling |
| `@google/genai` | Google Gemini AI SDK (embeddings + LLM) |
| `@pinecone-database/pinecone` | Vector database client |
| `axios` | HTTP requests (for web scraping + face auth) |
| `cheerio` | HTML parsing (web scraping NDTV) |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT token generation/verification |
| `multer` | File upload handling |
| `cron` | Scheduled tasks (trending news fetching) |
| `cors` | Cross-origin request handling |
| `dotenv` | Environment variable loading |
| `csv-parser` | Dataset CSV parsing |
| `express-validator` | Input validation |

---

## Cross-File Dependencies Map

```
                        ┌── vectorService.js ─── Pinecone + Gemini Embeddings
                        │
llmService.js ──────────┤── geminiKeyRotation.js ─── API Key Management
(Gemini LLM)            │
                        └── Used by:
                            ├── commentFilteringService.js
                            ├── aiVerdictService.js
                            ├── DebateCommentController.js
                            └── offTopicDetectionService.js

vectorService.js ───────── Used by:
                            ├── commentFilteringService.js
                            ├── DebateCommentController.js
                            ├── DebateGroupController.js
                            ├── DebateRoomController.js (cascade delete)
                            ├── CommentsController.js (delete cleanup)
                            └── offTopicDetectionService.js
```

---

## Next Steps
Now that you see the big picture, move on to [03 — MongoDB & Mongoose Deep Dive](03-MONGODB-MONGOOSE.md) to understand how data is stored and queried.
