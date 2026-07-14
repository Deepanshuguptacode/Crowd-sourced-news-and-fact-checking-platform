# 06 — AI & ML Q&A

> This section is your biggest differentiator in a TCS interview. Most candidates don't have real AI integration. Speak confidently here.

---

## LLM Basics

**Q: What is a Large Language Model (LLM)?**
A: An LLM is a deep learning model trained on massive text corpora using the Transformer architecture. It learns statistical relationships between tokens (words/subwords) and can generate coherent text, answer questions, classify text, and more. Examples: GPT-4, Google Gemini, LLaMA, Claude. We use Google Gemini.

**Q: What is the difference between an LLM and a traditional ML model?**
A: Traditional ML models (e.g., logistic regression, random forests) require manually engineered features and are trained for one specific task. LLMs are general-purpose — the same model can classify text, generate summaries, answer questions, write code. They learn from context (the prompt) rather than task-specific training data.

**Q: What is prompt engineering?**
A: Crafting the input text (prompt) to guide an LLM to produce the desired output. In VoxVeritas, we carefully design prompts for:
- Comment classification: "Given this comment about a news article, which category does it belong to?"
- Verdict generation: "Analyze the following news article and community comments. Provide a credibility verdict with score 0-100..."
- Off-topic detection: "Is this comment relevant to the debate topic?"

---

## Gemini Integration in VoxVeritas

**Q: How do you use Gemini in your project?**
A: Two distinct uses:

**1. LLM Text Generation (via `llmService.js`)**
- Classify comments into thematic groups
- Generate group labels and descriptions
- Create AI credibility verdicts
- Detect off-topic debate comments

**2. Text Embeddings (via `vectorService.js`)**
- Convert text to 768-dimensional vectors
- Used to find semantically similar comments
- Powers the comment grouping system via Pinecone

**Q: What is the difference between LLM generation and embeddings?**

| Feature | LLM Generation | Embeddings |
|---------|---------------|------------|
| Model | `gemini-2.5-flash` | `gemini-embedding-001` |
| Output | Human-readable text or JSON | Array of 768 floats |
| Purpose | Understand + generate content | Measure semantic similarity |
| Use in VoxVeritas | Verdicts, group labels, classification | Comment matching via Pinecone |

---

## Function Calling

**Q: What is function calling in Gemini? Why use it?**
A: Function calling lets you define a JSON schema, and Gemini returns structured JSON that fits that schema instead of free text. This gives you reliable, parseable output.

Example — AI Verdict function schema:
```javascript
const generateVerdictFn = {
  name: 'generate_news_verdict',
  parameters: {
    type: 'OBJECT',
    properties: {
      verdict:    { type: 'STRING' },  // Analysis text
      score:      { type: 'NUMBER' },  // 0-100 credibility
      confidence: { type: 'NUMBER' },  // 0-1 certainty
      keyFactors: { type: 'ARRAY', items: { type: 'STRING' } },
      riskLevel:  { type: 'STRING' },  // LOW/MEDIUM/HIGH
    },
    required: ['verdict', 'score', 'confidence', 'keyFactors', 'riskLevel']
  }
};
```

Without function calling, you'd get free text and have to parse it with regex — unreliable. With function calling, you always get a valid JSON object.

---

## Vector Database & Embeddings

**Q: What is an embedding?**
A: A numerical representation of text (or images) that captures semantic meaning. Semantically similar texts produce similar vectors. Example:
- "The president signed a new bill" → [0.23, -0.45, 0.12, ...] (768 numbers)
- "A new law was passed by the president" → [0.24, -0.44, 0.11, ...] (very similar!)
- "I like chocolate ice cream" → [−0.31, 0.67, -0.55, ...] (very different)

**Q: What is cosine similarity for text?**
A: A metric measuring the angle between two embedding vectors. Two identical texts have cosine similarity = 1.0. Completely unrelated texts approach 0.0. We use it to determine if a new comment is similar enough to an existing comment group (threshold: 0.74).

**Q: Why Pinecone and not just MongoDB?**
A: MongoDB stores structured data but can't efficiently search by semantic similarity. To find the most similar text across 10,000 vectors, MongoDB would need to compute cosine similarity for every single one (O(n)). Pinecone uses HNSW (Hierarchical Navigable Small World) index — an approximate nearest neighbor algorithm that finds the top K similar vectors in O(log n) time.

