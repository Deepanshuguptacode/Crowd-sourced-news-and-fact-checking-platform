# 08 — Pinecone Vector Database

> **File**: `services/vectorService.js` (804 lines)  
> **Pattern**: Singleton class — `module.exports = new VectorService()`  
> **Prerequisites**: [03 — MongoDB/Mongoose](./03-MONGODB-MONGOOSE.md), [01 — Node/Express Fundamentals](./01-NODE-EXPRESS-FUNDAMENTALS.md)

---

## What Is a Vector Database?

A traditional database answers "find me the row where `username = 'alice'`."  
A vector database answers **"find me the rows most similar to this concept."**

Text is converted into a list of numbers (an **embedding**) that captures its meaning. Two sentences about the same topic produce number lists that are mathematically close together, even if they use completely different words.

**Pinecone** is a managed cloud vector database. VoxVeritas stores embeddings there and queries them to:
- Group similar comments together (news page and debate page)
- Match debate groups to their counter-argument groups
- Detect off-topic debate comments

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                   VectorService                      │
│                  (Singleton Class)                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  Gemini Embed   │    │    Pinecone Client       │  │
│  │  gemini-embed-  │    │  Index: "voxveritas"     │  │
│  │  ding-001       │    │                          │  │
│  │  768 dimensions │    │  4 Namespaces:           │  │
│  └────────┬────────┘    │  ├─ debate-groups        │  │
│           │              │  ├─ ideal-counters       │  │
│           ▼              │  ├─ news-groups          │  │
│  ┌─────────────────┐    │  └─ debate-topics        │  │
│  │ Embedding Cache  │    └─────────────────────────┘  │
│  │ Map<key, {vec,  │                                  │
│  │   ts}>           │                                  │
│  │ max: 2000 items │                                  │
│  │ TTL: 1 hour     │                                  │
│  └─────────────────┘                                  │
└──────────────────────────────────────────────────────┘
```

---

## Singleton Initialisation

```javascript
class VectorService {
  constructor() {
    this.pinecone  = null;   // Pinecone client
    this.index     = null;   // Reference to "voxveritas" index
    this.ready     = false;  // True after successful init
    this._initPromise = null; // Prevents duplicate init calls
  }
}

