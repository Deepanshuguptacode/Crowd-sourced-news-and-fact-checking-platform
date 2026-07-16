# 10 — Project AI Deep Dive
> Every GenAI concept mapped back to your VoxVeritas project — your ultimate cheat sheet

---

> **Goal of this file**: For EVERY GenAI concept you've studied, know exactly HOW it appears in your project. Interviewers LOVE when you connect theory to YOUR real code.

---

## 🗺️ VoxVeritas AI Architecture Map

```
                    ┌──────────────────────────────────────────────────────┐
                    │              VOXVERITAS AI ECOSYSTEM                  │
                    │                                                        │
                    │  ┌────────────┐    ┌────────────┐   ┌─────────────┐  │
                    │  │  GEMINI    │    │  PINECONE  │   │  EMBEDDING  │  │
                    │  │  2.5 Flash │    │  Vector DB │   │  Model      │  │
                    │  │  (LLM)     │    │  (Storage) │   │  (Google)   │  │
                    │  └─────┬──────┘    └──────┬─────┘   └──────┬──────┘  │
                    │        │                   │                │          │
                    │        └───────────────────┼────────────────┘          │
                    │                            │                            │
                    │  ┌─────────────────────────▼──────────────────────┐   │
                    │  │              AI PIPELINE                         │   │
                    │  │                                                  │   │
                    │  │  1. Off-Topic Detection                          │   │
                    │  │     → Vector similarity OR Gemini analysis       │   │
                    │  │                                                  │   │
                    │  │  2. Comment Embedding                            │   │
                    │  │     → text-embedding-004 → 768-dim vector       │   │
                    │  │                                                  │   │
                    │  │  3. Group Matching (RAG-style)                   │   │
                    │  │     → Pinecone search → threshold check          │   │
                    │  │     → If miss → Gemini classify                  │   │
                    │  │                                                  │   │
                    │  │  4. Group Creation                               │   │
                    │  │     → Gemini: title + description + counters     │   │
                    │  │     → Embed group → Store in Pinecone            │   │
                    │  │                                                  │   │
                    │  │  5. Counter Matching                             │   │
                    │  │     → Search counter index → Find opposing group │   │
                    │  └──────────────────────────────────────────────────┘   │
                    │                                                          │
                    │  Supporting Systems:                                     │
                    │  • Gemini Key Rotation (3 API keys round-robin)         │
                    │  • MongoDB (structured data storage)                    │
                    │  • Node.js orchestration layer                          │
                    └──────────────────────────────────────────────────────────┘
```

---

## 📁 AI Services in Our Project

| Service File | What It Does | GenAI Concepts |
|-------------|-------------|---------------|
| `llmService.js` | Gemini API calls, prompts, function calling | LLM, Function Calling, Prompt Eng |
| `vectorService.js` | Embeddings + Pinecone queries | Embeddings, Vector DB, RAG |
| `aiVerdictService.js` | Fact-checking AI analysis | LLM, Structured Output |
| `offTopicDetectionService.js` | Comment relevance check | Semantic search, LLM |
| `commentFilteringService.js` | Full pipeline orchestration | AI Orchestration |
| `geminiKeyRotation.js` | API key round-robin | Rate limiting, Orchestration |

---

## 🧠 GenAI Concepts → Your Code

### 1. LLM Usage (Gemini 2.5 Flash)

**Where**: `llmService.js`  
**How**: Every LLM call uses `ai.models.generateContent()` with the Gemini Flash model.

```javascript
// From llmService.js — actual code:
const res = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  config: {
    tools: [{ functionDeclarations: [fn] }],
    functionInvocation: 'auto',
    temperature: 0.0,
  },
});
```

**Why Gemini Flash over Pro?**
- 5-10x faster than Gemini Pro
- Significantly cheaper per token
- More than accurate enough for our classification task
- Higher requests per minute quota

---

### 2. Function Calling (Structured AI Output)

**Where**: `llmService.js` — every Gemini call  
**How**: We define a JSON schema (function declaration) and Gemini returns typed JSON, NOT free text.

**The 4 functions we define**:

| Function | Returns | Used For |
|---------|---------|---------|
| `classify_and_generate` | matchedGroup, newLabel, title, description, idealCounter1, idealCounter2 | New comment processing |
| `classify_comment` | matchedGroup, newLabel | Fallback LLM classification only |
| `generate_group_content` | title, description, idealCounter1, idealCounter2 | Group regeneration |
| `analyze_comment_relevance` | isOffTopic, reason, label, confidence | Off-topic detection |
| `regenerate_name` | suggestedName | Group name refresh |

**Why this matters**: No hallucinated field names, no parsing errors, no random extra text. We get exactly the data we need.

