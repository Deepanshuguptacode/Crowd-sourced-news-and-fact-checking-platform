# Module 05: AI/LLM Integration Interview Questions

## Section A: LLM Fundamentals

### Q1: What is the difference between embeddings and LLM generation?

**Answer:**

| Embeddings | LLM Generation |
|------------|----------------|
| **Output:** Vector (numbers) | **Output:** Text |
| **Purpose:** Semantic similarity | **Purpose:** Create/understand content |
| **Model:** embedding-001 | **Model:** gemini-2.5-flash |
| **Cost:** Cheaper per token | **Cost:** More expensive per token |
| **Speed:** Faster | **Speed:** Slower |
| **Use case:** Search, grouping | **Use case:** Classification, summarization |

**VoxVeritas uses both:**
```
Comment Arrives
      ↓
Generate Embedding (vector search)
      ↓
┌─────────────────┐
│ Match > 0.74?   │
└─────────────────┘
  Yes ↓      ↓ No
Return  Call LLM
Match   (classify/create group)
```

---

### Q2: What is "function calling" in LLMs and why use it?

**Answer:**

**Function calling** allows LLMs to return structured data instead of free-form text.

**Without function calling (text parsing):**
```javascript
const response = await llm.generate("Classify this comment: 'AI is dangerous'");
// Response: "This comment should go in the 'AI Safety Concerns' group"
// Problem: Need regex/parse to extract 'AI Safety Concerns'
```

**With function calling (structured):**
```javascript
const response = await llm.generate({
  prompt: "Classify this comment",
  tools: [{
    name: 'classify_comment',
    parameters: {
      type: 'object',
      properties: {
        matchedGroup: { type: 'string' },
        newLabel: { type: 'string' }
      }
    }
  }]
});

// Response: { matchedGroup: 'AI Safety Concerns', newLabel: 'AI Safety Concerns' }
// Direct access: response.functionCalls[0].args.matchedGroup
```

**Benefits:**
1. No parsing needed - guaranteed structure
2. Type safety - numbers come as numbers, booleans as booleans
3. Schema enforcement - LLM cannot hallucinate extra fields
4. Better for API integration

---

### Q3: What is temperature and how does it affect LLM output?

**Answer:**

**Temperature** controls randomness in LLM responses.

| Temperature | Behavior | Use Case |
|-------------|----------|----------|
| 0.0 | Deterministic, repeatable | Classification, structured output |
| 0.3-0.5 | Slightly creative | Content generation |
| 0.7-1.0 | Very creative | Brainstorming, creative writing |

**VoxVeritas Examples:**
```javascript
// Classification - deterministic
await llm.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt,
  config: { temperature: 0.0 }
});

// Group name generation - some creativity
await llm.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt,
  config: { temperature: 0.3 }
});
```

---

## Section B: Gemini Integration

### Q4: How does VoxVeritas handle multiple API keys for rate limiting?

**Answer:**

```javascript
// Gemini Key Rotation System

class GeminiKeyRotation {
  constructor() {
    this.keys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ];
    this.currentIndex = 0;
    this.requestsPerKey = 5;
    this.requestCount = 0;
  }
  
  getApiKey() {
    // Get current key
    const key = this.keys[this.currentIndex];
    
    // Increment counter
    this.requestCount++;
    
    // Rotate after 5 requests
    if (this.requestCount >= this.requestsPerKey) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      this.requestCount = 0;
      console.log(`🔄 Rotated to API key ${this.currentIndex + 1}`);
    }
    
    return key;
  }
}

// Usage in service
const ai = new GoogleGenAI({ apiKey: geminiKeyRotation.getApiKey() });
```

**Why 5 requests per key?**
- Gemini free tier: ~60 requests per minute
- 3 keys × 5 requests = 15 requests per rotation cycle
- Distributes load, reduces rate limit errors

---

### Q5: What is the fallback hierarchy when LLM fails?

**Answer:**

