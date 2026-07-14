# 03 — Architecture & Design Patterns Q&A

---

## MVC Pattern

**Q: Explain the MVC pattern in your project.**
A: MVC stands for Model-View-Controller. In VoxVeritas:

- **Model** (`/models/`): Mongoose schemas defining data structure — `News.js`, `CommunityUser.js`, `Comments.js`, `AIVerdict.js`, etc. Models only define what data looks like, not what to do with it.
- **View**: Handled by the separate React frontend — our backend doesn't have views.
- **Controller** (`/controllers/`): Request handlers that extract data from `req`, call services, and send `res`. e.g., `NewsController.js` handles uploading news, fetching feeds, voting.
- **Routes** (`/routes/`): URL mappings that point to the right controller function.
- **Services** (`/services/`): Business logic that controllers delegate to — e.g., `aiVerdictService.js`, `commentFilteringService.js`. This is a Service Layer extension to pure MVC.

```
Request -> Route -> Middleware -> Controller -> Service -> Model -> DB
                                                                 |
Response <- Controller <---------- Service <------- Model <------+
```

**Q: Why separate Services from Controllers?**
A: Separation of concerns. Controllers know about HTTP (req/res). Services know about business rules and external APIs (Pinecone, Gemini). If we switch from REST to GraphQL, we can keep the same services. If we swap Pinecone for another vector DB, we only change the service, not controllers.

---

## Request Flow (Walk Through End-to-End)

**Q: Walk me through what happens when a user posts a comment.**

1. **Frontend** sends `POST /news/community-comment/add` with `{ newsId, comment, stance }` + JWT cookie
2. **Express Router** (`NewsRoute.js`) matches the route
3. **Auth Middleware** (`authenticateCommunityUser`) extracts cookie → verifies JWT → queries MongoDB for user → attaches `req.user`
4. **Controller** (`CommentsController.addCommunityComment`) validates input, saves `CommunityComment` to MongoDB
5. **Comment Filtering Service** (`commentFilteringService.processComment`) runs:
   - Calls `vectorService.generateEmbedding(comment)` → Gemini API → 768-dim vector
   - Calls `vectorService.matchNewsComment(embedding, newsId)` → Pinecone query
   - If score >= 0.74: assigns to existing group
   - Else: calls `llmService.classifyAndGenerateContent()` → Gemini LLM → creates new group
   - Stores new group embedding in Pinecone via `vectorService.storeNewsGroup()`
6. **Response** sent back to frontend

---

## Singleton Pattern

**Q: What design patterns did you use?**
A: We use the **Singleton pattern** for all service classes:

```javascript
class VectorService { ... }
module.exports = new VectorService();  // Export single instance
```

When any file does `require('./vectorService')`, Node.js module cache returns the SAME instance. This is critical for:
- `VectorService` — manages Pinecone connection state (only init once)
- `GeminiKeyRotation` — globally tracks which key to use (must be shared)
- `AIVerdictService` — stateless service, singleton for consistency

**Q: Why is Singleton important for GeminiKeyRotation?**
A: The key rotation counter must be shared across all services. If each service had its own instance, they'd all use key #1 simultaneously — defeating the purpose of rotation. The singleton ensures a global counter that all services increment together.

---

## Polymorphic References (refPath)

**Q: How do you handle references to multiple user types in MongoDB?**
A: Using Mongoose's `refPath` (dynamic references). The `DebateRoom` model stores participants like:

```javascript
participants: [{
  userId: { type: ObjectId, refPath: 'participants.userModel' },
  userModel: { type: String, enum: ['NormalUser', 'CommunityUser', 'ExpertUser'] }
}]
```

`refPath` tells Mongoose: "look at `participants.userModel` to know which collection to populate from." This avoids maintaining 3 separate arrays for 3 user types.

---

## Layered Architecture

**Q: Describe your folder structure and why it's organized that way.**
A:

```
backend/
  controllers/    <- HTTP layer: parse req, call services, send res
  services/       <- Business logic: AI calls, DB queries, algorithms
  models/         <- Data layer: Mongoose schemas
  routes/         <- URL routing
  middlewares/    <- Cross-cutting concerns: auth, validation
```

This is the **3-tier architecture**:
- Presentation tier: routes + controllers (HTTP)
- Business logic tier: services
- Data tier: models + MongoDB/Pinecone

Benefits: each layer can be tested independently, layers can be swapped without affecting others.

---

## Error Handling

**Q: How do you handle errors in your application?**
A: Multiple layers:

1. **Try-catch in controllers**: Every async controller is wrapped in try-catch, returning appropriate HTTP status codes (400, 401, 404, 500)
2. **Service-level graceful failures**: Services like `vectorService` return `null`/`false`/`[]` instead of throwing — callers handle missing vector results gracefully
3. **LLM fallback**: If Pinecone fails, the system falls back to pure LLM classification. If LLM fails, comments are saved without grouping (non-fatal)
4. **Connection error detection**: `vectorService._isConnectionError()` distinguishes network errors from logic errors, enabling silent recovery

**Q: What HTTP status codes do you use?**

| Code | When Used |
|------|-----------|
| 200 | Success |
| 201 | Resource created (signup, news upload) |
| 400 | Bad request (missing fields, duplicate email) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (wrong role, wrong security password) |
| 404 | Resource not found |
| 500 | Internal server error |

---

## Cascade Delete

**Q: When you delete a debate room, what happens?**
A: Cascade deletion in order:

1. **Collect** all DebateGroup IDs from MongoDB
2. **Delete vectors** from Pinecone (debate-groups namespace) — fire and forget
3. **Delete** all DebateComments where `debateRoomId = roomId`
4. **Delete** all DebateGroups where `debateRoomId = roomId`
5. **Delete** the DebateRoom document itself

Order matters — vectors reference group IDs, so we collect IDs before deleting documents.

---

## Concurrency & Race Conditions

**Q: What happens if two requests hit your server at the same time?**
A: Node.js handles concurrent requests via the event loop — each async operation (DB query, API call) yields control while waiting. Multiple requests can be "in flight" simultaneously even though JavaScript is single-threaded. The key risks are:

- **Pinecone init**: Solved with `_initPromise` pattern — first caller starts init, subsequent callers wait for the same promise rather than starting duplicate initializations
- **Duplicate verdicts**: `generateVerdict` checks `AIVerdict.findOne({ newsId })` before creating — if the verdict already exists, it throws instead of creating a duplicate

---

## Microservice Communication

**Q: How does Node.js communicate with your Python Flask service?**
A: HTTP REST calls via Axios:

```javascript
// In httpFaceAuthService.js
const response = await axios.post('http://127.0.0.1:5000/api/extract_embedding', {
  image: base64Image
}, { timeout: 30000 });
```

The Flask service is a separate process. Node.js acts as a client. Benefits: each service can be deployed, scaled, and maintained independently. The Flask service can be updated (e.g., swap InsightFace for a newer model) without touching Node.js code.
