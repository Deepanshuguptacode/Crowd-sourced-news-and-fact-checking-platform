# Module 04: Vector Databases Interview Questions

## Section A: Vector Database Fundamentals

### Q1: What is a vector database and how does it differ from a traditional database?

**Answer:**

| Traditional Database | Vector Database |
|---------------------|-----------------|
| Stores structured data (text, numbers, dates) | Stores vectors (arrays of numbers) |
| Query: "Find rows where name = 'John'" | Query: "Find vectors most similar to this" |
| Uses exact matching (=, <, >) | Uses similarity metrics (cosine, Euclidean) |
| B-tree, hash indexes | Approximate Nearest Neighbor (ANN) indexes |
| MySQL, PostgreSQL, MongoDB | Pinecone, Weaviate, Milvus, Qdrant |

**What are vectors?**
```
Text: "AI moderation is important" 
      ↓ (embedding model)
Vector: [0.12, -0.45, 0.89, -0.33, 0.67, ..., 0.23]  // 768 numbers
```

**VoxVeritas Use Cases:**
1. Group similar comments together
2. Match debate groups with counter-arguments
3. Detect off-topic content

---

### Q2: What are embeddings and how are they generated?

**Answer:**

**Embeddings** are numerical representations of text (or images) that capture semantic meaning.

**Generation Process:**
```javascript
const { GoogleGenAI } = require('@google/genai');

async function generateEmbedding(text) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const result = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
    config: { outputDimensionality: 768 }
  });
  
  return result.embeddings[0].values;  // Array of 768 floats
}

// Same concept, different words = similar vectors
const v1 = await generateEmbedding("Artificial Intelligence");
const v2 = await generateEmbedding("AI technology");
const v3 = await generateEmbedding("pizza recipe");

// v1 and v2 will have high similarity
// v1 and v3 will have low similarity
```

**Properties:**
- Same concept → similar vectors (regardless of wording)
- Different concepts → distant vectors
- Dimensionality fixed by model (768 for Gemini)

---

### Q3: Explain cosine similarity and why it's used for text comparison.

**Answer:**

**Cosine Similarity Formula:**
```
similarity(A, B) = (A · B) / (||A|| × ||B||)

Where:
- A · B = dot product (sum of element-wise multiplication)
- ||A|| = magnitude of A (square root of sum of squares)
```

**Intuition:**
- Measures the **angle** between two vectors
- Range: -1 to 1 (but text embeddings are typically 0 to 1)
- 1.0 = identical direction (same meaning)
- 0.0 = perpendicular (unrelated)

**Why cosine over Euclidean distance?**
- **Scale invariant:** Document length doesn't affect similarity
  - "cat" and "cat cat cat" have same cosine similarity
  - But very different Euclidean distance
- Focuses on **direction** (meaning) not magnitude (length)

**VoxVeritas Thresholds:**
```javascript
const SIMILARITY_THRESHOLDS = {
  GROUP_MATCH: 0.74,    // High confidence for grouping
  COUNTER_MATCH: 0.62,  // Lower for counter-argument matching
  OFF_TOPIC: 0.25       // Below this is off-topic
};
```

---

### Q4: How does Pinecone store and query vectors?

**Answer:**

```javascript
// Storage (Upsert)
await pinecone.index('voxveritas').namespace('debate-groups').upsert({
  records: [{
    id: 'group_123',                           // Unique identifier
    values: [0.12, -0.45, 0.89, ...],          // 768-dimensional vector
    metadata: {                                // Filterable attributes
      roomId: 'room_456',
      stance: 'for',
      _text: 'Original text for debugging'
    }
  }]
});

// Query (Find similar vectors)
const results = await pinecone.index('voxveritas')
  .namespace('debate-groups')
  .query({
    vector: queryEmbedding,     // Vector to search for
    topK: 5,                    // Return top 5 matches
    filter: {                   // Metadata filters
      roomId: 'room_456',
      stance: 'for'
    },
    includeMetadata: true       // Include original metadata
  });

// Results:
// [
//   { id: 'group_123', score: 0.89, metadata: {...} },
//   { id: 'group_124', score: 0.82, metadata: {...} },
//   ...
// ]
```

**Key Concepts:**
- **Namespace:** Logical partition within index (like a table)
- **Metadata:** Key-value pairs for filtering (indexed separately)
- **TopK:** Number of nearest neighbors to return
- **Score:** Cosine similarity (higher = more similar)

---

## Section B: Pinecone Architecture

### Q5: What are namespaces and when should you use them?

**Answer:**

