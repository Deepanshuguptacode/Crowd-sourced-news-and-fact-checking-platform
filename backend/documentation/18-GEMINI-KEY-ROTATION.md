# 18 — Gemini API Key Rotation

## Overview

VoxVeritas makes heavy use of Google Gemini for both LLM text generation and embedding computation. To avoid hitting per-key rate limits, the platform implements a **3-key rotation system** that distributes API calls across three Gemini API keys, rotating after every 5 requests per key.

**File:** `services/geminiKeyRotation.js`

---

## Architecture

The service is a **singleton class** — a single instance manages rotation state for the entire application lifecycle.

```
┌─────────────────────────────────────────┐
│          GeminiKeyRotation              │
│                                         │
│  keys: [KEY_1, KEY_2, KEY_3]           │
│  currentKeyIndex: 0 → 1 → 2 → 0 ...  │
│  requestCount: 0 → 1 → 2 → 3 → 4 → 0 │
│  rotateAfter: 5                         │
│                                         │
│  getApiKey() → returns current key      │
│  advanceKey() → forces immediate rotate │
│  rotateKey() → internal auto-rotate     │
└─────────────────────────────────────────┘
```

---

## Configuration

Keys are loaded from environment variables at construction time:

| Environment Variable | Key Index |
|---------------------|-----------|
| `GEMINI_API_KEY_1` | 0 |
| `GEMINI_API_KEY_2` | 1 |
| `GEMINI_API_KEY_3` | 2 |

```javascript
constructor() {
  this.keys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean);  // Remove undefined/null keys

  this.currentKeyIndex = 0;
  this.requestCount = 0;
  this.rotateAfter = 5;
}
```

If fewer than 3 keys are configured, the system works with whatever keys are available. If zero keys are configured, `isConfigured()` returns `false`.

---

## Rotation Mechanics

### `getApiKey()`

Called by any service that needs a Gemini API key:

```
getApiKey():
  1. key = this.keys[this.currentKeyIndex]
  2. this.requestCount++
  3. if (requestCount >= rotateAfter):
     → rotateKey()
  4. return { key, keyIndex: currentKeyIndex }
```

After **5 requests** on a single key, it automatically advances to the next key in the circular array.

### `rotateKey()`

Internal method for automatic rotation:

```
rotateKey():
  1. this.currentKeyIndex = (currentKeyIndex + 1) % this.keys.length
  2. this.requestCount = 0
  3. Log: "Rotated to key index {n}"
```

### `advanceKey()`

**Forced immediate rotation** — used when making sequential API calls that should use different keys:

```
advanceKey():
  1. this.currentKeyIndex = (currentKeyIndex + 1) % this.keys.length
  2. this.requestCount = 0
  3. return current key info
```

This is critical in multi-step AI pipelines. For example, the comment filtering service:
1. Calls `generateContent()` to classify comments → uses key A
2. Calls `advanceKey()` → switches to key B
3. Calls `embedContent()` to generate embeddings → uses key B

Without `advanceKey()`, both calls would hit the same key, potentially triggering rate limits.

---

## Usage Patterns

### Single API Call
```javascript
const { key } = geminiKeyRotation.getApiKey();
const genAI = new GoogleGenerativeAI(key);
// ... make API call
```

### Sequential API Calls (Same Request)
```javascript
// First call
const { key: key1 } = geminiKeyRotation.getApiKey();
const result1 = await generateContent(key1, prompt);

// Force rotation before second call
geminiKeyRotation.advanceKey();

// Second call uses different key
const { key: key2 } = geminiKeyRotation.getApiKey();
const result2 = await embedContent(key2, text);
```

### Consumers

Services that use key rotation:

| Service | Calls Per Operation | Uses advanceKey? |
|---------|-------------------|------------------|
| `llmService.js` | 1 (generate) | No |
| `vectorService.js` | 1 (embed) | No |
| `commentFilteringService.js` | 2+ (classify + embed) | **Yes** |
| `aiVerdictService.js` | 1–2 (generate + optional embed) | **Yes** |

---

## Monitoring

### `getStats()`

Returns current rotation state:

```javascript
{
  totalKeys: 3,
  currentKeyIndex: 1,
  requestCount: 3,
  rotateAfter: 5,
  isConfigured: true
}
```

### `isConfigured()`

Returns `true` if at least one API key is loaded. Used by services to check availability before attempting API calls.

### `reset()`

Resets to initial state:
```javascript
reset():
  this.currentKeyIndex = 0;
  this.requestCount = 0;
```

---

## Singleton Export

```javascript
const geminiKeyRotation = new GeminiKeyRotation();
module.exports = geminiKeyRotation;
```

Every `require('./geminiKeyRotation')` in the codebase gets the **same instance**, ensuring rotation state is globally consistent.

---

## Rate Limit Context

Google Gemini API has per-key rate limits:

| Tier | Requests/minute | Tokens/minute |
|------|----------------|---------------|
| Free | 15 RPM | 1M TPM |
| Pay-as-you-go | 360 RPM | 4M TPM |

With 3 keys and rotation every 5 requests:
- Effective burst capacity: 15 requests before full rotation cycle
- Keys get "rest" periods between rotation cycles
- Distributes load evenly across billing accounts (if separate)

---

## Design Decisions

### Why 5 requests before rotation?
A balance between key utilization and rate limit avoidance. Rotating after every single request would add overhead. Rotating after 5 keeps each key well under per-minute limits even under moderate load.

### Why a singleton?
Key rotation must be globally coordinated. If each service instantiated its own rotation manager, they'd independently track counters and could all use the same key simultaneously, defeating the purpose.

### Why `advanceKey()` exists separately from `rotateKey()`?
`rotateKey()` is an internal mechanism triggered by the request counter. `advanceKey()` is an explicit API for services that know they're about to make a second sequential call and want to proactively switch keys. Different intent, same effect.

### Why `filter(Boolean)` on keys?
Graceful degradation — if only 1 or 2 keys are configured (common in development), the system works with fewer keys rather than crashing. The modulo arithmetic handles any array length.
