# 20 — Complete API Reference

## Overview

This document catalogs every HTTP endpoint exposed by the VoxVeritas backend. All routes are registered in `index.js` and organized into 8 route files mounted at their respective base paths.

**Route mounting (from `index.js`):**

```javascript
app.use('/users',          userRoutes);
app.use('/news',           NewsRoutes);
app.use('/comment-filter', commentFilterRoutes);
app.use('/debate-rooms',   debateRoomRoutes);
app.use('/trending-news',  trendingNewsRoutes);
app.use('/profile',        profileRoutes);
app.use('/api',            aiVerdictRoutes);
app.use('/api/accuracy',   accuracyTestRoutes);
```

---

## Authentication Legend

| Symbol | Meaning |
|--------|---------|
| 🔓 | Public — no authentication required |
| 🔑 | `authenticateAnyUser` — any logged-in user type |
| 👥 | `authenticateCommunityUser` — community users only |
| 🎓 | `authenticateExpertUser` — expert users only |
| 👥🎓 | `authenticateCommunityOrExpertUser` — community or expert |

All authentication uses JWT from `token` cookie. See [05-AUTHENTICATION.md](05-AUTHENTICATION.md) for details.

---

## 1. User Routes — `/users`

**File:** `routes/userRoute.js`

### Signup & Login

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/normal/signup` | 🔓 | `normalUserSignup` | Register normal user |
| POST | `/normal/login` | 🔓 | `normalUserLogin` | Login normal user |
| POST | `/community/signup` | 🔓 | `communityUserSignup` | Register community user |
| POST | `/community/login` | 🔓 | `communityUserLogin` | Login community user |
| POST | `/expert/signup` | 🔓 | `expertUserSignup` | Register expert user |
| POST | `/expert/login` | 🔓 | `expertUserLogin` | Login expert user |
| POST | `/admin/signup` | 🔓 | `adminSignup` | Register admin user |
| POST | `/admin/login` | 🔓 | `adminLogin` | Login admin user |

### Face Authentication

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/normal/register-face` | 🔓 | `normalUserRegisterFace` | Register face for normal user |
| POST | `/normal/verify-face` | 🔓 | `normalUserVerifyFace` | Verify face login for normal user |
| GET | `/normal/face-auth-status/:userId` | 🔓 | `normalUserFaceAuthStatus` | Check face registration status |
| POST | `/community/register-face` | 🔓 | `communityUserRegisterFace` | Register face for community user |
| POST | `/community/verify-face` | 🔓 | `communityUserVerifyFace` | Verify face login for community user |
| GET | `/community/face-auth-status/:userId` | 🔓 | `communityUserFaceAuthStatus` | Check face registration status |
| POST | `/expert/register-face` | 🔓 | `expertUserRegisterFace` | Register face for expert user |
| POST | `/expert/verify-face` | 🔓 | `expertUserVerifyFace` | Verify face login for expert user |
| GET | `/expert/face-auth-status/:userId` | 🔓 | `expertUserFaceAuthStatus` | Check face registration status |

### Expert Directory

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/experts` | 🔓 | `getAllExperts` | List all approved experts |
| GET | `/experts/:id` | 🔓 | `getExpertById` | Get expert profile by ID |

---

## 2. News Routes — `/news`

**File:** `routes/NewsRoute.js`

### News CRUD

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/upload` | 🔑 | `uploadNews` | Upload a news article (with screenshots) |
| GET | `/posts` | 🔓 | `getAllPosts` | Get all news articles (paginated) |
| GET | `/combined-feed` | 🔓 | `getCombinedFeed` | Combined news + trending feed |
| POST | `/vote/:postId` | 👥🎓 | `voteNews` | Vote on a news article |
| DELETE | `/post/:postId` | 🔑 | `deletePost` | Delete a news article |

### Community Comments

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/community-comment/add` | 👥 | `addCommunityComment` | Add community comment |
| GET | `/community-comment` | 🔓 | `getAllCommunityComments` | List all community comments |
| DELETE | `/community-comment/:commentId` | 🔑 | `deleteCommunityComment` | Delete a community comment |

### Expert Comments

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/expert-comment/add` | 🎓 | `addExpertComment` | Add expert comment |
| GET | `/expert-comment` | 🔓 | `getAllExpertComments` | List all expert comments |
| DELETE | `/expert-comment/:commentId` | 🔑 | `deleteExpertComment` | Delete an expert comment |