module.exports = new VectorService();
```

`init()` is called lazily — the first method that needs Pinecone triggers it. The `_initPromise` pattern ensures only one initialisation runs even if multiple callers arrive simultaneously:

```javascript
async init() {
  if (this.ready) return;              // Already done
  if (this._initPromise) return this._initPromise; // Already in progress

  this._initPromise = (async () => {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) { console.warn('vector service disabled'); return; }

    this.pinecone = new Pinecone({ apiKey });
    const indexName = process.env.PINECONE_INDEX_NAME || 'voxveritas';

    // Auto-create index if it doesn't exist
    const { indexes } = await this.pinecone.listIndexes();
    const exists = indexes?.some(i => i.name === indexName);

    if (!exists) {
      await this.pinecone.createIndex({
        name: indexName,
        dimension: 768,                // Must match EMBEDDING_DIM
        metric: 'cosine',              // Cosine similarity
        spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
      });
      await new Promise(r => setTimeout(r, 30000)); // Wait for index readiness
    }

    this.index = this.pinecone.index(indexName);
    this.ready = true;
  })();

  return this._initPromise;
}
```

**Key points**:
- If `PINECONE_API_KEY` is not set, the service fails gracefully — every method returns empty results or `false` instead of crashing.
- The index is created automatically with **cosine** metric and serverless spec on AWS.
- The 30-second wait after creation gives Pinecone time to provision the index.

---

## Namespaces

Pinecone supports **namespaces** within a single index. Think of them as separate collections sharing the same index infrastructure:

```javascript
const NAMESPACES = {
  DEBATE_GROUPS:   'debate-groups',    // DebateGroup title+description embeddings
  IDEAL_COUNTERS:  'ideal-counters',   // Ideal counter-argument descriptions (2 per group)
  NEWS_GROUPS:     'news-groups',      // CommentGroup embeddings (news page)
  DEBATE_TOPICS:   'debate-topics',    // DebateRoom title+description (off-topic check)
};
```

| Namespace | What Gets Stored | Who Writes | Who Queries |
|-----------|-----------------|------------|-------------|
| `debate-groups` | Combined `title + description` of each DebateGroup | `storeDebateGroup()` | `matchDebateComment()` |
| `ideal-counters` | 2 ideal counter-argument texts per DebateGroup | `storeIdealCounters()` | `findCounterByIdealMatch()`, `findCounterByCombinedMatch()` |
| `news-groups` | Combined `label + description` of each CommentGroup | `storeNewsGroup()` | `matchNewsComment()` |
| `debate-topics` | DebateRoom title+description (currently unused — LLM replaced vector off-topic) | Reserved | Reserved |

---

## Similarity Thresholds

```javascript
const SIMILARITY_THRESHOLDS = {
  GROUP_MATCH:   0.74,   // comment → group (must be very confident)
  COUNTER_MATCH: 0.62,   // comment → ideal-counter avg (pairing threshold)
  OFF_TOPIC:     0.25,   // below = off-topic (legacy, LLM now handles this)
  TANGENTIAL:    0.40,   // between OFF_TOPIC and this = tangential (legacy)
};
```

**Why 0.74 for group matching?** A high threshold prevents false positives — if a comment is wrongly assigned to a group, the group's theme becomes polluted. It's better to miss a match (and let the LLM take a second look) than to assign incorrectly.

**Why 0.62 for counter matching?** Counter-matching is inherently less precise since ideal counters are AI-generated approximations. A lower threshold allows reasonable counter-group pairings.

---

## Embedding Generation

### Model Details

| Property | Value |
|----------|-------|
| Model | `gemini-embedding-001` |
| Dimensions | 768 (via `outputDimensionality` config) |
| SDK | `@google/genai` → `GoogleGenAI` |
| API Key | Rotated via `geminiKeyRotation.getApiKey()` |

### The Embedding Cache

Before calling Google's API, the service checks an in-memory `Map`:

```javascript
const embeddingCache = new Map();   // key → { vec, ts }
const CACHE_MAX = 2000;            // Maximum entries
const CACHE_TTL = 3600000;         // 1 hour in milliseconds

function getCached(key) {
  const entry = embeddingCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    embeddingCache.delete(key);     // Expired
    return null;
  }
  return entry.vec;
}

