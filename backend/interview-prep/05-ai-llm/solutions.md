# Module 05: AI/LLM Integration - Solutions

## Exercise 1: Prompt Builder Utility

```javascript
function buildClassificationPrompt(textToClassify, categories, examples = []) {
  let prompt = '';
  
  // Role and instruction
  prompt += 'You are a precise classification system. ';
  prompt += 'Classify the following text into exactly one of these categories:\n\n';
  
  // List categories
  prompt += 'Available Categories:\n';
  categories.forEach((cat, i) => {
    prompt += `${i + 1}. ${cat}\n`;
  });
  
  // Few-shot examples if provided
  if (examples.length > 0) {
    prompt += '\nExamples:\n';
    examples.forEach(ex => {
      prompt += `Text: "${ex.text}"\n`;
      prompt += `Category: ${ex.label}\n\n`;
    });
  }
  
  // The actual text to classify (clearly delimited)
  prompt += 'Text to classify:\n';
  prompt += '"""\n';
  prompt += textToClassify;
  prompt += '\n"""\n\n';
  
  // Output instructions
  prompt += 'Respond with only the category name, nothing else.';
  
  return prompt;
}

function buildStructuredPrompt(instruction, outputSchema, input) {
  let prompt = '';
  
  // Main instruction
  prompt += `${instruction}\n\n`;
  
  // Output format description
  prompt += 'Respond with a JSON object in this exact format:\n';
  prompt += '```json\n';
  prompt += JSON.stringify(outputSchema, null, 2);
  prompt += '\n```\n\n';
  
  // Input with delimiters
  prompt += 'Input to process:\n';
  prompt += '<input>\n';
  prompt += input;
  prompt += '\n</input>';
  
  return prompt;
}

// Example usage:
// buildClassificationPrompt(
//   "AI is dangerous",
//   ["Technology", "Safety", "Ethics"],
//   [{ text: "AI helps people", label: "Technology" }]
// )
```

---

## Exercise 2: LLM Response Parser

```javascript
function parseClassificationResponse(llmResponse, validCategories) {
  const result = {
    category: null,
    confidence: 0,
    raw: llmResponse,
    method: 'unknown'
  };
  
  // Try to extract from "Category: X" format
  const categoryMatch = llmResponse.match(/category:\s*(.+)/i);
  if (categoryMatch) {
    result.method = 'labelled';
    result.category = categoryMatch[1].trim();
  }
  
  // Try to parse as JSON
  if (!result.category) {
    try {
      const parsed = JSON.parse(llmResponse);
      if (parsed.category) {
        result.method = 'json';
        result.category = parsed.category;
        result.confidence = parsed.confidence || 0.5;
      }
    } catch {
      // Not valid JSON
    }
  }
  
  // Try to find exact match in response
  if (!result.category) {
    for (const cat of validCategories) {
      if (llmResponse.toLowerCase().includes(cat.toLowerCase())) {
        result.method = 'fuzzy';
        result.category = cat;
        break;
      }
    }
  }
  
  // Validate against valid categories
  if (result.category) {
    const matched = validCategories.find(
      c => c.toLowerCase() === result.category.toLowerCase()
    );
    result.category = matched || null;
    result.valid = !!matched;
  }
  
  return result;
}

