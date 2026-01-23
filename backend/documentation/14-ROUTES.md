# 14 - Routes: API Endpoint Definitions

## What You'll Learn
- How Express routing works
- Complete API endpoint reference
- Middleware application patterns
- Route organization best practices
- Request/Response structure for each endpoint

---

## Routing Overview

Routes define the API structure - they map HTTP requests to controller functions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROUTING ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────┘

HTTP Request                Express Router               Controller
     │                           │                            │
     │  GET /api/news            │                            │
     │ ─────────────────────────►│                            │
     │                           │                            │
     │                      ┌────┴────┐                       │
     │                      │ Route   │                       │
     │                      │ Match   │                       │
     │                      └────┬────┘                       │
     │                           │                            │
     │                      ┌────┴────┐                       │
     │                      │ Middleware │                    │
     │                      │ (auth)  │                       │
     │                      └────┬────┘                       │
     │                           │                            │
     │                           │ ──────────────────────────►│
     │                           │                            │
     │                           │        Controller Function │
     │                           │                            │
     │ ◄─────────────────────────┼────────────────────────────│
     │  Response                 │                            │
```

---

## Route Files

```
backend/routes/
├── userRoute.js           # User auth, signup, login, face auth
├── NewsRoute.js           # News CRUD, comments, voting
├── aiVerdictRoute.js      # AI verdict generation
├── commentFilterRoute.js  # Comment grouping/filtering
├── debateRoomRoute.js     # Debate rooms, groups, comments
├── trendingNewsRoute.js   # External trending news
├── profileRoute.js        # User profile management
└── accuracyTest.js        # Testing endpoints
```

---

## Route Registration (index.js)

```javascript
// backend/index.js

const express = require('express');
const app = express();

// Import Routes
const userRoutes = require('./routes/userRoute');
const newsRoutes = require('./routes/NewsRoute');
const aiVerdictRoutes = require('./routes/aiVerdictRoute');
const commentFilterRoutes = require('./routes/commentFilterRoute');
const debateRoomRoutes = require('./routes/debateRoomRoute');
const trendingNewsRoutes = require('./routes/trendingNewsRoute');
const profileRoutes = require('./routes/profileRoute');

// ═══════════════════════════════════════════════════════════════════════════
// MOUNT ROUTES
// ═══════════════════════════════════════════════════════════════════════════
app.use('/api/auth', userRoutes);           // All user auth endpoints
app.use('/api/news', newsRoutes);           // News and comments
app.use('/api', aiVerdictRoutes);           // AI verdict (uses /api/news/:id/ai-verdict)
app.use('/api/comment-filter', commentFilterRoutes);  // Comment filtering
app.use('/api/debates', debateRoomRoutes);  // Debate system
app.use('/api/trending-news', trendingNewsRoutes);    // Trending news
app.use('/api/profile', profileRoutes);     // User profiles

// WHY different prefixes:
//   • /api/auth → Authentication operations
//   • /api/news → Content operations
//   • /api/debates → Discussion feature
//   Each domain has its own prefix!
```

---

## User Routes (/api/auth)

**File:** `backend/routes/userRoute.js`

### Endpoint Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/normal/signup` | None | Register normal user |
| POST | `/normal/login` | None | Login normal user |
| POST | `/community/signup` | None | Register community user |
| POST | `/community/login` | None | Login community user |
| POST | `/expert/signup` | None | Register expert user |
| POST | `/expert/login` | None | Login expert user |
| POST | `/normal/register-face` | None | Register face for normal user |
| POST | `/normal/verify-face` | None | Verify face login |
| GET | `/normal/face-auth-status/:userId` | None | Check face auth status |
| GET | `/experts` | None | Get all approved experts |
| GET | `/experts/:id` | None | Get expert by ID |

### Code