function setCache(key, vec) {
  if (embeddingCache.size >= CACHE_MAX) {
    // Evict oldest entry (FIFO — Map preserves insertion order)
    const oldest = embeddingCache.keys().next().value;
    embeddingCache.delete(oldest);
  }
  embeddingCache.set(key, { vec, ts: Date.now() });
}
```

**Cache key**: First 200 characters of the input text. This means:
- Two identical comments produce the same embedding without a second API call
- Very long comments that share the first 200 chars will cache-collide (acceptable trade-off)

### Rate Limit Retry

```javascript
async generateEmbedding(text) {
  if (!text || text.trim().length === 0) return null;

  const cached = getCached(text.substring(0, 200));
  if (cached) return cached;                         // Cache hit

  const MAX_EMBED_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_EMBED_RETRIES; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKeyRotation.getApiKey() });
      const res = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
        config: { outputDimensionality: 768 },
      });

      const vec = res.embeddings?.[0]?.values ?? res.embedding?.values;
      if (!vec || vec.length === 0) throw new Error('Empty embedding response');

      setCache(text.substring(0, 200), vec);
      return vec;
    } catch (err) {
      const isRateLimit = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && attempt < MAX_EMBED_RETRIES - 1) {
        const wait = 3000 * (attempt + 1);   // 3s, 6s backoff
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      return null;  // Give up gracefully
    }
  }
  return null;
}
```

**Flow**: Cache check → API call → retry on 429 with exponential backoff → cache result → return.

**Graceful failure**: Returns `null` if generation fails entirely. Every caller handles `null` embeddings by skipping the vector operation.

---

## Core Operations

### Upsert (Store a Vector)

```javascript
async upsertVector(id, text, metadata = {}, namespace = NAMESPACES.DEBATE_GROUPS) {
  await this.init();                           // Ensure ready
  if (!this.ready) return false;

  const vector = await this.generateEmbedding(text);
  if (!vector) return false;                   // Embedding failed

  await this.index.namespace(namespace).upsert({
    records: [{
      id: String(id),                          // Pinecone requires string IDs
      values: vector,                          // The 768-dim embedding
      metadata: { ...metadata, _text: text.substring(0, 500) },
    }],
  });
  return true;
}
```

**Metadata**: The `_text` field stores the first 500 chars of the original text alongside the vector. This makes debugging easier — you can see what text produced each embedding when querying Pinecone directly.

### Query (Find Similar Vectors)

```javascript
async queryVector(text, topK = 5, filter = {}, namespace) {
  await this.init();
  if (!this.ready) return [];

  const vector = await this.generateEmbedding(text);
  if (!vector) return [];

  const res = await this.index.namespace(namespace).query({
    vector,
    topK,
    filter,             // Metadata filters (e.g., { roomId: "abc" })
    includeMetadata: true,
  });
  return res.matches || [];
}
```

There is also `queryWithEmbedding()` that takes a pre-computed embedding instead of text, skipping the embedding generation step. This saves an API call when the caller already has the embedding:

```javascript
async queryWithEmbedding(embedding, topK = 5, filter = {}, namespace) {
  // Same as queryVector but uses embedding directly
  const res = await this.index.namespace(namespace).query({
    vector: embedding, topK, filter, includeMetadata: true,
  });
  return res.matches || [];
}
```

### Delete

```javascript
async deleteVector(id, namespace) {
  await this.index.namespace(namespace).deleteOne({ id: String(id) });
}

