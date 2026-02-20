# 09 — Gemini LLM Service

> **File**: `services/llmService.js` (543 lines)  
> **Pattern**: Singleton class — `module.exports = new LLMService()`  
> **Prerequisites**: [08 — Pinecone Vector Database](./08-PINECONE-VECTOR-DATABASE.md), [18 — Gemini Key Rotation](./18-GEMINI-KEY-ROTATION.md)

---

## Purpose

The LLM Service is the "brain" of VoxVeritas. While the vector database handles fast similarity searches, this service handles tasks that require **understanding and reasoning**:

- **Classify comments** into existing groups or suggest new ones
- **Generate group content** (title, description, ideal counter-arguments)
- **Analyse comment relevance** to detect off-topic contributions
- **Regenerate group names** as groups accumulate more comments

Every LLM call uses **Gemini 2.5 Flash** via the `@google/genai` SDK with **function calling** — a structured output mechanism that returns typed JSON instead of free-form text.

---

## Architecture

```
┌────────────────────────────────────────────────────┐
│                   LLMService                       │
│                (Singleton Class)                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  _ai() → Creates fresh GoogleGenAI instance        │
│           with rotated API key each time            │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Methods (all async):                         │  │
│  │                                               │  │
│  │  classifyAndGenerateContent()  ← Debate flow  │  │
│  │  classifyComment()             ← News flow    │  │
│  │  generateGroupContent()        ← Regeneration │  │
│  │  generateGroupDescription()    ← Short desc   │  │
│  │  regenerateGroupName()         ← Rename groups│  │
│  │  analyzeCommentRelevance()     ← Off-topic    │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Fallbacks:                                        │
│  _keywordClassify()  ← keyword matching fallback   │
│  _simpleRelevance()  ← keyword off-topic fallback  │
│  _extractLabel()     ← extract key words as label  │
│  _frequencyLabel()   ← word frequency as label     │
└────────────────────────────────────────────────────┘
```

---

## Gemini Function Calling — How It Works

Instead of asking Gemini to produce free-form text and parsing it, function calling defines a **JSON schema** that Gemini must fill:

```javascript
const fn = {
  name: 'classify_comment',
  description: 'Assigns a comment to a group.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      matchedGroup: { type: Type.STRING, description: '...' },
      newLabel:     { type: Type.STRING, description: '...' },
    },
    required: ['matchedGroup', 'newLabel'],
  },
};

const res = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  config: {
    tools: [{ functionDeclarations: [fn] }],
    functionInvocation: 'auto',     // Gemini decides when to call the function
  },
});

// Extract structured result
const call = res.functionCalls?.[0];
const args = call?.args ?? {};
// args.matchedGroup, args.newLabel  ← typed, guaranteed fields
```

**Advantages over text parsing**:
- No regex or JSON.parse needed
- Gemini is constrained to the schema — fewer hallucinations
- Type safety: numbers come as numbers, booleans as booleans

---

## Method 1: `classifyAndGenerateContent(comment, existingLabels)`

**Used by**: Debate comment pipeline (via `DebateCommentController`)  
**Purpose**: Combined classification + content generation in ONE LLM call (saves API quota)

### What It Returns

```javascript
{
  matchedGroup: 'Economic Impact Concerns' | null,  // Exact label if matched
  shouldCreateNew: true | false,
  newLabel: 'Job Market Disruption Concerns',        // Label for new/matched group
  title: 'Arguments that AI reduces human oversight', // 6-10 word title
  description: 'Arguments claiming AI moderation...',  // 40-70 word description
  idealCounters: [
    'AI automation destroys far more jobs than...',    // Counter-argument #1 (30-50 words)
    'The jobs AI supposedly creates are...',            // Counter-argument #2 (30-50 words)
  ],
}
```

### The Function Schema

Six required fields are declared:

| Field | Type | Purpose |
|-------|------|---------|
| `matchedGroup` | string | Existing label if match found, empty string if new |
| `newLabel` | string | 2-5 word category label |
| `title` | string | 6-10 word specific title |
| `description` | string | 40-70 word rich summary |
| `idealCounter1` | string | 30-50 word actual counter-comment |
| `idealCounter2` | string | 30-50 word variation of same counter-argument |

### The Prompt

The prompt is meticulously crafted with:

1. **The comment** being classified
2. **Existing group labels** (so Gemini knows what already exists)
3. **Grouping rules**: Match ONLY if core claim, evidence type, and reasoning are substantially the same
4. **Content generation requirements**: Detailed examples of bad vs good titles, labels, descriptions
5. **Ideal counter guidelines**: Must be written as **actual counter-comments**, not descriptions of what a counter would say

