/**
 * Central Vector Service — Pinecone + Gemini Embeddings
 * 
 * This is the single entry-point every feature uses for:
 *   • Generating text embeddings  (Gemini text-embedding-004)
 *   • Storing / querying vectors  (Pinecone)
 *   • Comment-to-group matching   (debate + news comments)
 *   • Counter-group matching      (debate groups)
 *   • Off-topic detection cache   (debate comments)
 * 
 * Namespaces inside the single Pinecone index:
 *   "debate-groups"     – DebateGroup title+description embeddings
 *   "ideal-counters"    – Ideal counter-argument descriptions (2 per group)
 *   "news-groups"       – CommentGroup (news page) embeddings
 *   "debate-topics"     – DebateRoom title+description (for off-topic)
 */

const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenAI } = require('@google/genai');
const geminiKeyRotation = require('./geminiKeyRotation');
require('dotenv').config();

// ─── In-memory embedding cache ──────────────────────────────────────────────
const embeddingCache = new Map();
const CACHE_MAX = 2000;
const CACHE_TTL = 3600000; // 1 hour

function getCached(key) {
  const entry = embeddingCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { embeddingCache.delete(key); return null; }
  return entry.vec;
}

function setCache(key, vec) {
  if (embeddingCache.size >= CACHE_MAX) {
    // evict oldest
    const oldest = embeddingCache.keys().next().value;
    embeddingCache.delete(oldest);
  }
  embeddingCache.set(key, { vec, ts: Date.now() });
}

// ─── Constants ──────────────────────────────────────────────────────────────
const NAMESPACES = {
  DEBATE_GROUPS:    'debate-groups',
  IDEAL_COUNTERS:   'ideal-counters',
  NEWS_GROUPS:      'news-groups',
  DEBATE_TOPICS:    'debate-topics',
};

const SIMILARITY_THRESHOLDS = {
  GROUP_MATCH:   0.68,   // comment→group match (high = confident match)
  COUNTER_MATCH: 0.62,   // comment→ideal-counter avg (55% avg required for pairing)
  OFF_TOPIC:     0.25,   // below this = off-topic
  TANGENTIAL:    0.40,   // between OFF_TOPIC and this = tangential
};

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIM   = 768;   // gemini-embedding-001 with outputDimensionality=768

// ─── Singleton ──────────────────────────────────────────────────────────────
class VectorService {
  constructor() {
    this.pinecone  = null;
    this.index     = null;
    this.ready     = false;
    this._initPromise = null;
  }

