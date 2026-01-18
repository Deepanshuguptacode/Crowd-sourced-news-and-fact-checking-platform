/**
 * Gemini API Key Rotation Service
 * 
 * This service manages multiple Gemini API keys and automatically rotates them
 * after every 5 requests to distribute load and avoid rate limits.
 * 
 * Features:
 * - Maintains 3 API keys loaded from environment variables
 * - Rotates to next key after 5 requests
 * - Thread-safe request counting
 * - Automatic initialization from .env
 */

require('dotenv').config();

class GeminiKeyRotation {
  constructor() {
    // Load API keys from environment variables
    this.apiKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ].filter(key => key && key.length > 0); // Filter out undefined or empty keys

    // Validate that we have at least one key
    if (this.apiKeys.length === 0) {
      console.warn('⚠️ No Gemini API keys found in environment variables!');
      console.warn('Please set GEMINI_API_KEY_1, GEMINI_API_KEY_2, and GEMINI_API_KEY_3 in .env file');
    }

    // Initialize rotation state
    this.currentKeyIndex = 0;
    this.requestCount = 0;
    this.maxRequestsPerKey = 5; // Rotate after 5 requests
    this.totalRequests = 0;

    console.log(`🔑 Gemini Key Rotation Service initialized with ${this.apiKeys.length} API keys`);
    console.log(`🔄 Will rotate after every ${this.maxRequestsPerKey} requests`);
  }

  /**
   * Get the current active API key and increment request counter
   * @returns {string} The current API key to use
   */
  getApiKey() {
    // If no keys available, return empty string
    if (this.apiKeys.length === 0) {
      console.error('❌ No API keys available!');
      return '';
    }

    // Get current key
    const currentKey = this.apiKeys[this.currentKeyIndex];
    
    // Increment request counters
    this.requestCount++;
    this.totalRequests++;

    // Log rotation info
    const maskedKey = this.maskApiKey(currentKey);
    console.log(`🔑 Using API Key ${this.currentKeyIndex + 1}/${this.apiKeys.length} (${maskedKey}) - Request ${this.requestCount}/${this.maxRequestsPerKey}`);

    // Check if we need to rotate to next key
    if (this.requestCount >= this.maxRequestsPerKey) {
      this.rotateKey();
    }

    return currentKey;
  }

  /**
   * Rotate to the next API key
   */
  rotateKey() {
    const oldIndex = this.currentKeyIndex;
    
    // Move to next key (circular rotation)
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    
    // Reset request count
    this.requestCount = 0;

    const oldKeyMasked = this.maskApiKey(this.apiKeys[oldIndex]);
    const newKeyMasked = this.maskApiKey(this.apiKeys[this.currentKeyIndex]);
    
    console.log(`🔄 Rotating API Key: ${oldKeyMasked} → ${newKeyMasked}`);
    console.log(`📊 Total requests served: ${this.totalRequests}`);
  }

  /**
   * Mask API key for logging (show only first 10 and last 4 characters)
   * @param {string} key - API key to mask
   * @returns {string} Masked API key
   */
  maskApiKey(key) {
    if (!key || key.length < 14) {
      return '****';
    }
    return `${key.substring(0, 10)}...${key.substring(key.length - 4)}`;
  }

  /**
   * Get current rotation statistics
   * @returns {object} Statistics object
   */
  getStats() {
    return {
      totalKeys: this.apiKeys.length,
      currentKeyIndex: this.currentKeyIndex,
      requestsOnCurrentKey: this.requestCount,
      maxRequestsPerKey: this.maxRequestsPerKey,
      totalRequests: this.totalRequests,
      currentKey: this.maskApiKey(this.apiKeys[this.currentKeyIndex])
    };
  }

  /**
   * Reset rotation state (useful for testing)
   */
  reset() {
    this.currentKeyIndex = 0;
    this.requestCount = 0;
    this.totalRequests = 0;
    console.log('🔄 Key rotation state reset');
  }

  /**
   * Get a specific key by index (for backward compatibility)
   * @param {number} index - Key index (0-based)
   * @returns {string} API key at the specified index
   */
  getKeyByIndex(index) {
    if (index >= 0 && index < this.apiKeys.length) {
      return this.apiKeys[index];
    }
    return this.apiKeys[0] || '';
  }

  /**
   * Check if keys are properly configured
   * @returns {boolean} True if at least one key is available
   */
  isConfigured() {
    return this.apiKeys.length > 0;
  }
}

// Create and export singleton instance
const geminiKeyRotation = new GeminiKeyRotation();

module.exports = geminiKeyRotation;
