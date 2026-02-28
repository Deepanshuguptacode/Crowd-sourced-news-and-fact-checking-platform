# 10 - Gemini API Key Rotation Service

## What You'll Learn
- Why API key rotation is essential
- How the rotation algorithm works
- Configuration and usage patterns
- Statistics and monitoring
- Error handling strategies

---

## Why Rotate API Keys?

### The Problem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THE RATE LIMIT PROBLEM                              │
└─────────────────────────────────────────────────────────────────────────────┘

Gemini API Rate Limits (Free Tier Example):
  • 15 requests per minute
  • 1,500 requests per day
  • 1 million tokens per minute

What Happens When Exceeded:
  Request #16 in same minute →
  ╔═══════════════════════════════════════════════════════════════════╗
  ║  ERROR 429: Too Many Requests                                      ║
  ║  "You have exceeded your quota. Please retry after 60 seconds."    ║
  ╚═══════════════════════════════════════════════════════════════════╝

Impact:
  ✗ Users get errors
  ✗ Fact-checking fails
  ✗ App becomes unusable during peak traffic
```

### The Solution: Key Rotation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THE ROTATION SOLUTION                               │
└─────────────────────────────────────────────────────────────────────────────┘

Instead of 1 key with 15 req/min limit:
  Use 3 keys with 15 req/min each = 45 req/min effective!

    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │   KEY 1     │     │   KEY 2     │     │   KEY 3     │
    │  15 req/min │     │  15 req/min │     │  15 req/min │
    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
           │                   │                   │
           └───────────────────┴───────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Rotation Service   │
                    │                     │
                    │  Request 1-5: KEY 1 │
                    │  Request 6-10: KEY 2│
                    │  Request 11-15: KEY3│
                    │  Request 16-20: KEY1│
                    │         ...         │
                    └─────────────────────┘

Benefits:
  ✓ 3x higher throughput
  ✓ Reduced rate limit errors
  ✓ Better user experience
  ✓ Load distribution
```

---

## File Location

**Location:** `backend/services/geminiKeyRotation.js`

---

## Class Architecture

```javascript
/**
 * Gemini API Key Rotation Service
 * 
 * This service manages multiple Gemini API keys and automatically rotates them
 * after every 5 requests to distribute load and avoid rate limits.
 */

require('dotenv').config();  // Load environment variables

class GeminiKeyRotation {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTOR: Initialize the rotation service
  // ═══════════════════════════════════════════════════════════════════════════
  
  constructor() {
    // Load API keys from environment variables
    this.apiKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ].filter(key => key && key.length > 0);
    // WHY filter: Remove undefined or empty keys
    // Result: Array of valid API keys only

    // Validate that we have at least one key
    if (this.apiKeys.length === 0) {
      console.warn('⚠️ No Gemini API keys found in environment variables!');
      console.warn('Please set GEMINI_API_KEY_1, GEMINI_API_KEY_2, and GEMINI_API_KEY_3 in .env file');
    }

    // Initialize rotation state
    this.currentKeyIndex = 0;       // Start with first key
    this.requestCount = 0;          // Requests made with current key
    this.maxRequestsPerKey = 5;     // Rotate after 5 requests
    this.totalRequests = 0;         // Total requests ever made

    console.log(`🔑 Gemini Key Rotation Service initialized with ${this.apiKeys.length} API keys`);
    console.log(`🔄 Will rotate after every ${this.maxRequestsPerKey} requests`);
  }
}
```

### Why These Default Values?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CONFIGURATION CHOICES                                  │
└─────────────────────────────────────────────────────────────────────────────┘

maxRequestsPerKey = 5
──────────────────────
  Why 5?
  
  Too low (1-2):
    ✗ Rotation overhead on every request
    ✗ Unnecessary switching
    ✗ Logging noise
    
  Too high (50-100):
    ✗ Single key gets overloaded
    ✗ May hit rate limits before rotating
    ✗ Uneven distribution
    
  5 is optimal:
    ✓ Quick rotation before limits
    ✓ Low overhead
    ✓ Even distribution across keys
    ✓ Easy to monitor (5 is visible pattern)

