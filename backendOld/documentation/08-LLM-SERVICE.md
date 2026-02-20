# 08 - LLM Service: Gemini AI Integration

## What You'll Learn
- Complete understanding of LLM integration with Google Gemini
- Function Calling: What it is and how it works
- Each method in llmService.js explained in detail
- Error handling and fallback mechanisms
- API key rotation strategy
- Real examples with code flow

---

## What is the LLM Service?

The **LLMService** is the brain of VoxVeritas's AI features. It handles all interactions with Google's Gemini AI model.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LLM SERVICE OVERVIEW                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              LLM SERVICE
                         (llmService.js)
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────────┐  ┌─────────────────────┐  ┌───────────────────┐
│ Comment           │  │ Group Description   │  │ Off-Topic         │
│ Classification    │  │ Generation          │  │ Detection         │
│                   │  │                     │  │                   │
│ Assigns comments  │  │ Creates summaries   │  │ Checks if comment │
│ to groups         │  │ for groups          │  │ is relevant       │
└───────────────────┘  └─────────────────────┘  └───────────────────┘
        │                        │                        │
        └────────────────────────┴────────────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  GEMINI API     │
                        │                 │
                        │  Model:         │
                        │  gemini-3-flash │
                        │  -preview       │
                        │                 │
                        │  Features:      │
                        │  • Function     │
                        │    Calling      │
                        │  • JSON Output  │
                        └─────────────────┘
```

---

## File Location & Structure

**Location:** `backend/services/llmService.js`

```javascript
// Structure overview
class LLMService {
  constructor()                        // Initialize with API key
  getGenAI()                          // Get fresh AI instance
  
  // Main Classification Methods
  classifyComment()                   // Entry point for classification
  classifyCommentWithGemini()         // Gemini with function calling
  classifyCommentWithDescriptions()   // Classification with group context
  simpleClassifyComment()             // Fallback: keyword-based
  
  // Group Management
  generateGroupDescription()          // Create group summaries
  generateLabel()                     // Create labels from text
  regenerateGroupName()               // Update group names
  regenerateGroupNameWithGemini()     // Gemini-based rename
  simpleRegenerateGroupName()         // Fallback rename
  
  // Relevance Analysis
  analyzeCommentRelevance()           // Entry point for off-topic detection
  analyzeRelevanceWithGemini()        // Gemini-based analysis
  simpleRelevanceAnalysis()           // Fallback: pattern matching
}
```

---

## Understanding Function Calling

### What is Function Calling?

**Function Calling** (also called "Tool Use") is a way to get structured, reliable output from LLMs.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WITHOUT FUNCTION CALLING                                 │
└─────────────────────────────────────────────────────────────────────────────┘

You: "Classify this comment into a group"

AI Response (unpredictable):
  - "I think this comment belongs to the 'Scientific Evidence' group"
  - "Group: Scientific Evidence"
  - "The comment should be classified as: Scientific Evidence"
  - "{'group': 'Scientific Evidence'}"  ← Sometimes JSON, sometimes not!
  - "Based on my analysis, this comment discusses scientific evidence..."

Problem: Output format is inconsistent! 
         Parsing this in code is unreliable.


┌─────────────────────────────────────────────────────────────────────────────┐
│                    WITH FUNCTION CALLING                                    │
└─────────────────────────────────────────────────────────────────────────────┘

You: "Classify this comment. Use the classify_comment function."

AI Response (structured):
  {
    "functionCall": {
      "name": "classify_comment",
      "args": {
        "matchedGroup": "Scientific Evidence",
        "newLabel": "Scientific Research Claims",
        "comment": "The study shows..."
      }
    }
  }

Benefit: Always the same structure!
         Easy to parse: response.functionCalls[0].args
```

### How Function Calling Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FUNCTION CALLING FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: DEFINE the function schema
─────────────────────────────────
  const classifyCommentFn = {
    name: 'classify_comment',           // Function name
    description: 'Assigns a comment...', // What it does
    parameters: {
      type: Type.OBJECT,                // Return an object
      properties: {
        matchedGroup: {                 // First field
          type: Type.STRING,
          description: 'The matching group label'
        },
        newLabel: {                     // Second field
          type: Type.STRING,
          description: 'A new label for the group'
        }
      },
      required: ['matchedGroup', 'newLabel']  // Both required
    }
  };