async deleteMany(ids, namespace) {
  await this.index.namespace(namespace).deleteMany({ ids: ids.map(String) });
}
```

All operations handle connection errors gracefully via `_isConnectionError()`, which checks for network timeouts, connection resets, DNS failures, etc. If Pinecone is unreachable, operations return `false`/`[]` instead of crashing.

---

## Feature-Specific Methods

### News Comment Matching

**Purpose**: When a user posts a comment on a news article, find which existing CommentGroup it belongs to.

```javascript
async matchNewsComment(text, newsId, embedding = null) {
  const matches = embedding
    ? await this.queryWithEmbedding(embedding, 3, { newsId: String(newsId) }, NAMESPACES.NEWS_GROUPS)
    : await this.queryVector(text, 3, { newsId: String(newsId) }, NAMESPACES.NEWS_GROUPS);

  const best = matches[0];
  if (best && best.score >= SIMILARITY_THRESHOLDS.GROUP_MATCH) {  // ≥ 0.74
    return { groupId: best.id, score: best.score, label: best.metadata?.label };
  }
  return null;  // No confident match → LLM fallback
}
```

**Filter**: `{ newsId }` ensures the query only searches groups belonging to the same news article. A comment on Article A will never match a group from Article B.

### News Group Storage

```javascript
async storeNewsGroup(groupId, label, description, newsId) {
  const combined = `${label}. ${description || ''}`;
  return await this.upsertVector(groupId, combined, {
    newsId: String(newsId),
    label,
  }, NAMESPACES.NEWS_GROUPS);
}
```

### Debate Comment Matching

```javascript
async matchDebateComment(text, roomId, stance, embedding = null) {
  const matches = embedding
    ? await this.queryWithEmbedding(embedding, 3, { roomId: String(roomId), stance }, NAMESPACES.DEBATE_GROUPS)
    : await this.queryVector(text, 3, { roomId: String(roomId), stance }, NAMESPACES.DEBATE_GROUPS);

  const best = matches[0];
  if (best && best.score >= SIMILARITY_THRESHOLDS.GROUP_MATCH) { // ≥ 0.74
    return { groupId: best.id, score: best.score };
  }
  return null;
}
```

**Filter**: Both `roomId` AND `stance` — a "for" comment should only match "for" groups within the same debate room.

### Debate Group Storage

```javascript
async storeDebateGroup(groupId, title, description, roomId, stance) {
  const combined = `${title}. ${description}`;
  return await this.upsertVector(groupId, combined, {
    roomId: String(roomId),
    stance,
    title,
  }, NAMESPACES.DEBATE_GROUPS);
}
```

---

## Ideal Counter System

The ideal counter system is the most sophisticated part of vectorService. Each DebateGroup gets two AI-generated "ideal counter-arguments" stored as separate embeddings. When a new comment arrives for the opposing stance, the system checks if it matches any existing group's ideal counters.

### Why Two Ideal Counters?

A single counter-description might be too narrow. By generating two variations of the same opposing argument (different phrasing, different emphasis), the system catches a wider range of actual counter-comments.

### Storing Ideal Counters

```javascript
async storeIdealCounters(groupId, idealCounters, roomId, stance) {
  // Filter out empty/whitespace entries
  const validCounters = idealCounters.map(ic => ic?.trim()).filter(Boolean);
  if (validCounters.length === 0) return false;

  for (let i = 0; i < validCounters.length; i++) {
    const icId = `${groupId}_ic${i + 1}`;   // e.g., "abc123_ic1", "abc123_ic2"
    await this.upsertVector(icId, validCounters[i], {
      roomId: String(roomId),
      ownerGroupId: String(groupId),     // Which group owns this counter
      ownerStance: stance,               // Stance of the owning group
      idealCounterIndex: i + 1,          // 1 or 2
      idealCounterText: validCounters[i].substring(0, 400),
    }, NAMESPACES.IDEAL_COUNTERS);
  }
  return true;
}
```

**ID Convention**: `{groupId}_ic1` and `{groupId}_ic2`. This deterministic naming allows easy deletion via `deleteIdealCounters(groupId)`.

### Finding Counter-Groups by Ideal Match

When a "for" comment's group wants to find its counter, the system queries the comment's embedding against ideal counters of the "against" stance:

```javascript
async findCounterByIdealMatch(groupId, commentEmbedding, roomId, opposingStance) {
  // 1. Query comment against ideal counters of opposing stance
  const matches = await this.queryWithEmbedding(commentEmbedding, 15, {
    roomId: String(roomId),
    ownerStance: opposingStance,
  }, NAMESPACES.IDEAL_COUNTERS);

  // 2. Group results by ownerGroupId, tracking IC1 and IC2 scores separately
  const groupScores = new Map();
  for (const m of matches) {
    const ownerId = m.metadata?.ownerGroupId;
    if (ownerId === String(groupId)) continue;   // Skip self

    if (!groupScores.has(ownerId)) groupScores.set(ownerId, { ic1: 0, ic2: 0 });
    const entry = groupScores.get(ownerId);
    if (m.metadata?.idealCounterIndex === 1) entry.ic1 = Math.max(entry.ic1, m.score);
    if (m.metadata?.idealCounterIndex === 2) entry.ic2 = Math.max(entry.ic2, m.score);
  }

  // 3. Compute average score per opposing group
  //    If only one IC exists, use that score (don't penalise with 0)
  const candidates = [];
  for (const [gId, { ic1, ic2 }] of groupScores.entries()) {
    const hasIC1 = ic1 > 0, hasIC2 = ic2 > 0;
    let avgScore;
    if (hasIC1 && hasIC2) avgScore = (Math.max(ic1, ic2) + Math.min(ic1, ic2)) / 2;
    else avgScore = Math.max(ic1, ic2);

    candidates.push({ counterGroupId: gId, avgScore, bestScore: Math.max(ic1, ic2) });
  }

  // 4. Sort by average score, check threshold
  candidates.sort((a, b) => b.avgScore - a.avgScore);
  const best = candidates[0];
  if (best) {
    return {
      counterGroupId: best.counterGroupId,
      score: best.avgScore,
      bestScore: best.bestScore,
      passesThreshold: best.avgScore >= SIMILARITY_THRESHOLDS.COUNTER_MATCH  // ≥ 0.62
    };
  }
  return null;
}
```

### Combined Counter Matching

`findCounterByCombinedMatch()` improves accuracy by using **both** ideal counter matching AND direct group embedding matching:

```javascript
async findCounterByCombinedMatch(groupId, commentEmbedding, roomId, opposingStance) {
  // 1. Query ideal counters (up to 20 results)
  const idealMatches = await this.queryWithEmbedding(commentEmbedding, 20, {
    roomId: String(roomId), ownerStance: opposingStance,
  }, NAMESPACES.IDEAL_COUNTERS);

  // 2. Query opposing group embeddings directly (up to 20 results)
  const directMatches = await this.queryWithEmbedding(commentEmbedding, 20, {
    roomId: String(roomId), stance: opposingStance,
  }, NAMESPACES.DEBATE_GROUPS);

  // 3. Merge scores: for each opposing group, compute:
  //    - idealScore: average of IC1 and IC2 scores
  //    - directScore: cosine similarity with group embedding
  //    - combinedScore: average of available scores

  // 4. Apply threshold on combinedScore (≥ 0.62)
  // 5. Return best match
}
```

**Scoring logic**: If a group has both ideal score (0.65) and direct score (0.70), combined = `(0.65 + 0.70) / 2 = 0.675`. If only one score exists, it's used directly. The threshold is applied **after** combining, not before — this prevents premature elimination.

---

## Connection Error Handling

Every Pinecone operation wraps its call in a try-catch that checks for connection errors:

```javascript
_isConnectionError(err) {
  const msg = err?.message?.toLowerCase() || '';
  const name = err?.name?.toLowerCase() || '';
  const code = err?.code || err?.cause?.code || '';

  return (
    name.includes('pineconeconnectionerror') ||
    msg.includes('request failed to reach pinecone') ||
    msg.includes('connect timeout') ||
    msg.includes('network') ||
    msg.includes('econnreset') ||
    msg.includes('enotfound') ||
    msg.includes('timeout') ||
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'ECONNRESET' ||
    code === 'ENOTFOUND'
  );
}
```

If a connection error is detected, the operation returns gracefully (`false` for writes, `[]` for reads). This allows the rest of the application to continue using LLM fallbacks when Pinecone is unreachable.

---

## Utility Methods

```javascript
getNamespaces()   // Returns the NAMESPACES object
getThresholds()   // Returns the SIMILARITY_THRESHOLDS object
```

These are used by other services (e.g., controllers that need to clean up vectors during deletion).

---

## Data Flow Summary

```
New Comment Arrives
       │
       ▼
generateEmbedding(commentText)
       │
       ├── Cache HIT → use cached vector
       │
       └── Cache MISS → Gemini API → cache → vector
                                        │
              ┌─────────────────────────┘
              ▼
    queryWithEmbedding(vector, filters)
              │
              ├── score ≥ 0.74 → Return matched group
              │
              └── score < 0.74 → Return null (LLM fallback)
```

---

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `PINECONE_API_KEY` | Yes | — | Pinecone authentication |
| `PINECONE_INDEX_NAME` | No | `voxveritas` | Index name in Pinecone |
| (Gemini keys) | Yes | — | For embedding generation (see doc 18) |

---

**Next**: [09 — Gemini LLM Service](./09-GEMINI-LLM-SERVICE.md) — The AI that classifies comments and generates group content
