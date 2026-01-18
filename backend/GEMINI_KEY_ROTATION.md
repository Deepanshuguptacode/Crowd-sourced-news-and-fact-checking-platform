# Gemini API Key Rotation System

## Overview

This system implements automatic API key rotation for Google's Gemini AI service to:
- Distribute load across multiple API keys
- Avoid rate limits on individual keys
- Improve service reliability and availability
- Track usage statistics

## Configuration

### Environment Variables

Add 3 Gemini API keys to your `.env` file:

```env
# Gemini AI API Keys (3 keys for rotation)
GEMINI_API_KEY_1=your_first_api_key_here
GEMINI_API_KEY_2=your_second_api_key_here
GEMINI_API_KEY_3=your_third_api_key_here
```

**Get API keys from:** https://ai.google.dev/

## How It Works

### Rotation Logic

1. **Initialization**: The service loads all 3 API keys from environment variables
2. **Request Tracking**: Each API call increments a request counter
3. **Automatic Rotation**: After 5 requests, the service automatically switches to the next key
4. **Circular Rotation**: Keys rotate in a circular manner (1 → 2 → 3 → 1...)

### Request Counter

- **Current Key Index**: 0-2 (which of the 3 keys is active)
- **Request Count**: 1-5 (requests on current key)
- **Total Requests**: Cumulative count across all keys

## Usage

### In Service Files

The rotation service is automatically used in all AI service files:

```javascript
const geminiKeyRotation = require('./geminiKeyRotation');

// Get AI instance with rotated key
const getAI = () => new GoogleGenAI({ 
  apiKey: geminiKeyRotation.getApiKey()
});

// Use in your code
const ai = getAI();
const response = await ai.models.generateContent({
  model: 'gemini-3.0-flash',
  // ... rest of your configuration
});
```

### Files Using Rotation

All these service files now use the rotation system:

- `services/geminiKeyRotation.js` - Core rotation service
- `services/generateGroupContent.js` - Comment group content generation
- `services/findCounterGroup.js` - Counter group finding
- `services/findCounterGroup-new.js` - New counter group logic
- `services/classifyComment.js` - Comment classification
- `services/aiVerdictService.js` - AI verdict generation
- `services/llmService.js` - General LLM services

## Model Updates

All services have been updated to use:
- **Model**: `gemini-3.0-flash` (updated from `gemini-2.5-flash`)

## API Reference

### `geminiKeyRotation.getApiKey()`

Get the current active API key and increment request counter.

**Returns:** `string` - The current API key

**Example:**
```javascript
const apiKey = geminiKeyRotation.getApiKey();
```

### `geminiKeyRotation.getStats()`

Get current rotation statistics.

**Returns:** `object`
```javascript
{
  totalKeys: 3,              // Number of configured keys
  currentKeyIndex: 0,        // Current key index (0-2)
  requestsOnCurrentKey: 3,   // Requests on current key
  maxRequestsPerKey: 5,      // Max requests before rotation
  totalRequests: 13,         // Total requests served
  currentKey: "AIzaSyAKC_...bbU"  // Masked current key
}
```

### `geminiKeyRotation.isConfigured()`

Check if API keys are properly configured.

**Returns:** `boolean` - True if at least one key is available

**Example:**
```javascript
if (geminiKeyRotation.isConfigured()) {
  // Use Gemini API
} else {
  // Fallback to alternative logic
}
```

### `geminiKeyRotation.reset()`

Reset rotation state (useful for testing).

**Example:**
```javascript
geminiKeyRotation.reset();
```

## Console Output

The rotation service provides detailed logging:

```
🔑 Gemini Key Rotation Service initialized with 3 API keys
🔄 Will rotate after every 5 requests
🔑 Using API Key 1/3 (AIzaSyAKC_...bbU) - Request 1/5
🔑 Using API Key 1/3 (AIzaSyAKC_...bbU) - Request 2/5
🔑 Using API Key 1/3 (AIzaSyAKC_...bbU) - Request 5/5
🔄 Rotating API Key: AIzaSyAKC_...bbU → AIzaSyCBp-...2q8
📊 Total requests served: 5
🔑 Using API Key 2/3 (AIzaSyCBp-...2q8) - Request 1/5
```

## Security

- API keys are **never logged** in full - only first 10 and last 4 characters
- Environment variables should be kept in `.env` file (not committed to git)
- `.env` file is in `.gitignore` to prevent accidental commits

## Benefits

1. **Load Distribution**: Spreads requests across 3 keys
2. **Rate Limit Avoidance**: Reduces chance of hitting individual key limits
3. **High Availability**: If one key fails, others can continue
4. **Visibility**: Detailed logging for debugging and monitoring
5. **Flexibility**: Easy to adjust rotation frequency (change `maxRequestsPerKey`)

## Customization

To change rotation frequency, edit `geminiKeyRotation.js`:

```javascript
this.maxRequestsPerKey = 10; // Change from 5 to 10 requests
```

## Troubleshooting

### No API Keys Found

```
⚠️ No Gemini API keys found in environment variables!
Please set GEMINI_API_KEY_1, GEMINI_API_KEY_2, and GEMINI_API_KEY_3 in .env file
```

**Solution**: Add all 3 API keys to your `.env` file

### Rate Limit Still Hit

If you still hit rate limits, consider:
1. Increasing number of API keys (add KEY_4, KEY_5, etc.)
2. Decreasing `maxRequestsPerKey` value
3. Adding delay between requests

## Migration Notes

### Removed

- ❌ Hardcoded API keys (`AIzaSyCBp-890BKo0InjWvJLOI9Xh-8JWvK02q8`)
- ❌ Single `GEMINI_API_KEY` environment variable
- ❌ Old model reference `gemini-2.5-flash`

### Added

- ✅ Three API keys: `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`
- ✅ Automatic rotation service
- ✅ Request tracking and statistics
- ✅ Updated model: `gemini-3.0-flash`

## Testing

To test the rotation system:

```javascript
const geminiKeyRotation = require('./services/geminiKeyRotation');

// Check configuration
console.log('Configured:', geminiKeyRotation.isConfigured());

// Get stats
console.log('Stats:', geminiKeyRotation.getStats());

// Simulate 10 requests
for (let i = 0; i < 10; i++) {
  const key = geminiKeyRotation.getApiKey();
  console.log(`Request ${i + 1}: ${key}`);
}

// Check final stats
console.log('Final stats:', geminiKeyRotation.getStats());
```

## Support

For issues or questions about the rotation system:
1. Check console logs for detailed error messages
2. Verify all 3 API keys are valid and active
3. Review the statistics with `geminiKeyRotation.getStats()`
4. Check API key quotas in Google AI Studio

---

**Last Updated:** January 18, 2026
**Version:** 1.0.0