Step 2: SEND request with function definition
─────────────────────────────────────────────
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      tools: [{ functionDeclarations: [classifyCommentFn] }],  // Tell AI about function
      functionInvocation: 'auto'  // Let AI decide when to call it
    }
  });

Step 3: EXTRACT structured response
───────────────────────────────────
  const functionCall = response.functionCalls?.[0];
  
  if (functionCall.name === 'classify_comment') {
    const { matchedGroup, newLabel } = functionCall.args;
    // Now you have guaranteed structured data!
  }
```

---

## Constructor and Initialization

```javascript
class LLMService {
  constructor() {
    // Load environment variables
    require('dotenv').config();
    
    // Get the key rotation service
    this.geminiKeyRotation = geminiKeyRotation;
    
    // Initialize Google GenAI with rotated API key
    this.genAI = new GoogleGenAI({ 
      apiKey: this.geminiKeyRotation.getApiKey(),
      authConfig: {
        keyFilename: undefined,
        credentials: undefined
      }
    });
  }
}
```

### WHY This Design?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WHY KEY ROTATION?                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Problem: Gemini API has rate limits
─────────────────────────────────────
  Free tier: ~15 requests per minute per key
  
  If VoxVeritas gets popular:
    - Many users adding comments
    - Each comment needs AI classification
    - 50 comments/minute = Rate limit hit!

Solution: Rotate between multiple API keys
──────────────────────────────────────────
  Key 1 ─┐
  Key 2 ─┼───► geminiKeyRotation ───► Current Active Key
  Key 3 ─┘
  
  Every 5 requests, switch to next key
  Effectively: 3 keys × 15 req/min = 45 req/min capacity!
```

### getGenAI() Method

```javascript
getGenAI() {
  return new GoogleGenAI({ 
    apiKey: this.geminiKeyRotation.getApiKey(),  // Fresh rotated key
    authConfig: {
      keyFilename: undefined,
      credentials: undefined
    }
  });
}
```

**WHY:** Creates fresh instance with currently active API key. Used when the stored instance might have an exhausted key.

---

## Method 1: classifyComment()

**Purpose:** Entry point for classifying a comment into a group.

```javascript
async classifyComment(comment, existingLabels) {
  try {
    // Try the advanced Gemini method first
    return await this.classifyCommentWithGemini(comment, existingLabels);
  } catch (error) {
    console.error('Error in comment classification, falling back:', error);
    // If Gemini fails, use simple keyword matching
    return await this.simpleClassifyComment(comment, existingLabels);
  }
}
```

### Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `comment` | String | The comment text to classify | "The sample size is too small" |
| `existingLabels` | Array | Labels of existing groups | ["Sample Size", "Methodology", "Source Credibility"] |

### Return Value

```javascript
{
  matchedGroup: "Sample Size" | null,  // Existing group or null
  shouldCreateNew: true | false,        // Whether to create new group
  newLabel: "Sample Size Concerns"      // Label for the group
}
```

### Flow Diagram

```
                    classifyComment(comment, labels)
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Try classifyCommentWithGemini │
              └───────────────┬───────────────┘
                              │
                  ┌───────────┴───────────┐
                  │                       │
              SUCCESS                   ERROR
                  │                       │
                  ▼                       ▼
           Return result         simpleClassifyComment
                                         │
                                         ▼
                                  Return fallback result
```

---

## Method 2: classifyCommentWithGemini() (CORE METHOD)

**Purpose:** Use Gemini AI with function calling to classify comments.

### Complete Code with Annotations

