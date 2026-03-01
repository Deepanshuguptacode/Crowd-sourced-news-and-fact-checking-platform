# Integration Plan: Rule-Based Liveness Detection → Face-Authorization-System → Frontend

## Goal

Merge the rule-based liveness detection into the Face-authorization-System as a **single unified Flask server** on port 5000, and update the frontend to run real liveness challenges (blink, smile, head turn) via WebSocket before allowing face capture during signup.

---

## Current State

| Component | Status |
|-----------|--------|
| **rule-based-liveness-detection** | Standalone desktop app using OpenCV `imshow` for webcam. No web API. |
| **Face-authorization-System** | Flask server on port 5000. Has `/api/detect_face`, `/api/extract_embedding`, `/api/check_duplicate_face`, etc. |
| **LivenessFaceCapture.jsx** | Thin wrapper over FaceCapture — NO actual liveness detection. Just captures a photo. |
| **SignupForm.jsx** | Renders LivenessFaceCapture, sends captured image for duplicate check + signup. |

---

## Integration Architecture

```
                Frontend (React)
                     │
    ┌────────────────┼────────────────────┐
    │                │                    │
    │    LivenessFaceCapture.jsx          │
    │    (new: real liveness UI)          │
    │         │                           │
    │    [WebSocket]                      │  [REST API]
    │         │                           │
    │         ▼                           ▼
    │   Flask Server (port 5000)    Flask Server (port 5000)
    │   ┌─────────────────────┐   ┌──────────────────────┐
    │   │ /ws/liveness        │   │ /api/detect_face     │
    │   │ WebSocket endpoint  │   │ /api/extract_embedding│
    │   │                     │   │ /api/check_duplicate  │
    │   │ Uses:               │   │ /api/verify_face     │
    │   │ - LandmarkDetector  │   │ /api/register_face   │
    │   │ - SignalExtractor   │   │ /api/liveness/start  │
    │   │ - ChallengeEngine   │   │ /api/liveness/frame  │
    │   │ - StateMachine      │   │ /api/liveness/status │
    │   │ - ActiveLiveness    │   │                      │
    │   └─────────────────────┘   │ Uses InsightFace     │
    │                             └──────────────────────┘
    └─────────────────────────────────────┘
```

### Decision: REST-based Liveness (not WebSocket)

WebSocket adds complexity (flask-socketio, proxy config). Instead, use a **stateful REST API**:
1. `POST /api/liveness/start` → returns `session_id` + first challenge
2. `POST /api/liveness/frame` → send base64 frame + `session_id` → returns challenge status, signals, next instruction
3. `GET /api/liveness/status/{session_id}` → returns session progress
4. `GET /api/liveness/result/{session_id}` → returns final result

Sessions are held in server memory (dict keyed by session_id), auto-expire after 60s.

---

## Step-by-Step Implementation Plan

### Phase 1: Copy Liveness Files into Face-Auth

Copy from `rule-based-liveness-detection/` into `Face-authorization-System/liveness/`:
```
Face-authorization-System/
├── liveness/
│   ├── __init__.py
│   ├── config.py              ← from src/config/config.py (simplified)
│   ├── landmark_detector.py    ← from src/liveness/rule_based/
│   ├── signal_extractor.py     ← from src/liveness/rule_based/
│   ├── challenge_engine.py     ← from src/liveness/rule_based/
│   ├── state_machine.py        ← from src/liveness/rule_based/
│   └── active_liveness.py      ← from src/liveness/rule_based/
├── models/
│   └── face_landmarker.task    ← copy model file
├── app.py                      ← updated unified server
└── ...
```

Import paths will be adjusted from `from ...config.config import ...` to `from .config import ...`.

### Phase 2: Build Unified Flask Server

Add to existing `app.py`:
- Liveness session management (in-memory dict)
- New endpoints: `/api/liveness/start`, `/api/liveness/frame`, `/api/liveness/result/{id}`
- Frame processing: decode base64 → numpy array → BGR → feed to `ActiveLivenessDetector.process_frame()`
- Return challenge instruction, signals, state, progress as JSON

### Phase 3: Update Frontend

Replace `LivenessFaceCapture.jsx` with a full liveness component that:
1. Starts camera (reuse existing camera logic)
2. Calls `/api/liveness/start` to begin session
3. Sends frames at ~5 FPS via `/api/liveness/frame` 
4. Displays challenge instruction + countdown + progress
5. On session complete (success): captures final high-quality frame → calls `onSuccess(imageDataUrl)`
6. On session failed: shows error → calls `onError(message)`

### Phase 4: Test End-to-End

1. Start unified Flask server
2. Start frontend dev server
3. Navigate to signup page
4. Enable face auth → start liveness
5. Complete 3 challenges (blink, smile, head turn)
6. Verify face captured → duplicate check → signup completes

---

## Files Modified/Created

| File | Action |
|------|--------|
| `Face-authorization-System/liveness/__init__.py` | **Create** |
| `Face-authorization-System/liveness/config.py` | **Create** (simplified from rule-based config) |
| `Face-authorization-System/liveness/landmark_detector.py` | **Create** (adapted imports) |
| `Face-authorization-System/liveness/signal_extractor.py` | **Create** (adapted imports) |
| `Face-authorization-System/liveness/challenge_engine.py` | **Create** (copy) |
| `Face-authorization-System/liveness/state_machine.py` | **Create** (adapted imports) |
| `Face-authorization-System/liveness/active_liveness.py` | **Create** (adapted imports) |
| `Face-authorization-System/models/face_landmarker.task` | **Copy** model file |
| `Face-authorization-System/app.py` | **Modify** — add liveness endpoints |
| `frontend/src/components/LivenessFaceCapture.jsx` | **Rewrite** — real liveness UI |
| `frontend/src/pages/SignupForm.jsx` | Minor updates (if needed) |

---

## Risk Mitigation

- **MediaPipe + InsightFace coexistence**: Both use ONNX/TFLite — tested compatible on CPU
- **Frame rate**: Browser sends frames at ~5 FPS (200ms interval), sufficient for liveness
- **Session memory**: Auto-cleanup after 60s, max 100 concurrent sessions
- **Model file**: Copy existing `face_landmarker.task` (already downloaded)
- **Backwards compatibility**: All existing Face-auth endpoints unchanged