```javascript
async function classifyComment(comment, existingGroups) {
  try {
    // Level 1: LLM Function Calling
    return await llm.classify(comment, existingGroups);
    
  } catch (llmError) {
    console.error('LLM failed:', llmError);
    
    try {
      // Level 2: Keyword Matching
      return keywordClassify(comment, existingGroups);
      
    } catch (keywordError) {
      // Level 3: Create Generic Group
      return {
        matchedGroup: null,
        newLabel: comment.substring(0, 40),
        title: 'Discussion Group',
        description: `Comments related to: ${comment.substring(0, 80)}`
      };
    }
  }
}

function keywordClassify(comment, existingGroups) {
  const commentWords = comment.toLowerCase().split(/\s+/);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const group of existingGroups) {
    const groupWords = group.label.toLowerCase().split(/\s+/);
    const overlap = commentWords.filter(w => groupWords.includes(w)).length;
    const score = overlap / Math.max(commentWords.length, groupWords.length);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = group.label;
    }
  }
  
  return bestMatch && bestScore > 0.3 
    ? { matchedGroup: bestMatch }
    : { matchedGroup: null };
}
```

**Key Principle:** Never let an AI failure break user-facing functionality.

---

### Q6: How does VoxVeritas classify and group debate comments?

**Answer:**

```javascript
// Combined classification + content generation in ONE API call

const classifyAndGenerateContent = async (comment, existingLabels) => {
  const functionSchema = {
    name: 'classify_and_generate',
    parameters: {
      type: 'object',
      properties: {
        matchedGroup: { type: 'string' },        // Existing group if match
        newLabel: { type: 'string' },           // 2-5 word category
        title: { type: 'string' },                // 6-10 word title
        description: { type: 'string' },        // 40-70 words
        idealCounter1: { type: 'string' },      // Counter-argument 1
        idealCounter2: { type: 'string' }       // Counter-argument 2
      }
    }
  };
  
  const prompt = `
    Existing groups: ${existingLabels.join(', ')}
    New comment: "${comment}"
    
    Task: Either match to an existing group OR create a new one.
    If creating new, provide title, description, and 2 ideal counter-arguments.
  `;
  
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      tools: [{ functionDeclarations: [functionSchema] }],
      functionInvocation: 'auto'
    }
  });
  
  const args = result.functionCalls[0].args;
  
  // Verify matched group actually exists (prevent hallucination)
  const exists = existingLabels.includes(args.matchedGroup);
  
  return {
    matchedGroup: exists ? args.matchedGroup : null,
    shouldCreateNew: !exists,
    newLabel: args.newLabel,
    title: args.title,
    description: args.description,
    idealCounters: [args.idealCounter1, args.idealCounter2]
  };
};
```

**Why combined?**
- Reduces API calls (cost savings)
- Consistent generation (title/description/counters from same context)
- Better performance

---

## Section C: Off-Topic Detection

### Q7: How does VoxVeritas detect off-topic comments?

**Answer:**

```javascript
const analyzeCommentRelevance = async (comment, debateTitle, debateDescription, recentComments) => {
  const functionSchema = {
    name: 'analyze_relevance',
    parameters: {
      type: 'object',
      properties: {
        isOffTopic: { type: 'boolean' },
        reason: { type: 'string' },
        label: { type: 'string', enum: ['Relevant', 'Tangential', 'Off-Topic'] },
        confidence: { type: 'number' }
      }
    }
  };
  
  const prompt = `
    DEBATE TOPIC: "${debateTitle}"
    DESCRIPTION: ${debateDescription}
    
    RECENT CONTEXT:
    ${recentComments.map((c, i) => `${i + 1}. [${c.stance}] "${c.text}"`).join('\n')}
    
    NEW COMMENT: "${comment}"
    
    Classify as: Relevant (directly related), Tangential (loosely related), Off-Topic (unrelated)
  `;
  
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      tools: [{ functionDeclarations: [functionSchema] }],
      functionInvocation: 'auto'
    }
  });
  
  return result.functionCalls[0].args;
};

// Example result:
// {
//   isOffTopic: true,
//   reason: "Comment about pizza toppings has no relation to AI moderation debate",
//   label: "Off-Topic",
//   confidence: 0.95
// }
```

**Why include recent context?**
- Comments responding to recent points may not mention the main topic
- Context helps determine if comment is part of the conversation flow

---

## Section D: Prompt Engineering

### Q8: What are prompt engineering best practices?

**Answer:**

**1. Be Specific:**
```javascript
// BAD: "Classify this comment"
// GOOD: "Classify this comment into one of these specific categories: [list]"
```

