# 16 — Face Authentication System

## Overview

VoxVeritas integrates a biometric face authentication system that allows users to register and verify their identity via facial recognition. The architecture is a **two-service design**: a standalone Flask application (`Face-authorization-System/`) handles the heavy ML inference, while the Node.js backend communicates with it via HTTP. Three service implementations exist on the Node.js side, each representing a different integration strategy.

**Architecture:**
```
Browser (webcam capture)
    ↓ base64 image
Node.js Backend (Express)
    ↓ HTTP POST
Flask App (port 5000)
    ↓ ArcFace inference
    ↓ 512-dim embedding
Node.js Backend
    ↓ store/compare embedding
MongoDB (user document)
```

---

## Flask Face Auth Service

**Location:** `Face-authorization-System/app.py` (and variants)

The Python service runs independently on `http://127.0.0.1:5000` and exposes:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Health check |
| `/api/detect_face` | POST | Detect face and return bounding box + crop |
| `/api/extract_embedding` | POST | Extract 512-dimensional ArcFace embedding |
| `/api/register_face` | POST | Register a face with a username |
| `/api/verify_face` | POST | Verify a face against registered faces |

### ML Stack

| Component | Technology |
|-----------|------------|
| Face detection | InsightFace (`FaceAnalysis`) |
| Embedding model | ArcFace via InsightFace |
| Embedding dimensions | **512** |
| Image processing | OpenCV + PIL |
| Execution provider | CPU (`CPUExecutionProvider`) |
| Detection size | 640×640 |

### Image Preprocessing

The Flask service standardizes input images before inference:
1. Strip data URL prefix (`data:image/...;base64,`) if present
2. Decode base64 to PIL Image
3. Resize if exceeds max dimension (1200px for large images, 800px otherwise)
4. Convert RGB → BGR for OpenCV compatibility
5. Run InsightFace face detection
6. Extract `normed_embedding` from first detected face

---

## Node.js Service Implementations

Three service files exist, each representing a different integration pattern:

### 1. `httpFaceAuthService.js` — HTTP Client (Primary)

This is the **production service**. It communicates with the Flask app via Axios HTTP calls.

**Constructor configuration:**
```javascript
this.faceAuthUrl = 'http://127.0.0.1:5000';
this.timeout = 30000; // 30 seconds
```

**Key methods:**

| Method | Description |
|--------|-------------|
| `isServiceRunning()` | GET `/` with 5s timeout health check |
| `detectFace(imageBase64)` | POST to `/api/detect_face`, returns bbox + faceCrop |
| `extractFaceEmbedding(imageBase64)` | Two-step: detect face, then POST to `/api/extract_embedding` |
| `registerFace(username, imageBase64)` | Extract embedding + POST to `/api/register_face` with unique `face_{username}_{timestamp}` |
| `verifyFace(imageBase64)` | POST to `/api/verify_face`, returns match confidence |
| `verifyFaceMatch(testEmbedding, storedEmbedding, threshold)` | Local cosine similarity computation (no Flask call needed) |
| `startFaceAuthService()` | Spawns `python deferred-app.py` as child process |

**Registration flow:**
```
registerFace(username, imageBase64):
  1. extractFaceEmbedding(imageBase64) → 512-dim vector
  2. Generate unique faceUsername = 'face_{username}_{timestamp}'
  3. POST /api/register_face with faceUsername + image
  4. Return { embedding, faceUsername, bbox, faceCrop }
```

**Local cosine similarity** (used for verification without Flask):
```javascript
verifyFaceMatch(testEmbedding, storedEmbedding, threshold = 0.3):
  dotProduct = Σ(a[i] × b[i])
  similarity = dotProduct / (||a|| × ||b||)
  return { similarity, matched: similarity >= threshold }
```

The default threshold of **0.3** is intentionally low (cosine similarity range 0–1) to accommodate variations in lighting, angle, and webcam quality.

### 2. `faceAuthService.js` — Python Subprocess Spawner

This service writes an embedded Python script to disk and runs it via `child_process.spawn`. It was designed as a fallback when the Flask server isn't running.

**Key characteristics:**
- Creates `face_service.py` in the `Face-authorization-System/` directory at initialization
- Embeds the full Python inference logic as a string template
- Communicates via stdin/stdout JSON pipes
- Uses a higher similarity threshold of **0.6** (stricter than HTTP service)
- Requires InsightFace, numpy, cv2, PIL installed in the system Python environment

**Operations supported via stdin JSON:**
- `extract_embedding` — Send base64 image, receive embedding array
- `verify_face` — Send test embedding + stored embeddings map, receive match result

### 3. `simpleFaceAuthService.js` — Inline Python Execution