```javascript
const express = require('express');
const router = express.Router();
const {
  normalUserSignup,
  communityUserSignup,
  expertUserSignup,
  normalUserLogin,
  communityUserLogin,
  expertUserLogin,
  // Face Authentication Functions
  normalUserRegisterFace,
  communityUserRegisterFace,
  expertUserRegisterFace,
  // ... more imports
  getAllExperts,
  getExpertById,
} = require('../controllers/UserController');

// ═══════════════════════════════════════════════════════════════════════════
// SIGNUP & LOGIN ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Normal User Routes
router.post('/normal/signup', normalUserSignup);
router.post('/normal/login', normalUserLogin);

// Community User Routes
router.post('/community/signup', communityUserSignup);
router.post('/community/login', communityUserLogin);

// Expert User Routes  
router.post('/expert/signup', expertUserSignup);
router.post('/expert/login', expertUserLogin);
// WHY separate routes: Each user type has different fields and validation

// ═══════════════════════════════════════════════════════════════════════════
// FACE AUTHENTICATION ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Normal Users
router.post('/normal/register-face', normalUserRegisterFace);
router.post('/normal/verify-face', normalUserVerifyFace);
router.get('/normal/face-auth-status/:userId', normalUserFaceAuthStatus);

// Community Users
router.post('/community/register-face', communityUserRegisterFace);
router.post('/community/verify-face', communityUserVerifyFace);
router.get('/community/face-auth-status/:userId', communityUserFaceAuthStatus);

// Expert Users
router.post('/expert/register-face', expertUserRegisterFace);
router.post('/expert/verify-face', expertUserVerifyFace);
router.get('/expert/face-auth-status/:userId', expertUserFaceAuthStatus);

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC EXPERT ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.get('/experts', getAllExperts);       // List all approved experts
router.get('/experts/:id', getExpertById);   // Get single expert details

module.exports = router;
```

### Request/Response Examples

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// POST /api/auth/community/signup
// ═══════════════════════════════════════════════════════════════════════════

// Request:
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "faceImage": "base64EncodedImageData..."  // Optional
}

// Response (201 Created):
{
  "message": "User registered successfully with face authentication!",
  "hasFaceAuth": true,
  "user": {
    "id": "65a1234567890abcdef",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "hasFaceAuth": true
  }
}
// + Set-Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...


// ═══════════════════════════════════════════════════════════════════════════
// POST /api/auth/community/login
// ═══════════════════════════════════════════════════════════════════════════

// Request (password login):
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "loginMethod": "password"
}

// Request (face login):
{
  "email": "john@example.com",
  "faceImage": "base64EncodedImageData...",
  "loginMethod": "face"
}

// Response (200 OK):
{
  "message": "Login successful via password!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "authMethod": "password",
  "user": {
    "id": "65a1234567890abcdef",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "hasFaceAuth": true
  }
}
```

---

## News Routes (/api/news)

**File:** `backend/routes/NewsRoute.js`

### Endpoint Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/upload` | Any User | Upload news article |
| GET | `/posts` | None | Get all news posts |
| GET | `/combined-feed` | None | Get combined feed |
| POST | `/vote/:postId` | Community/Expert | Vote on news |
| POST | `/community-comment/add` | Community | Add community comment |
| POST | `/expert-comment/add` | Expert | Add expert comment |
| GET | `/community-comment` | None | Get all community comments |
| GET | `/expert-comment` | None | Get all expert comments |
| POST | `/community-comment/:commentId/vote` | Expert | Expert votes on comment |
| POST | `/expert-comment/:commentId/vote` | Expert | Expert votes on comment |
| GET | `/community-comment/:commentId/votes` | None | Get comment votes |
| GET | `/expert-comment/:commentId/votes` | None | Get comment votes |

### Code