3 API Keys:
──────────────────────
  Why 3?
  
  1 key:
    ✗ No rotation benefit
    
  2 keys:
    ✓ Better, but limited
    
  3 keys:
    ✓ 3x throughput
    ✓ If one fails, 2 remain
    ✓ Good balance of complexity
    
  10+ keys:
    ✓ Higher throughput
    ✗ Harder to manage
    ✗ More env variables
    ✗ Overkill for most apps
```

---

## Core Methods

### Method 1: getApiKey()

**Purpose:** Get the current API key and manage rotation.

```javascript
getApiKey() {
  // ═══════════════════════════════════════════════════════════
  // STEP 1: VALIDATE KEYS EXIST
  // ═══════════════════════════════════════════════════════════
  if (this.apiKeys.length === 0) {
    console.error('❌ No API keys available!');
    return '';
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 2: GET CURRENT KEY
  // ═══════════════════════════════════════════════════════════
  const currentKey = this.apiKeys[this.currentKeyIndex];
  
  // ═══════════════════════════════════════════════════════════
  // STEP 3: INCREMENT COUNTERS
  // ═══════════════════════════════════════════════════════════
  this.requestCount++;
  this.totalRequests++;
  // WHY two counters:
  //   requestCount: Tracks requests on CURRENT key (resets on rotation)
  //   totalRequests: Tracks ALL requests ever (for stats)

  // ═══════════════════════════════════════════════════════════
  // STEP 4: LOG FOR MONITORING
  // ═══════════════════════════════════════════════════════════
  const maskedKey = this.maskApiKey(currentKey);
  console.log(`🔑 Using API Key ${this.currentKeyIndex + 1}/${this.apiKeys.length} (${maskedKey}) - Request ${this.requestCount}/${this.maxRequestsPerKey}`);
  // Output example:
  // 🔑 Using API Key 1/3 (AIzaSyD123...abcd) - Request 3/5

  // ═══════════════════════════════════════════════════════════
  // STEP 5: CHECK IF ROTATION NEEDED
  // ═══════════════════════════════════════════════════════════
  if (this.requestCount >= this.maxRequestsPerKey) {
    this.rotateKey();  // Switch to next key
  }

  return currentKey;
}
```

### Visual: getApiKey() Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        getApiKey() EXECUTION                                │
└─────────────────────────────────────────────────────────────────────────────┘

Request 1:
  currentKeyIndex = 0
  requestCount = 1
  Return: KEY_1 (AIzaSyD123...)
  
Request 2:
  currentKeyIndex = 0
  requestCount = 2
  Return: KEY_1 (AIzaSyD123...)
  
  ...
  
Request 5:
  currentKeyIndex = 0
  requestCount = 5
  requestCount >= 5 ← ROTATE!
  rotateKey() called
  Return: KEY_1 (still returns current before rotating)
  
Request 6:
  currentKeyIndex = 1  ← Now using KEY_2
  requestCount = 1     ← Reset
  Return: KEY_2 (AIzaSyE456...)
```

---

### Method 2: rotateKey()

**Purpose:** Switch to the next API key in the rotation.

```javascript
rotateKey() {
  const oldIndex = this.currentKeyIndex;
  
  // ═══════════════════════════════════════════════════════════
  // CIRCULAR ROTATION
  // ═══════════════════════════════════════════════════════════
  this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
  // Math breakdown:
  //   Index 0: (0 + 1) % 3 = 1
  //   Index 1: (1 + 1) % 3 = 2
  //   Index 2: (2 + 1) % 3 = 0  ← Wraps back to first!
  
  // ═══════════════════════════════════════════════════════════
  // RESET REQUEST COUNT
  // ═══════════════════════════════════════════════════════════
  this.requestCount = 0;
  // WHY: New key = new count

  // ═══════════════════════════════════════════════════════════
  // LOG THE ROTATION
  // ═══════════════════════════════════════════════════════════
  const oldKeyMasked = this.maskApiKey(this.apiKeys[oldIndex]);
  const newKeyMasked = this.maskApiKey(this.apiKeys[this.currentKeyIndex]);
  
  console.log(`🔄 Rotating API Key: ${oldKeyMasked} → ${newKeyMasked}`);
  console.log(`📊 Total requests served: ${this.totalRequests}`);
  // Output example:
  // 🔄 Rotating API Key: AIzaSyD123...abcd → AIzaSyE456...efgh
  // 📊 Total requests served: 15
}
```

### Visual: Modulo Rotation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CIRCULAR ROTATION WITH MODULO                             │
└─────────────────────────────────────────────────────────────────────────────┘

apiKeys = [KEY_1, KEY_2, KEY_3]
           index 0  index 1  index 2

Rotation sequence:
  
  ┌───┐     ┌───┐     ┌───┐     ┌───┐
  │ 0 │ ──► │ 1 │ ──► │ 2 │ ──► │ 0 │ ──► ...
  └───┘     └───┘     └───┘     └───┘
    │                             ▲
    └─────────── wraps around ────┘

Formula: (currentIndex + 1) % length

  (0 + 1) % 3 = 1
  (1 + 1) % 3 = 2
  (2 + 1) % 3 = 0  ← 3 % 3 = 0, back to start!
  (0 + 1) % 3 = 1
  ...and so on forever
```

---

### Method 3: maskApiKey()

**Purpose:** Hide sensitive parts of API key for logging.

```javascript
maskApiKey(key) {
  // ═══════════════════════════════════════════════════════════
  // VALIDATE KEY
  // ═══════════════════════════════════════════════════════════
  if (!key || key.length < 14) {
    return '****';
  }
  
  // ═══════════════════════════════════════════════════════════
  // CREATE MASKED VERSION
  // ═══════════════════════════════════════════════════════════
  return `${key.substring(0, 10)}...${key.substring(key.length - 4)}`;
  
  // Examples:
  // Input:  AIzaSyD7bGHj1234567890abcdefghijklmnop
  // Output: AIzaSyD7bG...mnop
  //         ↑          ↑
  //         first 10   last 4
}
```

### Why Mask Keys?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY BEST PRACTICE                              │
└─────────────────────────────────────────────────────────────────────────────┘

Problem: You want to log which key is being used, but...

❌ BAD: Logging full key
   console.log(`Using key: AIzaSyD7bGHj1234567890abcdefghijklmnop`)
   
   • If logs are exposed, key is stolen
   • Attacker can use your API quota
   • You pay for their usage!

✓ GOOD: Logging masked key
   console.log(`Using key: AIzaSyD7bG...mnop`)
   
   • Key is identifiable (you know which one)
   • But not usable (missing middle part)
   • Safe to log, share, display

Show enough to identify, hide enough to protect!
```

---

### Method 4: getStats()

**Purpose:** Get current rotation statistics for monitoring.

```javascript
getStats() {
  return {
    totalKeys: this.apiKeys.length,          // How many keys configured
    currentKeyIndex: this.currentKeyIndex,   // Which key we're on (0-based)
    requestsOnCurrentKey: this.requestCount, // Requests made with current key
    maxRequestsPerKey: this.maxRequestsPerKey, // When we rotate
    totalRequests: this.totalRequests,       // All-time request count
    currentKey: this.maskApiKey(this.apiKeys[this.currentKeyIndex])  // Masked current key
  };
}

// Example output:
// {
//   totalKeys: 3,
//   currentKeyIndex: 1,
//   requestsOnCurrentKey: 3,
//   maxRequestsPerKey: 5,
//   totalRequests: 48,
//   currentKey: "AIzaSyE456...efgh"
// }
```

---

### Method 5: Utility Methods

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// RESET: Clear all state (for testing)
// ═══════════════════════════════════════════════════════════════════════════
reset() {
  this.currentKeyIndex = 0;
  this.requestCount = 0;
  this.totalRequests = 0;
  console.log('🔄 Key rotation state reset');
}
// USE CASE: Unit tests that need fresh state

// ═══════════════════════════════════════════════════════════════════════════
// GET KEY BY INDEX: Direct access (for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════
getKeyByIndex(index) {
  if (index >= 0 && index < this.apiKeys.length) {
    return this.apiKeys[index];
  }
  return this.apiKeys[0] || '';
}
// USE CASE: Legacy code that needs specific key

// ═══════════════════════════════════════════════════════════════════════════
// IS CONFIGURED: Check if keys are available
// ═══════════════════════════════════════════════════════════════════════════
isConfigured() {
  return this.apiKeys.length > 0;
}
// USE CASE: Startup validation, feature flags
```

---

## Singleton Pattern

```javascript
// Create and export singleton instance
const geminiKeyRotation = new GeminiKeyRotation();

module.exports = geminiKeyRotation;
```

### Why Singleton?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SINGLETON PATTERN                                 │
└─────────────────────────────────────────────────────────────────────────────┘

The Problem Without Singleton:

  // In llmService.js
  const keyRotation1 = new GeminiKeyRotation();  // Instance 1
  
  // In aiVerdictService.js  
  const keyRotation2 = new GeminiKeyRotation();  // Instance 2
  
  // Each has separate state!
  keyRotation1.getApiKey()  // Returns KEY_1, count=1
  keyRotation2.getApiKey()  // Returns KEY_1, count=1 (not synchronized!)
  
  Result: No actual rotation because state is split!

The Solution With Singleton:

  // geminiKeyRotation.js exports ONE instance
  module.exports = new GeminiKeyRotation();
  
  // In llmService.js
  const keyRotation = require('./geminiKeyRotation');  // SAME instance
  
  // In aiVerdictService.js
  const keyRotation = require('./geminiKeyRotation');  // SAME instance!
  
  keyRotation.getApiKey()  // Returns KEY_1, count=1
  keyRotation.getApiKey()  // Returns KEY_1, count=2 (synchronized!)
  
  Result: True rotation across all services!
```

---

## Environment Configuration

```bash
# .env file

# Three Gemini API keys for rotation
GEMINI_API_KEY_1=AIzaSyD7bGHj1234567890abcdefghijklmnop
GEMINI_API_KEY_2=AIzaSyE8cIJk2345678901bcdefghijklmnopq
GEMINI_API_KEY_3=AIzaSyF9dKLm3456789012cdefghijklmnopqr
```

### How to Get Multiple API Keys

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GETTING 3 GEMINI API KEYS                                │
└─────────────────────────────────────────────────────────────────────────────┘

Option A: Same Google Account, Different Projects
───────────────────────────────────────────────────
  1. Go to Google Cloud Console
  2. Create Project 1 → Enable Gemini API → Create API Key 1
  3. Create Project 2 → Enable Gemini API → Create API Key 2
  4. Create Project 3 → Enable Gemini API → Create API Key 3
  
  Each project has separate quota!

Option B: Different Google Accounts
───────────────────────────────────────────────────
  1. Account A → Google Cloud → Create API Key 1
  2. Account B → Google Cloud → Create API Key 2
  3. Account C → Google Cloud → Create API Key 3
  
  Completely separate quotas!

Option C: Paid Tier with Higher Limits
───────────────────────────────────────────────────
  1. Use one key with paid Google Cloud billing
  2. Much higher rate limits
  3. May not need rotation at all
  4. But rotation still useful for redundancy
```

---

## Usage in Other Services

### In llmService.js:

```javascript
const geminiKeyRotation = require('./geminiKeyRotation');
const { GoogleGenAI } = require('@google/genai');

// Create AI instance with rotated key
function getAI() {
  const apiKey = geminiKeyRotation.getApiKey();  // Gets next key in rotation
  return new GoogleGenAI({ apiKey });
}

// Usage
async function classifyComment(comment) {
  const ai = getAI();  // Automatically uses rotating key
  const response = await ai.models.generateContent(...);
}
```

### In aiVerdictService.js:

```javascript
const geminiKeyRotation = require('./geminiKeyRotation');

async function callAIForVerdict(news, comments) {
  const ai = new GoogleGenAI({ 
    apiKey: geminiKeyRotation.getApiKey()  // Rotated key
  });
  // ... rest of implementation
}
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE ROTATION FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Application Startup:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ 1. Load .env                                                            │
  │ 2. Create singleton: new GeminiKeyRotation()                            │
  │ 3. Load 3 keys from environment                                         │
  │ 4. Initialize: currentKeyIndex=0, requestCount=0                        │
  │ 5. Log: "🔑 Initialized with 3 API keys"                                │
  └─────────────────────────────────────────────────────────────────────────┘

Request 1 (llmService):
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ geminiKeyRotation.getApiKey()                                           │
  │   • currentKeyIndex = 0                                                 │
  │   • requestCount = 1                                                    │
  │   • Return: KEY_1                                                       │
  └─────────────────────────────────────────────────────────────────────────┘

Request 2 (aiVerdictService):
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ geminiKeyRotation.getApiKey()                                           │
  │   • currentKeyIndex = 0 (same instance!)                                │
  │   • requestCount = 2                                                    │
  │   • Return: KEY_1                                                       │
  └─────────────────────────────────────────────────────────────────────────┘

... Requests 3, 4 ...

Request 5 (llmService):
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ geminiKeyRotation.getApiKey()                                           │
  │   • currentKeyIndex = 0                                                 │
  │   • requestCount = 5                                                    │
  │   • 5 >= 5 → ROTATE!                                                    │
  │   • rotateKey() called                                                  │
  │   • currentKeyIndex = 1                                                 │
  │   • requestCount = 0                                                    │
  │   • Log: "🔄 Rotating: KEY_1 → KEY_2"                                   │
  │   • Return: KEY_1 (returns current, rotates for next)                   │
  └─────────────────────────────────────────────────────────────────────────┘

Request 6:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ geminiKeyRotation.getApiKey()                                           │
  │   • currentKeyIndex = 1  ← Now on KEY_2!                                │
  │   • requestCount = 1                                                    │
  │   • Return: KEY_2                                                       │
  └─────────────────────────────────────────────────────────────────────────┘

... and so on ...
```

---

## Console Output Example

```
Server starting...
🔑 Gemini Key Rotation Service initialized with 3 API keys
🔄 Will rotate after every 5 requests

[User analyzes comment]
🔑 Using API Key 1/3 (AIzaSyD7bG...mnop) - Request 1/5

[User analyzes another comment]
🔑 Using API Key 1/3 (AIzaSyD7bG...mnop) - Request 2/5

[AI verdict generated]
🔑 Using API Key 1/3 (AIzaSyD7bG...mnop) - Request 3/5

[Comment classified]
🔑 Using API Key 1/3 (AIzaSyD7bG...mnop) - Request 4/5

[Another verdict]
🔑 Using API Key 1/3 (AIzaSyD7bG...mnop) - Request 5/5
🔄 Rotating API Key: AIzaSyD7bG...mnop → AIzaSyE8cI...opqr
📊 Total requests served: 5

[Next request]
🔑 Using API Key 2/3 (AIzaSyE8cI...opqr) - Request 1/5
```

---

## Interview Questions & Answers

### Q1: Why use modulo (%) for rotation?
**Answer:** Modulo creates circular behavior:
- `(0 + 1) % 3 = 1` (move to next)
- `(2 + 1) % 3 = 0` (wrap to first)

Without modulo, index would exceed array bounds. Modulo ensures automatic wrapping.

### Q2: Why mask API keys in logs?
**Answer:**
1. Security: Prevents key theft from log exposure
2. Compliance: Many security policies require it
3. Identifiability: Still shows which key (first 10 + last 4)
4. Safe sharing: Logs can be shared for debugging

### Q3: Why rotate every 5 requests, not every 1?
**Answer:**
1. Overhead: Creating new AI client has cost
2. Connection reuse: Same key can reuse connections
3. Logging noise: 1-per-request would flood logs
4. Effectiveness: 5 is frequent enough to distribute load

### Q4: What if one key fails or gets revoked?
**Answer:** Current implementation:
- Continue to next key on error
- Filter removes empty keys at startup
- Could add: automatic retry with different key

Enhancement idea:
```javascript
async getApiKeyWithRetry() {
  for (let i = 0; i < this.apiKeys.length; i++) {
    const key = this.getApiKey();
    if (await this.testKey(key)) return key;
    this.rotateKey();
  }
  throw new Error('All API keys failed');
}
```

### Q5: Is this thread-safe?
**Answer:** In Node.js single-threaded model, yes. JavaScript event loop processes one operation at a time. For multi-process (clusters), you'd need:
- Redis-based shared state, or
- Sticky sessions, or
- Process-specific key allocation

---

## Summary

- **GeminiKeyRotation** distributes API load across 3 keys
- **Rotates every 5 requests** to avoid rate limits
- **Singleton pattern** ensures all services share one state
- **Modulo rotation** creates circular key cycling
- **Key masking** provides security in logs
- **Statistics** enable monitoring and debugging

---

**Next: [11-COMMENT-FILTERING-SERVICE.md](./11-COMMENT-FILTERING-SERVICE.md)** - Comment analysis and grouping →