function extractJsonFromResponse(response) {
  // Try to extract from markdown code block
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch {
      // Fall through
    }
  }
  
  // Try to find JSON object directly
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Fall through
    }
  }
  
  return null;
}
```

---

## Exercise 3: Simple LLM Client with Retry

```javascript
class SimpleLLMClient {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }
  
  async generate(prompt) {
    let lastError;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Simulate API call
        return await this.simulateAPICall(prompt);
        
      } catch (error) {
        lastError = error;
        
        // Check if retryable
        if (this.isRetryableError(error) && attempt < this.maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);  // Exponential backoff
          console.log(`Retrying after ${delay}ms...`);
          await this.delay(delay);
          continue;
        }
        
        // Non-retryable or out of retries
        throw error;
      }
    }
    
    throw lastError;
  }
  
  async simulateAPICall(prompt) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate occasional failures
        if (Math.random() < 0.3) {
          const error = new Error('Rate limit exceeded');
          error.code = 'RATE_LIMIT';
          reject(error);
        } else {
          resolve(`Response for: ${prompt.substring(0, 20)}...`);
        }
      }, 100);
    });
  }
  
  isRetryableError(error) {
    const retryableCodes = ['RATE_LIMIT', 'TIMEOUT', 'ECONNRESET', '503'];
    return retryableCodes.includes(error.code) || 
           error.message?.includes('rate limit') ||
           error.message?.includes('timeout');
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Exercise 4: API Key Rotation Manager

```javascript
class ApiKeyRotationManager {
  constructor(apiKeys, requestsPerKey = 5) {
    if (!apiKeys || apiKeys.length === 0) {
      throw new Error('At least one API key required');
    }
    this.keys = apiKeys;
    this.requestsPerKey = requestsPerKey;
    this.currentIndex = 0;
    this.requestCount = 0;
    this.totalRotations = 0;
  }
  
  getNextKey() {
    const key = this.keys[this.currentIndex];
    
    this.requestCount++;
    
    if (this.requestCount >= this.requestsPerKey) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      this.requestCount = 0;
      this.totalRotations++;
      console.log(`🔄 Rotated to key index ${this.currentIndex}`);
    }
    
    return key;
  }
  
  markCurrentKeyExhausted() {
    console.log(`⚠️ Marking key ${this.currentIndex} as exhausted`);
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    this.requestCount = 0;
    this.totalRotations++;
  }
  
  getStats() {
    return {
      totalKeys: this.keys.length,
      currentIndex: this.currentIndex,
      currentKeyRequests: this.requestCount,
      requestsPerKey: this.requestsPerKey,
      totalRotations: this.totalRotations,
      keysAvailable: this.keys.length - 1  // Assuming current is in use
    };
  }
}
```

---

## Exercise 5: Content Moderation System

```javascript
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
  
  async moderate(content, context = '') {
    const prompt = this.buildModerationPrompt(content, context);
    const response = await this.llmClient.generate(prompt);
    
    return this.parseModerationResponse(response);
  }
  
  buildModerationPrompt(content, context) {
    return `
You are a content moderator. Analyze the following content for policy violations.

Categories to check:
- hate_speech: Content that attacks protected groups
- harassment: Targeted abuse or intimidation
- spam: Unwanted promotional content
- misinformation: Demonstrably false claims
- off_topic: Content unrelated to discussion

Content to analyze:
"""
${content}
"""

${context ? `Context: ${context}` : ''}

Respond in JSON format:
{
  "approved": boolean,
  "violations": ["category1", "category2"],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}
`;
  }
  
  parseModerationResponse(response) {
    try {
      const parsed = JSON.parse(response);
      return {
        approved: parsed.approved ?? true,
        violations: parsed.violations || [],
        confidence: parsed.confidence ?? 0.5,
        reasoning: parsed.reasoning || ''
      };
    } catch {
      // Fallback: approve if parsing fails
      return {
        approved: true,
        violations: [],
        confidence: 0,
        reasoning: 'Parse error - defaulting to approved'
      };
    }
  }
  
  async moderateBatch(items) {
    const prompt = this.buildBatchPrompt(items);
    const response = await this.llmClient.generate(prompt);
    return this.parseBatchResponse(response, items.length);
  }
  
  buildBatchPrompt(items) {
    return `
Analyze ${items.length} items for content policy violations.

${items.map((item, i) => `
Item ${i + 1} (ID: ${item.id}):
"""
${item.content}
"""
`).join('\n')}

Respond with a JSON array where each element corresponds to an item:
[
  { "approved": boolean, "violations": [], "confidence": 0.0-1.0 },
  ...
]
`;
  }
  
  parseBatchResponse(response, expectedCount) {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed) && parsed.length === expectedCount) {
        return parsed;
      }
    } catch {
      // Fall through
    }
    // Fallback: approve all
    return Array(expectedCount).fill({ approved: true, violations: [] });
  }
}
```

---

## Exercise 6: Conversation Summarizer

```javascript
class ConversationSummarizer {
  constructor(llmClient, options = {}) {
    this.llmClient = llmClient;
    this.maxSummaryLength = options.maxSummaryLength || 200;
  }
  
  async summarize(comments) {
    // Sort by timestamp
    const sorted = [...comments].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    const formatted = sorted.map((c, i) => 
      `${i + 1}. [${c.author}] ${c.text}`
    ).join('\n');
    
    const prompt = `
Summarize the following conversation in at most ${this.maxSummaryLength} characters.
Focus on the main topics discussed and key points made.

Conversation:
${formatted}

Summary:`;

    const response = await this.llmClient.generate(prompt);
    return response.trim().substring(0, this.maxSummaryLength);
  }
  
  async extractKeyPoints(arguments_) {
    const formatted = arguments_.map((a, i) =>
      `${i + 1}. [${a.stance}] ${a.text}`
    ).join('\n');
    
    const prompt = `
Extract the main arguments from this discussion.
Group them by stance (for/against).

Arguments:
${formatted}

Respond in JSON format:
{
  "for": ["argument 1", "argument 2"],
  "against": ["counter argument 1"],
  "neutral": []
}
`;

    const response = await this.llmClient.generate(prompt);
    
    try {
      return JSON.parse(response);
    } catch {
      return { for: [], against: [], neutral: [] };
    }
  }
}
```

---

## Exercise 7: LLM Output Validator

```javascript
class LLMOutputValidator {
  validateSchema(output, schema) {
    const errors = [];
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in output)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }
    
    // Check types
    for (const [field, value] of Object.entries(output)) {
      const expectedType = schema.properties?.[field]?.type;
      if (expectedType && typeof value !== expectedType) {
        errors.push(`Field ${field} should be ${expectedType}, got ${typeof value}`);
      }
      
      // Check enum constraints
      const enumValues = schema.properties?.[field]?.enum;
      if (enumValues && !enumValues.includes(value)) {
        errors.push(`Field ${field} value "${value}" not in enum [${enumValues.join(', ')}]`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized: this.sanitizeObject(output)
    };
  }
  
  sanitizeObject(obj) {
    // Remove any fields not in expected schema
    const sanitized = {};
    for (const key of Object.keys(schema.properties || {})) {
      if (key in obj) {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  }
  
  sanitizeText(text) {
    if (typeof text !== 'string') return '';
    
    return text
      .replace(/[<>]/g, '')  // Remove potential HTML tags
      .substring(0, 10000)    // Limit length
      .trim();
  }
  
  checkHallucination(response, context) {
    const indicators = {
      uncertain: ['maybe', 'perhaps', 'i think', 'possibly', 'might be'],
      contradictions: [],
      fabrications: []
    };
    
    const lowerResponse = response.toLowerCase();
    
    // Check for uncertain language
    const hasUncertainLanguage = indicators.uncertain.some(word => 
      lowerResponse.includes(word)
    );
    
    // Check if response mentions facts not in context
    const suspiciousPatterns = [
      /according to [^,]+,/,
      /studies show/,
      /research indicates/
    ];
    
    const hasSuspiciousPatterns = suspiciousPatterns.some(pattern => 
      pattern.test(response)
    );
    
    return {
      suspicious: hasUncertainLanguage || hasSuspiciousPatterns,
      reasons: [
        ...(hasUncertainLanguage ? ['Contains uncertain language'] : []),
        ...(hasSuspiciousPatterns ? ['Makes claims without source in context'] : [])
      ]
    };
  }
}
```

---

## Exercise 8: Token Estimator

```javascript
function estimateTokens(text) {
  // Rough estimation: 1 token ≈ 4 characters for English
  // More accurate: ~0.75 tokens per word
  
  const charEstimate = Math.ceil(text.length / 4);
  const wordEstimate = Math.ceil(text.split(/\s+/).length * 0.75);
  
  // Use average of both methods
  return Math.round((charEstimate + wordEstimate) / 2);
}

function truncateToTokenLimit(text, maxTokens) {
  const maxChars = maxTokens * 4;  // Rough estimate
  
  if (text.length <= maxChars) {
    return text;
  }
  
  // Try to break at sentence boundary
  const truncated = text.substring(0, maxChars);
  const lastSentence = truncated.match(/.*[.!?]/);
  
  if (lastSentence && lastSentence[0].length > maxChars * 0.5) {
    return lastSentence[0] + ' ... [truncated]';
  }
  
  // Break at word boundary
  const lastWord = truncated.match(/.*\s/);
  if (lastWord) {
    return lastWord[0].trim() + ' ... [truncated]';
  }
  
  return truncated + ' ... [truncated]';
}
```

---

## Exercise 9: Classification Fallback Chain

```javascript
class ClassificationFallbackChain {
  constructor(vectorService, llmClient) {
    this.vectorService = vectorService;
    this.llmClient = llmClient;
  }
  
  async classifyWithFallback(text, categories) {
    // Level 1: Vector search (fastest, cheapest)
    try {
      const vectorMatch = await this.vectorService?.findSimilar(text);
      if (vectorMatch && vectorMatch.score >= 0.75) {
        return {
          category: vectorMatch.category,
          confidence: vectorMatch.score,
          method: 'vector'
        };
      }
    } catch (error) {
      console.log('Vector search failed:', error.message);
    }
    
    // Level 2: LLM classification
    try {
      const prompt = `Classify into one of: ${categories.join(', ')}\n\nText: ${text}`;
      const response = await this.llmClient.generate(prompt);
      const category = response.trim();
      
      if (categories.includes(category)) {
        return {
          category,
          confidence: 0.8,
          method: 'llm'
        };
      }
    } catch (error) {
      console.log('LLM classification failed:', error.message);
    }
    
    // Level 3: Keyword matching (always works)
    const keywordResult = this.keywordClassify(text, categories);
    return {
      ...keywordResult,
      method: 'keyword'
    };
  }
  
  keywordClassify(text, categories) {
    const words = text.toLowerCase().split(/\W+/);
    const scores = {};
    
    for (const category of categories) {
      const catWords = category.toLowerCase().split(/\W+/);
      const matches = words.filter(w => catWords.includes(w)).length;
      scores[category] = matches;
    }
    
    const best = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      category: best[0],
      confidence: best[1] > 0 ? 0.5 : 0.3
    };
  }
}
```

---

## Exercise 10: Prompt Versioning System

```javascript
class PromptVersionManager {
  constructor() {
    this.versions = new Map();
  }
  
  register(name, version, prompt) {
    if (!this.versions.has(name)) {
      this.versions.set(name, new Map());
    }
    this.versions.get(name).set(version, prompt);
  }
  
  get(name, version) {
    const versions = this.versions.get(name);
    if (!versions) return null;
    
    if (version) {
      return versions.get(version);
    }
    
    // Get latest version
    const sortedVersions = Array.from(versions.keys()).sort((a, b) => b - a);
    return versions.get(sortedVersions[0]);
  }
  
  render(name, variables, version) {
    const template = this.get(name, version);
    if (!template) throw new Error(`Prompt ${name} not found`);
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }
}

// Usage:
// const manager = new PromptVersionManager();
// manager.register('classify', 1, 'Classify: {{text}} into {{categories}}');
// const prompt = manager.render('classify', { text: 'AI is good', categories: 'Tech' });
```