**2. Provide Examples (Few-Shot):**
```javascript
const prompt = `
  Examples:
  Comment: "AI destroys jobs" -> Label: "Economic Impact Concerns"
  Comment: "Privacy is important" -> Label: "Privacy Concerns"
  
  Now classify: "${comment}"
`;
```

**3. Specify Output Format:**
```javascript
const prompt = `
  Respond in JSON format with these fields:
  {
    "category": "string",
    "confidence": "number 0-1",
    "reasoning": "string"
  }
`;
```

**4. Use Delimiters:**
```javascript
const prompt = `
  Comment to analyze: """${comment}"""
  
  Debate topic: <topic>${title}</topic>
`;
```

**5. Give the Model a Role:**
```javascript
const prompt = `
  You are an expert debate moderator with 10 years experience.
  Your task is to identify whether comments are relevant to the debate topic...
`;
```

---

### Q9: How do you handle LLM hallucinations?

**Answer:**

**Hallucination:** LLM generates plausible but false information.

**Prevention Strategies:**

```javascript
// 1. Verify outputs against known data
const classification = await llm.classify(comment, existingLabels);

// Verify the matched group actually exists
if (!existingLabels.includes(classification.matchedGroup)) {
  classification.shouldCreateNew = true;  // Override hallucination
}

// 2. Use constrained outputs (function calling)
const functionSchema = {
  properties: {
    stance: { type: 'string', enum: ['for', 'against', 'neutral'] }  // Constrained
  }
};

// 3. Temperature = 0 for deterministic tasks
await llm.generate({
  prompt,
  temperature: 0.0  // Most consistent
});

// 4. Provide ground truth in context
const prompt = `
  Facts: ${JSON.stringify(facts)}
  
  Based ONLY on these facts, answer: ${question}
`;

// 5. Post-processing validation
const result = await llm.generate(prompt);
if (result.length > 1000) {
  // Likely rambling - truncate or retry
}
```

---

## Section E: Cost and Performance Optimization

### Q10: How do you optimize LLM costs?

**Answer:**

```javascript
// 1. Caching
const responseCache = new Map();

async function generateWithCache(prompt) {
  const key = hash(prompt);
  if (responseCache.has(key)) {
    return responseCache.get(key);
  }
  
  const response = await llm.generate(prompt);
  responseCache.set(key, response);
  return response;
}

// 2. Batching
async function batchClassify(comments) {
  // Process multiple comments in one prompt
  const prompt = `
    Classify each comment:
    ${comments.map((c, i) => `${i + 1}. "${c}"`).join('\n')}
  `;
  
  const result = await llm.generate(prompt);
  // Parse and return array of classifications
}

// 3. Smaller models for simple tasks
const MODELS = {
  EMBEDDING: 'gemini-embedding-001',
  CLASSIFICATION: 'gemini-2.5-flash',  // Cheaper
  GENERATION: 'gemini-2.5-pro'        // Expensive, use sparingly
};

// 4. Token limits
const MAX_PROMPT_TOKENS = 4000;
if (prompt.length > MAX_PROMPT_TOKENS * 4) {  // ~4 chars per token
  prompt = prompt.substring(0, MAX_PROMPT_TOKENS * 4);
}

// 5. Fallback to non-LLM when possible
async function classify(comment) {
  // Try vector search first (free)
  const vectorMatch = await vectorSearch(comment);
  if (vectorMatch && vectorMatch.score > 0.8) {
    return vectorMatch;  // Skip LLM call
  }
  
  // Fall back to LLM only if needed
  return await llm.classify(comment);
}
```

---

## Quick Reference: LLM Patterns

| Pattern | When to Use |
|---------|-------------|
| Function Calling | Structured output, API integration |
| Temperature 0.0 | Classification, deterministic tasks |
| Temperature 0.7 | Creative generation |
| Few-Shot Prompting | Task is specific and examples help |
| Chain of Thought | Complex reasoning required |
| RAG (Retrieval) | Need to ground in specific knowledge |

**Cost Priorities:**
1. Use embeddings/vector search first (cheapest)
2. Use smaller LLM models when possible
3. Cache aggressively
4. Batch requests
5. Reserve large models for complex tasks
