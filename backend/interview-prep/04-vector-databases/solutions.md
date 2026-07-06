# Module 04: Vector Databases - Solutions

## Exercise 1: Cosine Similarity

```javascript
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same dimensions');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

function findMostSimilar(queryVec, candidates) {
  let bestMatch = null;
  let bestScore = -1;
  
  for (const candidate of candidates) {
    const score = cosineSimilarity(queryVec, candidate.vector);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }
  
  return {
    id: bestMatch.id,
    score: bestScore,
    metadata: bestMatch.metadata || {}
  };
}
```

**Key Points:**
- Always check for zero magnitude (would cause division by zero)
- Returns 0 to 1 for text embeddings (normalized vectors)
- O(n) time complexity per comparison

---

## Exercise 2: Simple Vector Store

```javascript
class SimpleVectorStore {
  constructor() {
    this.vectors = new Map();
  }
  
  add(id, vector, metadata = {}) {
    this.vectors.set(id, { vector, metadata });
  }
  
  search(queryVector, topK = 5) {
    const results = [];
    
    for (const [id, data] of this.vectors) {
      const score = cosineSimilarity(queryVector, data.vector);
      results.push({
        id,
        score,
        metadata: data.metadata
      });
    }
    
    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, topK);
  }
  
  delete(id) {
    this.vectors.delete(id);
  }
}
```

**Complexity:**
- `add()`: O(1)
- `search()`: O(n × d) where n = vectors, d = dimensions
- For large-scale: Use approximate search (Pinecone, etc.)

---

## Exercise 3: Comment Grouping System

```javascript
class CommentGroupingSystem {
  constructor(similarityThreshold = 0.74) {
    this.groups = new Map();
    this.threshold = similarityThreshold;
    this.nextGroupId = 1;
  }
  
  calculateCenter(vectors) {
    if (vectors.length === 0) return [];
    
    const dim = vectors[0].length;
    const center = new Array(dim).fill(0);
    
    for (const vec of vectors) {
      for (let i = 0; i < dim; i++) {
        center[i] += vec[i];
      }
    }
    
    for (let i = 0; i < dim; i++) {
      center[i] /= vectors.length;
    }
    
    return center;
  }
  
  findBestMatchingGroup(commentVector) {
    let bestMatch = null;
    let bestScore = -1;
    
    for (const [groupId, group] of this.groups) {
      const score = cosineSimilarity(commentVector, group.center);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { groupId, score };
      }
    }
    
    if (bestMatch && bestMatch.score >= this.threshold) {
      return bestMatch;
    }
    
    return null;
  }
  
  addComment(commentId, commentVector, metadata = {}) {
    const existingMatch = this.findBestMatchingGroup(commentVector);
    
    if (existingMatch) {
      // Add to existing group
      const group = this.groups.get(existingMatch.groupId);
      group.comments.push({ id: commentId, vector: commentVector, metadata });
      
      // Recalculate center
      const vectors = group.comments.map(c => c.vector);
      group.center = this.calculateCenter(vectors);
      
      return {
        assigned: true,
        groupId: existingMatch.groupId,
        isNewGroup: false,
        confidence: existingMatch.score
      };
    } else {
      // Create new group
      const groupId = `group_${this.nextGroupId++}`;
      this.groups.set(groupId, {
        comments: [{ id: commentId, vector: commentVector, metadata }],
        center: commentVector  // Single comment = its own center
      });
      
      return {
        assigned: true,
        groupId,
        isNewGroup: true,
        confidence: 1.0
      };
    }
  }
}
```

**Usage Example:**
```javascript
const system = new CommentGroupingSystem(0.74);

// Add comments
system.addComment('c1', [0.9, 0.1, 0.2], { text: 'AI is good' });
system.addComment('c2', [0.85, 0.15, 0.25], { text: 'AI helps people' });
// c2 should match with c1 (similar vectors)

system.addComment('c3', [0.1, 0.9, 0.8], { text: 'Pizza is tasty' });
// c3 creates new group (different topic)
```

---

## Exercise 4: Embedding Cache with LRU

```javascript
class EmbeddingCache {
  constructor(maxSize = 1000, ttlMs = 3600000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }
  
  generateKey(text) {
    return text.substring(0, 200);
  }
  
  get(text) {
    const key = this.generateKey(text);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access order for LRU (delete and re-insert)
    this.cache.delete(key);
    entry.lastAccessed = Date.now();
    this.cache.set(key, entry);
    
    return entry.vector;
  }
  
  set(text, vector) {
    const key = this.generateKey(text);
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      vector,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
```

**Why Map preserves insertion order:**
- JavaScript Maps maintain insertion order
- First key = oldest entry (LRU eviction)
- Deleting and re-adding moves to end (most recent)

---

## Exercise 5: Dimensionality Reduction

```javascript
function reduceDimensions(vector, targetDim) {
  const sourceDim = vector.length;
  const ratio = sourceDim / targetDim;
  
  const reduced = [];
  
  for (let i = 0; i < targetDim; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.floor((i + 1) * ratio);
    
    // Average values in this range
    let sum = 0;
    for (let j = start; j < end && j < sourceDim; j++) {
      sum += vector[j];
    }
    reduced.push(sum / (end - start));
  }
  
  return reduced;
}

// Example: reduceDimensions([1,2,3,4], 2) -> [1.5, 3.5]
```

**Note:** This is a simple averaging approach. Better methods:
- **PCA:** Principal Component Analysis (preserves most variance)
- **Random Projection:** Fast, preserves distances with high probability
- **Autoencoder:** Neural network-based compression