### Expert Voting on Comments

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/community-comment/:commentId/vote` | 🎓 | `expertVoteOnCommunityComment` | Expert votes on community comment |
| POST | `/expert-comment/:commentId/vote` | 🎓 | `expertVoteOnExpertComment` | Expert votes on expert comment |
| GET | `/community-comment/:commentId/votes` | 🔓 | `getCommunityCommentVotes` | Get vote totals for community comment |
| GET | `/expert-comment/:commentId/votes` | 🔓 | `getExpertCommentVotes` | Get vote totals for expert comment |

---

## 3. Comment Filter Routes — `/comment-filter`

**File:** `routes/commentFilterRoute.js`

All routes require 👥🎓 authentication except the test endpoint.

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/grouped/:newsId` | 👥🎓 | `getGroupedComments` | Get AI-grouped comments for news |
| GET | `/filtered/:newsId` | 👥🎓 | `getAllFilteredComments` | Get all filtered comments for news |
| GET | `/group/:groupId` | 👥🎓 | `getCommentsByGroup` | Get comments in a specific group |
| PUT | `/group/:groupId/label` | 👥🎓 | `updateGroupLabel` | Rename a comment group |
| PUT | `/group/:groupId/description` | 👥🎓 | `updateGroupDescription` | Update group description |
| DELETE | `/group/:groupId` | 👥🎓 | `deleteGroup` | Delete a comment group |
| GET | `/summary/:newsId` | 👥🎓 | `getFilteringSummary` | Get filtering summary for news |
| GET | `/test` | 🔓 | `testIntegration` | Test service integration |
| POST | `/regenerate-names/:newsId` | 👥🎓 | `regenerateGroupNames` | Regenerate AI group labels |

---

## 4. Debate Room Routes — `/debate-rooms`

**File:** `routes/debateRoomRoute.js`

All routes require 🔑 authentication except test routes.

### Test Routes (No Auth)

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/test/:roomId/groups` | 🔓 | `getDebateGroups` | Test: get groups without auth |
| GET | `/test/:roomId/comments` | 🔓 | `getDebateComments` | Test: get comments without auth |

### Debate Room Management

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/` | 🔑 | `createDebateRoom` | Create new debate room |
| GET | `/` | 🔑 | `getAllDebateRooms` | List all rooms (paginated) |
| GET | `/:roomId` | 🔑 | `getDebateRoom` | Get single room with groups |
| POST | `/:roomId/join` | 🔑 | `joinDebateRoom` | Join a debate room |
| POST | `/:roomId/leave` | 🔑 | `leaveDebateRoom` | Leave a debate room |
| PUT | `/:roomId` | 🔑 | `updateDebateRoom` | Update room details |
| DELETE | `/:roomId` | 🔑 | `deleteDebateRoom` | Delete room and all related data |

### Advanced Group Management

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| PUT | `/:roomId/groups/:groupId/regenerate` | 🔑 | `regenerateGroupContent` | Regenerate single group's AI content |
| POST | `/:roomId/relink-all` | 🔑 | `relinkGroups` | Rebuild all counter-group relationships |
| GET | `/:roomId/debug/counter-status` | 🔑 | `getDebugCounterStatus` | Debug: view counter-matching state |
| GET | `/:roomId/test/anti-scores` | 🔑 | `testAntiCommentScores` | Debug: test anti-score calculations |

### Debate Groups

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/:roomId/groups` | 🔑 | `getDebateGroups` | List all groups in room |
| POST | `/:roomId/groups` | 🔑 | `createDebateGroup` | Create new group (AI-generates counter) |
| GET | `/:roomId/groups/:groupId` | 🔑 | `getDebateGroup` | Get single group details |
| PUT | `/:roomId/groups/:groupId/regenerate` | 🔑 | `regenerateDebateGroup` | Regenerate group with AI |
| POST | `/:roomId/groups/relink` | 🔑 | `relinkDebateGroups` | Relink group counter-relationships |
| GET | `/:roomId/groups/:groupId/counter-analysis` | 🔑 | `getCounterAnalysis` | Analyze counter-group matching |

### Debate Comments

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/:roomId/comments` | 🔑 | `createDebateComment` | Post comment (triggers AI pipeline) |
| GET | `/:roomId/comments` | 🔑 | `getDebateComments` | List all comments in room |
| GET | `/:roomId/groups/:groupId/comments` | 🔑 | `getCommentsByGroup` | Comments in specific group |
| POST | `/:roomId/comments/:commentId/like` | 🔑 | `likeComment` | Like a comment |
| POST | `/:roomId/comments/:commentId/dislike` | 🔑 | `dislikeComment` | Dislike a comment |
| DELETE | `/:roomId/comments/:commentId` | 🔑 | `deleteDebateComment` | Delete a comment |
| POST | `/:roomId/comments/:commentId/undo` | 🔑 | `undoDebateComment` | Undo like/dislike |
| GET | `/:roomId/comments/debug/counter-status` | 🔑 | `getCommentsDebugCounterStatus` | Debug counter status for comments |