```javascript
const express = require('express');
const router = express.Router();
const { 
  uploadNews, 
  getAllPosts, 
  getCombinedFeed, 
  voteNews 
} = require('../controllers/NewsController');

const { 
  authenticateNormalUser, 
  authenticateCommunityUser, 
  authenticateExpertUser, 
  authenticateCommunityOrExpertUser, 
  authenticateAnyUser 
} = require('../middlewares/authMiddleware');

const { 
  addCommunityComment, 
  addExpertComment, 
  getAllCommunityComments, 
  getAllExpertComments,
  expertVoteOnCommunityComment,
  expertVoteOnExpertComment,
  getCommunityCommentVotes,
  getExpertCommentVotes 
} = require('../controllers/CommentsController');

// ═══════════════════════════════════════════════════════════════════════════
// NEWS CRUD
// ═══════════════════════════════════════════════════════════════════════════

router.post('/upload', authenticateAnyUser, uploadNews);
// WHY authenticateAnyUser: Any logged-in user can submit news

router.get('/posts', getAllPosts);
// WHY no auth: Public read access

router.get('/combined-feed', getCombinedFeed);
// WHY: Combines user-submitted + trending news

router.post('/vote/:postId', authenticateCommunityOrExpertUser, voteNews);
// WHY authenticateCommunityOrExpertUser: Only verified users can vote

// ═══════════════════════════════════════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════════════════════════════════════

// Add comments
router.post('/community-comment/add', authenticateCommunityUser, addCommunityComment);
router.post('/expert-comment/add', authenticateExpertUser, addExpertComment);
// WHY separate: Different user types, different comment models

// Get comments
router.get('/community-comment', getAllCommunityComments);
router.get('/expert-comment', getAllExpertComments);

// ═══════════════════════════════════════════════════════════════════════════
// EXPERT VOTING ON COMMENTS
// ═══════════════════════════════════════════════════════════════════════════

router.post('/community-comment/:commentId/vote', authenticateExpertUser, expertVoteOnCommunityComment);
router.post('/expert-comment/:commentId/vote', authenticateExpertUser, expertVoteOnExpertComment);
// WHY only experts: Expert votes carry more weight

router.get('/community-comment/:commentId/votes', getCommunityCommentVotes);
router.get('/expert-comment/:commentId/votes', getExpertCommentVotes);

module.exports = router;
```

### Request/Response Examples

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// POST /api/news/upload
// ═══════════════════════════════════════════════════════════════════════════

// Request (with auth cookie):
{
  "title": "Breaking: New Climate Study Released",
  "description": "Scientists report unprecedented findings...",
  "link": "https://example.com/article"
}

