# 08 — DSA Concepts Used in the Project

> TCS often asks "Show me where you used data structures/algorithms in your project." This section maps project code to DSA concepts.

---

## Cosine Similarity (Geometry / Linear Algebra)

**Where used**: Face authentication + vector similarity matching

**The math:**
```
Given vectors A = [a1, a2, ..., an] and B = [b1, b2, ..., bn]:

dot_product = a1×b1 + a2×b2 + ... + an×bn
magnitude_A = √(a1² + a2² + ... + an²)
magnitude_B = √(b1² + b2² + ... + bn²)

cosine_similarity = dot_product / (magnitude_A × magnitude_B)
```

**In JavaScript** (from `httpFaceAuthService.js`):
```javascript
verifyFaceMatch(testEmbedding, storedEmbedding, threshold = 0.3) {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < testEmbedding.length; i++) {
    dotProduct += testEmbedding[i] * storedEmbedding[i];
    normA += testEmbedding[i] ** 2;
    normB += storedEmbedding[i] ** 2;
  }
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return { similarity, matched: similarity >= threshold };
}
```

**Time Complexity**: O(n) where n = vector dimensions (512 for face, 768 for text)  
**Space Complexity**: O(1) — computed in a single pass

---

## Sorting

**Where used**: Comment selection for AI verdicts, debate room listing

**Algorithm**: JavaScript's `Array.sort()` — V8 uses TimSort (O(n log n))

```javascript
// Sort comments by score descending
comments.sort((a, b) => (b.score || 0) - (a.score || 0));

// Sort debate rooms by creation date descending
.sort({ createdAt: -1 })  // MongoDB sort (B-tree index traversal)
```

**Interview question: Implement a simple sort**
```javascript
// Bubble sort (for explanation)
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j+1]) {
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]]; // Swap
      }
    }
  }
  return arr;
}
// O(n²) time, O(1) space
```

---

## HashMap / Dictionary (Scoring System)

**Where used**: Counter-argument group scoring in `findCounterByIdealMatch`

```javascript
// Build a map of opposing group scores
const groupScores = new Map();  // groupId -> { ic1: 0, ic2: 0 }

for (const match of pineconeMatches) {
  const ownerId = match.metadata.ownerGroupId;
  if (!groupScores.has(ownerId)) {
    groupScores.set(ownerId, { ic1: 0, ic2: 0 });
  }
  const entry = groupScores.get(ownerId);
  if (match.metadata.idealCounterIndex === 1) {
    entry.ic1 = Math.max(entry.ic1, match.score);  // Keep best IC1 score
  } else {
    entry.ic2 = Math.max(entry.ic2, match.score);
  }
}

// Convert to array and sort by average score
const candidates = [...groupScores.entries()].map(([gId, { ic1, ic2 }]) => ({
  counterGroupId: gId,
  avgScore: (ic1 + ic2) / 2
}));
candidates.sort((a, b) => b.avgScore - a.avgScore);
```

**Map operations: O(1) average** for get/set/has (hash table implementation)

---

## FIFO Queue (Cache Eviction)

**Where used**: Embedding cache in `vectorService.js`

JavaScript's `Map` preserves insertion order. When cache is full (2000 items), the oldest entry is evicted:

```javascript
function setCache(key, vec) {
  if (embeddingCache.size >= CACHE_MAX) {
    const oldest = embeddingCache.keys().next().value;  // First inserted = oldest
    embeddingCache.delete(oldest);  // Evict
  }
  embeddingCache.set(key, { vec, ts: Date.now() });
}
```

This is effectively **FIFO (First In, First Out)** eviction — the caching strategy is LRU (Least Recently Used) via TTL check.

**Interview question: Implement LRU Cache**
```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);  // Move to end (most recent)
    return val;
  }
  put(key, val) {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.capacity) {
      this.cache.delete(this.cache.keys().next().value);  // Delete oldest
    }
    this.cache.set(key, val);
  }
}
```

---

## Tree Traversal (MongoDB B-Tree Index)

**Context**: When MongoDB queries sorted news (`sort({ uploadedAt: -1 })`), it traverses the B-tree index on `uploadedAt` in reverse order — O(log n) to find the starting position, then sequential leaf-node traversal for the results.

**Binary Search Tree reminder**:
```
Insert: O(log n) avg, O(n) worst (skewed tree)
Search: O(log n) avg
Delete: O(log n) avg
B-Tree: Balanced, used in databases for O(log n) guaranteed
```

---

## Recursive Thinking (Cascade Delete)

**Conceptual**: Deleting a DebateRoom cascades to DebateGroups → DebateComments → Pinecone vectors. This is depth-first graph traversal (tree of dependencies).

```
DebateRoom
    |
    +-- DebateGroup 1 -----> Vectors (Pinecone)
    |       |
    |       +-- DebateComment 1
    |       +-- DebateComment 2
    |
    +-- DebateGroup 2 -----> Vectors (Pinecone)
            |
            +-- DebateComment 3
```

Delete order: collect group IDs → delete vectors → delete comments → delete groups → delete room

---

## Exponential Backoff (Retry Algorithm)

**Where used**: Gemini embedding retry with rate limit handling

```javascript
for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  try {
    const result = await callGemini();
    return result;
  } catch (err) {
    if (isRateLimit(err) && attempt < MAX_RETRIES - 1) {
      const wait = 3000 * (attempt + 1);  // 3s, 6s, 9s
      await sleep(wait);
      continue;
    }
    return null;
  }
}
```

Exponential backoff pattern: wait time doubles each retry (or multiplies by factor). Used in distributed systems to avoid thundering herd problem.

---

## Pagination (Sliding Window on Sorted Data)

**Where used**: News feed, debate room listing

```javascript
// Page 1: skip=0, limit=10 → items [0,9]
// Page 2: skip=10, limit=10 → items [10,19]
.skip((page - 1) * limit).limit(limit)
```

For MongoDB with indexed sort field, this is efficient. For large offsets (skip 10,000), it becomes slow — cursor-based pagination (using last document's ID as cursor) is more efficient at scale.

---

## String Matching (Regex Search)

**Where used**: Debate room search

```javascript
if (search) {
  query.$or = [
    { title: { $regex: search, $options: 'i' } },      // case-insensitive
    { description: { $regex: search, $options: 'i' } },
    { tags: { $in: [new RegExp(search, 'i')] } }
  ];
}
```

MongoDB uses `$regex` for pattern matching. For full-text search at scale, MongoDB's `$text` index or Elasticsearch would be more efficient.

---

## OOP Concepts Used

**Encapsulation**: Service classes hide implementation details (Pinecone API calls, key management) behind clean method interfaces.

**Abstraction**: Controllers don't know about Pinecone or Gemini — they call `vectorService.matchNewsComment()` and get a result.

**Polymorphism**: The generic `signup(UserModel, userType)` function works for NormalUser, CommunityUser, ExpertUser — same code, different behavior via model injection.

**Singleton**: Service classes exported as `new ServiceClass()` — one instance per application lifecycle.