---

### 3. Prompt Engineering (7-Layer Prompts)

**Where**: `llmService.js` — `_classifyAndGenerateWithGemini()`  
**Our prompt structure**:

```javascript
const prompt = [
  // Layer 1: INPUT
  `New debate comment: "${comment}"`,
  
  // Layer 2: CONTEXT (RAG)  
  `Existing argument groups: ${existingLabels.join(', ')}`,
  
  // Layer 3: TASK
  `Task: Analyze this comment's SPECIFIC argument...`,
  
  // Layer 4: RULES
  `Grouping Rules:
   - Match ONLY if core claim, evidence type, and reasoning are substantially the same
   - Create NEW group if argument angle differs`,
  
  // Layer 5: FIELD REQUIREMENTS with word limits
  `1. newLabel: Ultra-specific argument category (2-5 words)`,
  
  // Layer 6: EXAMPLES (Few-shot)
  `- Bad: "Economic Impact"  Good: "Job Market Disruption Concerns"`,
  
  // Layer 7: FORMAT
  `Return only the JSON arguments.`,
].join('\n');
```

**Techniques used**:
- ✅ Zero-shot (no external examples, model uses its knowledge)
- ✅ Few-shot (bad/good examples for each field)
- ✅ Instruction following (numbered rules with constraints)
- ✅ Output format specification ("Return only JSON")
- ✅ Word limits ("30-50 words MAX")

---

### 4. RAG (Retrieval Augmented Generation)

**Where**: `vectorService.js` + `commentFilteringService.js`  
**How**: Before calling Gemini, we search Pinecone for similar existing groups. If found (score > 0.75), we skip the LLM entirely.

**Our RAG is "inverted"**: We don't retrieve docs TO answer a question. We retrieve existing groups TO decide if we need to create a new one. The LLM only gets called when retrieval confidence is low.

**The two retrieval passes**:
1. **Groups index**: "Does this comment match an existing debate group?"
2. **Counters index**: "Is this comment a counter-argument to an existing group?"

**Cost saving**: ~70% of comments match existing groups via vector search → 70% fewer LLM calls.

---

### 5. Vector Database (Pinecone)

**Where**: `vectorService.js`  
**Two indices**:

| Index | What's stored | Namespace | Purpose |
|-------|--------------|-----------|---------|
| `debate-groups` | Group description embeddings | `debate-{debateId}` | Match new comments to groups |
| `ideal-counters` | Counter-argument embeddings | `debate-{debateId}` | Match counter-comments to groups |

**Embedding model**: Google `text-embedding-004`  
**Dimensions**: 768  
**Similarity metric**: Cosine similarity  
**Threshold**: 0.75 for group match

**Key operations**:
```javascript
// UPSERT: Store new group embedding
await pinecone.index('debate-groups').upsert([{
  id: groupId,
  values: embeddingVector,  // 768 floats
  metadata: { label, title, debateId }
}]);

// QUERY: Find similar groups
const results = await pinecone.index('debate-groups').query({
  vector: commentEmbedding,
  topK: 5,
  includeMetadata: true,
  namespace: `debate-${debateId}`
});
```

---

### 6. AI Orchestration Pipeline

**Where**: `commentFilteringService.js`  
**Full orchestration sequence**:

```
STEP 1: RECEIVE COMMENT
         ↓
STEP 2: OFF-TOPIC CHECK (offTopicDetectionService)
  → Option A: Vector similarity to debate description (fast)
  → Option B: Gemini relevance analysis (accurate)
  → REJECT if off-topic
         ↓
STEP 3: EMBED COMMENT (vectorService.embedText)
  → text-embedding-004 → 768-dim vector
         ↓
STEP 4: SEARCH PINECONE (vectorService.searchSimilarGroups)
  → Query groups index
  → Query counters index (parallel)
  → Get top-5 matches with scores
         ↓
STEP 5: THRESHOLD DECISION
  → Score > 0.75: Match found → assign to group → DONE (no LLM)
  → Score < 0.75: No match → call Gemini
         ↓
STEP 6 (if no match): GEMINI CLASSIFY + GENERATE (llmService)
  → classifyAndGenerateContent(comment, existingLabels)
  → Returns: matchedGroup OR newLabel + title + description + counters
         ↓
STEP 7 (if new group): CREATE GROUP
  → Save to MongoDB
  → Embed group description → Store in Pinecone groups index
  → Embed idealCounter1, idealCounter2 → Store in Pinecone counters index
         ↓
STEP 8: RETURN RESULT
  → Comment assigned to group
  → Counter-group identified (if exists)