```javascript
async classifyCommentWithGemini(comment, existingLabels) {
  try {
    // Import Type for schema definition
    const { Type } = require('@google/genai');
    
    // ═══════════════════════════════════════════════════════════
    // STEP 1: DEFINE THE FUNCTION SCHEMA
    // ═══════════════════════════════════════════════════════════
    
    const classifyCommentFn = {
      name: 'classify_comment',
      description: 'Assigns a comment to an existing group or suggests a new group title.',
      parameters: {
        type: Type.OBJECT,  // Return type is an object
        properties: {
          comment: { 
            type: Type.STRING, 
            description: 'The user comment being classified.' 
          },
          matchedGroup: { 
            type: Type.STRING, 
            description: 'The matching group label, or empty string if no match.' 
          },
          newLabel: { 
            type: Type.STRING, 
            description: 'A concise label for this comment group.' 
          }
        },
        required: ['comment', 'matchedGroup', 'newLabel']
      }
    };
    // WHY: This tells Gemini exactly what structure to return
    // Type.OBJECT = return a JavaScript object
    // Type.STRING = each field is a string
    // required = these fields must always be present
    
    
    // ═══════════════════════════════════════════════════════════
    // STEP 2: CREATE THE PROMPT
    // ═══════════════════════════════════════════════════════════
    
    const systemPrompt = [
      `Here's a new user comment:\n"${comment}"\n\n`,
      `1) Compare it against these existing groups: ${existingLabels.join(', ')}.\n`,
      `   • If it fits one, set matchedGroup to that label.\n`,
      `   • Otherwise, matchedGroup should be an empty string.\n\n`,
      `2) Then generate newLabel: a single, concise phrase that summarizes this group.\n`,
      `\nReturn only the JSON arguments for the function invocation.`
    ].join('');
    // WHY: Clear instructions with examples help AI understand the task
    // The array.join('') style keeps the string readable in code
    
    
    // ═══════════════════════════════════════════════════════════
    // STEP 3: CALL GEMINI API
    // ═══════════════════════════════════════════════════════════
    
    const response = await this.genAI.models.generateContent({
      model: 'gemini-3-flash-preview',  // Fast, efficient model
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] }
      ],
      config: { 
        tools: [{ functionDeclarations: [classifyCommentFn] }],  // Provide function
        functionInvocation: 'auto'  // Let AI auto-call the function
      }
    });
    // WHY tools[]: Tells Gemini "here are functions you can use"
    // WHY functionInvocation: 'auto': Gemini decides when to use it
    
    
    // ═══════════════════════════════════════════════════════════
    // STEP 4: EXTRACT FUNCTION CALL RESULT
    // ═══════════════════════════════════════════════════════════
    
    const call = response.functionCalls?.[0];
    // response.functionCalls is an array of function calls made by AI
    // We take the first one (usually only one)
    
    const { comment: incoming, matchedGroup, newLabel } =
      call?.name === 'classify_comment'
        ? call.args   // Extract arguments from function call
        : { comment: comment, matchedGroup: '', newLabel: comment };
    // Safety: If function wasn't called, use defaults
    
    
    // ═══════════════════════════════════════════════════════════
    // STEP 5: VALIDATE AND RETURN
    // ═══════════════════════════════════════════════════════════
    
    const exists = existingLabels.includes(matchedGroup);
    // Check if AI returned a real existing group
    
    return {
      matchedGroup: exists ? matchedGroup : null,
      shouldCreateNew: !exists,
      newLabel
    };
    
  } catch (error) {
    console.error('Error with Gemini AI classification:', error);
    return await this.simpleClassifyComment(comment, existingLabels);
  }
}
```

### Visual: What Happens Inside Gemini

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INSIDE GEMINI FUNCTION CALLING                           │
└─────────────────────────────────────────────────────────────────────────────┘

INPUT TO GEMINI:
────────────────
  {
    "model": "gemini-3-flash-preview",
    "contents": [{ 
      "role": "user", 
      "parts": [{ "text": "Here's a new user comment: 'The sample size is too small'..." }] 
    }],
    "config": {
      "tools": [{
        "functionDeclarations": [{
          "name": "classify_comment",
          "parameters": { ... }
        }]
      }],
      "functionInvocation": "auto"
    }
  }

GEMINI'S INTERNAL PROCESS:
──────────────────────────
  1. Read the prompt
  2. Understand: "User wants me to classify this comment"
  3. See available function: classify_comment
  4. Decide: "I should call this function with my analysis"
  5. Generate function call with arguments

OUTPUT FROM GEMINI:
───────────────────
  {
    "candidates": [...],
    "functionCalls": [
      {
        "name": "classify_comment",
        "args": {
          "comment": "The sample size is too small",
          "matchedGroup": "Sample Size",     // AI's classification
          "newLabel": "Sample Size Concerns"  // AI's suggested label
        }
      }
    ]
  }

YOUR CODE EXTRACTS:
───────────────────
  const { matchedGroup, newLabel } = response.functionCalls[0].args;
  // matchedGroup = "Sample Size"
  // newLabel = "Sample Size Concerns"
```

---

## Method 3: simpleClassifyComment() (Fallback)

**Purpose:** When Gemini fails (API down, rate limited, etc.), use simple keyword matching.