Example from the prompt:
```
Bad label: "Economic Impact"
Good label: "Job Market Disruption Concerns"

Bad description: "Comments about economic aspects"
Good description: "Arguments claiming AI moderation destroys jobs by replacing
  human moderators, citing unemployment statistics and industry reports..."
```

### Post-Processing

```javascript
const exists = existingLabels.includes(args.matchedGroup);
return {
  matchedGroup: exists ? args.matchedGroup : null,
  shouldCreateNew: !exists,
  newLabel: args.newLabel || comment.substring(0, 40),  // Fallback: first 40 chars
  title: args.title || 'Discussion Group',
  description: args.description || 'A group of related comments.',
  idealCounters: [args.idealCounter1, args.idealCounter2].filter(Boolean),
};
```

**Critical check**: Even if Gemini returns a `matchedGroup`, the code verifies it actually exists in `existingLabels`. If Gemini hallucinated a group name, `shouldCreateNew` becomes `true`.

### Error Fallback

If the Gemini call fails entirely, a keyword-based fallback activates:

```javascript
catch (err) {
  const fallback = this._keywordClassify(comment, existingLabels);
  return {
    ...fallback,
    title: `Argument: ${comment.substring(0, 30)}…`,
    description: `Debate arguments focusing on: ${comment.substring(0, 80)}...`,
    idealCounters: [],  // No ideal counters without LLM
  };
}
```

---

## Method 2: `classifyComment(comment, existingLabels)`

**Used by**: News comment filtering pipeline (via `commentFilteringService`)  
**Purpose**: Classify a comment into an existing group or suggest a new one — lightweight version without content generation

This is a simpler version of `classifyAndGenerateContent` — only two fields:

```javascript
const classifyFn = {
  name: 'classify_comment',
  parameters: {
    type: Type.OBJECT,
    properties: {
      matchedGroup: { type: Type.STRING },
      newLabel:     { type: Type.STRING },
    },
    required: ['matchedGroup', 'newLabel'],
  },
};
```

Returns:
```javascript
{
  matchedGroup: 'Privacy Concerns' | null,
  shouldCreateNew: true | false,
  newLabel: 'Privacy Concerns',
}
```

**When is this called?** Only when `vectorService.matchNewsComment()` returned `null` (score below 0.74). The LLM acts as a fallback — slower but more nuanced than pure vector similarity.

---

## Method 3: `generateGroupContent(comments)`

**Used by**: Debate system when regenerating group content after new comments arrive  
**Purpose**: Generate title, description, and ideal counters from a set of existing comments

```javascript
async generateGroupContent(comments) {
  const texts = comments.map((c, i) => `${i + 1}. "${c.text ?? c}"`).join('\n');

  const fn = {
    name: 'generate_group_content',
    parameters: {
      // title: 8-12 word specific title
      // description: 50-80 word comprehensive paragraph
      // idealCounter1: 30-50 word actual counter-comment
      // idealCounter2: 30-50 word variation
    },
  };
  // ... Gemini call with temperature: 0.0 for deterministic results
}
```

**Temperature 0.0**: Used here to produce consistent results. Different runs with the same comments should produce similar titles/descriptions.

Returns:
```javascript
{
  title: 'Arguments that AI reduces human oversight and accountability',
  description: 'Arguments claiming AI moderation destroys jobs...',
  idealCounters: ['AI automation destroys...', 'The jobs AI creates...'],
}
```

---

## Method 4: `generateGroupDescription(commentText)`

**Used by**: News comment filtering when creating a new CommentGroup  
**Purpose**: Generate a short 10-13 word description

```javascript
async generateGroupDescription(commentText) {
  const prompt = `Analyze these comments and write a description in EXACTLY 10-13 words...
Rules:
- Maximum 13 words total
- No introductory phrases like "This group" or "Comments about"
- Return ONLY the description, nothing else`;

  // Uses plain text generation, not function calling
  const res = await ai.models.generateContent({ ... });
  const raw = res.text?.trim();

  // Safety net: truncate to 13 words regardless
  const words = raw.split(/\s+/);
  return words.length > 13 ? words.slice(0, 13).join(' ') + '…' : raw;
}
```

**Note**: This is the only method that uses plain text generation instead of function calling. The output is simple enough that structured output would be overkill.

---

## Method 5: `regenerateGroupName(commentTexts, currentName)`

**Used by**: `commentFilteringService.regenerateGroupNameAndDescriptionIfNeeded()`  
**Purpose**: Suggest a better group name based on all current comments