```

**Orchestration patterns used**:
- Sequential chain (steps 1-8 in order)
- Conditional routing (score threshold → two paths)
- Fallback chain (Gemini fails → keyword classify)
- Parallel queries (groups + counters simultaneously)

---

### 7. API Key Rotation (Rate Limit Management)

**Where**: `geminiKeyRotation.js`  
**Implementation**: Round-robin across 3 Gemini API keys.

```javascript
// Simplified from geminiKeyRotation.js:
class GeminiKeyRotation {
  constructor() {
    this.keys = [GEMINI_KEY_1, GEMINI_KEY_2, GEMINI_KEY_3];
    this.index = 0;
  }
  
  getApiKey() {
    const key = this.keys[this.index];
    this.index = (this.index + 1) % this.keys.length;
    return key;
  }
}
```

**Every LLM call**:
```javascript
// In llmService.js:
_ai() {
  return new GoogleGenAI({
    apiKey: this.geminiKeyRotation.getApiKey()  // rotated each time
  });
}
```

**Benefit**: 3x effective rate limit. No single key gets exhausted during high-traffic periods.

---

### 8. AI Verdict System (Fact-Checking)

**Where**: `aiVerdictService.js`  
**What**: When news articles are submitted, Gemini analyzes them for:
- Factual accuracy
- Bias detection
- Credibility score
- Evidence assessment

**GenAI concepts used**:
- LLM analysis (Gemini evaluates article content)
- Structured output (verdict returned as typed JSON)
- Prompt engineering (strict rubrics for fact-checking)

---

### 9. Off-Topic Detection System

**Where**: `offTopicDetectionService.js` + `llmService.analyzeCommentRelevance()`  
**Two-tier approach**:

**Tier 1 (Fast)**: Vector similarity  
- Embed the comment
- Check similarity to debate title + description
- If similarity < 0.3 → likely off-topic

**Tier 2 (Accurate)**: Gemini analysis  
- Pass comment + debate context + recent comments
- Gemini returns: isOffTopic, label (Relevant/Tangential/Off-Topic), confidence, reason
- Temperature: 0.0 for consistency

```javascript
// The Gemini off-topic response:
{
  isOffTopic: true,
  label: "Off-Topic",
  confidence: 0.92,
  reason: "The comment discusses cricket scores which has no relation to the AI ethics debate"
}
```

---

## 🎤 Power Phrases for Your Interview

When asked ANY GenAI question, weave in one of these:

1. **"In our project, when X happened, we used Y because Z..."**
2. **"We chose Gemini Flash over Pro because the speed-cost tradeoff favored Flash for our high-volume use case..."**
3. **"Our RAG-style pipeline reduces LLM calls by ~70% — vector search handles the common cases, Gemini handles the edge cases..."**
4. **"We use function calling for all Gemini interactions — this gives us typed, structured output and eliminates parsing errors..."**
5. **"The AI pipeline has multiple fallback levels: vector match → LLM classify → keyword classify. The system never hard fails."**

---

## 📊 Numbers to Remember

| Metric | Value |
|--------|-------|
| Embedding model | text-embedding-004 |
| Embedding dimensions | 768 |
| LLM model | Gemini 2.5 Flash |
| Vector match threshold | 0.75 cosine similarity |
| API keys rotating | 3 Gemini keys |
| Pinecone indices | 2 (groups + counters) |
| LLM calls saved | ~70% via vector search |
| Functions defined | 5 Gemini function schemas |
| Temperature for classification | 0.0 |

---

## 🎯 The 90-Second AI Pitch

Practice this until perfect:

> "Our project uses a multi-stage AI pipeline. When a user posts a comment in a debate room, here's what happens:
>
> First, we run **off-topic detection** — either via vector similarity to the debate description or a Gemini call for borderline cases. If it passes, we **embed the comment** using Google's text-embedding-004 model to get a 768-dimensional vector.
>
> Then we do a **Pinecone vector search** across existing debate groups for that room. If cosine similarity exceeds 0.75, we assign the comment to that group — no LLM call needed. This handles about 70% of cases and keeps our API costs low.
>
> For the remaining 30%, we call **Gemini 2.5 Flash** using function calling — not free text — to classify the comment and, if needed, generate a new group with title, description, and two ideal counter-arguments. These counter-arguments are also embedded and stored in a separate Pinecone index.
>
> Finally, we match the comment against the counter index to find which existing group it opposes. This powers our debate structure where users see opposing viewpoints.
>
> The whole pipeline is orchestrated in Node.js with API key rotation across 3 Gemini keys for rate limit management, and keyword-based fallbacks if anything fails."

---

*You've completed the GenAI Interview Prep series! Review → Practice → Go ace that interview! 🚀*
