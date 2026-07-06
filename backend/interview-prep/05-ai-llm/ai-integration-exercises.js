/**
 * Module 05: AI/LLM Integration Coding Exercises
 * 
 * Practice implementing LLM integrations and prompt engineering.
 */

// ============================================================================
// EXERCISE 1: Prompt Builder Utility
// ============================================================================

/**
 * Build a classification prompt with examples
 * @param {string} textToClassify - The text to classify
 * @param {Array<string>} categories - Available categories
 * @param {Array<{text: string, label: string}>} examples - Few-shot examples
 * @returns {string} Formatted prompt
 */
function buildClassificationPrompt(textToClassify, categories, examples = []) {
  // Your code here
  // Include examples section if provided
  // List available categories
  // Include the text to classify with clear delimiters
  
}

/**
 * Build a structured output prompt
 * @param {string} instruction - Main instruction
 * @param {Object} outputSchema - Expected output format
 * @param {string} input - Input to process
 * @returns {string} Formatted prompt
 */
function buildStructuredPrompt(instruction, outputSchema, input) {
  // Your code here
  // Include instruction
  // Describe output format clearly
  // Include input with delimiters
  
}

// ============================================================================
// EXERCISE 2: LLM Response Parser
// ============================================================================

/**
 * Parse LLM response for classification task
 * Expected formats: "Category: X" or JSON {"category": "X"}
 * @param {string} llmResponse - Raw LLM output
 * @param {Array<string>} validCategories - Valid categories to validate against
 * @returns {Object} Parsed result with category and confidence
 */
function parseClassificationResponse(llmResponse, validCategories) {
  // Your code here
  // Try to extract category from different formats
  // Validate against validCategories
  // Return { category, confidence, raw: response }
  
}

/**
 * Extract JSON from LLM response (handles markdown code blocks)
 * @param {string} response - LLM response that may contain JSON
 * @returns {Object|null} Parsed JSON or null
 */
function extractJsonFromResponse(response) {
  // Your code here
  // Handle markdown code blocks ```json ... ```
  // Handle plain JSON
  // Return parsed object or null
  
}

// ============================================================================
// EXERCISE 3: Simple LLM Client with Retry
// ============================================================================

/**
 * Create a simple LLM client with retry logic
 * Simulates calling an LLM API with exponential backoff
 */
class SimpleLLMClient {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }
  
  /**
   * Generate response with retry logic
   * @param {string} prompt - Input prompt
   * @returns {Promise<string>} LLM response
   */
  async generate(prompt) {
    // Your code here
    // Simulate API call (use setTimeout)
    // Implement exponential backoff on "rate limit" errors
    // Return response after success
    
  }
  
  /**
   * Delay helper
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// EXERCISE 4: API Key Rotation Manager
// ============================================================================

/**
 * Manage multiple API keys with rotation
 * Similar to VoxVeritas geminiKeyRotation
 */
class ApiKeyRotationManager {
  constructor(apiKeys, requestsPerKey = 5) {
    this.keys = apiKeys;
    this.requestsPerKey = requestsPerKey;
    this.currentIndex = 0;
    this.requestCount = 0;
  }
  
  /**
   * Get next API key using round-robin
   * @returns {string} API key to use
   */
  getNextKey() {
    // Your code here
    // Return current key
    // Increment counter
    // Rotate when limit reached
    
  }
  
  /**
   * Mark current key as exhausted/rate-limited
   * Force rotation to next key
   */
  markCurrentKeyExhausted() {
    // Your code here
    // Move to next key immediately
    // Reset counter
    
  }
  
  /**
   * Get stats on key usage
   * @returns {Object} Usage statistics
   */
  getStats() {
    // Your code here
    // Return current key index, total rotations, etc.
    
  }
}

// ============================================================================
// EXERCISE 5: Content Moderation System
// ============================================================================

/**
 * Implement a content moderation system using LLM
 */
class ContentModerator {
  constructor(llmClient) {
    this.llmClient = llmClient;
    this.violationCategories = [
      'hate_speech',
      'harassment',
      'spam',
      'misinformation',
      'off_topic'
    ];
  }
  
  /**
   * Moderate content and return decision
   * @param {string} content - Content to moderate
   * @param {string} context - Additional context (optional)
   * @returns {Promise<Object>} Moderation result
   */
  async moderate(content, context = '') {
    // Your code here
    // Build moderation prompt
    // Call LLM
    // Parse result
    // Return { approved: boolean, violations: [], confidence: number }
    
  }
  
  /**
   * Batch moderate multiple items
   * @param {Array<{id: string, content: string}>} items
   * @returns {Promise<Array>} Moderation results
   */
  async moderateBatch(items) {
    // Your code here
    // Build batch prompt
    // Call LLM once for all items
    // Parse and return individual results
    
  }
}

// ============================================================================
// EXERCISE 6: Conversation Summarizer
// ============================================================================

/**
 * Summarize a conversation thread
 * Useful for debate room summaries in VoxVeritas
 */
class ConversationSummarizer {
  constructor(llmClient, options = {}) {
    this.llmClient = llmClient;
    this.maxSummaryLength = options.maxSummaryLength || 200;
  }
  