---

## Comment Grouping Pipeline

**Q: Explain how comments are grouped in your system.**
A: End-to-end pipeline for a new comment:

```
New comment posted
      |
      v
1. Generate Embedding (Gemini API)
   Text -> 768-dim vector
      |
      v
2. Query Pinecone (matchNewsComment)
   Filter by newsId
   Find top 3 similar group vectors
      |
      +----- Score >= 0.74 -----> Assign to existing group (done!)
      |
      +----- Score < 0.74 ------> LLM Classification fallback:
                                    |
                                    v
                               3. Gemini LLM - classifyAndGenerateContent()
                                  "Does this comment fit any of these groups?
                                   If yes, return groupId.
                                   If no, create a new group with label + description."
                                    |
                                    +----- Fits existing: assign groupId
                                    |
                                    +----- New group: create CommentGroup in MongoDB
                                                        Store new embedding in Pinecone
```

**Q: Why two layers (vector + LLM)?**
A: Speed and cost. Vector search is fast (milliseconds, no AI cost). LLM classification is slower (~1-2 seconds, API cost). The vector layer handles ~74%+ of cases cheaply; LLM only runs for genuinely ambiguous or new-theme comments.

---

## AI Verdict System

**Q: How does the AI generate a credibility verdict?**
A: Multi-step process:

1. **Select top comments**: Takes top 8 supporting + 8 opposing comments by score, ensuring diversity via group-based selection (one best comment per thematic group)

2. **Build analysis prompt**: Structured prompt with news article details + comments grouped by stance

3. **Gemini function call**: Returns:
   - Verdict text (≤250 words analysis)
   - Score (0-100)
   - Confidence (0-1)
   - Key factors (3-5 points)
   - Risk level (LOW/MEDIUM/HIGH)

4. **Multi-layer parsing**: Tries standard function call response → nested candidates → plain text JSON fallback

5. **Save AIVerdict document**: Stores verdict + metadata for future retrieval

**Q: What credibility score scale do you use?**

| Score | Meaning |
|-------|---------|
| 0-20 | Definitely fake |
| 21-40 | Likely false |
| 41-60 | Uncertain/mixed evidence |
| 61-80 | Likely true |
| 81-100 | Highly credible |

---

## API Key Rotation

**Q: How do you handle Gemini API rate limits?**
A: Custom `GeminiKeyRotation` singleton service with 3 API keys:

- Rotates to the next key after every 5 requests
- Automatic rotation via `getApiKey()` counter
- Forced rotation via `advanceKey()` for sequential multi-step calls
- Circular rotation: key1 → key2 → key3 → key1 → ...

This triples the effective rate limit and distributes load across keys, preventing 429 (rate limit exceeded) errors in production.

---

## Off-Topic Detection

**Q: How do you detect off-topic comments in debate rooms?**
A: Two-layer approach:

1. **Primary — LLM check**: Gemini LLM evaluates if the comment is relevant to the debate topic. Returns: on-topic / off-topic / tangential. This is the current production method.

2. **Legacy — Vector check**: Compare comment embedding against the debate room's topic embedding in Pinecone. Score < 0.25 → off-topic; 0.25-0.40 → tangential; > 0.40 → on-topic. (Replaced by LLM method which is more accurate.)

---

## Ideal Counter System (Advanced — Impress the Interviewer)

**Q: How does counter-argument matching work in debate rooms?**
A: When a comment group is created (e.g., "Group FOR: Economic benefits"), the LLM generates 2 ideal counter-argument descriptions — what an opposing argument would look like. These are stored in Pinecone as `{groupId}_ic1` and `{groupId}_ic2`.

When an opposing comment arrives and gets assigned to a group, the system:
1. Queries the comment's embedding against ideal counters of the opposing stance
2. Scores each opposing group by averaging IC1 and IC2 match scores
3. If score >= 0.62: links the two groups as counter-arguments (`counterGroupId`)

This creates a map of debate structure — which "for" arguments counter which "against" arguments — useful for displaying structured debate analysis to users.