  // ── Lazy initialisation (called once) ──────────────────────────────────
  async init() {
    if (this.ready) return;
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      try {
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
          console.warn('⚠️  PINECONE_API_KEY not set – vector service disabled');
          return;
        }

        this.pinecone = new Pinecone({ apiKey });

        const indexName = process.env.PINECONE_INDEX_NAME || 'voxveritas';

        // List existing indexes
        const { indexes } = await this.pinecone.listIndexes();
        const exists = indexes?.some(i => i.name === indexName);

        if (!exists) {
          console.log(`📦 Creating Pinecone index "${indexName}" …`);
          await this.pinecone.createIndex({
            name: indexName,
            dimension: EMBEDDING_DIM,
            metric: 'cosine',
            spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
          });
          // Wait for index to be ready
          console.log('⏳ Waiting for index to initialise …');
          await new Promise(r => setTimeout(r, 30000));
        }

        this.index = this.pinecone.index(indexName);
        this.ready = true;
        console.log(`✅ VectorService ready  (index: ${indexName})`);
      } catch (err) {
        console.error('❌ VectorService init failed:', err.message);
        this.ready = false;
      }
    })();

    return this._initPromise;
  }

  // ── Embedding generation (with auto-retry on rate limit) ────────────
  async generateEmbedding(text) {
    if (!text || text.trim().length === 0) return null;

    const cacheKey = text.substring(0, 200);
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`🎯 Embedding cache HIT (${text.substring(0, 50)}...)`);
      return cached;
    }

    console.log(`🤖 Generating embedding for text: "${text.substring(0, 100)}..."`)
    console.log(`📏 Text length: ${text.length} chars, Cache key: ${cacheKey.substring(0, 30)}...`);
    
    const MAX_EMBED_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_EMBED_RETRIES; attempt++) {
      try {
        const startTime = Date.now();
        const ai = new GoogleGenAI({ apiKey: geminiKeyRotation.getApiKey() });
        const res = await ai.models.embedContent({
          model: EMBEDDING_MODEL,
          contents: text,
          config: { outputDimensionality: EMBEDDING_DIM },
        });
        const duration = Date.now() - startTime;
        
        const vec = res.embeddings?.[0]?.values ?? res.embedding?.values;
        if (!vec || vec.length === 0) throw new Error('Empty embedding response');
        
        console.log(`✅ Embedding generated successfully (${duration}ms, dim: ${vec.length})`);
        setCache(cacheKey, vec);
        return vec;
      } catch (err) {
        const isRateLimit = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
        console.error(`❌ Embedding attempt ${attempt + 1}/${MAX_EMBED_RETRIES} failed:`, err.message);
        
        if (isRateLimit && attempt < MAX_EMBED_RETRIES - 1) {
          const wait = 3000 * (attempt + 1);
          console.warn(`⏳ Rate-limited, retrying in ${wait/1000}s (attempt ${attempt + 2})`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        console.error('❌ Final embedding failure:', err.message);
        return null;
      }
    }
    return null;
  }

  // ── Query with pre-computed embedding (skip embedding generation) ────
  async queryWithEmbedding(embedding, topK = 5, filter = {}, namespace = NAMESPACES.DEBATE_GROUPS) {
    await this.init();
    if (!this.ready || !embedding) return [];

    try {
      const res = await this.index.namespace(namespace).query({
        vector: embedding,
        topK,
        filter,
        includeMetadata: true,
      });
      return res.matches || [];
    } catch (err) {
      if (this._isConnectionError(err)) {
        console.warn(`⚠️ Pinecone connection failed (${namespace}), falling back`);
        return [];
      }
      throw err;
    }
  }

  // ── Core upsert (with connection error handling) ──────────────────────
  async upsertVector(id, text, metadata = {}, namespace = NAMESPACES.DEBATE_GROUPS) {
    await this.init();
    if (!this.ready) return false;

    try {
      const vector = await this.generateEmbedding(text);
      if (!vector) {
        console.warn(`Skipping upsert for ${id} — embedding generation failed`);
        return false;
      }
      await this.index.namespace(namespace).upsert({
        records: [{
          id: String(id),
          values: vector,
          metadata: { ...metadata, _text: text.substring(0, 500) },
        }],
      });
      return true;
    } catch (err) {
      if (this._isConnectionError(err)) {
        console.warn(`⚠️ Pinecone upsert failed for ${id}, continuing without vector storage`);
        return false;
      }
      throw err;
    }
  }

  // ── Core query (with connection error handling) ──────────────────────
  async queryVector(text, topK = 5, filter = {}, namespace = NAMESPACES.DEBATE_GROUPS) {
    await this.init();
    if (!this.ready) return [];

    try {
      const vector = await this.generateEmbedding(text);
      if (!vector) return [];
      const res = await this.index.namespace(namespace).query({
        vector,
        topK,
        filter,
        includeMetadata: true,
      });
      return res.matches || [];
    } catch (err) {
      if (this._isConnectionError(err)) {
        console.warn(`⚠️ Pinecone connection failed (${namespace}), falling back to LLM`);
        return [];
      }
      throw err;
    }
  }

  // ── Delete vector (with connection error handling) ────────────────────
  async deleteVector(id, namespace = NAMESPACES.DEBATE_GROUPS) {
    await this.init();
    if (!this.ready) return false;
    try {
      await this.index.namespace(namespace).deleteOne({ id: String(id) });
      return true;
    } catch (err) {
      if (this._isConnectionError(err)) {
        console.warn(`⚠️ Pinecone delete failed for ${id}, continuing`);
        return false;
      }
      throw err;
    }
  }

  // ── Delete many (with connection error handling) ──────────────────────
  async deleteMany(ids, namespace = NAMESPACES.DEBATE_GROUPS) {
    await this.init();
    if (!this.ready || !ids.length) return false;
    try {
      await this.index.namespace(namespace).deleteMany({ ids: ids.map(String) });
      return true;
    } catch (err) {
      if (this._isConnectionError(err)) {
        console.warn(`⚠️ Pinecone bulk delete failed for ${ids.length} items, continuing`);
        return false;
      }
      throw err;
    }
  }

  // =====================================================================
  //  DEBATE  FEATURE  HELPERS
  // =====================================================================

  /**
   * Match a new debate comment to the best existing group.
   * Returns { groupId, score } or null if no good match.
   */
  async matchDebateComment(text, roomId, stance, embedding = null) {
    const matches = embedding
      ? await this.queryWithEmbedding(embedding, 3, { roomId: String(roomId), stance }, NAMESPACES.DEBATE_GROUPS)
      : await this.queryVector(text, 3, { roomId: String(roomId), stance }, NAMESPACES.DEBATE_GROUPS);

    const best = matches[0];
    if (best && best.score >= SIMILARITY_THRESHOLDS.GROUP_MATCH) {
      return { groupId: best.id, score: best.score };
    }
    return null;
  }

  /**
   * Store / update a debate group embedding.
   */
  async storeDebateGroup(groupId, title, description, roomId, stance) {
    const combined = `${title}. ${description}`;
    return await this.upsertVector(groupId, combined, {
      roomId: String(roomId),
      stance,
      title,
    }, NAMESPACES.DEBATE_GROUPS);
  }

  /**
   * Store ideal counter embeddings for a group.
   * Each group gets up to 2 ideal counter vectors in the "ideal-counters" namespace.
   *
   * @param {string}   groupId        – the group that owns these ideal counters
   * @param {string[]} idealCounters  – array of 1-2 ideal counter descriptions
   * @param {string}   roomId
   * @param {string}   stance         – stance of the owning group
   */
  async storeIdealCounters(groupId, idealCounters, roomId, stance) {
    if (!idealCounters || idealCounters.length === 0) {
      console.log(`⚠️ No ideal counters provided for group ${groupId}`);
      return false;
    }
    
    // Filter out empty/whitespace-only ideal counters
    const validCounters = idealCounters
      .map(ic => ic?.trim())
      .filter(ic => ic && ic.length > 0);
    
    if (validCounters.length === 0) {
      console.log(`⚠️ All ideal counters for group ${groupId} are empty or whitespace`);
      return false;
    }
    
    console.log(`📦 Storing ${validCounters.length} ideal counter embeddings for group ${groupId}`);

    let success = true;
    for (let i = 0; i < validCounters.length; i++) {
      const icText = validCounters[i];
      const icId = `${groupId}_ic${i + 1}`;
      
      console.log(`   IC${i + 1}: "${icText.substring(0, 80)}${icText.length > 80 ? '...' : ''}" (${icText.split(' ').length} words)`);
      
      const stored = await this.upsertVector(icId, icText, {
        roomId: String(roomId),
        ownerGroupId: String(groupId),
        ownerStance: stance,
        idealCounterIndex: i + 1,
        idealCounterText: icText.substring(0, 400),
      }, NAMESPACES.IDEAL_COUNTERS);
      if (!stored) success = false;
    }

    console.log(`${success ? '✅' : '⚠️'} Ideal counter embeddings ${success ? 'stored' : 'partially stored'} for group ${groupId}`);
    return success;
  }

  /**
   * Delete ideal counter embeddings for a group.
   */
  async deleteIdealCounters(groupId) {
    const ids = [`${groupId}_ic1`, `${groupId}_ic2`];
    return await this.deleteMany(ids, NAMESPACES.IDEAL_COUNTERS);
  }

  /**
   * Find the best counter-group by searching a COMMENT's embedding
   * against opposing groups' ideal counter embeddings.
   *
   * Scoring:
   *   1. Query the comment embedding against ideal-counters of opposing stance.
   *   2. Group results by ownerGroupId.
   *   3. For each opposing group: compute avg of both IC scores.
   *   4. Return best match info (always), with passesThreshold flag if ≥ 55%.
   *
   * @param {string}   groupId          – this group's ID (excluded from results)
   * @param {array}    commentEmbedding – the comment's embedding vector
   * @param {string}   roomId
   * @param {string}   opposingStance   – stance to search in ('for' | 'against')
   * @returns {{ counterGroupId, score, bestScore, passesThreshold }} or null
   */
  async findCounterByIdealMatch(groupId, commentEmbedding, roomId, opposingStance) {
    if (!commentEmbedding) {
      console.log(`❌ No comment embedding provided for counter-matching`);
      return null;
    }
    console.log(`\n🔍 [IDEAL MATCH] Finding counter-group by searching comment embedding against ideal counters`);
    console.log(`   Group ID: ${groupId}`);
    console.log(`   Room ID: ${roomId}`);
    console.log(`   Looking for stance: ${opposingStance}`);
    console.log(`   Embedding dimension: ${commentEmbedding.length}`);

    // Query comment embedding against ideal counters of opposing stance
    const matches = await this.queryWithEmbedding(commentEmbedding, 15, {
      roomId: String(roomId),
      ownerStance: opposingStance,
    }, NAMESPACES.IDEAL_COUNTERS);

    console.log(`   Pinecone returned ${matches?.length || 0} ideal counter matches`);

    if (!matches || matches.length === 0) {
      console.log(`❌ No ideal counter matches found in Pinecone`);
      return null;
    }

    // Group by ownerGroupId and track both IC scores
    const groupScores = new Map();
    for (const m of matches) {
      const ownerId = m.metadata?.ownerGroupId;
      const icIndex = m.metadata?.idealCounterIndex;
      
      if (!ownerId) {
        console.log(`⚠️ Skipping match with no ownerGroupId metadata`);
        continue;
      }
      
      if (ownerId === String(groupId)) {
        console.log(`   ⏭️ Skipping self-match: ${ownerId}`);
        continue;
      }

      if (!groupScores.has(ownerId)) {
        groupScores.set(ownerId, { ic1: 0, ic2: 0 });
      }
      const entry = groupScores.get(ownerId);
      if (icIndex === 1) entry.ic1 = Math.max(entry.ic1, m.score);
      if (icIndex === 2) entry.ic2 = Math.max(entry.ic2, m.score);
    }

    console.log(`   📊 Grouped into ${groupScores.size} candidate counter-groups`);

    // Compute avg score per group
    const candidates = [];
    for (const [gId, scores] of groupScores.entries()) {
      const { ic1, ic2 } = scores;
      
      // Handle cases where only one IC exists (the other would be 0)
      const hasIC1 = ic1 > 0;
      const hasIC2 = ic2 > 0;
      
      let avgScore, bestScore;
      if (hasIC1 && hasIC2) {
        // Both ICs exist: use average
        bestScore = Math.max(ic1, ic2);
        const otherScore = Math.min(ic1, ic2);
        avgScore = (bestScore + otherScore) / 2;
      } else if (hasIC1 || hasIC2) {
        // Only one IC exists: use that score directly (don't penalize with 0)
        bestScore = Math.max(ic1, ic2);
        avgScore = bestScore;
        console.log(`   ℹ️ Group ${gId} has only one IC (IC1: ${ic1}, IC2: ${ic2}), using single score: ${bestScore.toFixed(3)}`);
      } else {
        // Neither IC exists (shouldn't happen, but skip if it does)
        console.log(`   ⚠️ Group ${gId} has no valid IC scores, skipping`);
        continue;
      }

      candidates.push({ counterGroupId: gId, avgScore, ic1, ic2, bestScore });
    }

    candidates.sort((a, b) => b.avgScore - a.avgScore);

    console.log(`\n📊 ${candidates.length} counter-candidates (comment → ideal counters):`);
    candidates.forEach((c, i) => {
      const passesThreshold = c.avgScore >= SIMILARITY_THRESHOLDS.COUNTER_MATCH;
      console.log(`   ${i + 1}. Group ${c.counterGroupId} — IC1: ${(c.ic1 * 100).toFixed(1)}%, IC2: ${(c.ic2 * 100).toFixed(1)}%, AVG: ${(c.avgScore * 100).toFixed(1)}% ${passesThreshold ? '✅' : '❌'}`);
    });

    // Always return best match info (for frontend display), but mark if it passes threshold
    const best = candidates[0];
    if (best) {
      const passesThreshold = best.avgScore >= SIMILARITY_THRESHOLDS.COUNTER_MATCH;
      if (passesThreshold) {
        console.log(`\n✅ Best counter match: group ${best.counterGroupId} (avg: ${(best.avgScore * 100).toFixed(1)}%, best IC: ${(best.bestScore * 100).toFixed(1)}%) - PASSES threshold (${(SIMILARITY_THRESHOLDS.COUNTER_MATCH * 100).toFixed(0)}%)`);
      } else {
        console.log(`\n⚠️ Best counter match: group ${best.counterGroupId} (avg: ${(best.avgScore * 100).toFixed(1)}%, best IC: ${(best.bestScore * 100).toFixed(1)}%) - BELOW threshold (${(SIMILARITY_THRESHOLDS.COUNTER_MATCH * 100).toFixed(0)}%)`);
      }
      return { 
        counterGroupId: best.counterGroupId, 
        score: best.avgScore, 
        bestScore: best.bestScore,
        passesThreshold 
      };
    }

    console.log(`❌ No counter candidates found after filtering`);
    return null;
  }

  // =====================================================================
  //  NEWS COMMENT GROUPING HELPERS
  // =====================================================================

  /**
   * Match a news-page comment to an existing CommentGroup.
   * Returns { groupId, score, label } or null.
   */
  async matchNewsComment(text, newsId, embedding = null) {
    const matches = embedding
      ? await this.queryWithEmbedding(embedding, 3, { newsId: String(newsId) }, NAMESPACES.NEWS_GROUPS)
      : await this.queryVector(text, 3, { newsId: String(newsId) }, NAMESPACES.NEWS_GROUPS);

    const best = matches[0];
    if (best && best.score >= SIMILARITY_THRESHOLDS.GROUP_MATCH) {
      return { groupId: best.id, score: best.score, label: best.metadata?.label };
    }
    return null;
  }

  /**
   * Store / update a news CommentGroup embedding.
   */
  async storeNewsGroup(groupId, label, description, newsId) {
    const combined = `${label}. ${description || ''}`;
    return await this.upsertVector(groupId, combined, {
      newsId: String(newsId),
      label,
    }, NAMESPACES.NEWS_GROUPS);
  }

  // =====================================================================
  //  COMBINED COUNTER MATCHING (Ideal Counters + Direct Group Embeddings)
  // =====================================================================

  /**
   * Find counter-groups using BOTH ideal counter matching AND direct group embedding matching.
   * Combines scores from both approaches for more robust matching.
   * Gets ALL ideal counter scores and ALL direct scores, then combines them.
   * Applies threshold AFTER combining scores, not before.
   * 
   * @param {string} groupId - Current group ID
   * @param {number[]} commentEmbedding - Pre-computed comment embedding
   * @param {string} roomId - Room ID
   * @param {string} opposingStance - 'for' or 'against'
   * @returns {Object|null} Best match with combined scoring
   */
  async findCounterByCombinedMatch(groupId, commentEmbedding, roomId, opposingStance) {
    if (!commentEmbedding) {
      console.log(`❌ [COMBINED MATCH] No comment embedding provided`);
      return null;
    }

    console.log(`\n🔀 [COMBINED MATCH] Using BOTH ideal counters + direct group embeddings`);
    console.log(`   Group ID: ${groupId}`);
    console.log(`   Room ID: ${roomId}`);
    console.log(`   Looking for stance: ${opposingStance}`);

    // 1. Query ALL ideal counter matches (don't use findCounterByIdealMatch, query directly)
    const idealMatches = await this.queryWithEmbedding(commentEmbedding, 20, {
      roomId: String(roomId),
      ownerStance: opposingStance,
    }, NAMESPACES.IDEAL_COUNTERS);

    console.log(`   Ideal counter query: ${idealMatches?.length || 0} IC matches`);

    // 2. Query ALL direct group embedding matches
    const directMatches = await this.queryWithEmbedding(commentEmbedding, 20, {
      roomId: String(roomId),
      stance: opposingStance,
    }, NAMESPACES.DEBATE_GROUPS);

    console.log(`   Direct group query: ${directMatches?.length || 0} group matches`);

    if ((!idealMatches || idealMatches.length === 0) && (!directMatches || directMatches.length === 0)) {
      console.log(`❌ [COMBINED MATCH] No matches found in either approach`);
      return null;
    }

    // Build combined scores map
    const combinedScores = new Map();

    // Process ideal counter matches - group by ownerGroupId
    if (idealMatches && idealMatches.length > 0) {
      const idealGroupScores = new Map();
      
      for (const m of idealMatches) {
        const ownerId = m.metadata?.ownerGroupId;
        const icIndex = m.metadata?.idealCounterIndex;
        
        if (!ownerId) continue;
        if (ownerId === String(groupId)) continue; // Skip self
        
        if (!idealGroupScores.has(ownerId)) {
          idealGroupScores.set(ownerId, { ic1: 0, ic2: 0 });
        }
        const entry = idealGroupScores.get(ownerId);
        if (icIndex === 1) entry.ic1 = Math.max(entry.ic1, m.score);
        if (icIndex === 2) entry.ic2 = Math.max(entry.ic2, m.score);
      }

      // Calculate ideal avg scores for each group
      for (const [gId, scores] of idealGroupScores.entries()) {
        const { ic1, ic2 } = scores;
        const hasIC1 = ic1 > 0;
        const hasIC2 = ic2 > 0;
        
        let idealAvgScore, idealBestScore;
        if (hasIC1 && hasIC2) {
          idealBestScore = Math.max(ic1, ic2);
          const otherScore = Math.min(ic1, ic2);
          idealAvgScore = (idealBestScore + otherScore) / 2;
        } else if (hasIC1 || hasIC2) {
          idealBestScore = Math.max(ic1, ic2);
          idealAvgScore = idealBestScore;
        } else {
          continue;
        }

        combinedScores.set(gId, {
          groupId: gId,
          idealScore: idealAvgScore,
          idealBestScore: idealBestScore,
          ic1,
          ic2,
          directScore: 0,
        });
      }
    }

    // Process direct group scores
    if (directMatches && directMatches.length > 0) {
      for (const match of directMatches) {
        if (match.id === String(groupId)) continue; // Skip self
        
        if (combinedScores.has(match.id)) {
          // Group already has ideal score, add direct score
          combinedScores.get(match.id).directScore = match.score;
        } else {
          // Group has no ideal score, create entry with just direct score
          combinedScores.set(match.id, {
            groupId: match.id,
            idealScore: 0,
            idealBestScore: 0,
            ic1: 0,
            ic2: 0,
            directScore: match.score,
          });
        }
      }
    }

    // Calculate combined scores
    const candidates = [];
    for (const [gId, scores] of combinedScores.entries()) {
      const { idealScore, idealBestScore, directScore, ic1, ic2 } = scores;
      
      // Combined score: average of ideal counter avg and direct group score
      // Only count scores that exist (> 0)
      const validScores = [];
      if (idealScore > 0) validScores.push(idealScore);
      if (directScore > 0) validScores.push(directScore);
      
      if (validScores.length === 0) continue;
      
      const combinedScore = validScores.reduce((sum, s) => sum + s, 0) / validScores.length;
      const bestScore = Math.max(idealBestScore, directScore);
      
      candidates.push({
        counterGroupId: gId,
        idealScore,
        directScore,
        combinedScore,
        bestScore,
        ic1,
        ic2,
      });
    }

    candidates.sort((a, b) => b.combinedScore - a.combinedScore);

    console.log(`\n📊 [COMBINED MATCH] ${candidates.length} candidates with combined scores:`);
    candidates.slice(0, 10).forEach((c, i) => {
      const passesThreshold = c.combinedScore >= SIMILARITY_THRESHOLDS.COUNTER_MATCH;
      const idealDisplay = c.idealScore > 0 ? `Ideal: ${(c.idealScore * 100).toFixed(1)}% (IC1:${(c.ic1 * 100).toFixed(1)}%, IC2:${(c.ic2 * 100).toFixed(1)}%)` : 'Ideal: N/A';
      const directDisplay = c.directScore > 0 ? `Direct: ${(c.directScore * 100).toFixed(1)}%` : 'Direct: N/A';
      console.log(`   ${i + 1}. Group ${c.counterGroupId} — ${idealDisplay}, ${directDisplay}, COMBINED: ${(c.combinedScore * 100).toFixed(1)}% ${passesThreshold ? '✅' : '❌'}`);
    });

    const best = candidates[0];
    if (best) {
      const passesThreshold = best.combinedScore >= SIMILARITY_THRESHOLDS.COUNTER_MATCH;
      console.log(`\n🏆 [COMBINED MATCH] Best: Group ${best.counterGroupId} (combined: ${(best.combinedScore * 100).toFixed(1)}%, best: ${(best.bestScore * 100).toFixed(1)}%) ${passesThreshold ? '✅ PASSES' : '❌ BELOW'} threshold (${(SIMILARITY_THRESHOLDS.COUNTER_MATCH * 100).toFixed(0)}%)\n`);
      
      return {
        counterGroupId: best.counterGroupId,
        score: best.combinedScore,
        bestScore: best.bestScore,
        idealScore: best.idealScore,
        directScore: best.directScore,
        passesThreshold,
      };
    }

    console.log(`❌ [COMBINED MATCH] No valid candidates found\n`);
    return null;
  }

  // =====================================================================
  //  ANTI-GROUP DIRECT MATCHING (for debugging - queries against group embeddings)
  // =====================================================================

  /**
   * Find anti-groups by directly matching comment embedding against opposing group embeddings.
   * This is an ADDITIONAL diagnostic query that runs alongside ideal counter matching.
   * 
   * @param {string} groupId - Current group ID (to exclude self)
   * @param {number[]} commentEmbedding - Pre-computed comment embedding
   * @param {string} roomId - Room ID
   * @param {string} opposingStance - 'for' or 'against'
   * @returns {Array} All anti-group matches with scores
   */
  async findAntiGroupDirectMatch(groupId, commentEmbedding, roomId, opposingStance) {
    if (!commentEmbedding) {
      console.log(`❌ [ANTI-GROUP] No comment embedding provided`);
      return [];
    }
    
    console.log(`\n🎯 [ANTI-GROUP DIRECT] Searching comment against opposing GROUP embeddings`);
    console.log(`   Group ID: ${groupId}`);
    console.log(`   Room ID: ${roomId}`);
    console.log(`   Looking for stance: ${opposingStance}`);
    console.log(`   Embedding dimension: ${commentEmbedding.length}`);

    // Query comment embedding against opposing group embeddings (not ideal counters)
    const matches = await this.queryWithEmbedding(commentEmbedding, 20, {
      roomId: String(roomId),
      stance: opposingStance,
    }, NAMESPACES.DEBATE_GROUPS);

    console.log(`   Pinecone returned ${matches?.length || 0} opposing group matches`);

    if (!matches || matches.length === 0) {
      console.log(`❌ [ANTI-GROUP] No opposing group embeddings found in Pinecone`);
      return [];
    }

    // Filter out self and format results
    const antiGroups = matches
      .filter(m => m.id !== String(groupId))
      .map(m => ({
        groupId: m.id,
        score: m.score,
        metadata: m.metadata,
      }));

    console.log(`\n📊 [ANTI-GROUP DIRECT] ${antiGroups.length} anti-groups found (comment → group embeddings):`);
    antiGroups.forEach((g, i) => {
      const passesThreshold = g.score >= SIMILARITY_THRESHOLDS.COUNTER_MATCH;
      const scorePercent = (g.score * 100).toFixed(1);
      console.log(`   ${i + 1}. Group ${g.groupId} — ${scorePercent}% ${passesThreshold ? '✅ PASSES' : '❌ BELOW'} threshold (${(SIMILARITY_THRESHOLDS.COUNTER_MATCH * 100).toFixed(0)}%)`);
    });

    if (antiGroups.length > 0) {
      const best = antiGroups[0];
      const passesThreshold = best.score >= SIMILARITY_THRESHOLDS.COUNTER_MATCH;
      console.log(`\n🏆 [ANTI-GROUP] Best direct match: Group ${best.groupId} (${(best.score * 100).toFixed(1)}%) ${passesThreshold ? '✅ PASSES' : '❌ BELOW'} threshold\n`);
    }

    return antiGroups;
  }

  // =====================================================================
  //  OFF-TOPIC DETECTION HELPER
  // =====================================================================

  // =====================================================================
  //  OFF-TOPIC DETECTION (MOVED TO LLM)
  // =====================================================================
  
  /**
   * Vector-based off-topic detection has been replaced with LLM-based detection.
   * See llmService.analyzeCommentRelevance() for current implementation.
   * 
   * The LLM approach provides:
   * - Context awareness (considers recent comments)
   * - Better accuracy for nuanced/indirect references
   * - Explainable reasoning for classification decisions
   * - No need to store topic vectors in Pinecone
   */

  // =====================================================================
  //  UTILITY
  // =====================================================================

  /** Check if error is a connection/network issue that should trigger fallback */
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

  getNamespaces() { return NAMESPACES; }
  getThresholds() { return SIMILARITY_THRESHOLDS; }
}

module.exports = new VectorService();