The simplest implementation: runs Python code inline via `python -c` with the full script passed as a command-line argument.

**Key characteristics:**
- No temporary files created
- Imports directly from the Flask app's `app.py` via `sys.path` manipulation
- Uses the Flask app's `get_embedding_from_image_data()` function directly
- Similarity threshold: **0.3** (same as HTTP service)
- Exported as a singleton instance

---

## Integration with User Models

Face authentication data is stored directly on user documents across all three user types:

| Field | Type | Description |
|-------|------|-------------|
| `faceEmbedding` | `[Number]` | 512-element array of floats |
| `faceRegistered` | `Boolean` | Whether face is registered |
| `faceAuthEnabled` | `Boolean` | Whether face login is enabled |

### User Controller Face Endpoints

The `UserController.js` provides face auth endpoints for each user type:

**Registration (per user type):**
```
POST /users/normal/register-face
POST /users/community/register-face
POST /users/expert/register-face

Body: { userId, image (base64) }

Flow:
  1. Find user by userId in appropriate collection
  2. Call httpFaceAuthService.extractFaceEmbedding(image)
  3. Store embedding array on user.faceEmbedding
  4. Set user.faceRegistered = true
  5. Save user document
```

**Verification (per user type):**
```
POST /users/normal/verify-face
POST /users/community/verify-face
POST /users/expert/verify-face

Body: { image (base64) }

Flow:
  1. Call httpFaceAuthService.extractFaceEmbedding(image)
  2. Query all users of that type where faceRegistered = true
  3. Compare extracted embedding against each stored embedding
  4. Use verifyFaceMatch() with cosine similarity
  5. Return matched user or "no match found"
```

**Face Auth Status:**
```
GET /users/normal/face-auth-status/:userId
GET /users/community/face-auth-status/:userId
GET /users/expert/face-auth-status/:userId

Returns: { faceRegistered, faceAuthEnabled }
```

---

## Cosine Similarity Verification

The verification process uses cosine similarity to compare face embeddings:

```
Given: testEmbedding (512-dim), storedEmbedding (512-dim)

dot_product = Σ testEmbedding[i] × storedEmbedding[i]
magnitude_a = √(Σ testEmbedding[i]²)
magnitude_b = √(Σ storedEmbedding[i]²)

similarity = dot_product / (magnitude_a × magnitude_b)

Match if similarity ≥ threshold (0.3 default)
```

### Threshold Rationale

| Threshold | Service | Context |
|-----------|---------|---------|
| 0.3 | httpFaceAuthService, simpleFaceAuthService | Production — lenient for webcam variance |
| 0.6 | faceAuthService (subprocess) | Stricter — designed for higher-quality inputs |

---

## Service Startup

The `httpFaceAuthService` includes a `startFaceAuthService()` method that can spawn the Flask app as a child process:

```
startFaceAuthService():
  1. Resolve path to Face-authorization-System/
  2. spawn('python', ['deferred-app.py'])
  3. Listen for stdout "Running on http://127.0.0.1:5000"
  4. Resolve promise when Flask is ready
  5. 30-second timeout → kill process and reject
```

The `deferred-app.py` variant defers heavy model loading until the first request, reducing startup time.

---

## Error Handling

- **Flask unreachable** — `isServiceRunning()` returns false; registration/verification calls return `{ success: false, message: 'Face detection service error: ...' }`
- **No face detected** — Flask returns a specific message; Node.js propagates it to the client
- **Multiple faces** — Only the first detected face is used (InsightFace `faces[0]`)
- **Image too large** — Automatically resized before inference (max 1200px)
- **Timeout** — All HTTP calls have 30-second timeout; subprocess variant has no explicit timeout

---

## Design Decisions

### Why a separate Flask service?
InsightFace and ArcFace require Python with heavy ML dependencies (ONNX Runtime, OpenCV, numpy). Running these in Node.js would require complex native bindings. HTTP decoupling keeps the Node.js backend lightweight.

### Why three service implementations?
Evolution of the integration approach:
1. `simpleFaceAuthService` — Quick prototype using `python -c`
2. `faceAuthService` — More robust subprocess with embedded script
3. `httpFaceAuthService` — Final production version using HTTP

### Why store embeddings in MongoDB?
512 floats × 4 bytes = ~2KB per user. This is negligible storage and avoids the complexity of a separate vector database for user-count data (unlike the thousands of comment embeddings in Pinecone).

### Why threshold 0.3?
ArcFace produces normalized embeddings where cosine similarity typically ranges 0.2–0.8 for different-person comparisons and 0.5–1.0 for same-person comparisons. A threshold of 0.3 accommodates poor webcam quality, varying lighting, and slight angle changes while still rejecting clearly different faces.