---

## Exercise 6: Threshold Optimization

```javascript
function findOptimalThreshold(testCases) {
  let bestThreshold = 0.5;
  let bestAccuracy = 0;
  
  // Test thresholds from 0.5 to 0.9 in 0.05 increments
  for (let threshold = 0.5; threshold <= 0.9; threshold += 0.05) {
    let correct = 0;
    
    for (const testCase of testCases) {
      const score = cosineSimilarity(testCase.vecA, testCase.vecB);
      const predicted = score >= threshold;
      
      if (predicted === testCase.shouldMatch) {
        correct++;
      }
    }
    
    const accuracy = correct / testCases.length;
    
    if (accuracy > bestAccuracy) {
      bestAccuracy = accuracy;
      bestThreshold = threshold;
    }
  }
  
  return bestThreshold;
}
```

**Alternative Metrics:**
- **Precision:** Of predicted matches, how many are correct?
- **Recall:** Of actual matches, how many were found?
- **F1 Score:** Harmonic mean of precision and recall

---

## Exercise 7: Batch Operations

```javascript
function batchCosineSimilarity(queryVec, candidateVecs) {
  // Pre-calculate query magnitude (same for all comparisons)
  let queryMagnitude = 0;
  for (const val of queryVec) {
    queryMagnitude += val * val;
  }
  queryMagnitude = Math.sqrt(queryMagnitude);
  
  return candidateVecs.map(candidateVec => {
    let dotProduct = 0;
    let candidateMagnitude = 0;
    
    for (let i = 0; i < queryVec.length; i++) {
      dotProduct += queryVec[i] * candidateVec[i];
      candidateMagnitude += candidateVec[i] * candidateVec[i];
    }
    
    candidateMagnitude = Math.sqrt(candidateMagnitude);
    
    if (queryMagnitude === 0 || candidateMagnitude === 0) {
      return 0;
    }
    
    return dotProduct / (queryMagnitude * candidateMagnitude);
  });
}

function normalizeVector(vector) {
  let magnitude = 0;
  for (const val of vector) {
    magnitude += val * val;
  }
  magnitude = Math.sqrt(magnitude);
  
  if (magnitude === 0) return vector;
  
  return vector.map(val => val / magnitude);
}

// Optimization: With normalized vectors, cosine similarity = dot product
// const normQuery = normalizeVector(queryVec);
// const normCandidate = normalizeVector(candidateVec);
// const similarity = normQuery.reduce((sum, val, i) => sum + val * normCandidate[i], 0);
```

---

## Exercise 8: Debate Counter-Matching System

```javascript
class DebateMatchingSystem {
  constructor() {
    this.groups = new Map();
    this.groupVectors = new Map();
    this.counterVectors = new Map();  // groupId -> [ic1Vec, ic2Vec]
  }
  
  addGroup(groupId, stance, groupVector, idealCounters, counterVectors) {
    this.groups.set(groupId, {
      stance,
      idealCounters
    });
    this.groupVectors.set(groupId, groupVector);
    this.counterVectors.set(groupId, counterVectors);
  }
  
  findCounterGroup(sourceGroupId, commentVector) {
    const sourceGroup = this.groups.get(sourceGroupId);
    if (!sourceGroup) return null;
    
    const targetStance = sourceGroup.stance === 'for' ? 'against' : 'for';
    const threshold = 0.62;
    
    const candidates = [];
    
    // Compare with each opposite-stance group
    for (const [groupId, group] of this.groups) {
      if (group.stance !== targetStance) continue;
      if (groupId === sourceGroupId) continue;
      
      const counters = this.counterVectors.get(groupId);
      if (!counters || counters.length === 0) continue;
      
      // Calculate scores against each ideal counter
      const scores = counters.map(counterVec => 
        cosineSimilarity(commentVector, counterVec)
      );
      
      // Average scores (if 2 counters, average both; if 1, use that)
      const avgScore = scores.length > 1
        ? (scores[0] + scores[1]) / 2
        : scores[0];
      
      candidates.push({
        groupId,
        score: avgScore,
        individualScores: scores
      });
    }
    
    // Sort by score
    candidates.sort((a, b) => b.score - a.score);
    
    const best = candidates[0];
    if (best && best.score >= threshold) {
      return {
        matched: true,
        counterGroupId: best.groupId,
        score: best.score,
        individualScores: best.individualScores
      };
    }
    
    return { matched: false };
  }
}
```

**VoxVeritas Pattern Applied:**
- 2 ideal counters per group for better coverage
- Average score prevents single outlier from skewing results
- Threshold of 0.62 is more lenient than 0.74 (counter-arguments are inherently more varied)

---

## Production Considerations

### Error Handling
```javascript
class ProductionVectorService {
  async queryWithFallback(queryVector, namespace) {
    try {
      // Try Pinecone first
      return await pinecone.index('voxveritas')
        .namespace(namespace)
        .query({ vector: queryVector, topK: 5 });
    } catch (error) {
      console.error('Pinecone error:', error);
      
      // Fallback: Simple in-memory search
      return await this.fallbackSearch(queryVector, namespace);
    }
  }
}
```

### Monitoring
```javascript
// Track embedding cache hit rate
const cacheMetrics = {
  hits: 0,
  misses: 0,
  get hitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }
};

// Track query latency
const start = Date.now();
const results = await pinecone.index('voxveritas').query({ ... });
const latency = Date.now() - start;
console.log(`Query latency: ${latency}ms`);
```