---

## 5. Trending News Routes — `/trending-news`

**File:** `routes/trendingNewsRoute.js`

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/` | 🔓 | `getTrendingNews` | Paginated trending news list |
| GET | `/:id` | 🔓 | `getTrendingNewsById` | Single trending article |
| GET | `/user/reposts` | 🔑 | `getUserReposts` | User's reposted articles |
| POST | `/:id/repost` | 🔑 | `repostNews` | Repost to main feed |
| DELETE | `/:id/repost` | 🔑 | `removeRepost` | Remove a repost |
| POST | `/admin/fetch` | 🔑 | `fetchTrendingNews` | Manual scrape trigger |
| POST | `/admin/cleanup` | 🔑 | `manualCleanupTrendingNews` | Force cleanup |
| GET | `/admin/stats` | 🔑 | `getTrendingNewsStats` | Collection stats |

---

## 6. Profile Routes — `/profile`

**File:** `routes/profileRoute.js`

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/me` | 🔑 | `getProfile` | Get current user's profile |
| PUT | `/update` | 🔑 | `updateProfile` | Update profile (supports photo upload) |
| PUT | `/change-password` | 🔑 | `changePassword` | Change password with verification |

### Profile Update Fields

The update endpoint accepts `multipart/form-data` with these fields:

**All user types:**
- `name`, `username`, `email`, `bio`, `interests` (JSON array or comma-separated), `photo` (file), `password`

**Community + Expert users additionally:**
- `location`, `verificationId`, `socialLinks` (JSON object with twitter/linkedin/website)

**Expert users additionally:**
- `profession`, `experience` (integer), `areaOfExpertise` (JSON array), `credentials` (JSON array)

Photo uploads: max 5MB, JPEG/JPG/PNG/GIF only, stored at `/uploads/profiles/`.

---

## 7. AI Verdict Routes — `/api`

**File:** `routes/aiVerdictRoute.js`

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | `/news/:newsId/ai-verdict` | 🔑 | `generateAIVerdict` | Generate AI credibility verdict |
| GET | `/news/:newsId/ai-verdict` | 🔓 | `getAIVerdict` | Get existing verdict |
| PUT | `/news/:newsId/ai-verdict/regenerate` | 🔑 | `regenerateAIVerdict` | Regenerate verdict |
| DELETE | `/news/:newsId/ai-verdict` | 🔑 | `deleteAIVerdict` | Delete verdict |
| GET | `/ai-verdicts/stats` | 🔓 | `getAIVerdictStats` | Verdict statistics |

---

## 8. Accuracy Test Routes — `/api/accuracy`

**File:** `routes/accuracyTest.js`

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | `/test` | 🔓 | inline | API health check |
| GET | `/results` | 🔓 | inline | Get latest accuracy results |
| POST | `/calculate` | 🔓 | inline | Run full accuracy calculation |
| POST | `/recalculate` | 🔓 | inline | Clear + recalculate |
| GET | `/status` | 🔓 | inline | Accuracy testing status summary |
| DELETE | `/results` | 🔓 | inline | Clear all stored results |

Note: Accuracy routes are defined inline in the route file rather than delegating to a controller. The service layer (`accuracyTestService.js`) is called directly.

---

## Endpoint Count Summary

| Route Group | Endpoints |
|-------------|-----------|
| Users | 20 |
| News | 14 |
| Comment Filter | 9 |
| Debate Rooms | 22 |
| Trending News | 8 |
| Profile | 3 |
| AI Verdict | 5 |
| Accuracy Test | 6 |
| **Total** | **87** |

---

## Common Response Patterns

### Success
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "error": "detailed error message"
}
```

### Paginated
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET/PUT/DELETE |
| 201 | Successful POST (resource created) |
| 400 | Validation errors, bad input |
| 401 | Unauthorized (missing/invalid JWT) |
| 403 | Forbidden (wrong user type) |
| 404 | Resource not found |
| 500 | Internal server error |

---

## CORS Configuration

From `index.js`:
```javascript
app.use(cors({
  origin: [frontend URL from env],
  credentials: true
}));
```

Cookies (JWT tokens) are sent cross-origin via `credentials: true`.

## Static Files

```javascript
app.use('/uploads', express.static('uploads'));
```

Screenshot and profile photo files are served from the `/uploads` directory.