```javascript
// VoxVeritas uses 4 namespaces:
const NAMESPACES = {
  DEBATE_GROUPS:   'debate-groups',    // Debate argument groups
  IDEAL_COUNTERS:  'ideal-counters',   // AI-generated counter arguments
  NEWS_GROUPS:     'news-groups',      // News comment groups
  DEBATE_TOPICS:   'debate-topics'     // Debate room topics
};
```

**Why namespaces?**
1. **Query isolation:** Search in 'debate-groups' doesn't see 'news-groups'
2. **Access control:** Can set different permissions per namespace
3. **Cleanup:** Delete entire namespace easily
4. **Organization:** Logical separation of concerns

**Without namespaces (don't do this):**
```javascript
// BAD: Mix everything, filter with metadata
{ id: 'group_1', metadata: { type: 'debate-group', roomId: '123' } }
{ id: 'group_2', metadata: { type: 'news-group', newsId: '456' } }
// Query becomes complex, slower
```

**With namespaces (VoxVeritas approach):**
```javascript
// GOOD: Separate namespaces
await pinecone.index('voxveritas').namespace('debate-groups').query({...});
await pinecone.index('voxveritas').namespace('news-groups').query({...});
// Faster, cleaner queries
```

---

### Q6: How does the vectorService cache work?

**Answer:**

```javascript
const embeddingCache = new Map();  // In-memory cache
const CACHE_MAX = 2000;            // Max entries
const CACHE_TTL = 3600000;         // 1 hour TTL

async function generateEmbedding(text) {
  // Cache key: first 200 chars of text
  const cacheKey = text.substring(0, 200);
  
  // Check cache
  const cached = embeddingCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.vec;  // Cache hit!
  }
  
  // Cache miss - call API
  const vec = await callGeminiAPI(text);
  
  // Evict oldest if at capacity
  if (embeddingCache.size >= CACHE_MAX) {
    const oldestKey = embeddingCache.keys().next().value;
    embeddingCache.delete(oldestKey);
  }
  
  // Store in cache
  embeddingCache.set(cacheKey, { vec, ts: Date.now() });
  
  return vec;
}
```

**Why cache?**
- Embedding API calls cost money and have rate limits
- Same comments ("I agree", "This is fake") appear frequently
- 200 char key captures most duplicates while limiting memory

---

## Section C: Similarity Matching

### Q7: How does VoxVeritas match comments to groups?

**Answer:**

```javascript
async function matchCommentToGroup(commentText, newsId) {
  // Step 1: Generate embedding for new comment
  const commentEmbedding = await generateEmbedding(commentText);
  
  // Step 2: Query Pinecone for similar groups
  const matches = await pinecone
    .index('voxveritas')
    .namespace('news-groups')
    .query({
      vector: commentEmbedding,
      topK: 3,  // Get top 3 matches
      filter: { newsId: newsId }  // Only for this news article
    });
  
  // Step 3: Check if best match exceeds threshold
  const bestMatch = matches.matches[0];
  
  if (bestMatch && bestMatch.score >= 0.74) {
    return {
      matched: true,
      groupId: bestMatch.id,
      confidence: bestMatch.score
    };
  }
  
  // Step 4: No good match - create new group (via LLM)
  return { matched: false };
}
```

**Decision Flow:**
```
Comment Arrives
      ↓
Generate Embedding
      ↓
Query Pinecone
      ↓
┌─────────────────┐
│ Score >= 0.74?  │
└─────────────────┘
    Yes ↓      ↓ No
Add to    Create New
existing  Group (LLM)
group
```

**Why 0.74 threshold?**
- High enough to avoid false positives (wrong group assignment pollutes group)
- Better to miss a match and let LLM decide than assign incorrectly

---

### Q8: How does counter-argument matching work in debates?

**Answer:**

**The Problem:** Match a "for" argument group with its best "against" counter-group.

**The Solution: Ideal Counters**

```javascript
// Each group stores 2 "ideal" counter-arguments
// These are AI-generated summaries of what a counter-argument would say

// When matching:
async function findCounterGroup(groupId, commentEmbedding, roomId) {
  // 1. Query ideal counters of opposing stance
  const idealMatches = await pinecone
    .index('voxveritas')
    .namespace('ideal-counters')
    .query({
      vector: commentEmbedding,
      topK: 15,
      filter: { roomId, ownerStance: 'against' }
    });
  
  // 2. Each group has 2 ideal counters (ic1, ic2)
  // Track best score for each
  const groupScores = new Map();
  
  for (const match of idealMatches) {
    const groupId = match.metadata.ownerGroupId;
    const icIndex = match.metadata.idealCounterIndex;  // 1 or 2
    
    if (!groupScores.has(groupId)) {
      groupScores.set(groupId, { ic1: 0, ic2: 0 });
    }
    
    const scores = groupScores.get(groupId);
    const key = `ic${icIndex}`;
    scores[key] = Math.max(scores[key], match.score);
  }
  
  // 3. Average the two scores (if both exist)
  const candidates = [];
  for (const [gId, scores] of groupScores) {
    const hasBoth = scores.ic1 > 0 && scores.ic2 > 0;
    const avgScore = hasBoth 
      ? (scores.ic1 + scores.ic2) / 2
      : Math.max(scores.ic1, scores.ic2);
    
    candidates.push({ groupId: gId, score: avgScore });
  }
  
  // 4. Sort and return best
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  
  return best && best.score >= 0.62 
    ? { matched: true, counterGroupId: best.groupId, score: best.score }
    : { matched: false };
}
```

**Why 2 ideal counters?**
- Single counter might be too narrow
- Two variations capture more ways to express the same counter-argument
- Average score prevents outliers from skewing results

---

## Section D: Error Handling and Fallbacks

### Q9: How does vectorService handle API failures gracefully?

**Answer:**

```javascript
async function generateEmbedding(text) {
  const MAX_RETRIES = 3;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await callGeminiAPI(text);
    } catch (error) {
      const isRateLimit = error.message?.includes('429') || 
                          error.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit && attempt < MAX_RETRIES - 1) {
        // Exponential backoff: 3s, 6s, 9s
        await delay(3000 * (attempt + 1));
        continue;
      }
      
      // Log and return null - don't crash
      console.error('Embedding failed:', error);
      return null;
    }
  }
}

// Usage in caller:
const embedding = await generateEmbedding(text);
if (!embedding) {
  // Fall back to LLM or keyword matching
  return await llmFallback(text);
}
```

**Graceful Degradation:**
- If Pinecone is down → Use LLM directly
- If embedding fails → Use keyword matching
- If LLM fails → Create generic group
- **Never let AI failures break core functionality**

---

## Section E: Advanced Topics

### Q10: What is Approximate Nearest Neighbor (ANN) search?

**Answer:**

**The Problem:**
- With 1 million vectors of 768 dimensions, exact search is too slow
- Calculating cosine similarity with every vector = O(n × d) time

**ANN Solution:**
- Use approximate algorithms (HNSW, IVF) to pre-organize vectors
- Trade accuracy for speed
- Find "close enough" neighbors in milliseconds vs. seconds

**How it works:**
1. **Indexing:** Build hierarchical graph of vectors
2. **Search:** Navigate graph to find nearest regions
3. **Result:** Return topK approximate nearest neighbors

**Trade-offs:**
- Recall: Might miss the true #1 nearest neighbor
- Speed: 1000x faster than exact search
- VoxVeritas: Acceptable for comment grouping

---

### Q11: How would you scale vector search for millions of users?

**Answer:**

**Sharding Strategies:**

1. **By News Article:**
   ```javascript
   // Partition key: newsId % numShards
   shard = newsId.hash() % 16
   // Each shard handles subset of articles
   ```

2. **By Time:**
   ```javascript
   // Recent articles on fast SSD shards
   // Old articles on slower/cheaper storage
   ```

3. **By Organization (multi-tenant):**
   ```javascript
   // Separate Pinecone index per organization
   // Complete isolation, easier billing
   ```

**Optimization Techniques:**

```javascript
// 1. Filter before vector search (VoxVeritas does this)
query({
  filter: { newsId: 'specific_id' },  // Reduces search space first
  vector: embedding
});

// 2. Reduce dimensionality (if needed)
// Use PCA to reduce 768 → 256 dimensions
// Less accurate but faster

// 3. Batch operations
await index.upsert({ records: [record1, record2, ...] });  // Batch

// 4. Async indexing
// Queue embeddings to background worker
// Don't block user request
```

---

## Quick Reference: Vector Operations

| Operation | Pinecone Method | Use Case |
|-----------|-----------------|----------|
| Store | `upsert()` | Add/update group |
| Search | `query()` | Find similar groups |
| Delete | `deleteOne()` | Remove deleted group |
| Batch Delete | `deleteMany()` | Cleanup old data |
| Fetch | `fetch()` | Get specific vectors |
| Stats | `describeIndexStats()` | Monitor usage |

**Similarity Score Interpretation:**
- 0.90-1.00: Very similar (likely same topic)
- 0.70-0.89: Related (same general area)
- 0.50-0.69: Somewhat related
- 0.00-0.49: Unrelated

**Threshold Guidelines:**
- **Strict matching:** 0.80+ (minimize false positives)
- **Balanced:** 0.70-0.75 (VoxVeritas default)
- **Lenient:** 0.60+ (capture more, accept false positives)