// Response (201 Created):
{
  "success": true,
  "message": "News uploaded successfully",
  "news": {
    "_id": "65a1234567890abcdef",
    "title": "Breaking: New Climate Study Released",
    "description": "Scientists report unprecedented findings...",
    "link": "https://example.com/article",
    "uploadedBy": "65a0987654321fedcba",
    "status": "Pending",
    "upvotes": 0,
    "downvotes": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// POST /api/news/community-comment/add
// ═══════════════════════════════════════════════════════════════════════════

// Request:
{
  "newsId": "65a1234567890abcdef",
  "comment": "This study was also verified by NASA researchers.",
  "stance": "in_favor",
  "evidenceLinks": ["https://nasa.gov/research/study123"]
}

// Response (201 Created):
{
  "success": true,
  "message": "Comment added successfully",
  "comment": {
    "_id": "65a5678901234567890",
    "newsId": "65a1234567890abcdef",
    "comment": "This study was also verified by NASA researchers.",
    "commenter": "65a0987654321fedcba",
    "stance": "in_favor",
    "evidenceLinks": ["https://nasa.gov/research/study123"],
    "upvoteCount": 0,
    "downvoteCount": 0
  }
}
```

---

## AI Verdict Routes (/api)

**File:** `backend/routes/aiVerdictRoute.js`

### Endpoint Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/news/:newsId/ai-verdict` | Any User | Generate AI verdict |
| GET | `/news/:newsId/ai-verdict` | None | Get existing verdict |
| PUT | `/news/:newsId/ai-verdict/regenerate` | Any User | Regenerate verdict |
| DELETE | `/news/:newsId/ai-verdict` | Any User | Delete verdict |
| GET | `/ai-verdicts/stats` | None | Get verdict statistics |

### Code

```javascript
const express = require('express');
const router = express.Router();
const AIVerdictController = require('../controllers/AIVerdictController');
const { authenticateAnyUser } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/news/:newsId/ai-verdict
 * @desc    Generate AI verdict for a news article
 * @access  Private (requires authentication)
 */
router.post('/news/:newsId/ai-verdict', 
  authenticateAnyUser, 
  AIVerdictController.generateAIVerdict
);

/**
 * @route   GET /api/news/:newsId/ai-verdict
 * @desc    Get existing AI verdict for a news article
 * @access  Public
 */
router.get('/news/:newsId/ai-verdict', 
  AIVerdictController.getAIVerdict
);

/**
 * @route   PUT /api/news/:newsId/ai-verdict/regenerate
 * @desc    Regenerate AI verdict for a news article
 * @access  Private
 */
router.put('/news/:newsId/ai-verdict/regenerate', 
  authenticateAnyUser, 
  AIVerdictController.regenerateAIVerdict
);

/**
 * @route   DELETE /api/news/:newsId/ai-verdict
 * @desc    Delete AI verdict for a news article
 * @access  Private (Admin/Expert)
 */
router.delete('/news/:newsId/ai-verdict', 
  authenticateAnyUser, 
  AIVerdictController.deleteAIVerdict
);

/**
 * @route   GET /api/ai-verdicts/stats
 * @desc    Get AI verdict statistics
 * @access  Public
 */
router.get('/ai-verdicts/stats', 
  AIVerdictController.getAIVerdictStats
);

module.exports = router;
```

### Request/Response Examples

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/news/:newsId/ai-verdict
// ═══════════════════════════════════════════════════════════════════════════

// Response (200 OK):
{
  "success": true,
  "verdict": {
    "_id": "65a9876543210fedcba",
    "newsId": "65a1234567890abcdef",
    "verdict": "Based on analysis of 47 comments, the claim appears to be MOSTLY TRUE. Multiple credible sources including Reuters and Associated Press have verified the core facts. However, some statistics cited appear to be slightly exaggerated from the original study. Key concerns raised include...",
    "score": 72,
    "confidence": 0.85,
    "topComments": {
      "inFavor": [
        {
          "commentId": "65a111...",
          "commentType": "expert",
          "commentText": "I verified this with the original research...",
          "score": 12,
          "evidenceLinks": ["https://..."]
        }
      ],
      "against": [
        {
          "commentId": "65a222...",
          "commentType": "community",
          "commentText": "The source website was registered last week...",
          "score": 8,
          "evidenceLinks": []
        }
      ]
    },
    "analysisMetadata": {
      "totalCommentsAnalyzed": 47,
      "commentsByStance": {
        "inFavor": 22,
        "against": 18,
        "general": 7
      },
      "averageScore": {
        "inFavor": 6.2,
        "against": 4.8
      }
    },
    "generatedBy": {
      "model": "gemini-3-flash-preview",
      "version": "1.0"
    },
    "createdAt": "2024-01-15T14:30:00Z"
  }
}
```

---

## Debate Room Routes (/api/debates)

**File:** `backend/routes/debateRoomRoute.js`

### Endpoint Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Any User | Create debate room |
| GET | `/` | Any User | Get all debate rooms |
| GET | `/:roomId` | Any User | Get single room |
| POST | `/:roomId/join` | Any User | Join debate room |
| POST | `/:roomId/leave` | Any User | Leave debate room |
| PUT | `/:roomId` | Any User | Update room |
| DELETE | `/:roomId` | Any User | Delete room |
| GET | `/:roomId/groups` | Any User | Get debate groups |
| POST | `/:roomId/groups` | Any User | Create debate group |
| POST | `/:roomId/comments` | Any User | Create comment |
| GET | `/:roomId/comments` | Any User | Get all comments |
| POST | `/:roomId/comments/:commentId/like` | Any User | Like comment |
| POST | `/:roomId/comments/:commentId/dislike` | Any User | Dislike comment |

### Code

```javascript
const express = require('express');
const router = express.Router();

// Import Controllers
const {
  createDebateRoom,
  getAllDebateRooms,
  getDebateRoom,
  joinDebateRoom,
  leaveDebateRoom,
  updateDebateRoom,
  deleteDebateRoom,
  regenerateGroupContent,
  relinkGroups,
  getDebugCounterStatus
} = require('../controllers/DebateRoomController');

const {
  getDebateGroups,
  createDebateGroup,
  getDebateGroup,
  regenerateDebateGroup,
  relinkDebateGroups,
  getCounterAnalysis
} = require('../controllers/DebateGroupController');

const {
  createDebateComment,
  getDebateComments,
  getCommentsByGroup,
  likeComment,
  dislikeComment
} = require('../controllers/DebateCommentController');

const authMiddleware = require('../middlewares/authMiddleware');

// ═══════════════════════════════════════════════════════════════════════════
// TEST ROUTES (NO AUTH)
// ═══════════════════════════════════════════════════════════════════════════

router.get('/test/:roomId/groups', getDebateGroups);
router.get('/test/:roomId/comments', getDebateComments);
// WHY: Testing endpoints without requiring auth

// ═══════════════════════════════════════════════════════════════════════════
// APPLY AUTH MIDDLEWARE TO ALL REMAINING ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.use(authMiddleware.authenticateAnyUser);
// WHY: All debate features require authentication
// router.use() applies middleware to all routes BELOW this line

// ═══════════════════════════════════════════════════════════════════════════
// DEBATE ROOM ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.post('/', createDebateRoom);
router.get('/', getAllDebateRooms);
router.get('/:roomId', getDebateRoom);
router.post('/:roomId/join', joinDebateRoom);
router.post('/:roomId/leave', leaveDebateRoom);
router.put('/:roomId', updateDebateRoom);
router.delete('/:roomId', deleteDebateRoom);

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED GROUP MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

router.put('/:roomId/groups/:groupId/regenerate', regenerateGroupContent);
router.post('/:roomId/groups/relink', relinkGroups);
router.get('/:roomId/debug/counter-status', getDebugCounterStatus);

// ═══════════════════════════════════════════════════════════════════════════
// DEBATE GROUP ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:roomId/groups', getDebateGroups);
router.post('/:roomId/groups', createDebateGroup);
router.get('/:roomId/groups/:groupId', getDebateGroup);
router.put('/:roomId/groups/:groupId/regenerate', regenerateDebateGroup);
router.post('/:roomId/groups/relink', relinkDebateGroups);
router.get('/:roomId/groups/:groupId/counter-analysis', getCounterAnalysis);

// ═══════════════════════════════════════════════════════════════════════════
// DEBATE COMMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.post('/:roomId/comments', createDebateComment);
router.get('/:roomId/comments', getDebateComments);
router.get('/:roomId/groups/:groupId/comments', getCommentsByGroup);
router.post('/:roomId/comments/:commentId/like', likeComment);
router.post('/:roomId/comments/:commentId/dislike', dislikeComment);

module.exports = router;
```

### Nested Resource Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NESTED RESOURCE URLS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

/debates                           → All debate rooms
/debates/:roomId                   → Single debate room
/debates/:roomId/groups            → Groups in this room
/debates/:roomId/groups/:groupId   → Single group
/debates/:roomId/comments          → Comments in this room
/debates/:roomId/comments/:commentId/like  → Like specific comment

This structure shows:
  • Resource hierarchy
  • Belongingness (comments belong to room)
  • Clear navigation

URL: /api/debates/abc123/groups/def456/comments
     ────────────────────────────────────────────
     Debates → Room abc123 → Group def456 → Comments
```

---

## Comment Filter Routes (/api/comment-filter)

**File:** `backend/routes/commentFilterRoute.js`

### Endpoint Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/grouped/:newsId` | Community/Expert | Get grouped comments |
| GET | `/filtered/:newsId` | Community/Expert | Get all filtered comments |
| GET | `/group/:groupId` | Community/Expert | Get comments by group |
| PUT | `/group/:groupId/label` | Community/Expert | Update group label |
| PUT | `/group/:groupId/description` | Community/Expert | Update group description |
| DELETE | `/group/:groupId` | Community/Expert | Delete group |
| GET | `/summary/:newsId` | Community/Expert | Get filtering summary |
| POST | `/regenerate-names/:newsId` | Community/Expert | Regenerate group names |
| GET | `/test` | None | Test integration |

### Code

```javascript
const express = require('express');
const router = express.Router();
const { authenticateCommunityOrExpertUser } = require('../middlewares/authMiddleware');
const commentFilterController = require('../controllers/CommentFilterController');

// Get all grouped comments for a news item
router.get('/grouped/:newsId', 
  authenticateCommunityOrExpertUser, 
  commentFilterController.getGroupedComments
);

// Get all filtered comments for a news item
router.get('/filtered/:newsId', 
  authenticateCommunityOrExpertUser, 
  commentFilterController.getAllFilteredComments
);

// Get comments by specific group
router.get('/group/:groupId', 
  authenticateCommunityOrExpertUser, 
  commentFilterController.getCommentsByGroup
);

// Update group label
router.put('/group/:groupId/label', 
  authenticateCommunityOrExpertUser, 
  commentFilterController.updateGroupLabel
);

// Update group description
router.put('/group/:groupId/description', 
  authenticateCommunityOrExpertUser, 
  commentFilterController.updateGroupDescription
);

// Delete a comment group
router.delete('/group/:groupId', 
  authenticateCommunityOrExpertUser, 
  commentFilterController.deleteGroup
);

// Get filtering summary for a news item
router.get('/summary/:newsId', 
  authenticateCommunityOrExpertUser, 
  commentFilterController.getFilteringSummary
);

// Test endpoint (no auth for debugging)
router.get('/test', commentFilterController.testIntegration);

// Regenerate group names
router.post('/regenerate-names/:newsId', 
  authenticateCommunityOrExpertUser, 
  commentFilterController.regenerateGroupNames
);

module.exports = router;
```

---

## Trending News Routes (/api/trending-news)

**File:** `backend/routes/trendingNewsRoute.js`

### Endpoint Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | None | Get trending news |
| GET | `/:id` | None | Get single trending news |
| GET | `/user/reposts` | Any User | Get user's reposts |
| POST | `/:id/repost` | Any User | Repost trending news |
| DELETE | `/:id/repost` | Any User | Remove repost |
| POST | `/admin/fetch` | Any User | Manual fetch trigger |
| POST | `/admin/cleanup` | Any User | Cleanup old news |
| GET | `/admin/stats` | Any User | Get statistics |

### Code

```javascript
const express = require('express');
const router = express.Router();
const trendingNewsController = require('../controllers/TrendingNewsController');
const { authenticateAnyUser } = require('../middlewares/authMiddleware');

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.get('/', trendingNewsController.getTrendingNews);
// WHY public: Everyone should see trending news

// ═══════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.get('/user/reposts', 
  authenticateAnyUser, 
  trendingNewsController.getUserReposts
);

router.post('/:id/repost', 
  authenticateAnyUser, 
  trendingNewsController.repostNews
);

router.delete('/:id/repost', 
  authenticateAnyUser, 
  trendingNewsController.removeRepost
);

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════════════════════════

router.post('/admin/fetch', 
  authenticateAnyUser, 
  trendingNewsController.fetchTrendingNews
);
// WHY: Manual trigger to fetch new trending news

router.post('/admin/cleanup', 
  authenticateAnyUser, 
  trendingNewsController.manualCleanupTrendingNews
);
// WHY: Remove old trending news entries

router.get('/admin/stats', 
  authenticateAnyUser, 
  trendingNewsController.getTrendingNewsStats
);

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE NEWS (MUST BE LAST)
// ═══════════════════════════════════════════════════════════════════════════

router.get('/:id', trendingNewsController.getTrendingNewsById);
// WHY last: Prevent /user/reposts from matching /:id pattern

module.exports = router;
```

### Route Order Matters!

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ROUTE ORDER IMPORTANCE                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Request: GET /api/trending-news/user/reposts

WRONG ORDER:
  router.get('/:id', getTrendingNewsById);       // Matches first!
  router.get('/user/reposts', getUserReposts);   // Never reached
  
  :id = "user" ← Wrong! Tries to find news with ID "user"

CORRECT ORDER:
  router.get('/user/reposts', getUserReposts);   // Specific match first
  router.get('/:id', getTrendingNewsById);       // General catch-all last
  
  "/user/reposts" matched exactly ✓

Rule: Specific routes BEFORE dynamic parameters!
```

---

## Express Routing Concepts

### HTTP Methods

```javascript
router.get(path, handler);     // Read data
router.post(path, handler);    // Create data
router.put(path, handler);     // Update (full replace)
router.patch(path, handler);   // Update (partial)
router.delete(path, handler);  // Delete data
```

### Route Parameters

```javascript
// :paramName captures value from URL
router.get('/news/:newsId', (req, res) => {
  const newsId = req.params.newsId;
  // URL: /news/abc123 → newsId = "abc123"
});

// Multiple parameters
router.get('/debates/:roomId/groups/:groupId', (req, res) => {
  const { roomId, groupId } = req.params;
  // URL: /debates/r1/groups/g2 → roomId="r1", groupId="g2"
});
```

### Query Parameters

```javascript
// ?key=value&key2=value2
router.get('/news', (req, res) => {
  const { page, limit, status } = req.query;
  // URL: /news?page=2&limit=10&status=Verified
  // page = "2", limit = "10", status = "Verified"
});
```

### Request Body

```javascript
router.post('/news', (req, res) => {
  const { title, description, link } = req.body;
  // Body: {"title": "...", "description": "...", "link": "..."}
});
```

---

## Interview Questions & Answers

### Q1: Why use separate routes for community and expert comments?

**Answer:**
1. Different models (`CommunityComment` vs `ExpertComment`)
2. Different authentication (community middleware vs expert middleware)
3. Different fields (expert has `profession`)
4. Cleaner separation of concerns

### Q2: Why put `/:id` route last?

**Answer:** Express matches routes in order. A dynamic parameter like `/:id` would match any string, including intended static routes like `/user/reposts`. Static routes must come before dynamic ones.

### Q3: What's the difference between `router.use()` and individual middleware?

**Answer:**
- `router.use(authMiddleware)` - Applies to ALL routes below this line
- `router.get('/path', authMiddleware, handler)` - Applies to this route only

Use `router.use()` when most routes need the same middleware.

### Q4: How would you add rate limiting to routes?

**Answer:**
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per window
});

// Apply to all routes
router.use(apiLimiter);

// Or specific routes
router.post('/upload', apiLimiter, uploadNews);
```

---

## Summary

- **Routes** map HTTP methods and paths to controller functions
- **Middleware** handles authentication before controllers
- **Route order** matters - specific before dynamic
- **Nested resources** show relationships in URLs
- **Parameters** come from URL (`:id`), query (`?key=value`), or body
- **RESTful patterns** use GET/POST/PUT/DELETE appropriately

---

**Next: [15-CONTROLLERS.md](./15-CONTROLLERS.md)** - Business logic implementation →