  /**
   * Summarize a list of comments
   * @param {Array<{author: string, text: string, timestamp: Date}>} comments
   * @returns {Promise<string>} Summary
   */
  async summarize(comments) {
    // Your code here
    // Format comments chronologically
    // Build summarization prompt
    // Call LLM
    // Return summary
    
  }
  
  /**
   * Extract key points/arguments from discussion
   * @param {Array<{stance: string, text: string}>} arguments_
   * @returns {Promise<Array>} Key points with stances
   */
  async extractKeyPoints(arguments_) {
    // Your code here
    // Build prompt to identify main arguments
    // Group by stance (for/against)
    // Return structured key points
    
  }
}

// ============================================================================
// EXERCISE 7: LLM Output Validator
// ============================================================================

/**
 * Validate and sanitize LLM outputs
 */
class LLMOutputValidator {
  /**
   * Validate that output matches expected schema
   * @param {Object} output - LLM output object
   * @param {Object} schema - Expected schema
   * @returns {Object} Validation result
   */
  validateSchema(output, schema) {
    // Your code here
    // Check required fields exist
    // Validate types
    // Check enum constraints
    // Return { valid: boolean, errors: [], sanitized: object }
    
  }
  
  /**
   * Sanitize text output (remove unsafe content)
   * @param {string} text - Raw LLM output
   * @returns {string} Sanitized text
   */
  sanitizeText(text) {
    // Your code here
    // Remove potential injection patterns
    // Limit length
    // Clean up whitespace
    
  }
  
  /**
   * Check for hallucination indicators
   * @param {string} response - LLM response
   * @param {Object} context - Original context/prompt
   * @returns {Object} Hallucination check result
   */
  checkHallucination(response, context) {
    // Your code here
    // Check if response contradicts known facts in context
    // Look for uncertain language ("maybe", "perhaps", "I think")
    // Return { suspicious: boolean, reasons: [] }
    
  }
}

// ============================================================================
// EXERCISE 8: Token Estimator
// ============================================================================

/**
 * Simple token estimation for cost management
 * Roughly 4 characters per token for English text
 */
function estimateTokens(text) {
  // Your code here
  // Estimate based on word count or character count
  // Return approximate token count
  
}

/**
 * Truncate text to fit within token limit
 * @param {string} text - Original text
 * @param {number} maxTokens - Maximum tokens allowed
 * @returns {string} Truncated text
 */
function truncateToTokenLimit(text, maxTokens) {
  // Your code here
  // Estimate tokens
  // Truncate if over limit (try to break at sentence boundary)
  // Add truncation indicator
  
}

// ============================================================================
// EXERCISE 9: Fallback Chain Implementation
// ============================================================================

/**
 * Implement a fallback chain for classification
 * Tries multiple methods in order until one succeeds
 */
class ClassificationFallbackChain {
  constructor(vectorService, llmClient) {
    this.vectorService = vectorService;
    this.llmClient = llmClient;
  }
  
  /**
   * Classify with fallback chain
   * 1. Try vector search
   * 2. Try LLM classification
   * 3. Use keyword matching
   * @param {string} text - Text to classify
   * @param {Array<string>} categories - Available categories
   * @returns {Promise<Object>} Classification result
   */
  async classifyWithFallback(text, categories) {
    // Your code here
    // Try vector search first (if available)
    // If no match, try LLM
    // If LLM fails, use keyword matching
    // Return result with method used
    
  }
  
  /**
   * Simple keyword-based classification
   * @param {string} text
   * @param {Array<string>} categories
   * @returns {Object} Best matching category
   */
  keywordClassify(text, categories) {
    // Your code here
    // Split text into words
    // Count keyword overlap with each category
    // Return best match
    
  }
}

// ============================================================================
// EXERCISE 10: Prompt Versioning System
// ============================================================================

/**
 * Manage different versions of prompts for A/B testing
 */
class PromptVersionManager {
  constructor() {
    this.versions = new Map();
  }
  
  /**
   * Register a prompt version
   * @param {string} name - Prompt name
   * @param {number} version - Version number
   * @param {string} prompt - Prompt template
   */
  register(name, version, prompt) {
    // Your code here
    
  }
  
  /**
   * Get prompt by name and version
   * @param {string} name
   * @param {number} version - If not specified, get latest
   * @returns {string} Prompt template
   */
  get(name, version) {
    // Your code here
    
  }
  
  /**
   * Render prompt with variables
   * @param {string} name
   * @param {Object} variables - Variables to substitute
   * @returns {string} Rendered prompt
   */
  render(name, variables, version) {
    // Your code here
    // Get template
    // Replace {{variable}} with values
    // Return rendered prompt
    
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  buildClassificationPrompt,
  buildStructuredPrompt,
  parseClassificationResponse,
  extractJsonFromResponse,
  SimpleLLMClient,
  ApiKeyRotationManager,
  ContentModerator,
  ConversationSummarizer,
  LLMOutputValidator,
  estimateTokens,
  truncateToTokenLimit,
  ClassificationFallbackChain,
  PromptVersionManager
};