```javascript
async simpleClassifyComment(comment, existingLabels) {
  try {
    const lowerComment = comment.toLowerCase();
    
    // ═══════════════════════════════════════════════════════════
    // Try to match with existing groups
    // ═══════════════════════════════════════════════════════════
    
    for (const label of existingLabels) {
      const labelWords = label.toLowerCase().split(' ');
      
      // Count how many label words appear in comment
      const matchCount = labelWords.filter(word => 
        lowerComment.includes(word) && word.length > 2
      ).length;
      
      // If any words match, assign to this group
      if (matchCount > 0) {
        return {
          matchedGroup: label,
          shouldCreateNew: false,
          newLabel: label
        };
      }
    }
    
    // ═══════════════════════════════════════════════════════════
    // No match found - create new group
    // ═══════════════════════════════════════════════════════════
    
    const newLabel = this.generateLabel(comment);
    
    return {
      matchedGroup: null,
      shouldCreateNew: true,
      newLabel: newLabel
    };
    
  } catch (error) {
    // Ultimate fallback: use first 50 chars as label
    return {
      matchedGroup: null,
      shouldCreateNew: true,
      newLabel: comment.substring(0, 50) + (comment.length > 50 ? '...' : '')
    };
  }
}
```

### Why Have a Fallback?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FALLBACK STRATEGY                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Scenario: Gemini API is down or rate-limited

WITHOUT FALLBACK:
─────────────────
  User posts comment → API fails → Error 500 → User sees error
  Result: Bad user experience, feature broken

WITH FALLBACK:
──────────────
  User posts comment → API fails → simpleClassifyComment runs → Basic grouping works
  Result: Degraded but functional experience

The fallback is less intelligent but ensures the app never fully breaks!

Quality Comparison:
───────────────────
  Gemini:   "This comment discusses statistical methodology and sample sizes"
  Fallback: "Sample Size" (matched keyword "size" to existing group)
  
  Less accurate, but better than nothing!