```javascript
const fn = {
  name: 'regenerate_name',
  parameters: {
    properties: {
      suggestedName: { type: Type.STRING, description: '2-4 word group name.' },
    },
  },
};

const prompt = `Current name: "${currentName}"\nComments:\n${list}\nSuggest a concise group name.`;
```

Returns the new name string, or falls back to `_frequencyLabel()` which picks the most frequent significant words.

---

## Method 6: `analyzeCommentRelevance(comment, debateTitle, debateDescription, recentComments)`

**Used by**: `DebateCommentController.createDebateComment()`  
**Purpose**: Determine if a debate comment is relevant, tangential, or off-topic

### The Function Schema

```javascript
const fn = {
  name: 'analyze_comment_relevance',
  parameters: {
    properties: {
      isOffTopic:  { type: Type.BOOLEAN },  // true = completely unrelated
      reason:      { type: Type.STRING },   // Explanation of classification
      label:       { type: Type.STRING },   // "Relevant" | "Tangential" | "Off-Topic"
      confidence:  { type: Type.NUMBER },   // 0.0 to 1.0
    },
  },
};
```

### The Prompt Structure

```
DEBATE TOPIC: "Should AI moderate social media?"
DESCRIPTION: Full debate description...

RECENT DEBATE CONTEXT (last N comments):
1. [for] "AI moderation is faster than humans..."
2. [against] "But AI can't understand context..."

NEW COMMENT TO EVALUATE:
"What's the best pizza topping?"

ANALYSIS GUIDELINES:
- RELEVANT: Directly addresses debate topic or responds to recent points
- TANGENTIAL: Loosely related but goes off on side topics
- OFF-TOPIC: Completely unrelated
```

**Context awareness**: By including recent comments, Gemini can determine if a comment is responding to a specific point made earlier (which makes it relevant even if it doesn't directly mention the debate topic).

### Return Value

```javascript
{
  isOffTopic: true,
  reason: 'Comment about pizza has no relation to AI moderation debate',
  label: 'Off-Topic',
  confidence: 0.95
}
```

### Keyword Fallback

If Gemini is not configured or fails:

```javascript
_simpleRelevance(comment, debateTitle, debateDescription) {
  const keywords = `${debateTitle} ${debateDescription}`.split(' ').filter(w => w.length > 3);
  const hits = keywords.filter(k => comment.toLowerCase().includes(k)).length;

  if (hits === 0 && comment.length > 20)  → Off-Topic
  if (hits <= 1 && comment.length > 80)   → Tangential
  else                                     → Relevant
}
```

---

## Fallback Hierarchy

Every LLM method has a fallback chain:

```
Gemini Function Calling
        │
        ├── Success → Return structured result
        │
        └── Failure (API error, rate limit, timeout)
                │
                ▼
        Keyword-Based Fallback
                │
                ├── _keywordClassify()     → Match by keyword overlap
                ├── _simpleRelevance()     → Count keyword hits
                ├── _extractLabel()        → Top 3 significant words
                └── _frequencyLabel()      → Most frequent words across texts
```

This ensures the platform **never stops functioning** even if Gemini is completely down.

---

## API Key Rotation

Every method creates a fresh `GoogleGenAI` instance:

```javascript
_ai() {
  return new GoogleGenAI({
    apiKey: this.geminiKeyRotation.getApiKey(),  // Rotated key
  });
}
```

See [18 — Gemini Key Rotation](./18-GEMINI-KEY-ROTATION.md) for how keys rotate every 5 requests.

---

## Method Summary

| Method | Used By | Function Calling? | Fields | Fallback |
|--------|---------|-------------------|--------|----------|
| `classifyAndGenerateContent` | Debate pipeline | Yes (6 fields) | matchedGroup, newLabel, title, description, idealCounter1, idealCounter2 | `_keywordClassify` |
| `classifyComment` | News filtering | Yes (2 fields) | matchedGroup, newLabel | `_keywordClassify` |
| `generateGroupContent` | Debate regeneration | Yes (4 fields) | title, description, idealCounter1, idealCounter2 | Static defaults |
| `generateGroupDescription` | News group creation | No (plain text) | — | Empty string |
| `regenerateGroupName` | Auto-rename groups | Yes (1 field) | suggestedName | `_frequencyLabel` |
| `analyzeCommentRelevance` | Off-topic detection | Yes (4 fields) | isOffTopic, reason, label, confidence | `_simpleRelevance` |

---

**Next**: [10 — Comment Filtering Service](./10-COMMENT-FILTERING-SERVICE.md) — The pipeline that combines vector search and LLM classification
