# Quick Start Guide - Gemini API Key Rotation

## 🚀 Getting Started in 3 Steps

### Step 1: Update Your `.env` File

Open `backend/.env` and ensure you have all 3 Gemini API keys:

```env
# Gemini AI API Keys (3 keys for rotation)
GEMINI_API_KEY_1=your_first_api_key_here
GEMINI_API_KEY_2=your_second_api_key_here
GEMINI_API_KEY_3=your_third_api_key_here
```

**Where to get API keys:** https://ai.google.dev/

---

### Step 2: Test the Rotation System

Run the test script to verify everything works:

```bash
cd backend
node test-key-rotation.js
```

**Expected Output:**
```
============================================================
GEMINI API KEY ROTATION TEST
============================================================

Test 1: Configuration Check
------------------------------------------------------------
✓ Keys configured: true

Test 2: Initial Statistics
------------------------------------------------------------
Initial Stats: {
  "totalKeys": 3,
  "currentKeyIndex": 0,
  "requestsOnCurrentKey": 0,
  "maxRequestsPerKey": 5,
  "totalRequests": 0
}

Test 3: Simulating 12 API Requests
------------------------------------------------------------
Request 01: Key 1 - AIzaSyAKC_ntqE...bbU
Request 02: Key 1 - AIzaSyAKC_ntqE...bbU
...
Request 05: Key 1 - AIzaSyAKC_ntqE...bbU
  ↳ 🔄 Rotation triggered after 5 requests
Request 06: Key 2 - AIzaSyCBp-890B...2q8
...
```

---

### Step 3: Start Your Backend

```bash
cd backend
npm start
```

**Look for these messages:**
```
🔑 Gemini Key Rotation Service initialized with 3 API keys
🔄 Will rotate after every 5 requests
✓ Connected to MongoDB successfully
✓ Server running on port 3000
```

---

## ✅ Verification

Your rotation system is working if you see:

1. ✅ **Initialization Message**
   ```
   🔑 Gemini Key Rotation Service initialized with 3 API keys
   ```

2. ✅ **Environment Check Shows All Keys**
   ```
   GEMINI_API_KEY_1: ✓ Set
   GEMINI_API_KEY_2: ✓ Set
   GEMINI_API_KEY_3: ✓ Set
   ```

3. ✅ **Rotation Messages During Operation**
   ```
   🔑 Using API Key 1/3 (AIzaSyAKC_...bbU) - Request 1/5
   🔄 Rotating API Key: AIzaSyAKC_...bbU → AIzaSyCBp-...2q8
   ```

---

## 🎯 What Changed?

### Before
- ❌ Single hardcoded API key
- ❌ Old model: `gemini-2.5-flash`
- ❌ No rotation
- ❌ Risk of rate limits

### After
- ✅ 3 API keys with automatic rotation
- ✅ New model: `gemini-3.0-flash`
- ✅ Rotates every 5 requests
- ✅ Better rate limit handling

---

## 📊 Monitor Your System

### Get Current Statistics

Add this to any service file:

```javascript
const geminiKeyRotation = require('./geminiKeyRotation');
console.log(geminiKeyRotation.getStats());
```

**Output:**
```javascript
{
  totalKeys: 3,
  currentKeyIndex: 1,        // Currently using Key 2
  requestsOnCurrentKey: 3,   // 3 requests so far on this key
  maxRequestsPerKey: 5,      // Will rotate at 5
  totalRequests: 8,          // 8 total requests served
  currentKey: "AIzaSyCBp-...2q8"
}
```

---

## 🔧 Troubleshooting

### Problem: "No API keys found"

```
⚠️ No Gemini API keys found in environment variables!
```

**Solution:**
1. Check your `.env` file has all 3 keys
2. Restart your backend server
3. Verify key format (should start with `AIzaSy...`)

---

### Problem: API key invalid

```
Error: API key not valid
```

**Solution:**
1. Go to https://ai.google.dev/
2. Generate new API keys
3. Update your `.env` file
4. Restart backend

---

### Problem: Rotation not visible

**Solution:**
1. Make at least 5 API calls
2. Check console logs for rotation messages
3. Verify logs aren't filtered

---

## 📚 More Information

- **Full Documentation:** [GEMINI_KEY_ROTATION.md](GEMINI_KEY_ROTATION.md)
- **Implementation Details:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Test Script:** [test-key-rotation.js](test-key-rotation.js)

---

## 🎉 You're All Set!

Your Gemini API key rotation system is now active and will:
- ✅ Automatically rotate keys every 5 requests
- ✅ Use the latest `gemini-3.0-flash` model
- ✅ Log detailed rotation information
- ✅ Track usage statistics
- ✅ Handle rate limits better

**Happy Coding! 🚀**