```

---

## Method 4: generateGroupDescription()

**Purpose:** Create a human-readable description for a comment group.

```javascript
async generateGroupDescription(commentText) {
  try {
    const model = this.genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const prompt = `Generate a brief, descriptive explanation (2-3 sentences) 
for a comment group based on this comment:

"${commentText}"

The description should explain what type of comments would be grouped together.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text().trim();
    
    return description;
    
  } catch (error) {
    // Fallback: Use first few words
    const topic = commentText.split(' ').slice(0, 5).join(' ');
    return `Comments related to: ${topic}...`;
  }
}
```

### Example Usage

```javascript
// Input
commentText = "The sample size of 50 participants is insufficient for any statistical validity"

// Output from Gemini
description = "Comments in this group discuss concerns about study sample sizes 
and their impact on statistical validity. These comments typically question 
whether research conclusions can be drawn from limited participant pools."
```

---

## Method 5: analyzeCommentRelevance() (Off-Topic Detection)

**Purpose:** Determine if a debate comment is relevant to the topic.

```javascript
async analyzeCommentRelevance(comment, debateTitle, debateDescription) {
  try {
    if (this.geminiKeyRotation.isConfigured()) {
      return await this.analyzeRelevanceWithGemini(comment, debateTitle, debateDescription);
    } else {
      return await this.simpleRelevanceAnalysis(comment, debateTitle, debateDescription);
    }
  } catch (error) {
    // Default to relevant if analysis fails
    return {
      isOffTopic: false,
      reason: 'Analysis failed, defaulting to relevant',
      label: 'Relevant'
    };
  }
}
```

### analyzeRelevanceWithGemini() (With Function Calling)

```javascript
async analyzeRelevanceWithGemini(comment, debateTitle, debateDescription) {
  try {
    const { GoogleGenAI, Type } = require('@google/genai');
    const ai = this.genAI;

    // ═══════════════════════════════════════════════════════════
    // FUNCTION DEFINITION
    // ═══════════════════════════════════════════════════════════
    
    const analyzeRelevanceFn = {
      name: 'analyze_comment_relevance',
      description: 'Analyze if a comment is relevant to a debate topic.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          isOffTopic: { 
            type: Type.BOOLEAN, 
            description: 'True if the comment is off-topic' 
          },
          reason: { 
            type: Type.STRING, 
            description: 'Explanation of the classification' 
          },
          label: { 
            type: Type.STRING, 
            description: 'Classification: Relevant, Tangential, or Off-Topic',
            enum: ['Relevant', 'Tangential', 'Off-Topic']  // Constrained values!
          }
        },
        required: ['isOffTopic', 'reason', 'label']
      }
    };
    // NOTE: The 'enum' constraint ensures AI only returns valid labels

    // ═══════════════════════════════════════════════════════════
    // PROMPT WITH CONTEXT
    // ═══════════════════════════════════════════════════════════
    
    const systemPrompt = `
      Debate Topic: "${debateTitle}"
      Debate Description: "${debateDescription}"
      Comment to analyze: "${comment}"

      Analyze if this comment is relevant:

      1. RELEVANT: Directly addresses the debate topic
      2. TANGENTIAL: Somewhat related but drifts off-topic
      3. OFF-TOPIC: Completely unrelated, spam, or doesn't contribute

      Also check for spam patterns, personal attacks, or off-topic content.
    `;

    // ═══════════════════════════════════════════════════════════
    // API CALL
    // ═══════════════════════════════════════════════════════════
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      config: { 
        tools: [{ functionDeclarations: [analyzeRelevanceFn] }], 
        functionInvocation: 'auto' 
      }
    });

    // ═══════════════════════════════════════════════════════════
    // EXTRACT RESULT
    // ═══════════════════════════════════════════════════════════
    
    const call = response.functionCalls?.[0];
    const { isOffTopic, reason, label } = call?.name === 'analyze_comment_relevance'
      ? call.args
      : { isOffTopic: false, reason: 'Failed to analyze', label: 'Relevant' };

    return {
      isOffTopic: isOffTopic || label === 'Off-Topic',
      reason: reason || 'AI analysis completed',
      label: label || 'Relevant'
    };

  } catch (error) {
    return await this.simpleRelevanceAnalysis(comment, debateTitle, debateDescription);
  }
}
```

### simpleRelevanceAnalysis() (Pattern-Based Fallback)

```javascript
async simpleRelevanceAnalysis(comment, debateTitle, debateDescription) {
  const commentLower = comment.toLowerCase();
  
  // ═══════════════════════════════════════════════════════════
  // SPAM DETECTION
  // ═══════════════════════════════════════════════════════════
  
  const spamPatterns = [
    /(.)\1{4,}/g,           // "soooooo" - repeated chars
    /^[A-Z\s!]{10,}$/g,     // "ALL CAPS SHOUTING"
    /(buy|sell|click|www\.)/gi  // Commercial content
  ];
  
  if (spamPatterns.some(pattern => pattern.test(comment))) {
    return { isOffTopic: true, reason: 'Spam detected', label: 'Off-Topic' };
  }

  // ═══════════════════════════════════════════════════════════
  // OFF-TOPIC PATTERN DETECTION
  // ═══════════════════════════════════════════════════════════
  
  const offTopicPatterns = [
    /\b(pizza|food|recipe|cooking)\b/gi,  // Food talk
    /\b(cat|dog|pet|animal)\b/gi,         // Pet talk
    /\b(movie|film|music|song)\b/gi,      // Entertainment
    /^(lol|haha|omg|wow)\s*[!.]*$/gi     // Empty reactions
  ];
  
  if (offTopicPatterns.some(pattern => pattern.test(comment))) {
    return { isOffTopic: true, reason: 'Off-topic content', label: 'Off-Topic' };
  }

  // ═══════════════════════════════════════════════════════════
  // KEYWORD RELEVANCE CHECK
  // ═══════════════════════════════════════════════════════════
  
  const topicKeywords = [...debateTitle.split(' '), ...debateDescription.split(' ')]
    .filter(word => word.length > 3);
  
  const relevantWords = topicKeywords.filter(keyword => 
    commentLower.includes(keyword.toLowerCase())
  );

  if (relevantWords.length === 0 && comment.length > 20) {
    return { isOffTopic: true, reason: 'No topic keywords found', label: 'Off-Topic' };
  }

  return { isOffTopic: false, reason: 'Appears relevant', label: 'Relevant' };
}
```

---

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERROR HANDLING LAYERS                               │
└─────────────────────────────────────────────────────────────────────────────┘

Layer 1: Method-Level Try/Catch
───────────────────────────────
  Every method has its own try/catch
  Errors are logged and fallback is used

Layer 2: Fallback Methods
─────────────────────────
  Gemini fails → Use simple keyword-based method
  simpleClassify fails → Use substring-based label

Layer 3: Default Safe Values
────────────────────────────
  All else fails → Return safe defaults
  isOffTopic: false (don't wrongly flag content)
  matchedGroup: null (create new group)

Why This Matters:
─────────────────
  API errors shouldn't break user experience
  Degraded functionality > No functionality
  AI enhancement, not AI dependency
```

---

## Usage Examples

### Example 1: Classifying a Comment

```javascript
const llmService = require('./services/llmService');

// Existing groups in the debate
const existingLabels = ['Sample Size', 'Source Credibility', 'Methodology'];

// New comment comes in
const newComment = "The study only had 50 participants which is way too small";

// Classify it
const result = await llmService.classifyComment(newComment, existingLabels);

console.log(result);
// {
//   matchedGroup: 'Sample Size',  // Matched existing group!
//   shouldCreateNew: false,
//   newLabel: 'Sample Size'
// }
```

### Example 2: Generating Group Description

```javascript
const description = await llmService.generateGroupDescription(
  "The study only had 50 participants which is way too small"
);

console.log(description);
// "Comments in this group discuss concerns about research sample sizes
//  and their impact on statistical significance. Contributors question
//  whether conclusions can be reliably drawn from limited participant pools."
```

### Example 3: Off-Topic Detection

```javascript
const debateTitle = "Should AI regulate social media?";
const debateDescription = "Discuss whether AI should be used for content moderation";

// Test relevant comment
const relevant = await llmService.analyzeCommentRelevance(
  "AI moderation could reduce harmful content faster than human moderators",
  debateTitle,
  debateDescription
);
// { isOffTopic: false, reason: 'Directly addresses AI moderation', label: 'Relevant' }

// Test off-topic comment
const offTopic = await llmService.analyzeCommentRelevance(
  "I really love pizza with extra cheese",
  debateTitle,
  debateDescription
);
// { isOffTopic: true, reason: 'Comment about food unrelated to AI', label: 'Off-Topic' }
```

---

## Interview Questions & Answers

### Q1: What is function calling in LLMs?
**Answer:** Function calling is a feature that allows LLMs to return structured output by "calling" a predefined function with specific arguments. Instead of free-form text, the AI returns data that matches a schema you define. This ensures consistent, parseable output for programmatic use.

### Q2: Why use function calling instead of asking for JSON?
**Answer:** 
1. **Reliability**: Function schemas enforce structure; JSON prompts can fail
2. **Type safety**: Parameters have types (string, boolean, enum)
3. **Validation**: Required fields are guaranteed
4. **Cleaner code**: Direct access to args vs JSON parsing
5. **Better prompting**: AI understands it's "calling a function"

### Q3: How does the fallback mechanism work?
**Answer:** Multi-layer fallback:
1. **Primary**: Gemini function calling (best quality)
2. **Secondary**: Simple keyword matching (if API fails)
3. **Tertiary**: Basic substring labeling (if everything fails)

Each layer catches errors and passes to the next, ensuring the system never fully breaks.

### Q4: What is the Type object from @google/genai?
**Answer:** `Type` is an enum that defines JSON schema types for function parameters:
- `Type.STRING` - text values
- `Type.NUMBER` - numeric values
- `Type.BOOLEAN` - true/false
- `Type.OBJECT` - nested objects
- `Type.ARRAY` - arrays

Used to define the structure of function call arguments.

### Q5: How does off-topic detection handle edge cases?
**Answer:**
1. **Spam**: Regex patterns detect repeated chars, all caps, promotional content
2. **Irrelevant topics**: Pattern matching for common off-topic subjects (food, pets, entertainment)
3. **Low relevance**: Keyword matching checks if comment contains topic words
4. **Graceful degradation**: Defaults to "Relevant" if analysis fails (avoid false positives)

---

## Summary

- **LLMService** is the central AI integration layer
- **Function Calling** ensures structured, reliable AI output
- **classifyCommentWithGemini** uses function calling for comment grouping
- **analyzeRelevanceWithGemini** detects off-topic comments
- **Fallback methods** ensure functionality when API fails
- **Key rotation** manages rate limits across multiple API keys

---

**Next: [09-AI-VERDICT-SERVICE.md](./09-AI-VERDICT-SERVICE.md)** - Fact-checking verdict generation →
