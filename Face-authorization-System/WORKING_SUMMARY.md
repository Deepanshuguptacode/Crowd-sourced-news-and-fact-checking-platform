# Face-Authorization-System — Working Summary & Frontend Integration

## What It Does

A **Flask-based face recognition API** using InsightFace (ArcFace) for face embedding extraction, storage in MongoDB, and cosine-similarity matching. Provides registration (signup) and verification (login) endpoints consumed by the VoxVeritas React frontend.

---

## Architecture Overview

```
Frontend (React / VoxVeritas)                 Flask Server (port 5000)
    │                                              │
    ├─ FaceCapture.jsx ──► /api/detect_face        │  → InsightFace → face detected? bbox + crop
    ├─ SignupForm.jsx  ──► /api/check_duplicate_face│  → Compare embedding vs all users in MongoDB
    │                                              │
    ├─ authAPI.signup() ──► Node.js Backend ────┐  │
    │                                           │  │
    │   Node.js Backend (port 3000)             │  │
    │       └─ httpFaceAuthService.js ──────────┼──► /api/extract_embedding → embedding[]
    │           (stores embedding in user doc)   │  │
    │                                           │  │
    ├─ Login ──► Node.js Backend ───────────────┼──► /api/verify_face → match + similarity
    │                                              │
    └─ config.js: FACE_AUTH_URL = 127.0.0.1:5000   │
```

---

## Flask Server (`app.py` / `deferred-app.py`)

### Core Function: `get_embedding_from_image_data(base64_image)`
1. Decode base64 → PIL Image
2. Resize (max 800–1200px maintaining aspect ratio)
3. Convert RGB → BGR (OpenCV format)
4. Run `face_app.get(img_bgr)` via InsightFace ArcFace (buffalo_l model)
5. Returns: `(embedding[512], bbox[4], face_crop_base64)` or `(None, None, None)`

### API Endpoints

| Endpoint | Method | Input | Output | Used By |
|----------|--------|-------|--------|---------|
| `/api/detect_face` | POST | `{image: base64}` | `{success, bbox, face_crop}` | FaceCapture.jsx (preview) |
| `/api/extract_embedding` | POST | `{image: base64}` | `{success, embedding[], bbox, face_crop}` | Node.js backend |
| `/api/register_face` | POST | `{username, image}` | `{success, bbox, face_crop}` | Flask-only registration |
| `/api/verify_face` | POST | `{image: base64}` | `{success, username, similarity}` | Flask-only login |
| `/api/check_duplicate_face` | POST | `{image: base64}` | `{success, isDuplicate, similarity}` | SignupForm.jsx |
| `/api/status` | GET | — | `{success, face_model_loaded}` | Health check |

### Cosine Similarity Matching
```python
similarity = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
threshold = 0.3  # Match threshold
```

### MongoDB Storage
```json
{
  "username": "string",
  "embedding": [512 floats],
  "registered_at": "datetime",
  "bbox": [x1, y1, x2, y2]
}
```

---

## Frontend Integration (VoxVeritas)

### Files Involved

1. **`frontend/src/config.js`**
   - `FACE_AUTH_URL`: `http://127.0.0.1:5000` (dev) / `https://api.voxveritas.me/face-auth` (prod)

2. **`frontend/src/components/FaceCapture.jsx`** (525 lines)
   - Camera access via `getUserMedia` with device selection
   - Captures JPEG at 0.9 quality
   - Calls `FACE_AUTH_URL/api/detect_face` for face detection preview
   - Returns `imageDataUrl` to parent via `onCapture` callback

3. **`frontend/src/components/LivenessFaceCapture.jsx`** (23 lines)
   - Thin wrapper: maps `onSuccess` → `onCapture`, `onError` → `onError`
   - Sets button text to "Capture & Verify Face"
   - **Currently has NO actual liveness detection** — just wraps FaceCapture

4. **`frontend/src/pages/SignupForm.jsx`** (316 lines)
   - Renders `<LivenessFaceCapture>` when face auth is enabled (toggle switch)
   - On capture: calls `FACE_AUTH_URL/api/check_duplicate_face` directly
   - If verified & no duplicate: stores `faceImage` in state
   - On form submit: includes `faceImage` in signup payload to Node.js backend

5. **`backend/services/httpFaceAuthService.js`** (286 lines)
   - Node.js → Flask HTTP client
   - `extractFaceEmbedding(imageData)`: calls `/api/extract_embedding`
   - `verifyFaceMatch(embedding, storedEmbedding)`: JS-side cosine similarity
   - `startFaceAuthService()`: spawns `deferred-app.py` as child process

### Signup Flow (Current)

```
User fills form → enables face auth → clicks "Start Liveness + Face Verification"
    │
    ▼
LivenessFaceCapture renders → FaceCapture starts camera
    │
    ▼
User clicks "Capture & Verify Face" → JPEG captured
    │
    ▼
FaceCapture calls Flask /api/detect_face → face detected? show crop preview
    │
    ▼
FaceCapture calls onCapture(imageDataUrl) → SignupForm.handleFaceCapture
    │
    ▼
SignupForm calls Flask /api/check_duplicate_face → no duplicate? ✓
    │
    ▼
User clicks "Create Account" → authAPI.signup() with faceImage to Node.js
    │
    ▼
Node.js backend calls Flask /api/extract_embedding → stores embedding in user doc
```

### Key Insight: No Real Liveness Detection Currently
The `LivenessFaceCapture` component is a **placeholder** — it just captures a photo and sends it for face detection. There are no challenges, no blink/smile/head-turn checks. This is the gap the integration will fill.

---

## Dependencies

- `flask`, `flask-cors` — web framework
- `insightface` — ArcFace face recognition (buffalo_l model)
- `opencv-python`, `numpy`, `Pillow` — image processing
- `pymongo` — MongoDB client
- `python-dotenv` — environment config
